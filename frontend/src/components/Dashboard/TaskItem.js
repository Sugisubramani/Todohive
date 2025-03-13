import React, { useState } from "react";
import axios from "axios";
import { FaRegCalendarAlt, FaPaperclip } from "react-icons/fa";
import "../../styles/TaskItem.css";

const formatDueDateDisplay = (dueDateString) => {
  if (!dueDateString) return "";

  const dueDate = new Date(dueDateString);
  const now = new Date();

  // Extract time
  let hours = dueDate.getHours();
  const minutes = dueDate.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  const timeString = `${hours}:${formattedMinutes} ${ampm}`;

  // Get today’s date at midnight
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = (dueStart - todayStart) / (1000 * 60 * 60 * 24);

  // Get this week's Sunday (last day of the current week)
  const thisSunday = new Date(todayStart);
  thisSunday.setDate(thisSunday.getDate() + (7 - thisSunday.getDay()));

  if (diffDays === 0) return `Today ${timeString}`;
  if (diffDays === 1) return `Tomorrow ${timeString}`;
  if (dueStart <= thisSunday) {
    // If it's still in this week (before or on Sunday), show the day name
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${weekdayNames[dueDate.getDay()]} ${timeString}`;
  }

  // If it's next week or later, show full date
  const day = dueDate.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const month = monthNames[dueDate.getMonth()];
  const year = dueDate.getFullYear();

  return `${day} ${month} ${year} ${timeString}`;
};

const TaskItem = ({ task, fetchTasks, onEditTask, currentPage }) => {
  const [expanded, setExpanded] = useState(false);

  // Clicking the entire item (if not completed) opens the view form
  const handleItemClick = () => {
    if (!task.completed) {
      onEditTask(task);
    }
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

  const hasFooter =
    task.dueDate ||
    (task.attachments && task.attachments.length > 0) ||
    task.priority;

  const now = new Date();
  const dueDatePassed = task.dueDate ? new Date(task.dueDate) < now : false;
  const statusLabel = task.completed
    ? "Completed"
    : (!task.completed && dueDatePassed ? "Pending" : "");

  return (
    <div
      className={`card task-item ${task.completed ? "completed" : ""}`}
      onClick={handleItemClick}
    >
      <div className="card-body p-2">
        {/* Header: Checkbox, Title, Status, and Action Button */}
        <div className="task-item-header">
          <input
            type="checkbox"
            className="complete-toggle"  // Changed from form-check-input to complete-toggle
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

        {/* Description */}
        {task.description && (
          <div className={`task-item-description ${expanded ? "expanded" : ""}`}>
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

        {/* Footer */}
        {hasFooter && (
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
                {task.attachments.map((file, index) => {
                  const fileName = file.split(/[\\/]/).pop();
                  const displayName = fileName.includes("-")
                    ? fileName.substring(fileName.indexOf("-") + 1)
                    : fileName;
                  return (
                    <div key={index} className="attachment-item">
                      <FaPaperclip className="icon-clip" />
                      <a
                        href={`http://localhost:5000/uploads/${fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {displayName}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
