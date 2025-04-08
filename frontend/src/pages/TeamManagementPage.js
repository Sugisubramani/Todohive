import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";

const TeamManagementPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/teams/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(response.data.members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleAddMember = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/teams/addMember",
        { email: newMemberEmail },
        { headers: { Authorization: `Bearer ${token}` },
      });
      setNewMemberEmail("");
      alert("Member added successfully!");
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member.");
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/teams/removeMember/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId));
      alert("Member removed successfully!");
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member.");
    }
  };

  return (
    <div className="team-management-page">
      <h2>Team Management</h2>
      <Modal.Body>
        <h5>Team Members</h5>
        {teamMembers.length > 0 ? (
          <ul>
            {teamMembers.map((member) => (
              <li key={member.id} className="d-flex justify-content-between align-items-center">
                <span>
                  {member.name} ({member.role})
                </span>
                {member.role === "Admin" && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No team members found.</p>
        )}
        <hr />
        <h5>Add New Member</h5>
        <div className="d-flex">
          <input
            type="email"
            placeholder="Enter member's email"
            className="form-control me-2"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleAddMember}>
            Add
          </button>
        </div>
      </Modal.Body>
    </div>
  );
};

export default TeamManagementPage;