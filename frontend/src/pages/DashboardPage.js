import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import TaskList from "../components/Dashboard/TaskList";
import Sidebar from "../components/Dashboard/Sidebar";
import { Modal, Button } from "react-bootstrap";
import { FiTrash2, FiSearch } from "react-icons/fi";
import { CgMoreVertical } from "react-icons/cg";
import { VscClearAll } from "react-icons/vsc";
import { MdBuild } from "react-icons/md";
import TaskForm from "../components/Dashboard/TaskForm";
import "../styles/Dashboard.css";

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({ priority: ["All"], status: "All" });
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); 
    return () => clearInterval(intervalId);
  }, []);

  const moreMenuRef = useRef(null);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const isAllSelected = (filterArray) =>
    filterArray.includes("All") || filterArray.length === 0;

  const fetchTasks = useCallback(async (currentPage = 1) => {
    try {
      let url = `http://localhost:5000/api/tasks?page=${currentPage}&limit=5`;

      if (!isAllSelected(filters.priority)) {
        url += `&priority=${filters.priority.join(",")}`;
      }
      if (filters.status !== "All") {
        url += `&status=${filters.status}`;
      }
      if (searchText.trim()) {
        url += `&search=${encodeURIComponent(searchText.trim())}`;
      }

      console.log("Fetching tasks from URL:", url);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setTasks(
        res.data.tasks.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
      setPages(res.data.pages);
      setPage(res.data.page);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [filters, searchText]);

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openAddTaskModal = () => {
    setEditTask(null);
    setShowModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleDeleteTask = async () => {
    if (!editTask) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${editTask._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchTasks(page);
      closeModal();
      setEditTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const clearAllTasks = async () => {
    try {
      let url = `http://localhost:5000/api/tasks/clear`;
      let queryParams = [];
      if (!isAllSelected(filters.priority)) {
        queryParams.push(`priority=${filters.priority.join(",")}`);
      }
      if (filters.status !== "All") {
        queryParams.push(`status=${filters.status}`);
      }
      if (queryParams.length > 0) {
        url += "?" + queryParams.join("&");
      }

      console.log("Clearing tasks with URL:", url);
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchTasks(page);
      setShowMenu(false);
    } catch (error) {
      console.error("Error clearing tasks:", error);
      alert("Failed to clear tasks.");
    }
  };

  return (
    <div className="d-flex dashboard-container">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onFilterChange={setFilters}
        openAddTaskModal={openAddTaskModal}
      />

      <div className="flex-grow-1 p-3 main-content">
        <div className="header-area" style={{ position: "relative" }}>
          <a
            href="#!"
            className="main-add-task text-decoration-none"
            onClick={openAddTaskModal}
          >
            + Add Task
          </a>

          <div
            style={{
              position: "absolute",
              top: "-18px",
              right: "1px",
            }}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              <span
                className="customize-label"
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                <CgMoreVertical size={20} style={{ marginRight: "4px" }} />
                More
              </span>

              {showMenu && (
                <div
                  ref={moreMenuRef}
                  className="custom-dropdown show"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 40px)",
                    right: "0",
                    left: "auto",
                  }}
                >
                  <button className="dropdown-item" onClick={clearAllTasks}>
                    <VscClearAll style={{ marginRight: "8px" }} />
                    Clear Task
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item">
                    <MdBuild style={{ marginRight: "8px" }} />
                    More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="search-bar text-center mb-1">
          <div className="search-input-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="task-list-container">
          {tasks.length > 0 ? (
            <TaskList
              tasks={tasks}
              fetchTasks={fetchTasks}
              openEditTaskModal={openEditTaskModal}
              pages={pages}
              page={page}
              currentTime={currentTime}
            />
          ) : (
            <div className="no-tasks-message">
              {searchText
                ? `No tasks found for "${searchText}"`
                : "No tasks found."}
            </div>
          )}
        </div>
      </div>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header className="d-flex justify-content-between align-items-center">
          <Modal.Title>{editTask ? "Edit Task" : "Add Task"}</Modal.Title>
          {editTask && (
            <Button
              variant="link"
              onClick={handleDeleteTask}
              className="header-trash-btn"
              style={{
                border: "none",
                textDecoration: "none",
                color: "#dc3545",
              }}
            >
              <FiTrash2 size={20} />
            </Button>
          )}
        </Modal.Header>
        <Modal.Body>
          <TaskForm
            fetchTasks={fetchTasks}
            taskToEdit={editTask}
            clearEdit={() => setEditTask(null)}
            closeModal={closeModal}
            currentPage={page}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DashboardPage;