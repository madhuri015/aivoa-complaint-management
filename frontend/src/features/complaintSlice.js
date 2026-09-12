import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  complaint: {
    complaint_source: "",
    customer_name: "",
    product_name: "",
    product_strength: "",
    batch_lot_number: "",
    affected_quantity: "",
    manufacturing_date: "",
    expiry_date: "",
    originating_site: "",
    impacted_npm: "",
    complaint_category: "",
    complaint_description: "",
    structured_defect_summary: "",
  },

  riskAssessment: {
    severity: "",
    suggested_action: "",
    risk_assessment: "",
  },
};

const complaintSlice = createSlice({
  name: "complaint",

  initialState,

  reducers: {
    setComplaintData: (state, action) => {
      state.complaint = {
        ...state.complaint,
        ...action.payload,
      };
    },

    updateComplaintField: (state, action) => {
      const { field, value } = action.payload;

      state.complaint[field] = value;
    },

    setRiskAssessment: (state, action) => {
      state.riskAssessment = {
        ...state.riskAssessment,
        ...action.payload,
      };
    },

    clearComplaint: (state) => {
      state.complaint = initialState.complaint;
      state.riskAssessment = initialState.riskAssessment;
    },
  },
});

export const {
  setComplaintData,
  updateComplaintField,
  setRiskAssessment,
  clearComplaint,
} = complaintSlice.actions;

export default complaintSlice.reducer;