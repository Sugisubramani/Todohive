import React, { useState } from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = ({ collapsed, toggleSidebar, onFilterChange, openAddTaskModal }) => {
  const navigate = useNavigate();

  // Get user from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { name: 'User' };
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Changed initial state to "Priority" instead of "Priority Filter"
  const [selectedFilter, setSelectedFilter] = useState("Priority");

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  // Helper: return CSS class based on filter value
  const getPriorityClass = (filter) => {
    switch (filter) {
      case "High": return "priority-high";
      case "Medium": return "priority-medium";
      case "Low": return "priority-low";
      case "All": return "priority-all";
      default: return "priority-default";
    }
  };

  // Helper: return color based on filter value
  const getPriorityColor = (filter) => {
    switch (filter) {
      case "High": return 'red';
      case "Medium": return 'orange';
      case "Low": return 'green';
      case "All": return '#212529';
      default: return '#212529';
    }
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className={`sidebar bg-light ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Button variant="light" className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </Button>
        {!collapsed && (
          <Dropdown className="profile-dropdown">
            <Dropdown.Toggle variant="light" id="dropdown-profile" className="d-flex align-items-center">
              <div className="profile-icon">{initial}</div>
              <span className="ms-2">{user.name}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      {/* Sidebar Content */}
      {!collapsed && (
        <div className="sidebar-content">
          <Button 
            variant="light" 
            className="custom-white-button add-task-button mb-3 w-100" 
            onClick={openAddTaskModal}
          >
            + Add Task
          </Button>

          <Dropdown className="mb-3 w-100 priority-filter">
            <Dropdown.Toggle 
              id="priority-filter-dropdown" 
              key={selectedFilter}  // Forces re-mount on change
              className={`dropdown-toggle custom-white-button w-100 ${getPriorityClass(selectedFilter)}`}
              style={{
                color: getPriorityColor(selectedFilter),
                borderColor: (selectedFilter === "Priority" || selectedFilter === "All")
                              ? "#ced4da" 
                              : getPriorityColor(selectedFilter)
              }}
            >
              {selectedFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleFilterSelect("All")} style={{ color: '#212529' }}>
                All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFilterSelect("High")} style={{ color: 'red' }}>
                High
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFilterSelect("Medium")} style={{ color: 'orange' }}>
                Medium
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFilterSelect("Low")} style={{ color: 'green' }}>
                Low
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
