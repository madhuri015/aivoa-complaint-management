# AIVOA AI-Powered Customer Complaint Management System

An AI-powered Customer Complaint Management System built for pharmaceutical manufacturing. The system helps quality teams convert unstructured customer complaints into structured complaint records, assess risk, make conversational corrections, and save the final complaint to a QMS database.

## Overview

The system follows an AI-assisted complaint triage workflow:

**Customer Complaint → AI Extraction → Structured Complaint Form → AI Risk Assessment → Conversational Correction → Human Review → QMS Ledger**

The application accepts complaint information as text and also supports PDF-based complaint analysis.

The AI acts as an assistant to the quality team. Final complaint information and risk decisions should be reviewed by a human before being committed to the quality management system.

## Key Features

- AI-powered customer complaint extraction
- Automatic population of structured complaint fields
- AI-powered severity and risk assessment
- Suggested action generation
- Conversational correction of complaint information
- Preservation of existing complaint information during corrections
- PDF complaint text extraction and AI analysis
- React-based complaint management interface
- Redux state management
- FastAPI backend
- LangGraph-based AI workflow
- Groq LLM integration
- MySQL database storage
- QMS Ledger-style complaint commitment
- Human review before final submission

## End-to-End Workflow

```text
Customer Complaint
       |
       v
React + Redux Frontend
       |
       v
FastAPI Backend
       |
       v
LangGraph Workflow
       |
       v
Groq LLM
       |
       +----------------------+
       |                      |
       v                      v
Structured Complaint     Risk Assessment
Data                     & Suggested Action
       |                      |
       +----------+-----------+
                  |
                  v
          React Complaint Form
                  |
                  v
       Conversational Correction
                  |
                  v
             Human Review
                  |
                  v
         Commit to QMS Ledger
                  |
                  v
            MySQL Database


Technology Stack
Frontend
React.js
Vite
Redux Toolkit
React Redux
Axios
Lucide React
CSS
Google Inter Font
Backend
Python
FastAPI
Uvicorn
SQLAlchemy
MySQL
PyMySQL
Pydantic
Python Dotenv
AI / LLM
LangGraph
LangChain
LangChain Groq
Groq API
openai/gpt-oss-20b

The original assignment specified gemma2-9b-it. That model is no longer available through the current Groq model catalog, so the implementation uses openai/gpt-oss-20b as the available Groq model.

Document Processing
pypdf


Project Structure
aivoa-complaint-management/
│
├── backend/
│   ├── ai_graph.py
│   ├── ai_service.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   └── complaintSlice.js
│   │   ├── store/
│   │   │   └── store.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
└── ...


Complaint Fields

| Field                     | Description                                     |
| ------------------------- | ----------------------------------------------- |
| Complaint Source          | Source through which the complaint was received |
| Customer Name             | Name of the customer or organization            |
| Product Name              | Name of the pharmaceutical product              |
| Product Strength/Grade    | Product strength, grade, or specification       |
| Batch/Lot Number          | Manufacturing batch or lot identifier           |
| Affected Quantity         | Quantity of affected products                   |
| Manufacturing Date        | Product manufacturing date                      |
| Expiry Date               | Product expiry date                             |
| Originating Site/Block    | Manufacturing or originating location           |
| Impacted NPM              | Impacted non-product materials                  |
| Complaint Category        | Category of the complaint                       |
| Complaint Description     | Detailed customer complaint                     |
| Structured Defect Summary | AI-generated structured summary of the defect   |



AI Workflow
1. Complaint Input

The user enters an unstructured customer complaint into the complaint input area.

Example:
Apollo Pharmacy reported that several Amoxicillin Capsules 500 mg from
batch AMX240602 were received with visible discoloration. The affected
quantity is 12 capsules. The products were manufactured in March 2026
and have an expiry date of February 2028. The complaint appears to be
related to possible moisture ingress or primary packaging seal failure.
Please investigate the affected batch and arrange replacement of the
affected capsules.
2. AI Extraction

The complaint is sent to the FastAPI backend.

The LangGraph workflow processes the complaint and sends the relevant information to the Groq LLM.

The AI extracts structured fields such as:

Customer
Product
Strength
Batch number
Quantity
Manufacturing date
Expiry date
Complaint category
Defect description
Structured defect summary
3. AI Risk Assessment

The AI evaluates the complaint and provides:

Severity
Suggested action
Risk assessment

Severity is classified as:

Critical
Major
Minor

The assessment is intended to assist quality personnel and does not replace human review.

4. Conversational Correction

The user can provide natural-language corrections through the AIVOA Copilot.

Example:
Change the batch number to BMX240602 and change the affected quantity
to 48 capsules.
The AI updates only the requested fields while preserving the remaining complaint information.

5. Human Review

The user reviews the updated complaint form and AI risk assessment before submission.

6. QMS Ledger Commitment

After review, the user clicks:

Log Customer Complaint

The final structured complaint and AI assessment are sent to the backend and stored in the MySQL database.

PDF Complaint Processing

The backend also provides PDF complaint analysis.

The PDF workflow is:
Complaint PDF
     |
     v
FastAPI PDF Upload
     |
     v
PDF Text Extraction
     |
     v
LangGraph Workflow
     |
     v
Groq LLM
     |
     +----------------------+
     |                      |
     v                      v
Structured Data       Risk Assessment
     |                      |
     +----------+-----------+
                |
                v
        Complaint Interface

The current prototype focuses on text-based PDF extraction. Production-grade OCR for scanned documents is outside the current implementation scope.

API Endpoints
Health Check
GET /
Returns a message confirming that the API is running.

Database Test
GET /test-db
Tests the MySQL database connection.

Analyze Complaint
POST /ai/analyze

Accepts an unstructured complaint and returns:

Extracted complaint data
AI risk assessment
Analyze Complaint PDF
POST /ai/analyze-pdf

Accepts a PDF complaint, extracts its text, and processes it through the AI workflow.

Correct Complaint
POST /ai/correct

Accepts:

Current complaint data
Natural-language correction

Returns:

Updated complaint data
Updated risk assessment
Save Complaint
POST /complaints

Stores the reviewed complaint and risk assessment in the MySQL database.

AI Copilot

The AIVOA Copilot is designed to assist quality personnel during complaint triage.

It provides:

Complaint information extraction
Risk classification
Suggested actions
Risk explanation
Conversational complaint corrections

The conversational interface allows users to update complaint information using natural language instead of manually editing every field.

Design Approach

The interface is divided into two primary areas:

Log Customer Complaint

The left side contains the structured complaint form where users can:

Enter complaints
Review AI-extracted information
Manually edit fields
Review final information
Commit the complaint
AIVOA Copilot

The right side provides:

AI risk classification
Suggested action
Risk assessment
Conversational correction interface

This design keeps the structured complaint record and AI assistance visible together during review.