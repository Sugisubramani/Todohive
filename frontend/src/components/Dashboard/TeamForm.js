import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';

// Function to generate a random team ID (for demo purposes)
const generateTeamId = () => Math.random().toString(36).substr(2, 9);

const TeamForm = ({ onClose, refreshTeams }) => {
  const [projectName, setProjectName] = useState('');
  const [privacy, setPrivacy] = useState('Private'); // Default privacy setting
  const [teamId, setTeamId] = useState('');
  const [currentInvite, setCurrentInvite] = useState('');
  const [inviteMembers, setInviteMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // When privacy changes to Public, generate a team ID; clear if set to Private.
  useEffect(() => {
    if (privacy === 'Public') {
      setTeamId(generateTeamId());
    } else {
      setTeamId('');
    }
  }, [privacy]);

  // Add invite email to the list when "Enter" is pressed or on button click
  const handleAddInvite = () => {
    const email = currentInvite.trim();
    if (email && !inviteMembers.includes(email)) {
      setInviteMembers([...inviteMembers, email]);
      setCurrentInvite('');
    }
  };

  // Remove an invite email tag
  const removeInvite = (email) => {
    setInviteMembers(inviteMembers.filter(member => member !== email));
  };

  // Copy teamId to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamId)
      .then(() => alert('Team ID copied!'))
      .catch(err => console.error('Failed to copy!', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Team/Project Name is required.');
      return;
    }
    setError('');
    setLoading(true);

    const teamData = {
      projectName,
      privacy,
      // Only include teamId if public; backend can override or generate its own if needed.
      teamId: privacy === 'Public' ? teamId : null,
      inviteMembers
    };

    try {
      // Retrieve token from localStorage
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/teams', teamData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (refreshTeams) refreshTeams();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating team. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Team</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          {/* Team/Project Name */}
          <Form.Group controlId="formProjectName" className="mb-3">
            <Form.Label>Team/Project Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter team/project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Privacy Setting */}
          <Form.Group controlId="formPrivacy" className="mb-3">
            <Form.Label>Privacy Setting</Form.Label>
            <Form.Select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
            </Form.Select>
          </Form.Group>

          {/* Display Team ID if Public */}
          {privacy === 'Public' && teamId && (
            <Form.Group controlId="formTeamId" className="mb-3">
              <Form.Label>Team ID</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control type="text" value={teamId} readOnly />
                <Button variant="outline-secondary" onClick={copyToClipboard} className="ms-2">
                  Copy
                </Button>
              </div>
            </Form.Group>
          )}

          {/* Invite Members */}
          <Form.Group controlId="formInviteMembers" className="mb-3">
            <Form.Label>Invite Members</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="email"
                placeholder="Enter email and press Add"
                value={currentInvite}
                onChange={(e) => setCurrentInvite(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInvite(); } }}
              />
              <Button variant="primary" onClick={handleAddInvite} className="ms-2">
                Add
              </Button>
            </div>
            <div className="mt-2">
              {inviteMembers.map((email, index) => (
                <Badge pill bg="secondary" key={index} className="me-1 invite-badge">
                  {email} <span className="remove-badge" onClick={() => removeInvite(email)}>×</span>
                </Badge>
              ))}
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onClose} disabled={loading} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Creating...</span>
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TeamForm;
