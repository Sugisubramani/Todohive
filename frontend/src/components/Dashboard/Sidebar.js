// src/components/Dashboard/Sidebar.js
import React, { useState, useEffect } from "react";
import { Dropdown, Button, Form } from "react-bootstrap";
import { FaBars, FaPlus, FaUsers, FaSlidersH } from "react-icons/fa";
import { CgEditUnmask } from "react-icons/cg";
import { RiArrowDownSLine } from "react-icons/ri";
import { SlLogout } from "react-icons/sl";
import { MdBuild } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import CreateTeamModal from "../Dashboard/CreateTeamModal";
import axios from "axios";
import "../../styles/Sidebar.css";

const Sidebar = ({ collapsed, toggleSidebar, onFilterChange, openAddTaskModal, onTeamSelect }) => {
  const navigate = useNavigate();

  // Retrieve current user info.
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : { name: "User" };
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  // Local states for filters, dropdowns, teams, and modal visibility.
  const [selectedFilters, setSelectedFilters] = useState(["All"]);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(["All"]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch teams when the component mounts.
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data);
      } catch (error) {
        console.error("Error fetching teams in Sidebar:", error);
        setTeams([]);
      }
    };
    fetchTeams();
  }, []);

  // Handle team selection.
  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    if (onTeamSelect) {
      onTeamSelect(team);
    }
    localStorage.setItem("selectedTeam", JSON.stringify(team));
    navigate(`/team/${team.name}`);
  };

  // Logout functionality.
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("teams");
    localStorage.removeItem("selectedTeam");
    setSelectedTeam(null);
    navigate("/auth/login");
  };

  // Create new team.
  const handleCreateTeam = async ({ teamName, members }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/teams",
        { teamName, members },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newTeam = res.data.team;
      setTeams((prevTeams) => [...prevTeams, newTeam]);
      setShowModal(false);
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team. Please try again.");
    }
  };

  // Toggle priority filters.
  const handleFilterToggle = (filter) => {
    let newFilters = [...selectedFilters];
    if (filter === "All") {
      newFilters = ["All"];
    } else {
      newFilters = newFilters.filter((item) => item !== "All");
      newFilters.includes(filter)
        ? (newFilters = newFilters.filter((item) => item !== filter))
        : newFilters.push(filter);
      if (newFilters.length === 0) newFilters = ["All"];
    }
    setSelectedFilters(newFilters);
    onFilterChange({ priority: newFilters, status: selectedStatus });
  };

  // Toggle status filters.
  const handleStatusToggle = (stat) => {
    let newStatus = [...selectedStatus];
    if (stat === "All") {
      newStatus = ["All"];
    } else {
      newStatus = newStatus.filter((item) => item !== "All");
      newStatus.includes(stat)
        ? (newStatus = newStatus.filter((item) => item !== stat))
        : newStatus.push(stat);
      if (newStatus.length === 0) newStatus = ["All"];
    }
    setSelectedStatus(newStatus);
    onFilterChange({ priority: selectedFilters, status: newStatus });
  };

  // Determine filter text for display.
  const displayPriorityText =
    selectedFilters[0] === "All" ? "Priority" : selectedFilters.join(", ");
  const displayStatusText =
    selectedStatus[0] === "All" ? "Status" : selectedStatus.join(", ");

  // Define colors for different statuses.
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#FFA500";
      case "Completed":
        return "#28A745";
      case "Active":
        return "#1E90FF";
      default:
        return "#212529";
    }
  };

  return (
    <div className={`sidebar bg-light ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Button
          variant="light"
          className="toggle-btn header-item toggle-label"
          onClick={toggleSidebar}
        >
          <FaBars />
        </Button>
        {!collapsed && (
          <Dropdown className="profile-dropdown header-item">
            <Dropdown.Toggle
              variant="light"
              id="dropdown-profile"
              className="d-flex align-items-center profile-toggle"
            >
              <div className="profile-icon">{initial}</div>
              <span className="ms-2 sidebar-text">{user.name}</span>
              <RiArrowDownSLine className="custom-caret" />
            </Dropdown.Toggle>
            <Dropdown.Menu className="custom-profile-dropdown">
              {selectedTeam && (
                <>
                  <Dropdown.Item
                    as="button"
                    onClick={() => {
                      console.log("Switching to Personal mode");
                      if (onTeamSelect) onTeamSelect(null);
                      setSelectedTeam(null);
                      localStorage.removeItem("selectedTeam");
                      navigate("/dashboard");
                    }}
                  >
                    Switch to Personal
                  </Dropdown.Item>
                  <Dropdown.Divider />
                </>
              )}
              <Dropdown.Item as="button" onClick={handleLogout}>
                <SlLogout style={{ marginRight: "8px" }} />
                Logout
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as="button">
                <MdBuild style={{ marginRight: "8px" }} />
                More
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      {/* Sidebar Content */}
      {!collapsed && (
        <div className="sidebar-content">
          <Button
            variant="light"
            className="custom-white-button add-task-button mb-3 w-100 no-hover"
            onClick={openAddTaskModal}
          >
            <FaPlus
              style={{
                marginRight: "4px",
                fontSize: "1rem",
                position: "relative",
                top: "-2px",
              }}
            />
            <span style={{ fontSize: "0.9rem" }}>Add Task</span>
          </Button>

          <div className="filter-section">
            <Dropdown
              className="mb-3 w-100 priority-filter"
              onToggle={(isOpen) => setPriorityOpen(isOpen)}
              autoClose="outside"
            >
              <Dropdown.Toggle
                id="priority-filter-dropdown"
                className="dropdown-toggle custom-white-button sidebar-dropdown-control"
              >
                <FaSlidersH
                  style={{
                    marginRight: "6px",
                    fontSize: "1rem",
                    color: "black",
                    position: "relative",
                    top: "-4px",
                  }}
                />
                <span className="filter-text">{displayPriorityText}</span>
                <div className="dropdown-arrow">
                  {priorityOpen ? (
                    <RiArrowDownSLine style={{ transform: "rotate(0deg)", fontSize: "1.3rem" }} />
                  ) : (
                    <RiArrowDownSLine style={{ transform: "rotate(-90deg)", fontSize: "1.3rem" }} />
                  )}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: "100%" }}>
                {["All", "High", "Medium", "Low"].map((level) => (
                  <Dropdown.Item as="div" onClick={(e) => e.stopPropagation()} key={level}>
                    <Form.Check
                      type="checkbox"
                      label={level}
                      checked={selectedFilters.includes(level)}
                      onChange={() => handleFilterToggle(level)}
                      style={{
                        color:
                          level === "High"
                            ? "red"
                            : level === "Medium"
                            ? "orange"
                            : level === "Low"
                            ? "green"
                            : "#212529",
                        fontSize: "1rem",
                      }}
                    />
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
  
            <Dropdown className="mb-3 w-100" onToggle={(isOpen) => setStatusOpen(isOpen)}>
              <Dropdown.Toggle
                id="status-filter-dropdown"
                className="dropdown-toggle custom-white-button sidebar-dropdown-control"
              >
                <CgEditUnmask
                  style={{
                    marginRight: "6px",
                    fontSize: "1rem",
                    color: "black",
                    position: "relative",
                    top: "-4px",
                  }}
                />
                <span className="filter-text">{displayStatusText}</span>
                <div className="dropdown-arrow">
                  {statusOpen ? (
                    <RiArrowDownSLine style={{ transform: "rotate(0deg)", fontSize: "1.3rem" }} />
                  ) : (
                    <RiArrowDownSLine style={{ transform: "rotate(-90deg)", fontSize: "1.3rem" }} />
                  )}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: "100%" }}>
                {["All", "Pending", "Completed", "Active"].map((stat) => (
                  <Dropdown.Item as="div" onClick={(e) => e.stopPropagation()} key={stat}>
                    <Form.Check
                      type="checkbox"
                      label={stat}
                      checked={selectedStatus.includes(stat)}
                      onChange={() => handleStatusToggle(stat)}
                      style={{ color: getStatusColor(stat), fontSize: "1rem" }}
                    />
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
  
          <div className="project-section">
            <Button
              variant="light"
              className="custom-white-button mb-3 w-100 no-hover"
              onClick={() => setShowModal(true)}
            >
              <FaUsers style={{ marginRight: "4px", fontSize: "1rem" }} />
              <span style={{ fontSize: "0.9rem" }}>Add Team</span>
            </Button>
            <h6 className="sidebar-section-title">Projects</h6>
            <ul className="team-list">
              {teams.map((team, index) => (
                <li
                  key={index}
                  className={`team-item ${selectedTeam?.name === team.name ? "active-team" : ""}`}
                  onClick={() => handleTeamClick(team)}
                >
                  {team.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
  
      <CreateTeamModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateTeam}
      />
    </div>
  );
};

export default Sidebar;
