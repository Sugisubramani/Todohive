import React, { useState } from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { FaBars, FaPlus, FaSlidersH, FaChevronDown, FaChevronRight } from 'react-icons/fa';
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
  // Local state to control whether the priority dropdown is open
  const [priorityOpen, setPriorityOpen] = useState(false);

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
        <Button variant="light" className="toggle-btn header-item" onClick={toggleSidebar}>
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
              <FaChevronDown className="custom-caret" />
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
            className="custom-white-button add-task-button mb-3 w-100 no-hover" 
            onClick={openAddTaskModal}
          >
            <FaPlus style={{ marginRight: '6px', fontSize: '0.9rem' }} />
            <span style={{ fontSize: '0.9rem' }}>Add Task</span>
          </Button>

          <Dropdown 
            className="mb-3 w-100 priority-filter"
            onToggle={(isOpen) => setPriorityOpen(isOpen)}
          >
            <Dropdown.Toggle 
              id="priority-filter-dropdown" 
              key={selectedFilter}  // Forces re-mount on change
              className={`dropdown-toggle custom-white-button w-100 ${getPriorityClass(selectedFilter)}`}
              style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem',
                color: getPriorityColor(selectedFilter),
                borderColor: (selectedFilter === "Priority" || selectedFilter === "All")
                              ? "#ced4da" 
                              : getPriorityColor(selectedFilter)
              }}
            >
              <FaSlidersH style={{ marginRight: '6px', fontSize: '0.9rem' }} />
              <span>{selectedFilter}</span>
              {priorityOpen ? (
                <FaChevronDown className="priority-caret" />
              ) : (
                <FaChevronRight className="priority-caret" />
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleFilterSelect("All")} style={{ color: '#212529', textAlign: 'left', fontSize: '0.9rem' }}>
                All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFilterSelect("High")} style={{ color: 'red', textAlign: 'left', fontSize: '0.9rem' }}>
                High
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFilterSelect("Medium")} style={{ color: 'orange', textAlign: 'left', fontSize: '0.9rem' }}>
                Medium
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFilterSelect("Low")} style={{ color: 'green', textAlign: 'left', fontSize: '0.9rem' }}>
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
