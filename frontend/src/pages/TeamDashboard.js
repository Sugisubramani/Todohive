import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TeamDashboard = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        // Adjust the URL if you have an endpoint to fetch team details
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}`);
        setTeam(response.data.team);
      } catch (err) {
        setError('Error fetching team data.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Team Dashboard</h2>
      <p><strong>Team Name:</strong> {team.projectName}</p>
      <p><strong>Privacy:</strong> {team.privacy}</p>
      <p><strong>Team ID:</strong> {team.teamId || team._id}</p>
      <p><strong>Members:</strong> {team.members.join(', ')}</p>
      {/* You can further expand with tasks, chats, etc. */}
    </div>
  );
};

export default TeamDashboard;
