// src/pages/TeamDashboard.jsx
import React, { useEffect, useContext, useState, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { TeamContext } from "../context/TeamContext";

const TeamDashboard = () => {
  const { teamName } = useParams();
  const { selectedTeam, setSelectedTeam } = useContext(TeamContext);
  const [loading, setLoading] = useState(true);

  // Get the logged-in user from localStorage.
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Function to fetch teams only if needed.
  const fetchAcceptedTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Teams fetched from API:", res.data);

      const acceptedTeam = res.data.find((team) => team.name === teamName);
      if (acceptedTeam) {
        setSelectedTeam(acceptedTeam);
      } else {
        console.error("Team not found or not accepted yet.");
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  }, [teamName, setSelectedTeam]);

  useEffect(() => {
    // For member accounts without a team specified, default to personal mode.
    if (user && user.role === "member" && !teamName) {
      setSelectedTeam(null);
      setLoading(false);
    } 
    // If a team is specified but not already set or is different from the selected team, fetch it.
    else if (!selectedTeam || (selectedTeam && selectedTeam.name !== teamName)) {
      fetchAcceptedTeams();
    } else {
      setLoading(false);
    }
  }, [user, teamName, selectedTeam, fetchAcceptedTeams, setSelectedTeam]);

  if (loading) return <div>Loading teams...</div>;

  // Pass teamName as-is to DashboardPage. For members in personal mode, teamName will be null.
  return <DashboardPage teamName={teamName} />;
};

export default TeamDashboard;
