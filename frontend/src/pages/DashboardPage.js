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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // Define fetchTasks here so it can be passed down
  const fetchTasks = async (currentPage = page) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks?page=${currentPage}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      let fetchedTasks = res.data.tasks;
      // Apply priority filter if needed
      if (priorityFilter !== 'All') {
        fetchedTasks = fetchedTasks.filter(task => task.priority === priorityFilter);
      }
      setTasks(fetchedTasks);
      setPages(res.data.pages);
      setPage(res.data.page);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Fetch tasks on mount and when priorityFilter changes
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
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
        <div className="text-center mb-3">
          <a
            href="#!"
            className="main-add-task text-decoration-none"
            onClick={openAddTaskModal}
          >
            + Add Task
          </a>
        </div>
        <TaskList
          tasks={tasks}
          fetchTasks={fetchTasks}
          openEditTaskModal={openEditTaskModal}
          pages={pages}
          page={page}
        />
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
