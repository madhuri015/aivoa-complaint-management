from ai_graph import complaint_graph


complaint = """
Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg.
The complaint is related to Batch AMX240602. The manufacturing date is
March 2026 and the expiry date is February 2028. The customer reported
12 discolored capsules in a sealed bottle and requested investigation
and replacement.
"""


result = complaint_graph.invoke({
    "complaint_text": complaint,
    "extracted_data": "",
    "risk_assessment": ""
})


print("\n===== AI EXTRACTION RESULT =====\n")
print(result["extracted_data"])

print("\n===== AI RISK ASSESSMENT =====\n")
print(result["risk_assessment"])