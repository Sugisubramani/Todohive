import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const CreateTeamModal = ({ show, onClose, onCreate }) => {
  const [teamName, setTeamName] = useState("");
  const [emails, setEmails] = useState("");

  const handleCreate = () => {
    if (!teamName.trim()) {
      alert("Please enter a team name.");
      return;
    }

    const emailList = emails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    onCreate({ teamName, members: emailList });
    setTeamName("");
    setEmails("");
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Team</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Team Name</Form.Label>
            <Form.Control
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Invite Members (Comma Separated Emails)</Form.Label>
            <Form.Control
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="e.g., user1@example.com, user2@example.com"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreate}>
          Create Team
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateTeamModal;
