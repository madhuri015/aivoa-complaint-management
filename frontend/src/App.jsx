import { useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import {
  setComplaintData,
  setRiskAssessment,
  updateComplaintField,
} from "./features/complaintSlice";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const dispatch = useDispatch();

  // -------------------------------------------------------
  // REDUX STATE
  // -------------------------------------------------------

  const formData = useSelector(
    (state) => state.complaint.complaint
  );

  const aiResult = useSelector(
    (state) => state.complaint.riskAssessment
  );

  // -------------------------------------------------------
  // LOCAL UI STATE
  // -------------------------------------------------------

  const [complaintText, setComplaintText] = useState("");
  const [loading, setLoading] = useState(false);

  const [correctionText, setCorrectionText] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);

  const [commitMessage, setCommitMessage] = useState("");

  // PDF state
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  // -------------------------------------------------------
  // FORM FIELDS
  // -------------------------------------------------------

  const fields = [
    ["complaint_source", "Complaint Source"],
    ["customer_name", "Customer Name"],
    ["product_name", "Product Name"],
    ["product_strength", "Product Strength / Grade"],
    ["batch_lot_number", "Batch / Lot Number"],
    ["affected_quantity", "Affected Quantity"],
    ["manufacturing_date", "Manufacturing Date"],
    ["expiry_date", "Expiry Date"],
    ["originating_site", "Originating Site / Block"],
    ["impacted_npm", "Impacted Non-Product Materials"],
    ["complaint_category", "Complaint Category"],
    ["complaint_description", "Complaint Description"],
    ["structured_defect_summary", "Structured Defect Summary"],
  ];

  // -------------------------------------------------------
  // PARSE AI RESPONSE
  // -------------------------------------------------------

  const parseAIResponse = (value) => {
    if (!value) {
      return {};
    }

    if (typeof value === "object") {
      return value;
    }

    let text = String(value).trim();

    if (text.startsWith("```")) {
      text = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Unable to parse AI JSON:", error);
      console.error("AI response was:", text);

      return {};
    }
  };

  // -------------------------------------------------------
  // APPLY AI RESULT TO REDUX
  // -------------------------------------------------------

  const applyAIResult = (responseData) => {
    const extracted = parseAIResponse(
      responseData.extracted_data
    );

    const risk = parseAIResponse(
      responseData.risk_assessment
    );

    dispatch(
      setComplaintData({
        complaint_source:
          extracted.complaint_source || "",

        customer_name:
          extracted.customer_name || "",

        product_name:
          extracted.product_name || "",

        product_strength:
          extracted.product_strength || "",

        batch_lot_number:
          extracted.batch_lot_number || "",

        affected_quantity:
          extracted.affected_quantity || "",

        manufacturing_date:
          extracted.manufacturing_date || "",

        expiry_date:
          extracted.expiry_date || "",

        originating_site:
          extracted.originating_site || "",

        impacted_npm:
          extracted.impacted_npm || "",

        complaint_category:
          extracted.complaint_category || "",

        complaint_description:
          extracted.complaint_description || "",

        structured_defect_summary:
          extracted.structured_defect_summary || "",
      })
    );

    dispatch(
      setRiskAssessment({
        severity: risk.severity || "Major",

        suggested_action:
          risk.suggested_action ||
          "QA review required",

        risk_assessment:
          risk.risk_assessment ||
          "Initial AI assessment completed.",
      })
    );
  };

  // -------------------------------------------------------
  // ANALYZE TEXT COMPLAINT
  // -------------------------------------------------------

  const handleAnalyze = async () => {
    if (!complaintText.trim()) {
      alert("Please enter a complaint.");
      return;
    }

    setLoading(true);
    setCommitMessage("");
    setPdfMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/ai/analyze`,
        {
          complaint_text: complaintText,
        }
      );

      console.log("Analyze response:", response.data);

      applyAIResult(response.data);
    } catch (error) {
      console.error("Analyze error:", error);

      if (error.response) {
        console.error(
          "Backend response:",
          error.response.data
        );
      }

      alert(
        "Unable to analyze the complaint. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // PDF FILE SELECTION
  // -------------------------------------------------------

  const handlePdfChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setPdfFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file.");
      event.target.value = "";
      setPdfFile(null);
      return;
    }

    setPdfFile(selectedFile);
    setPdfMessage("");
    setCommitMessage("");
  };

  // -------------------------------------------------------
  // ANALYZE PDF COMPLAINT
  // -------------------------------------------------------

  const handlePdfAnalyze = async () => {
    if (!pdfFile) {
      alert("Please select a PDF complaint first.");
      return;
    }

    setPdfLoading(true);
    setPdfMessage("");
    setCommitMessage("");

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("file", pdfFile);

      const response = await axios.post(
        `${API_URL}/ai/analyze-pdf`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(
        "PDF analyze response:",
        response.data
      );

      if (response.data.error) {
        alert(response.data.error);
        return;
      }

      applyAIResult(response.data);

      setComplaintText(
        response.data.extracted_text || ""
      );

      setPdfMessage(
        `✓ PDF analyzed successfully: ${pdfFile.name}`
      );
    } catch (error) {
      console.error("PDF analyze error:", error);

      if (error.response) {
        console.error(
          "PDF backend response:",
          error.response.data
        );
      }

      alert(
        "Unable to analyze the PDF. Please check the backend."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // -------------------------------------------------------
  // CONVERSATIONAL CORRECTION
  // -------------------------------------------------------

  const handleCorrection = async () => {
    if (!correctionText.trim()) {
      alert("Please enter a correction.");
      return;
    }

    if (!formData.product_name && !formData.customer_name) {
      alert("Please analyze a complaint first.");
      return;
    }

    setCorrectionLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/ai/correct`,
        {
          current_data: formData,
          correction: correctionText,
        }
      );

      console.log(
        "Correction response:",
        response.data
      );

      if (response.data.error) {
        console.error(
          "Backend correction error:",
          response.data
        );

        alert(
          "The AI returned an invalid response. Please try again."
        );

        return;
      }

      const updatedData = parseAIResponse(
        response.data.extracted_data
      );

      const updatedRisk = parseAIResponse(
        response.data.risk_assessment
      );

      // ---------------------------------------------------
      // UPDATE REDUX COMPLAINT DATA
      // ---------------------------------------------------

      dispatch(
        setComplaintData({
          complaint_source:
            updatedData.complaint_source ??
            formData.complaint_source,

          customer_name:
            updatedData.customer_name ??
            formData.customer_name,

          product_name:
            updatedData.product_name ??
            formData.product_name,

          product_strength:
            updatedData.product_strength ??
            formData.product_strength,

          batch_lot_number:
            updatedData.batch_lot_number ??
            formData.batch_lot_number,

          affected_quantity:
            updatedData.affected_quantity ??
            formData.affected_quantity,

          manufacturing_date:
            updatedData.manufacturing_date ??
            formData.manufacturing_date,

          expiry_date:
            updatedData.expiry_date ??
            formData.expiry_date,

          originating_site:
            updatedData.originating_site ??
            formData.originating_site,

          impacted_npm:
            updatedData.impacted_npm ??
            formData.impacted_npm,

          complaint_category:
            updatedData.complaint_category ??
            formData.complaint_category,

          complaint_description:
            updatedData.complaint_description ??
            formData.complaint_description,

          structured_defect_summary:
            updatedData.structured_defect_summary ??
            formData.structured_defect_summary,
        })
      );

      // ---------------------------------------------------
      // UPDATE REDUX RISK ASSESSMENT
      // ---------------------------------------------------

      dispatch(
        setRiskAssessment({
          severity:
            updatedRisk.severity ||
            aiResult.severity ||
            "Major",

          suggested_action:
            updatedRisk.suggested_action ||
            aiResult.suggested_action ||
            "QA review required",

          risk_assessment:
            updatedRisk.risk_assessment ||
            aiResult.risk_assessment ||
            "Initial AI assessment completed.",
        })
      );

      setCorrectionText("");
    } catch (error) {
      console.error("Correction error:", error);

      if (error.response) {
        console.error(
          "Backend correction response:",
          error.response.data
        );
      }

      alert(
        "Unable to apply the correction. Please check the backend."
      );
    } finally {
      setCorrectionLoading(false);
    }
  };

  // -------------------------------------------------------
  // MANUAL FIELD CHANGE
  // -------------------------------------------------------

  const handleFieldChange = (key, value) => {
    dispatch(
      updateComplaintField({
        field: key,
        value: value,
      })
    );
  };

  // -------------------------------------------------------
  // COMMIT TO QMS LEDGER
  // -------------------------------------------------------

  const handleCommit = async () => {
    if (!formData.customer_name || !formData.product_name) {
      alert("Please analyze a complaint before committing.");
      return;
    }

    try {
      const complaintToSave = {
        ...formData,

        severity:
          aiResult.severity || "Major",

        suggested_action:
          aiResult.suggested_action ||
          "QA review required",

        risk_assessment:
          aiResult.risk_assessment ||
          "Initial AI assessment completed.",
      };

      console.log(
        "Complaint being committed:",
        complaintToSave
      );

      const response = await axios.post(
        `${API_URL}/complaints`,
        complaintToSave
      );

      setCommitMessage(
        `Complaint committed successfully. ID: ${response.data.complaint_id}`
      );
    } catch (error) {
      console.error("Commit error:", error);

      if (error.response) {
        console.error(
          "Backend commit response:",
          error.response.data
        );
      }

      setCommitMessage(
        "Unable to commit the complaint. Please check the backend."
      );
    }
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #111827 50%, #172554 100%)",
        color: "#f8fafc",
        padding: "28px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1450px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: "700",
              }}
            >
              AIVOA
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              AI-Powered Customer Complaint Management
            </p>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              background:
                "rgba(245, 158, 11, 0.15)",
              border:
                "1px solid rgba(245, 158, 11, 0.35)",
              color: "#fbbf24",
              fontSize: "13px",
            }}
          >
            Pending Triage
          </div>
        </div>

        {/* MAIN GRID */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.7fr 1fr",
            gap: "22px",
          }}
        >
          {/* =================================================
              LEFT PANEL
          ================================================= */}

          <div
            style={{
              background:
                "rgba(15, 23, 42, 0.85)",
              border:
                "1px solid rgba(148, 163, 184, 0.16)",
              borderRadius: "18px",
              padding: "24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Log Customer Complaint
            </h2>

            {/* COMPLAINT INPUT */}

            <textarea
              value={complaintText}
              onChange={(e) =>
                setComplaintText(e.target.value)
              }
              placeholder="Paste or type the customer complaint here..."
              style={{
                width: "100%",
                minHeight: "135px",
                boxSizing: "border-box",
                resize: "vertical",
                background: "#020617",
                color: "#f8fafc",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "14px",
              }}
            />

            {/* ANALYZE BUTTON */}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "13px",
                border: "none",
                borderRadius: "10px",
                background: "#6366f1",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {loading
                ? "Analyzing..."
                : "✨ Analyze Complaint"}
            </button>

            {/* PDF INPUT */}

            <div
              style={{
                marginTop: "18px",
                padding: "16px",
                borderRadius: "12px",
                background:
                  "rgba(30, 41, 59, 0.65)",
                border:
                  "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                📄 Analyze Complaint PDF
              </div>

              <p
                style={{
                  margin: "0 0 12px",
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              >
                Upload a text-based complaint PDF and let
                AIVOA extract and analyze the complaint.
              </p>

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfChange}
                style={{
                  width: "100%",
                  color: "#cbd5e1",
                  fontSize: "12px",
                }}
              />

              <button
                onClick={handlePdfAnalyze}
                disabled={pdfLoading || !pdfFile}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "11px",
                  border: "none",
                  borderRadius: "9px",
                  background:
                    pdfFile && !pdfLoading
                      ? "#0891b2"
                      : "#334155",
                  color: "white",
                  fontWeight: "600",
                  cursor:
                    pdfFile && !pdfLoading
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {pdfLoading
                  ? "Reading & Analyzing PDF..."
                  : "📄 Analyze PDF Complaint"}
              </button>

              {pdfMessage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    background:
                      "rgba(34,197,94,0.1)",
                    border:
                      "1px solid rgba(34,197,94,0.25)",
                    color: "#86efac",
                    fontSize: "12px",
                  }}
                >
                  {pdfMessage}
                </div>
              )}
            </div>

            {/* FORM */}

            <div
              style={{
                marginTop: "25px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              {fields.map(([key, label]) => (
                <div
                  key={key}
                  style={{
                    gridColumn:
                      key === "complaint_description" ||
                      key === "structured_defect_summary"
                        ? "1 / -1"
                        : "auto",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    {label}
                  </label>

                  {key === "complaint_description" ||
                  key === "structured_defect_summary" ? (
                    <textarea
                      value={formData[key]}
                      onChange={(e) =>
                        handleFieldChange(
                          key,
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        boxSizing: "border-box",
                        resize: "vertical",
                        background: "#020617",
                        color: "#f8fafc",
                        border:
                          "1px solid #334155",
                        borderRadius: "9px",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    />
                  ) : (
                    <input
                      value={formData[key]}
                      onChange={(e) =>
                        handleFieldChange(
                          key,
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: "#020617",
                        color: "#f8fafc",
                        border:
                          "1px solid #334155",
                        borderRadius: "9px",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* COMMIT BUTTON */}

            <button
              onClick={handleCommit}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "10px",
                background: "#16a34a",
                color: "white",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              💾 Commit to QMS Ledger
            </button>

            {/* COMMIT MESSAGE */}

            {commitMessage && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "9px",
                  background:
                    "rgba(34,197,94,0.1)",
                  border:
                    "1px solid rgba(34,197,94,0.25)",
                  color: "#86efac",
                  fontSize: "13px",
                }}
              >
                ✓ {commitMessage}
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT PANEL
          ================================================= */}

          <div
            style={{
              background:
                "rgba(15, 23, 42, 0.85)",
              border:
                "1px solid rgba(148, 163, 184, 0.16)",
              borderRadius: "18px",
              padding: "24px",
              height: "fit-content",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              ✨ AIVOA Copilot
            </h2>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              AI-assisted complaint extraction,
              correction and initial risk assessment.
            </p>

            {/* AI RISK */}

            {aiResult.severity && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#020617",
                  border: "1px solid #334155",
                }}
              >
                <h3>
                  ⚠ AI Risk Assessment
                </h3>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "10px",
                  }}
                >
                  {aiResult.severity}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#cbd5e1",
                    lineHeight: "1.6",
                  }}
                >
                  <strong>
                    Suggested Action:
                  </strong>

                  <br />

                  {aiResult.suggested_action}
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    lineHeight: "1.6",
                  }}
                >
                  <strong>
                    Risk Assessment:
                  </strong>

                  <br />

                  {aiResult.risk_assessment}
                </div>
              </div>
            )}

            {/* CONVERSATIONAL CORRECTION */}

            <div
              style={{
                marginTop: "22px",
                padding: "16px",
                borderRadius: "12px",
                background: "#020617",
                border: "1px solid #334155",
              }}
            >
              <h3>
                Conversational Correction
              </h3>

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                Tell the Copilot what needs to
                be changed.

                <br />

                Example:

                <br />

                <span
                  style={{ color: "#c4b5fd" }}
                >
                  Change the batch number to
                  BMX240602 and change the affected
                  quantity to 48 capsules.
                </span>
              </p>

              <textarea
                value={correctionText}
                onChange={(e) =>
                  setCorrectionText(
                    e.target.value
                  )
                }
                placeholder="Describe the correction..."
                style={{
                  width: "100%",
                  minHeight: "95px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  background: "#0f172a",
                  color: "#f8fafc",
                  border:
                    "1px solid #334155",
                  borderRadius: "9px",
                  padding: "10px",
                  fontSize: "13px",
                }}
              />

              <button
                onClick={handleCorrection}
                disabled={correctionLoading}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "11px",
                  border: "none",
                  borderRadius: "9px",
                  background: "#8b5cf6",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {correctionLoading
                  ? "Applying Correction..."
                  : "✨ Apply Correction"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;