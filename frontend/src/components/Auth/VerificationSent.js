// client/src/components/Auth/VerificationSent.js
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { MdEmail } from "react-icons/md";
import "../../styles/VerificationSent.css";

const VerificationSent = () => {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email");
  const emailFromLocal = localStorage.getItem("signupEmail");
  const email = emailFromQuery || emailFromLocal || "your email";

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/resend-verification", { email });
      setMessage(
        `A new verification email has been sent to ${email}. Please check your inbox and spam folder.`
      );
    } catch (error) {
      console.error("Error resending email:", error.response?.data || error.message);
      setMessage("Failed to resend verification email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="todoist-verification-page">
      <div className="todoist-card">
        <div className="todoist-icon-container">
          <MdEmail className="todoist-icon" />
        </div>
        <h2 className="todoist-title">Verify Your Email Address</h2>
        <p className="todoist-text">
          We have sent a verification link to <strong>{email}</strong>.
        </p>
        <p className="todoist-text">
          Click on the link to complete the verification process. You might need to check your spam folder.
        </p>
        <div className="todoist-actions">
          <div className="todoist-button-row">
            <button
              className="todoist-btn resend-btn"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Resending..." : "Resend Email"}
            </button>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="todoist-btn open-mail-btn"
            >
              Open Gmail
            </a>
          </div>
          {message && <p className="todoist-message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default VerificationSent;
