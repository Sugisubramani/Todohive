import React, { useState, useEffect } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { FaRegCalendarAlt, FaPaperclip, FaComment } from "react-icons/fa";
import moment from "moment";
import AttachmentItem from "./AttachmentItem";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import CommentBox from "./CommentBox";
import "../../styles/TaskItem.css";

const formatDueDateDisplay = (task) => {
  if (!task.dueDate) return null;

  if (task.isDateOnly && task.localDueDate) {
    return moment(task.localDueDate, "YYYY-MM-DD").format("D MMMM YYYY");
  }

  return moment(task.dueDate).local().format("D MMMM YYYY, h:mm A");
};

const TaskItem = ({ task, fetchTasks, onEditTask, currentPage }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const currentUser = JSON.parse(localStorage.getItem("user"));

  console.log("Task data:", task);
  console.log("Current user:", currentUser);
  console.log("Task created by:", task.createdBy);

  // --- Magic Fix Part 1: ID extraction and conversion ---
  // Force both currentUser and task.createdBy IDs to string and trim any extra spaces.
  const currentUserId = String(currentUser._id || currentUser.id || "").trim();

  const createdById =
    task.createdBy && (task.createdBy._id || task.createdBy.id)
      ? String(task.createdBy._id || task.createdBy.id).trim()
      : task.createdBy
        ? String(task.createdBy).trim()
        : "";
  const createdByName =
    task.createdBy && task.createdBy.name ? task.createdBy.name : "";

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleItemClick = () => {
    if (!task.completed) onEditTask(task);
  };

  // --- Magic Fix Part 2: Prevent infinite update loops ---
  // Remove currentTime from dependencies; update only when the dueDate changes.
  useEffect(() => {
    if (!task.dueDate) {
      setCurrentTime(Date.now());
      return;
    }
    const dueTime = moment(task.dueDate).valueOf();
    const now = Date.now();
    const delay = dueTime - now;
    if (delay > 0 && delay < 60000) {
      const timeoutId = setTimeout(() => {
        setCurrentTime(Date.now());
      }, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [task.dueDate]);

  const toggleComplete = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");

      const updatedDueDate = task.dueDate
        ? task.isDateOnly
          ? moment(task.dueDate).format("YYYY-MM-DD")
          : new Date(task.dueDate).toISOString()
        : null;

      const updatedFullDate = task.dueDate ? !task.isDateOnly : false;

      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        {
          title: task.title,
          description: task.description,
          dueDate: updatedDueDate,
          fullDate: updatedFullDate,
          priority: task.priority,
          attachments: task.attachments,
          completed: !task.completed,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks(currentPage);
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks(currentPage);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const isDateOnly =
    task.dueDate && typeof task.dueDate === "string"
      ? /T00:00:00\.000Z$/.test(task.dueDate)
      : false;
  const dueDatePassed = task.dueDate
    ? isDateOnly
      ? moment()
        .startOf("day")
        .isAfter(moment(task.dueDate).local().startOf("day"))
      : moment().isAfter(moment(task.dueDate).local())
    : false;
  const statusLabel = task.completed
    ? "Completed"
    : !task.completed && dueDatePassed
      ? "Pending"
      : "";

  const formattedDueDate = formatDueDateDisplay(task);

  const cardContent = (
    <div
      className={`card task-item ${task.completed ? "completed" : ""}`}
      onClick={handleItemClick}
    >
      <div className="card-body p-2">
        <div className="task-item-header">
          <input
            type="checkbox"
            className="complete-toggle"
            checked={task.completed}
            onChange={toggleComplete}
            onClick={(e) => e.stopPropagation()}
          />
          <h5 className="task-title">
            <span className="title-text">{task.title}</span>
            {statusLabel && (
              <span className={`status-label ${statusLabel.toLowerCase()}`}>
                {statusLabel}
              </span>
            )}
          </h5>
          <div className="action-buttons">
            {task.completed ? (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleDelete}
                style={{ minWidth: "80px" }}
              >
                Delete
              </button>
            ) : (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTask(task);
                }}
                style={{ minWidth: "80px" }}
              >
                View
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <div
            className={`task-item-description ${expanded ? "expanded" : ""}`}
          >
            <p className="mb-0">{task.description}</p>
            {task.description.length > 100 && (
              <button
                className="btn btn-link btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        )}

        <div className="task-item-footer">
          {formattedDueDate && (
            <div className="task-due-date">
              <FaRegCalendarAlt className="icon-date" />
              <small>{formattedDueDate}</small>
            </div>
          )}

          {task.priority && (
            <div className={`task-priority ${task.priority.toLowerCase()}`}>
              <small>Priority: {task.priority}</small>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="task-attachments">
              <FaPaperclip className="clip-icon" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachmentsModal(true);
                }}
                className="attachments-link"
              >
                Attachments ({task.attachments.length})
              </button>
            </div>
          )}

          {task.teamId && (
            <div
              className="task-comments"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsModal(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <FaComment className="comment-icon" />
              <span className="comments-count">
                {task.comments?.length || 0}
              </span>
            </div>
          )}

          {task.createdBy && task.teamId && (
            <div className="task-created-by" style={{ marginLeft: "auto" }}>
              <small>
                {`Created by ${createdById === currentUserId ? "you" : createdByName
                  }`}
              </small>
            </div>
          )}
        </div>
      </div>

      {showAttachmentsModal &&
        createPortal(
          <div
            className="ti-modal-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setShowAttachmentsModal(false);
            }}
          >
            <div className="ti-modal-content" onClick={(e) => e.stopPropagation()}>
              <h5 className="ti-modal-title">{task.title}</h5>
              <hr className="ti-modal-separator" />
              <ul className="ti-attachments-list">
                {task.attachments.map((file, index) => (
                  <AttachmentItem
                    key={index}
                    file={file}
                    task={task}
                    fetchTasks={fetchTasks}
                    currentPage={currentPage}
                  />
                ))}
              </ul>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAttachmentsModal(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}

      {showCommentsModal &&
        createPortal(
          <div
            className="ti-modal-overlay"
            onClick={() => setShowCommentsModal(false)}
            style={{ cursor: 'pointer' }}
          >
            {/* Stop clicks inside from closing */}
            <div onClick={e => e.stopPropagation()}>
              <CommentBox
                task={task}
                fetchTasks={fetchTasks}
                onClose={() => setShowCommentsModal(false)}
              />
            </div>
          </div>,
          document.body
        )}


      <span style={{ display: "none" }}>{currentTime}</span>
    </div>
  );

  return task.teamId && task.createdBy ? (
    <OverlayTrigger
      trigger={["hover", "focus"]}
      placement="left"
      delay={{ show: 150, hide: 0 }}
      overlay={
        <Tooltip id={`tooltip-${task._id}`} className="custom-tooltip">
          {createdById === currentUserId
            ? "Created by you"
            : `Created by ${createdByName}`}
        </Tooltip>
      }
    >
      {cardContent}
    </OverlayTrigger>
  ) : (
    cardContent
  );
};

export default TaskItem;
