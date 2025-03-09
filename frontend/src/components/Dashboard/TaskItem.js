import React, { useState } from "react";
import axios from "axios";
import { FaRegCalendarAlt, FaPaperclip } from "react-icons/fa";
import "../../styles/TaskItem.css";

const TaskItem = ({ task, fetchTasks, onEditTask }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleComplete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        { completed: !task.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Determine if the footer should be shown
  const hasFooter =
    task.dueDate ||
    (task.attachments && task.attachments.length > 0) ||
    task.priority;

  return (
    <div className={`card task-item ${task.completed ? "completed" : ""}`}>
      <div className="card-body p-2">
        {/* Header: Toggle, Title, and Conditional Button */}
        <div className="task-item-header">
          <input
            type="checkbox"
            className="form-check-input"
            checked={task.completed}
            onChange={toggleComplete}
          />
          <h5 className="task-title">{task.title}</h5>
          {task.completed ? (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => onEditTask(task)}>
              View
            </button>
          )}
        </div>
        
        {/* Description: Collapsed by default if too long */}
        {task.description && (
          <div className={`task-item-description ${expanded ? "expanded" : ""}`}>
            <p className="mb-0">{task.description}</p>
            {task.description.length > 100 && (
              <button className="btn btn-link btn-sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        )}

        {/* Footer: Render only if at least one field exists */}
        {hasFooter && (
          <div className="task-item-footer">
            {/* Due Date First */}
            {task.dueDate && (
              <div className="task-due-date">
                <FaRegCalendarAlt className="icon-date" />
                <small>{new Date(task.dueDate).toLocaleString()}</small>
              </div>
            )}

            {/* Priority Second */}
            {task.priority && (
              <div className={`task-priority ${task.priority.toLowerCase()}`}>
                <small>Priority: {task.priority}</small>
              </div>
            )}

            {/* Attachments Last */}
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
