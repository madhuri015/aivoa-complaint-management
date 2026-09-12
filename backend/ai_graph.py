from typing import TypedDict

from langgraph.graph import StateGraph, END
from ai_service import llm


class ComplaintState(TypedDict):
    complaint_text: str
    extracted_data: str
    risk_assessment: str


# =========================================================
# EXTRACT COMPLAINT INFORMATION
# =========================================================

def extract_complaint(state: ComplaintState):

    prompt = f"""
You are an AI assistant for a pharmaceutical Customer Complaint Management System.

Extract complaint information accurately from the complaint text.

IMPORTANT:
- Never invent information.
- If information is missing, use "Not Provided".
- Complaint Source means how the complaint was received, such as Email,
  Phone, Web Portal, Sales Representative, or Letter.
- Customer Name means the company, pharmacy, hospital, distributor,
  or person reporting the complaint.
- Product Name is the pharmaceutical product.
- Product Strength/Grade is the product strength or grade.
- Batch/Lot Number is the batch or lot identifier.
- Affected Quantity is the affected quantity.
- Manufacturing Date and Expiry Date should contain dates if provided.
- Originating Site/Block is the manufacturing/originating location if provided.
- Impacted Non-Product Materials means affected packaging or other
  non-product materials.
- Complaint Category describes the type of complaint.
- Complaint Description briefly describes the complaint.
- Structured Defect Summary summarizes the observed defect.

Complaint text:
{state["complaint_text"]}

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations.

Use exactly this structure:

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

    return {
        "extracted_data": response.content
    }


# =========================================================
# RISK ASSESSMENT
# =========================================================

def assess_risk(state: ComplaintState):

    prompt = f"""
You are an AI risk assessment assistant for a pharmaceutical
Customer Complaint Management System.

Analyze the complaint and extracted information below.

Complaint:
{state["complaint_text"]}

Extracted Information:
{state["extracted_data"]}

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations.

Use exactly this structure:

{{
  "severity": "Critical",
  "suggested_action": "",
  "risk_assessment": ""
}}

Severity must be exactly one of:
Critical
Major
Minor

Do not invent facts.

This is an initial AI assessment and must be reviewed by qualified QA personnel.
"""

    response = llm.invoke(prompt)

    return {
        "risk_assessment": response.content
    }


# =========================================================
# LANGGRAPH WORKFLOW
# =========================================================

graph_builder = StateGraph(ComplaintState)

graph_builder.add_node(
    "extract_complaint",
    extract_complaint
)

graph_builder.add_node(
    "assess_risk",
    assess_risk
)

graph_builder.set_entry_point(
    "extract_complaint"
)

graph_builder.add_edge(
    "extract_complaint",
    "assess_risk"
)

graph_builder.add_edge(
    "assess_risk",
    END
)

complaint_graph = graph_builder.compile()