import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import axios from "axios";
import TaskList from "../components/Dashboard/TaskList";
import Sidebar from "../components/Dashboard/Sidebar";
import { Modal, Button, Dropdown, Toast } from "react-bootstrap";
import { FiTrash2, FiSearch } from "react-icons/fi";
import { CgMoreVertical } from "react-icons/cg";
import { VscClearAll } from "react-icons/vsc";
import { MdBuild } from "react-icons/md";
import { RiArrowDownSLine, RiTeamFill } from "react-icons/ri";
import TaskForm from "../components/Dashboard/TaskForm";
import { TeamContext } from "../context/TeamContext";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Dashboard.css";
import { io } from "socket.io-client";

const DashboardPage = ({ teamName }) => {
  const { selectedTeam, setSelectedTeam } = useContext(TeamContext);
  const navigate = useNavigate();

  // Component states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({ priority: ["All"], status: ["All"] });
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Toast state for notifications
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Refs
  const moreMenuRef = useRef(null);
  const socketRef = useRef(null);
  const prevTasksCountRef = useRef(tasks.length);
  const currentPageRef = useRef(page);

  const isAllSelected = (filterArray) =>
    filterArray.includes("All") || filterArray.length === 0;

  const fetchTasks = useCallback(
    async (currentPage = 1) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      try {
        let url = `http://localhost:5000/api/tasks?page=${currentPage}&limit=5`;

        // Handle team vs personal mode
        if (selectedTeam) {
          url += `&teamId=${selectedTeam._id}`;
        } else {
          // Add explicit personal mode filter
          url += `&personal=true&teamId=null`;
        }

        // Add priority filter
        if (!isAllSelected(filters.priority)) {
          url += `&priority=${filters.priority.join(",")}`;
        }

        // Add status filter
        if (!isAllSelected(filters.status)) {
          url += `&status=${filters.status.join(",")}`;
        }

        // Add search filter
        if (searchText.trim()) {
          url += `&search=${encodeURIComponent(searchText.trim())}`;
        }

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && typeof res.data === "object") {
          const fetchedTasks = res.data.tasks.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setTasks(fetchedTasks);
          setPages(res.data.pages);
          setPage(Number(res.data.page));
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    },
    [selectedTeam, filters, searchText, navigate]
  );

  useEffect(() => {
    setPage(1);
    fetchTasks(1);
  }, [teamName, fetchTasks]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    socketRef.current = io("http://localhost:5000", {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selectedTeam]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Leave previous room if exists
    if (selectedTeam?.previousTeamId) {
      socket.emit("leaveTeamRoom", selectedTeam.previousTeamId);
    }

    // Join appropriate room
    if (selectedTeam) {
      console.log("Joining team room:", selectedTeam._id);
      socket.emit("joinTeamRoom", selectedTeam._id);
    } else {
      console.log("Joining personal room");
      // Get user ID from localStorage instead of req
      const user = JSON.parse(localStorage.getItem("user"));
      socket.emit("joinPersonalRoom", user._id);
    }

    const handleTaskChange = () => {
      console.log("Socket event received, fetching tasks...");
      fetchTasks(currentPageRef.current);
    };

    // Listen to events
    socket.on("taskAdded", handleTaskChange);
    socket.on("taskUpdated", handleTaskChange);
    socket.on("taskDeleted", handleTaskChange);
    socket.on("tasksCleared", handleTaskChange);

    return () => {
      socket.off("taskAdded", handleTaskChange);
      socket.off("taskUpdated", handleTaskChange);
      socket.off("taskDeleted", handleTaskChange);
      socket.off("tasksCleared", handleTaskChange);
    };
  }, [selectedTeam, fetchTasks]);

  useEffect(() => {
    if (!teamName) {
      setSelectedTeam(null);
    }
  }, [teamName, setSelectedTeam]);

  useEffect(() => {
    if (selectedTeam) {
      console.log("Selected team:", selectedTeam.name);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchTasks(page);
  }, [selectedTeam, filters, searchText, page, fetchTasks]);

  useEffect(() => {
    if (prevTasksCountRef.current > 0 && tasks.length === 0 && page > 1) {
      setPage((prev) => prev - 1);
    }
    prevTasksCountRef.current = tasks.length;
  }, [tasks, page]);

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  // Show a Bootstrap Toast whenever the selectedTeam changes.
  useEffect(() => {
    const currentTeam = selectedTeam?.name || "Personal";
    setToastMessage(`Now viewing ${currentTeam} Dashboard`);
    setShowToast(true);
  }, [selectedTeam]);

  const handleLeaveTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/teams/leaveTeam",
        { teamId: selectedTeam._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTeam(null);
      navigate("/dashboard");
      fetchTasks(1);
      setShowLeaveModal(false);
    } catch (error) {
      console.error("Error leaving team:", error);
      alert("Failed to leave team. Please try again.");
    }
  };

  const openAddTaskModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setEditTask(null);
  };

  const openEditTaskModal = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      closeModal();
      fetchTasks(page);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const clearAllTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/api/tasks/clear";
      if (selectedTeam) {
        url += `?teamId=${selectedTeam._id}`;
      }
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks(page);
    } catch (error) {
      console.error("Error clearing tasks:", error);
    }
  };

  return (
    <>
      {/* React-Bootstrap Toast for notifications */}
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={1500}
        autohide
        className="dashboard-toast"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 9999,
          width: "300px",
        }}
      >
        <Toast.Body style={{ backgroundColor: "#56565", color: "#fff", padding: "0.55rem 1zrem" }}>
          {toastMessage}
        </Toast.Body>
      </Toast>

      <div className="d-flex dashboard-container">
        <Sidebar
          collapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          onFilterChange={setFilters}
          openAddTaskModal={openAddTaskModal}
          onTeamSelect={setSelectedTeam}
        />
        <div className="flex-grow-1 p-3 main-content">
          <div
            className="header-area"
            style={{ position: "relative", textAlign: "center" }}
          >
            {selectedTeam && (
              <Dropdown style={{ position: "absolute", top: "-7px", left: "1px" }}>
                <Dropdown.Toggle variant="light" id="team-dropdown" className="team-dropdown">
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                      textTransform: "uppercase",
                    }}
                  >
                    <RiTeamFill
                      style={{
                        marginRight: "-2px",
                        color: "#007bff",
                        verticalAlign: "text-top",
                        position: "relative",
                        top: "3px",
                      }}
                    />{" "}
                    {selectedTeam.name}
                  </span>{" "}
                  <RiArrowDownSLine size={16} style={{ marginLeft: "4px", verticalAlign: "middle" }} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setShowLeaveModal(true)}>
                    Leave Team
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
            <a
              href="#!"
              className="main-add-task text-decoration-none"
              onClick={openAddTaskModal}
            >
              + Add Task
            </a>
            <div style={{ position: "absolute", top: "-18px", right: "1px" }}>
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
                      Clear Tasks
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item">
                      <MdBuild style={{ marginRight: "8px" }} />
                      Settings
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
                onClick={() => handleDeleteTask(editTask._id)}
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
              teamId={selectedTeam ? selectedTeam._id : null}
              onDeleteTask={handleDeleteTask}
            />
          </Modal.Body>
        </Modal>
        <Modal
          show={showLeaveModal}
          onHide={() => setShowLeaveModal(false)}
          centered
          size="md"
        >
          <Modal.Header>
            <Modal.Title className="text-center w-100">Leave Team</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <p>
              Are you sure you want to leave the team <strong>{selectedTeam?.name}</strong>?
            </p>
            <p className="text-danger">This action cannot be undone.</p>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-end">
            <button
              className="btn btn-secondary"
              onClick={() => setShowLeaveModal(false)}
              style={{
                minWidth: "80px",
                fontSize: "0.9rem",
                padding: "6px 12px",
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLeaveTeam}
              style={{
                minWidth: "80px",
                fontSize: "0.9rem",
                padding: "6px 12px",
                marginLeft: "10px",
              }}
            >
              Leave
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default DashboardPage;
