import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Spinner } from 'react-bootstrap';

const InvitePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Parse query parameters from the URL
  const queryParams = new URLSearchParams(location.search);
  const teamId = queryParams.get('teamId');
  const inviteToken = queryParams.get('token');

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        // Retrieve the JWT token from localStorage (user should be logged in)
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('You must be logged in to accept an invitation.');
          setLoading(false);
          return;
        }
        // Make a POST request to accept the invitation
        const response = await axios.post(
          'http://localhost:5000/api/teams/accept-invite',
          { teamId, token: inviteToken },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(response.data.message);
        setLoading(false);
        // Redirect to the team page after a short delay (adjust URL as needed)
        setTimeout(() => {
          navigate(`/teams/${teamId}`);
        }, 2000);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Error accepting invitation.');
        setLoading(false);
      }
    };

    acceptInvite();
  }, [teamId, inviteToken, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {loading ? (
        <>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Processing your invitation...</p>
        </>
      ) : (
        <Alert variant={message.includes('Error') ? 'danger' : 'success'}>
          {message}
        </Alert>
      )}
    </div>
  );
};

export default InvitePage;
