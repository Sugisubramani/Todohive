import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify"; 

const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return regex.test(email);
};

const CreateTeamModal = ({ show, onClose, onCreate }) => {
  const [teamName, setTeamName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailInputChange = (e) => {
    setEmailInput(e.target.value);
    setError("");
  };

  const addEmail = (email) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    if (!isValidEmail(trimmedEmail)) {
      setError(`"${trimmedEmail}" is not a valid email.`);
      return;
    }
    if (invitedEmails.includes(trimmedEmail)) {
      setError(`"${trimmedEmail}" is already invited.`);
      return;
    }
    setInvitedEmails([...invitedEmails, trimmedEmail]);
    setEmailInput("");
    setError("");
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault(); 
      addEmail(emailInput);
    }
  };

  const handleEmailBlur = () => {
    if (emailInput !== "") {
      addEmail(emailInput);
    }
  };

  const removeEmail = (emailToRemove) => {
    setInvitedEmails(invitedEmails.filter((email) => email !== emailToRemove));
  };

  const handleCreate = async () => {
    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }
    if (invitedEmails.length === 0) {
      setError("Please invite at least one member.");
      return;
    }

    setIsLoading(true);
    try {
      await onCreate({ teamName, members: invitedEmails });
      setTeamName("");
      setInvitedEmails([]);
      setEmailInput("");
      setError("");
      onClose();
      
      toast.success(
        <div>
          <strong>{teamName}</strong> team created!
          <br />
          <span style={{ fontSize: '0.9em', opacity: 0.9 }}>
            Invitations sent to {invitedEmails.length} member{invitedEmails.length > 1 ? 's' : ''}
          </span>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          className: "dashboard-toast",
          style: {
            backgroundColor: "#4caf50",
            color: "white"
          }
        }
      );
    } catch (error) {
      setError("Failed to create team. Please try again.");
      toast.error("Failed to create team. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Team</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="teamName">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="inviteEmails" className="mt-3">
            <Form.Label>Invite Members</Form.Label>
            <div
              className="border rounded"
              style={{ 
                minHeight: "38px", 
                backgroundColor: "#fff",
                padding: "0.375rem"
              }}
            >
              <div className="d-flex flex-wrap w-100 gap-2">
                {invitedEmails.map((email) => (
                  <div
                    key={email}
                    className="bg-primary text-white rounded-pill px-2 d-flex align-items-center"
                    style={{ 
                      fontSize: "0.9em", 
                      height: "24px",
                      marginBottom: "0.25rem" 
                    }}
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      className="btn-close btn-close-white btn-sm ms-1"
                      onClick={() => removeEmail(email)}
                      style={{ fontSize: "0.8em" }}
                    ></button>
                  </div>
                ))}
                <Form.Control
                  type="text"
                  placeholder="Type an email and press Enter"
                  value={emailInput}
                  onChange={handleEmailInputChange}
                  onKeyDown={handleEmailKeyDown}
                  onBlur={handleEmailBlur}
                  style={{
                    border: "none",
                    boxShadow: "none",
                    padding: "0 0.5rem",
                    height: "28px",
                    flex: "1 0 200px", 
                    minWidth: 0,
                    backgroundColor: "transparent"
                  }}
                />
              </div>
            </div>
            {error && <div className="text-danger mt-2">{error}</div>}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          variant="outline-primary"
          onClick={handleCreate}
          disabled={isLoading}
          className="d-flex align-items-center justify-content-center gap-2"
          style={{ 
            minWidth: "120px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {isLoading ? (
            <>
              <div 
                className="spinner-grow-custom"
                role="status"
                aria-hidden="true"
              />
              <span>Creating...</span>
            </>
          ) : (
            'Create'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateTeamModal;

