// client/src/components/Dashboard/TaskItem.js
import React from 'react';
import axios from 'axios';
import { FaRegCalendarAlt, FaPaperclip } from 'react-icons/fa';
import '../../styles/Dashboard.css';

const TaskItem = ({ task, fetchTasks, onEditTask }) => {
  const toggleComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        { completed: !task.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="card task-item">
      <div className="card-body">
        {/* Header: Toggle, Title, and Conditional Button */}
        <div className="task-item-header d-flex align-items-center">
          <input
            type="checkbox"
            className="form-check-input me-2"
            checked={task.completed}
            onChange={toggleComplete}
          />
          <h5 className="mb-0 flex-grow-1">{task.title}</h5>
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
        {/* Description */}
        <div className="mt-2">
          <p className="mb-0">{task.description || "No description"}</p>
        </div>
        {/* Footer: Date, Attachments, Priority */}
        <div className="task-item-footer d-flex align-items-center justify-content-between mt-2">
          <div className="due-date">
            <FaRegCalendarAlt className="me-1" />
            <small className="text-muted">{task.dueDate ? new Date(task.dueDate).toLocaleString() : "No date"}</small>
          </div>
          <div className="attachments">
            {task.attachments && task.attachments.length > 0 ? (
              task.attachments.map((file, index) => {
                const fileName = file.split(/[\\/]/).pop();
                const displayName = fileName.includes('-')
                  ? fileName.substring(fileName.indexOf('-') + 1)
                  : fileName;
                return (
                  <div key={index} className="attachment-item">
                    <FaPaperclip className="me-1" />
                    <a href={`http://localhost:5000/${file}`} target="_blank" rel="noopener noreferrer">
                      {displayName}
                    </a>
                  </div>
                );
              })
            ) : (
              <small className="text-muted">No attachments</small>
            )}
          </div>
          <div className="priority">
            <small className="text-muted">Priority: {task.priority || "N/A"}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
