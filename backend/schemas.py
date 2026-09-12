from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    complaint_source: str | None = None
    customer_name: str | None = None
    product_name: str | None = None
    product_strength: str | None = None
    batch_lot_number: str | None = None
    affected_quantity: str | None = None
    manufacturing_date: str | None = None
    expiry_date: str | None = None
    originating_site: str | None = None
    impacted_npm: str | None = None
    complaint_category: str | None = None
    complaint_description: str | None = None
    structured_defect_summary: str | None = None

    severity: str | None = None
    suggested_action: str | None = None
    risk_assessment: str | None = None