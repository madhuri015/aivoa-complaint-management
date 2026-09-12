from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import json
from pypdf import PdfReader

from database import engine, Base, SessionLocal
from models import Complaint
from schemas import ComplaintCreate
from ai_graph import complaint_graph
from ai_service import llm


Base.metadata.create_all(bind=engine)


app = FastAPI(title="AIVOA Complaint Management System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "AIVOA Complaint Management API is running"
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect():
            return {
                "database": "MySQL connection successful"
            }
    except Exception as e:
        return {
            "database": "Connection failed",
            "error": str(e)
        }


class AIAnalyzeRequest(BaseModel):
    complaint_text: str


@app.post("/ai/analyze")
def analyze_complaint(request: AIAnalyzeRequest):

    result = complaint_graph.invoke({
        "complaint_text": request.complaint_text,
        "extracted_data": "",
        "risk_assessment": ""
    })

    return {
        "extracted_data": result["extracted_data"],
        "risk_assessment": result["risk_assessment"]
    }


@app.post("/ai/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        return {
            "error": "Please upload a PDF file."
        }

    try:
        contents = await file.read()

        with open("temp_complaint.pdf", "wb") as temp_file:
            temp_file.write(contents)

        reader = PdfReader("temp_complaint.pdf")

        extracted_text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                extracted_text += page_text + "\n"

        if not extracted_text.strip():
            return {
                "error": "Could not extract text from the PDF."
            }

        result = complaint_graph.invoke({
            "complaint_text": extracted_text,
            "extracted_data": "",
            "risk_assessment": ""
        })

        return {
            "filename": file.filename,
            "extracted_text": extracted_text,
            "extracted_data": result["extracted_data"],
            "risk_assessment": result["risk_assessment"]
        }

    except Exception as e:
        return {
            "error": f"PDF processing failed: {str(e)}"
        }


class AICorrectRequest(BaseModel):
    current_data: dict
    correction: str


@app.post("/ai/correct")
def correct_complaint(request: AICorrectRequest):

    prompt = f"""
You are an AI assistant for a pharmaceutical Customer Complaint
Management System.

The complaint information has already been extracted.

Your task is to apply the user's correction to the CURRENT complaint
information.

IMPORTANT RULES:

1. Treat the CURRENT COMPLAINT INFORMATION as the source of truth.
2. Preserve every existing value unless the user explicitly asks
   to change it.
3. Change ONLY the fields requested by the user.
4. Do not invent new information.
5. If the user changes a value, use exactly the corrected value.
6. Keep all other existing values unchanged.
7. Do not use information from previous versions of the complaint.
8. Do not compare the old value with the new value.
9. Affected Quantity should contain only the final quantity value,
   for example "48".
10. Return ONLY valid JSON.
11. Do not include markdown.
12. Do not include explanations outside the JSON.

CURRENT COMPLAINT INFORMATION:
{json.dumps(request.current_data, indent=2)}

USER CORRECTION:
{request.correction}

Return exactly this JSON structure:
{{
    "complaint_source": "",
    "customer_name": "",
    "product_name": "",
    "product_strength": "",
    "batch_lot_number": "",
    "affected_quantity": "",
    "manufacturing_date": "",
    "expiry_date": "",
    "originating_site": "",
    "impacted_npm": "",
    "complaint_category": "",
    "complaint_description": "",
    "structured_defect_summary": ""
}}
"""

    response = llm.invoke(prompt)

    content = response.content.strip()

    if content.startswith("```"):
        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

    try:
        updated_data = json.loads(content)

    except json.JSONDecodeError:
        return {
            "error": "AI returned invalid JSON",
            "raw_response": content
        }

    risk_prompt = f"""
You are an AI risk assessment assistant for a pharmaceutical
Customer Complaint Management System.

Assess the risk of the FINAL CORRECTED complaint below.

IMPORTANT RULES:

1. Use ONLY the FINAL CORRECTED COMPLAINT INFORMATION below.
2. Do not use any previous version of the complaint.
3. Do not mention old values.
4. Do not compare old and new values.
5. Do not invent facts.
6. The affected quantity shown below is the FINAL quantity.
7. If the affected quantity is 48, treat the affected quantity as 48.
8. Never say that the quantity is 12 if the final complaint says 48.
9. Return ONLY valid JSON.
10. Do not include markdown.
11. This is an initial AI assessment and must be reviewed by
    qualified QA personnel.

FINAL CORRECTED COMPLAINT INFORMATION:
{json.dumps(updated_data, indent=2)}

Return exactly this JSON structure:
{{
    "severity": "Major",
    "suggested_action": "",
    "risk_assessment": ""
}}

Severity must be exactly one of:
Critical
Major
Minor

The suggested action should be appropriate for the final corrected
complaint.

The risk assessment should be based only on the final corrected
complaint information.
"""

    risk_response = llm.invoke(risk_prompt)

    risk_content = risk_response.content.strip()

    if risk_content.startswith("```"):
        risk_content = (
            risk_content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

    try:
        risk_assessment = json.loads(risk_content)

    except json.JSONDecodeError:
        risk_assessment = {
            "severity": "Major",
            "suggested_action": "QA review required",
            "risk_assessment": risk_content
        }

    return {
        "extracted_data": updated_data,
        "risk_assessment": risk_assessment
    }


@app.post("/complaints")
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db)
):

    new_complaint = Complaint(
        **complaint.model_dump()
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return {
        "message": "Complaint saved successfully",
        "complaint_id": new_complaint.id
    }