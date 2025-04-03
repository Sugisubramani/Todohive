import React, { useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import "../../styles/AttachmentItem.css";

const AttachmentItem = ({ file, task, fetchTasks, currentPage }) => {
  // Extract the extension and base name from file.displayName.
  const ext = file.displayName.substring(file.displayName.lastIndexOf('.'));
  const baseNameInitial = file.displayName.substring(0, file.displayName.lastIndexOf('.'));

  const [isEditing, setIsEditing] = useState(false);
  const [newBaseName, setNewBaseName] = useState(baseNameInitial);

  const handleRename = async (e) => {
    e.stopPropagation();
    // If newBaseName is empty, cancel the rename.
    if (!newBaseName.trim()) {
      setNewBaseName(baseNameInitial);
      setIsEditing(false);
      return;
    }
    // Build the final file name, preserving the original extension.
    const finalFileName = newBaseName.trim() + ext;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}/attachments/rename`,
        { originalPath: file.path, newFileName: finalFileName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      fetchTasks(currentPage);
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/tasks/${task._id}/delete-attachment`,
        {
          data: { filePath: file.path },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTasks(currentPage);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  return (
    <li className="attachment-item">
      <div className="attachment-content">
        {isEditing ? (
          <input
            type="text"
            value={newBaseName}
            onChange={(e) => setNewBaseName(e.target.value)}
            onBlur={handleRename}
            onKeyPress={(e) => e.key === "Enter" && handleRename(e)}
            className="attachment-rename-input"
            autoFocus
          />
        ) : (
          // Wrap file name in a clickable link to open the file.
          <a
            href={`http://localhost:5000${file.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="attachment-name"
          >
            {file.displayName}
          </a>
        )}
      </div>
      <div className="attachment-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="attachment-icon-btn"
          title="Rename"
        >
          <FaEdit size={16} />
        </button>
        <button
          onClick={handleDelete}
          className="attachment-icon-btn"
          title="Delete"
        >
          <FaTrash size={16} />
        </button>
      </div>
    </li>
  );
};

export default AttachmentItem;
