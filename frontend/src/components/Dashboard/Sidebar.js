// client/src/components/Dashboard/Sidebar.js
import React from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { FaBars, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

const Sidebar = ({ collapsed, toggleSidebar, onFilterChange, openAddTaskModal }) => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { name: 'User' };
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  return (
    <div className={`sidebar bg-light ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header d-flex justify-content-between align-items-center mb-4">
        {!collapsed && (
          <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-profile" className="d-flex align-items-center">
              <div className="profile-icon">{initial}</div>
              <span className="ms-2 sidebar-text">{user.name}</span>
              <FaChevronDown className="dropdown-arrow ms-1" />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
        <Button variant="light" onClick={toggleSidebar}>
          <FaBars />
        </Button>
      </div>
      {!collapsed && (
        <>
          <Button variant="primary" className="mb-3 w-100" onClick={openAddTaskModal}>
            Add Task
          </Button>
          <Dropdown className="mb-3 w-100 priority-filter">
            <Dropdown.Toggle variant="outline-secondary" id="priority-filter-dropdown" className="w-100">
              Priority Filter
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onFilterChange('All')}>All</Dropdown.Item>
              <Dropdown.Item onClick={() => onFilterChange('High')}>High</Dropdown.Item>
              <Dropdown.Item onClick={() => onFilterChange('Medium')}>Medium</Dropdown.Item>
              <Dropdown.Item onClick={() => onFilterChange('Low')}>Low</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </>
      )}
    </div>
  );
};

export default Sidebar;
