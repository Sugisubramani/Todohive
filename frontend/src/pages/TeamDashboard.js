import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import { useParams, useLocation, useSearchParams, Navigate } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { TeamContext } from "../context/TeamContext";

const TeamDashboard = () => {
  const { teamName } = useParams();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("id");
  const location = useLocation();
  const { setSelectedTeam } = useContext(TeamContext);
  const [loading, setLoading] = useState(true);

  // Retrieve token unconditionally
  const token = localStorage.getItem("token");

  // Always call useEffect (hooks must be called in the same order)
  useEffect(() => {
    // If there's no token, skip fetching and clear the team.
    if (!token) {
      setSelectedTeam(null);
      setLoading(false);
      return;
    }
    if (!teamName || !teamId) {
      setSelectedTeam(null);
      setLoading(false);
      return;
    }

    const fetchTeam = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const team = res.data.find((t) => t._id === teamId);
        if (team) {
          setSelectedTeam(team);
        } else {
          console.error("Team not found");
          setSelectedTeam(null);
        }
      } catch (error) {
        console.error("Error fetching team:", error);
        setSelectedTeam(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamName, teamId, setSelectedTeam, token]);

  // If there is no token, redirect to login
  if (!token) {
    return <Navigate to="/auth/login" />;
  }

  if (loading) return <div>Loading teams...</div>;

  return <DashboardPage key={location.key} teamName={teamName} />;
};

export default TeamDashboard;
