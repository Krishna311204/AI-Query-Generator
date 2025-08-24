# AI Natural Language Database Query Tool

## Overview
This project is a web-based application that allows users to query a relational database using plain, natural language. It leverages a Large Language Model (LLM) to translate user questions, such as *"How many students are in the Computer Science department?"*, into executable SQL queries.

A key feature of this application is its secure, two-step architecture. Raw user input is never directly used to generate SQL. Instead, it is first converted into a structured, safe format, which is then used to generate the final SQL query. This prevents a wide range of security vulnerabilities, including prompt injection attacks.

## Core Features
- Natural Language Interface: Query the database using plain English instead of SQL.
- Secure by Design: Uses an intermediate metadata-only representation to isolate the LLM from raw user input.
- Dynamic Schema Awareness: The backend automatically fetches the database schema at startup.
- Data Visualization Ready: API responses are structured for easy integration with charting libraries.
- RESTful API: Simple endpoints for integration with any frontend framework.

## Architecture
The application follows a secure, multi-step process:
1. The user submits a natural language query via the frontend.
2. The frontend sends this query to the backend server.
3. The backend performs intent extraction, converting the query into a structured format using the LLM.
4. The LLM returns structured data, not raw SQL.
5. The backend constructs a safe prompt with the database schema and structured data.
6. The LLM generates the final SQL query from this safe prompt.
7. The backend validates and executes the query.
8. The results are returned to the frontend in a structured format.

## Technology Stack
- Backend: Node.js, Express.js  
- Database: MySQL or PostgreSQL  
- AI: Google Gemini API  
- Environment Management: Dotenv  
