from sqlalchemy import Column, Integer, String, Text
from database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    complaint_source = Column(String(100))
    customer_name = Column(String(255))
    product_name = Column(String(255))
    product_strength = Column(String(255))
    batch_lot_number = Column(String(255))
    affected_quantity = Column(String(255))
    manufacturing_date = Column(String(100))
    expiry_date = Column(String(100))
    originating_site = Column(String(255))
    impacted_npm = Column(String(255))
    complaint_category = Column(String(255))
    complaint_description = Column(Text)
    structured_defect_summary = Column(Text)

    severity = Column(String(50))
    suggested_action = Column(Text)
    risk_assessment = Column(Text)