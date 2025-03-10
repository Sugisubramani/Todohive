// client/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskList from '../components/Dashboard/TaskList';
import Sidebar from '../components/Dashboard/Sidebar';
import { Modal } from 'react-bootstrap';
import TaskForm from '../components/Dashboard/TaskForm';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // State for tasks and pagination
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fetch tasks from the backend with proper pagination and filtering
  const fetchTasks = async (currentPage = page) => {
    try {
      // Build the base URL with pagination
      let url = `http://localhost:5000/api/tasks?page=${currentPage}&limit=5`;
      
      // Append the priority filter if it's not 'All'
      if (priorityFilter !== 'All') {
        url += `&priority=${priorityFilter}`;
      }
  
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
  
      // The backend now returns the properly filtered tasks
      const fetchedTasks = res.data.tasks;
  
      // Ensure newest tasks are at the top (redundant if backend sorts, but safe to have)
      setTasks(fetchedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  
      // Update pagination details from the response
      setPages(res.data.pages);
      setPage(res.data.page);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // When priorityFilter changes, reset to page 1
  useEffect(() => {
    fetchTasks(1);
  }, [priorityFilter]);

  const openAddTaskModal = () => {
    setEditTask(null);
    setShowModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="d-flex dashboard-container">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onFilterChange={setPriorityFilter}
        openAddTaskModal={openAddTaskModal}
      />
      <div className="flex-grow-1 p-3 main-content">
        <div className="header-area text-center">
          <a href="#!" className="main-add-task text-decoration-none" onClick={openAddTaskModal}>
            + Add Task
          </a>
        </div>
        <div className="task-list-container">
          <TaskList
            tasks={tasks}
            fetchTasks={fetchTasks}
            openEditTaskModal={openEditTaskModal}
            pages={pages}
            page={page}
          />
        </div>
      </div>
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editTask ? 'Edit Task' : 'Add Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TaskForm
            fetchTasks={fetchTasks}
            taskToEdit={editTask}
            clearEdit={() => setEditTask(null)}
            closeModal={closeModal}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DashboardPage;
