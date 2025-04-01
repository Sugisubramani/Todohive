import React, { useState } from 'react';
import { Dropdown, Button, Form } from 'react-bootstrap';
import { FaBars, FaPlus, FaSlidersH } from 'react-icons/fa';
import { CgEditUnmask } from 'react-icons/cg';
import { RiArrowDownSLine } from 'react-icons/ri';
import { SlLogout } from 'react-icons/sl';
import { MdBuild } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import '../../styles/Sidebar.css';
import TeamForm from './TeamForm'; 

const Sidebar = ({ collapsed, toggleSidebar, onFilterChange, openAddTaskModal }) => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { name: 'User' };
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const [selectedFilters, setSelectedFilters] = useState(["All"]);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(["All"]);
  const [statusOpen, setStatusOpen] = useState(false);
  
  // NEW: State for Team Modal
  const [openTeamModal, setOpenTeamModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  const handleFilterToggle = (filter) => {
    let newFilters = [...selectedFilters];
    if (filter === "All") {
      newFilters = ["All"];
    } else {
      newFilters = newFilters.filter(item => item !== "All"); 
      if (newFilters.includes(filter)) {
        newFilters = newFilters.filter(item => item !== filter);
      } else {
        newFilters.push(filter);
      }
      if (newFilters.length === 0) {
        newFilters = ["All"];
      }
    }
    setSelectedFilters(newFilters);
    onFilterChange({ priority: newFilters, status: selectedStatus });
  };

  const handleStatusToggle = (stat) => {
    let newStatus = [...selectedStatus];
    if (stat === "All") {
      newStatus = ["All"];
    } else {
      newStatus = newStatus.filter(item => item !== "All");
      if (newStatus.includes(stat)) {
        newStatus = newStatus.filter(item => item !== stat);
      } else {
        newStatus.push(stat);
      }
      if (newStatus.length === 0) {
        newStatus = ["All"];
      }
    }
    setSelectedStatus(newStatus);
    onFilterChange({ priority: selectedFilters, status: newStatus });
  };

  const displayPriorityText =
    selectedFilters[0] === "All" ? "Priority" : selectedFilters.join(', ');
  const displayStatusText =
    selectedStatus[0] === "All" ? "Status" : selectedStatus.join(', ');

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
    <div className={`sidebar bg-light ${collapsed ? 'collapsed' : ''}`}>
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
              <Dropdown.Item as="button" onClick={handleLogout}>
                <SlLogout style={{ marginRight: '8px' }} />
                Logout
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as="button">
                <MdBuild style={{ marginRight: '8px' }} />
                More
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          <Button
            variant="light"
            className="custom-white-button add-task-button mb-3 w-100 no-hover"
            onClick={openAddTaskModal}
          >
            <FaPlus
              style={{
                marginRight: '4px',
                fontSize: '1rem',
                position: 'relative',
                top: '-2px'
              }}
            />
            <span style={{ fontSize: '0.9rem' }}>Add Task</span>
          </Button>

          {/* NEW: Add Team Button */}
          <Button
            variant="light"
            className="custom-white-button add-team-button mb-3 w-100 no-hover"
            onClick={() => setOpenTeamModal(true)}
          >
            <FaPlus
              style={{
                marginRight: '4px',
                fontSize: '1rem',
                position: 'relative',
                top: '-2px'
              }}
            />
            <span style={{ fontSize: '0.9rem' }}>Add Team</span>
          </Button>

          {/* Existing Dropdowns for Priority and Status */}
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
                  marginRight: '6px',
                  fontSize: '1rem',
                  color: 'black',
                  position: 'relative',
                  top: '-4px'
                }}
              />
              <span className="filter-text">{displayPriorityText}</span>
              <div className="dropdown-arrow">
                {priorityOpen ? (
                  <RiArrowDownSLine style={{ transform: 'rotate(0deg)', fontSize: '1.3rem' }} />
                ) : (
                  <RiArrowDownSLine style={{ transform: 'rotate(-90deg)', fontSize: '1.3rem' }} />
                )}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: '100%' }}>
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
                          ? 'red'
                          : level === "Medium"
                            ? 'orange'
                            : level === "Low"
                              ? 'green'
                              : '#212529',
                      fontSize: '1rem'
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
                  marginRight: '6px',
                  fontSize: '1rem',
                  color: 'black',
                  position: 'relative',
                  top: '-4px'
                }}
              />
              <span className="filter-text">{displayStatusText}</span>
              <div className="dropdown-arrow">
                {statusOpen ? (
                  <RiArrowDownSLine style={{ transform: 'rotate(0deg)', fontSize: '1.3rem' }} />
                ) : (
                  <RiArrowDownSLine style={{ transform: 'rotate(-90deg)', fontSize: '1.3rem' }} />
                )}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: '100%' }}>
              {["All", "Pending", "Completed", "Active"].map((stat) => (
                <Dropdown.Item as="div" onClick={(e) => e.stopPropagation()} key={stat}>
                  <Form.Check
                    type="checkbox"
                    label={stat}
                    checked={selectedStatus.includes(stat)}
                    onChange={() => handleStatusToggle(stat)}
                    style={{
                      color: getStatusColor(stat),
                      fontSize: '1rem',
                    }}
                  />
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}

      {/* NEW: Render TeamForm Modal */}
      {openTeamModal && (
        <TeamForm
          onClose={() => setOpenTeamModal(false)}
          // Optionally, pass a function to refresh teams if you plan to display them somewhere
        />
      )}
    </div>
  );
};

export default Sidebar;
