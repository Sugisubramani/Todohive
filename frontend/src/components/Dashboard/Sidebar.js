// src/components/Dashboard/Sidebar.js
import React, { useState, useEffect, useContext } from "react";
import { Dropdown, Button, Form } from "react-bootstrap";
import { FaBars, FaPlus, FaUsers, FaSlidersH, FaCrown } from "react-icons/fa";
import { CgEditUnmask } from "react-icons/cg";
import { RiArrowDownSLine } from "react-icons/ri";
import { SlLogout } from "react-icons/sl";
import { MdBuild } from "react-icons/md";
import { BsPersonFill } from "react-icons/bs";
import { TbHomeMove } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import CreateTeamModal from "../Dashboard/CreateTeamModal";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/Sidebar.css";
import { TeamContext } from "../../context/TeamContext";

const Sidebar = ({
  collapsed,
  toggleSidebar,
  onFilterChange,
  openAddTaskModal,
  onTeamSelect,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve current user info
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : { name: "User" };
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  // Use shared team state from context
  const { selectedTeam, setSelectedTeam } = useContext(TeamContext);

  // Local states
  const [selectedFilters, setSelectedFilters] = useState(["All"]);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(["All"]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Enhanced toggleSidebar function
  const handleToggleSidebar = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleSidebar();
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Fetch teams when component mounts
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data);

        const params = new URLSearchParams(location.search);
        const joinedTeamName = params.get("joinedTeam");
        if (joinedTeamName) {
          const joinedTeam = res.data.find((team) => team.name === joinedTeamName);
          if (joinedTeam) {
            setSelectedTeam(joinedTeam);
            toast.success(`Joined ${joinedTeamName} team!`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: true,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        setTeams([]);
      }
    };
    fetchTeams();
  }, [location.search, setSelectedTeam]);

  // Handle team selection with toast notification
  const handleTeamClick = (team) => {
    // First check if we're already on this exact team
    if (selectedTeam?._id === team._id) {
      return; // Do nothing if clicking the same team
    }

    setSelectedTeam(team);
    if (onTeamSelect) onTeamSelect(team);
    localStorage.setItem("selectedTeam", JSON.stringify(team));
    navigate(`/team/${team.name}?id=${team._id}`); // Add team ID to URL
    
    toast.success(`Switched to ${team.name} team`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
    });
  };

  // Handle switching to personal mode with toast notification
  const handleSwitchToPersonal = () => {
    setSelectedTeam(null);
    localStorage.removeItem("selectedTeam");
    navigate("/dashboard", { replace: true });
    
    toast.info("Switched to Personal Dashboard", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
    });
  };

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("teams");
    localStorage.removeItem("selectedTeam");
    setSelectedTeam(null);
    navigate("/auth/login");
  };

  // Handle creating a new team
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

      // Show creation success toast
      toast(
        <div className="toast-content">
          <div>
            <strong>{teamName}</strong> team created!
            <br />
            <small style={{ opacity: 0.9 }}>
              Invitations sent to {members.length} member{members.length > 1 ? 's' : ''}
            </small>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          className: "dashboard-toast",
          style: {
            backgroundColor: "#4caf50"
          }
        }
      );

      return Promise.resolve();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team. Please try again.");
      return Promise.reject(error);
    }
  };

  // Filter handlers
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
    onFilterChange({ priority: newFilters, status: selectedStatus }); // Pass updated filters
  };

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
    onFilterChange({ priority: selectedFilters, status: newStatus }); // Pass updated status
  };

  const displayPriorityText =
    selectedFilters[0] === "All" ? "Priority" : selectedFilters.join(", ");
  const displayStatusText =
    selectedStatus[0] === "All" ? "Status" : selectedStatus.join(", ");

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
    <div
      className={`sidebar bg-light ${collapsed ? "collapsed" : ""}`}
      style={{ transition: "width 0.3s ease-in-out" }}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Button
          variant="light"
          className="toggle-btn header-item toggle-label"
          onClick={handleToggleSidebar}
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
                  <Dropdown.Item as="button" onClick={handleSwitchToPersonal}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TbHomeMove 
                        style={{ 
                          marginRight: "5px",
                          fontSize: "1.2rem",
                          transform: "scaleX(-1)"
                        }} 
                      />
                      My Space
                    </div>
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
                    <RiArrowDownSLine
                      style={{ transform: "rotate(0deg)", fontSize: "1.3rem" }}
                    />
                  ) : (
                    <RiArrowDownSLine
                      style={{ transform: "rotate(-90deg)", fontSize: "1.3rem" }}
                    />
                  )}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: "100%" }}>
                {["All", "High", "Medium", "Low"].map((level) => (
                  <Dropdown.Item
                    as="div"
                    onClick={(e) => e.stopPropagation()}
                    key={level}
                  >
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

            <Dropdown
              className="mb-3 w-100"
              onToggle={(isOpen) => setStatusOpen(isOpen)}
            >
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
                    <RiArrowDownSLine
                      style={{ transform: "rotate(0deg)", fontSize: "1.3rem" }}
                    />
                  ) : (
                    <RiArrowDownSLine
                      style={{ transform: "rotate(-90deg)", fontSize: "1.3rem" }}
                    />
                  )}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: "100%" }}>
                {["All", "Pending", "Completed", "Active"].map((stat) => (
                  <Dropdown.Item
                    as="div"
                    onClick={(e) => e.stopPropagation()}
                    key={stat}
                  >
                    <Form.Check
                      type="checkbox"
                      label={stat}
                      checked={selectedStatus.includes(stat)}
                      onChange={() => handleStatusToggle(stat)}
                      style={{
                        color: getStatusColor(stat),
                        fontSize: "1rem",
                      }}
                    />
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <Button
            variant="light"
            className="custom-white-button add-task-button mb-3 w-100 no-hover"
            onClick={() => setShowModal(true)}
          >
            <FaUsers
              style={{
                marginRight: "4px",
                fontSize: "1rem",
                position: "relative",
                top: "-2px",
              }}
            />
            <span style={{ fontSize: "0.9rem" }}>Add Team</span>
          </Button>

          <div
            className="project-section"
            style={{ borderTop: "1px solid #ddd", paddingTop: "0.75rem" }}
          >
            <div
              className="project-header d-flex justify-content-between align-items-center"
              style={{ cursor: "pointer" }}
              onClick={() => setProjectsExpanded(!projectsExpanded)}
            >
              <h6 className="sidebar-section-title m-0">Projects</h6>
              <RiArrowDownSLine
                style={{
                  transform: projectsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.2s ease-in-out",
                  fontSize: "1.3rem",
                }}
              />
            </div>
            {projectsExpanded && (
              <>
                {teams.length > 0 ? (
                  <ul className="team-list">
                    {teams.map((team) => (
                      <li
                        key={team._id}
                        className={`team-item ${
                          selectedTeam?._id === team._id ? "active-team" : ""
                        }`}
                        onClick={() => handleTeamClick(team)}
                      >
                        {team.role === "admin" ? (
                          <FaCrown 
                            className="role-icon admin-icon"
                            style={{ 
                              marginRight: '8px',
                              fontSize: '0.9rem'
                            }}
                          />
                        ) : (
                          <BsPersonFill 
                            className="role-icon member-icon"
                            style={{ 
                              marginRight: '8px',
                              fontSize: '0.9rem'
                            }}
                          />
                        )}
                        <span>{team.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    style={{
                      paddingLeft: "0.5rem",
                      marginTop: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#0d6efd",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowModal(true)}
                    className="add-team-link"
                  >
                    <FaPlus
                      style={{
                        marginRight: "4px",
                        fontSize: "0.8rem",
                        position: "relative",
                        top: "-1px",
                      }}
                    />
                    Add Team
                  </div>
                )}
              </>
            )}
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