// src/components/Dashboard/AttachmentItem.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import "../../styles/AttachmentItem.css";

// We add dot (".") to our forbidden list so users can’t type it.
const forbiddenCharsSet = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|', '.']);

const AttachmentItem = ({ file, task, fetchTasks, currentPage }) => {
  // Use file.displayName as the full original file name.
  const originalName = file.displayName;  
  const dotIndex = originalName.lastIndexOf(".");
  const hasExtension = dotIndex !== -1;
  // The editable base name is everything before the dot.
  const baseNameInitial = hasExtension ? originalName.substring(0, dotIndex) : originalName;
  // The fixed extension includes the dot (if present).
  const extensionText = hasExtension ? originalName.substring(dotIndex) : "";
  
  // Local state for rename editing.
  const [isEditing, setIsEditing] = useState(false);
  const [baseName, setBaseName] = useState(baseNameInitial);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  
  // Reference to the input, so that we can auto-select on edit.
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Auto-select all text in the input—similar to Explorer.
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Tooltip handler.
  const triggerTooltip = (message) => {
    setTooltipText(message);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1500);
  };
  
  // Prevent forbidden characters—including the dot—from being entered.
  const handleInputKeyDown = (e) => {
    if (e.key === '.' || (e.key.length === 1 && forbiddenCharsSet.has(e.key))) {
      e.preventDefault();
      triggerTooltip('A file name can’t contain: \\ / : * ? " < > | or dot');
    }
  };
  
  // Handle renaming on blur or when Enter is pressed.
  const handleRename = async (e) => {
    e.stopPropagation();
    const trimmedBase = baseName.trim();
    // If empty, revert to the original full file name.
    if (trimmedBase === "") {
      setBaseName(baseNameInitial);
      setIsEditing(false);
      return;
    }
    const finalFileName = trimmedBase + extensionText;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}/attachments/rename`,
        { originalPath: file.path, newFileName: finalFileName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      setBaseName(trimmedBase);
      fetchTasks(currentPage);
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  };
  
  const handleBlur = (e) => {
    handleRename(e);
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
          <div className="rename-container" style={{ position: "relative", display: "inline-block" }}>
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleBlur}
              onKeyPress={(e) => { if (e.key === "Enter") handleRename(e); }}
              ref={inputRef}
              className="attachment-rename-input"
              autoFocus
            />
            <span style={{ pointerEvents: "none", marginLeft: "4px" }}>
              {extensionText}
            </span>
            {showTooltip && (
              <div
                className="attachment-tooltip"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: "0",
                  backgroundColor: "rgba(0,0,0,0.8)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  zIndex: 1000,
                }}
              >
                {tooltipText}
              </div>
            )}
          </div>
        ) : (
          <a
            href={`http://localhost:5000${file.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="attachment-name"
          >
            {originalName}
          </a>
        )}
      </div>
      <div className="attachment-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
            setBaseName(baseNameInitial); // Reset edit field on entering edit mode.
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
