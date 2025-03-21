// File: src/components/Dashboard/TaskItem.js
import React, { useState } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { FaRegCalendarAlt, FaPaperclip } from "react-icons/fa";
import "../../styles/TaskItem.css";
import moment from "moment";

const formatDueDateDisplay = (dueDateString) => {
  if (!dueDateString) return "";

  // Parse the string in UTC
  const mUtc = moment.utc(dueDateString);
  
  // If the stored time is exactly midnight in UTC, treat as date-only.
  if (mUtc.hour() === 0 && mUtc.minute() === 0 && mUtc.second() === 0) {
    return mUtc.format("D MMMM YYYY");
  }
  
  // Otherwise, show both date and time (converted to local time)
  return moment(dueDateString).format("D MMMM YYYY, h:mm A");
};


const TaskItem = ({ task, fetchTasks, onEditTask, currentPage }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  const handleItemClick = () => {
    if (!task.completed) onEditTask(task);
  };

  const toggleComplete = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        { completed: !task.completed },
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

  // Compute if due date has passed inline.
  const dueDatePassed = task.dueDate ? new Date(task.dueDate) < new Date() : false;
  const statusLabel = task.completed
    ? "Completed"
    : (!task.completed && dueDatePassed ? "Pending" : "");

  return (
    <div className={`card task-item ${task.completed ? "completed" : ""}`} onClick={handleItemClick}>
      <div className="card-body p-2">
        {/* Header */}
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
            {statusLabel && <span className={`status-label ${statusLabel.toLowerCase()}`}>{statusLabel}</span>}
          </h5>
          <div className="action-buttons">
            {task.completed ? (
              <button className="btn btn-outline-danger btn-sm" onClick={handleDelete} style={{ minWidth: "80px" }}>
                Delete
              </button>
            ) : (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                style={{ minWidth: "80px" }}
              >
                View
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className={`task-item-description ${expanded ? "expanded" : ""}`}>
            <p className="mb-0">{task.description}</p>
            {task.description.length > 100 && (
              <button className="btn btn-link btn-sm" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                {expanded ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="task-item-footer">
          {task.dueDate && (
            <div className="task-due-date">
              <FaRegCalendarAlt className="icon-date" />
              <small>{formatDueDateDisplay(task.dueDate)}</small>
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
                onClick={(e) => { e.stopPropagation(); setShowAttachmentsModal(true); }}
                className="attachments-link"
              >
                Attachments ({task.attachments.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {showAttachmentsModal &&
        createPortal(
          <div
            className="ti-modal-overlay"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAttachmentsModal(false);
            }}
          >
            <div className="ti-modal-content" onClick={(e) => e.stopPropagation()}>
              <h5 className="ti-modal-title">{task.title}</h5>
              <hr className="ti-modal-separator" />
              <ul>
                {task.attachments.map((file, index) => {
                  const fileName = file.split(/[\\/]/).pop();
                  const displayName = fileName.includes("-")
                    ? fileName.substring(fileName.indexOf("-") + 1)
                    : fileName;
                  return (
                    <li key={index} className="ti-small-attachment">
                      <span className="ti-bullet">&#8226;</span>
                      <a
                        href={`http://localhost:5000/uploads/${fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {displayName}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <button className="btn btn-secondary" onClick={() => setShowAttachmentsModal(false)}>
                Close
              </button>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};

export default TaskItem;
