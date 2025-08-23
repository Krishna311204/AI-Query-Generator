// backend/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MySQL Connection Pool Setup ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- Google Gemini Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- The Core API Logic ---
app.post('/api/query', async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: 'User input is required.' });
  }

  const dbSchema = `
    You have access to a college database with the following 5 tables:

    1. departments:
       - Columns: dept_id (INT, PRIMARY KEY), dept_name (VARCHAR), building (VARCHAR)

    2. professors:
       - Columns: professor_id (INT, PRIMARY KEY), first_name (VARCHAR), last_name (VARCHAR), email (VARCHAR), dept_id (INT)
       - The professors.dept_id column is a foreign key that references departments.dept_id.

    3. students:
       - Columns: student_id (INT, PRIMARY KEY), first_name (VARCHAR), last_name (VARCHAR), email (VARCHAR), state (VARCHAR), cgpa (DECIMAL), enrollment_date (DATE), major_dept_id (INT)
       - The students.major_dept_id column is a foreign key that references departments.dept_id.

    4. courses:
       - Columns: course_id (INT, PRIMARY KEY), course_code (VARCHAR), course_name (VARCHAR), credits (INT), dept_id (INT), professor_id (INT)
       - The courses.dept_id column references departments.dept_id.
       - The courses.professor_id column references professors.professor_id.

    5. enrollments:
       - Columns: enrollment_id (INT, PRIMARY KEY), student_id (INT), course_id (INT), semester (VARCHAR), grade (DECIMAL)
       - This table links students to courses.
       - The enrollments.student_id column references students.student_id.
       - The enrollments.course_id column references courses.course_id.
  `;

  const prompt = `
    You are an expert MySQL assistant. Your role is to convert natural language questions into SQL queries for the college database.
    Given the database schema below, generate a syntactically correct MySQL query.

    Database Schema:
    ${dbSchema}

    Rules:
    - Only generate a single, valid SQL SELECT query.
    - Do not generate any text or explanation before or after the SQL query. Do not use markdown like \`\`\`sql.
    - When joining tables, use clear aliases (e.g., FROM students s JOIN enrollments e ON s.student_id = e.student_id).
    - If the user asks for something that cannot be answered with a SELECT query or is ambiguous, respond with "Invalid query."

    User Question: "${userInput}"

    SQL Query:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let generatedSql = response.text();
    
    if (!generatedSql.toLowerCase().trim().startsWith('select')) {
        console.error("Validation failed: Generated content is not a SELECT statement.", generatedSql);
        return res.status(400).json({ error: "Generated query is not a valid SELECT statement." });
    }

    console.log("Attempting to execute SQL:", generatedSql);

    const [rows] = await pool.query(generatedSql);
    
    res.json({
      query: generatedSql,
      results: rows,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: 'Failed to process your request.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
