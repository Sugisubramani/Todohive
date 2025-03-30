import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Form, Button, Row, Col } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";
import "../../styles/TaskForm.css";
import PrioritySelect from "./PrioritySelect";
import CustomReactDatetimePicker from "./CustomReactDatetimePicker";
import moment from "moment";

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const mUtc = moment.utc(dateString);
  if (mUtc.hour() === 0 && mUtc.minute() === 0 && mUtc.second() === 0) {
    return mUtc.format("YYYY-MM-DD");
  }
  const mLocal = moment(dateString).local();
  return mLocal.format("YYYY-MM-DDTHH:mm");
};

const forbiddenCharsSet = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|']);
const forbiddenCharsRegex = /[\\/:*?"<>|]/g;

const AttachmentTooltip = ({ show, message }) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 5px)",
        left: "30%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "5px 10px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          fontSize: "0.875rem",
        }}
      >
        <div
          style={{
            content: '""',
            position: "absolute",
            top: "-5px",
            left: "10%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderBottom: "5px solid rgba(0,0,0,0.8)",
          }}
        />
        {message}
      </div>
    </div>
  );
};

const AttachmentInput = ({ value, onRename }) => {
  const inputRef = useRef(null);
  const fallbackName = useRef(value);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  const triggerTooltip = (message) => {
    setTooltipText(message);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1500);
  };

  const clearTooltipIfValid = (val) => {
    if (!forbiddenCharsRegex.test(val)) {
      setShowTooltip(false);
    }
  };

  const allowedKeys = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Tab",
    "Shift",
    "Control",
    "Alt",
    "Meta",
  ];

  const handleKeyDown = (e) => {
    const dotIndex = value.lastIndexOf(".");
    if (allowedKeys.includes(e.key)) return;

    if (dotIndex !== -1 && e.target.selectionStart > dotIndex) {
      e.preventDefault();
      return;
    }

    if (e.key.length === 1 && forbiddenCharsSet.has(e.key)) {
      e.preventDefault();
      triggerTooltip('A file name can’t contain: \\ / : * ? " < > |');
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      if (dotIndex === -1) return;
      const { selectionStart, selectionEnd } = e.target;
      if (
        (selectionStart <= dotIndex && selectionEnd > dotIndex) ||
        (selectionStart === selectionEnd &&
          ((e.key === "Backspace" && selectionStart === dotIndex + 1) ||
            (e.key === "Delete" && selectionStart === dotIndex)))
      ) {
        e.preventDefault();
        triggerTooltip("You cannot delete the '.' in the extension.");
        return;
      }
    }
  };

  const handlePaste = (e) => {
    const dotIndex = value.lastIndexOf(".");
    if (dotIndex !== -1 && e.target.selectionStart > dotIndex) {
      e.preventDefault();
      return;
    }
    const pasteData = e.clipboardData.getData("text");
    const sanitized = pasteData.replace(forbiddenCharsRegex, "");
    e.preventDefault();
    const newValue = value + sanitized;
    onRename(newValue);
    clearTooltipIfValid(newValue);
  };

  const handleChange = (e) => {
    let newValue = e.target.value;
    onRename(newValue);
    clearTooltipIfValid(newValue);
  };

  const handleBlur = (e) => {
    let newValue = e.target.value;
    const fallbackExt = fallbackName.current.substring(fallbackName.current.indexOf("."));
    if (newValue.trim() === "" || newValue === fallbackExt) {
      onRename(fallbackName.current);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        className="form-control attachment-input"
        style={{ width: "100%", minWidth: "467px" }}
      />
      <AttachmentTooltip show={showTooltip} message={tooltipText} />
    </div>
  );
};

const TaskForm = ({ fetchTasks, taskToEdit, clearEdit, closeModal, currentPage }) => {
  const [formData, setFormData] = useState({
    title: taskToEdit ? taskToEdit.title : "",
    description: taskToEdit ? taskToEdit.description : "",
    dueDate: taskToEdit && taskToEdit.dueDate ? formatDateForInput(taskToEdit.dueDate) : "",
    priority: taskToEdit ? taskToEdit.priority : "",
  });

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const descriptionRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        dueDate: taskToEdit.dueDate ? formatDateForInput(taskToEdit.dueDate) : "",
        priority: taskToEdit.priority,
      });
      if (descriptionRef.current) {
        descriptionRef.current.style.height = "auto";
        descriptionRef.current.style.height = descriptionRef.current.scrollHeight + "px";
      }
      const formattedExistingAttachments = (taskToEdit.attachments || []).map((attachment) => {
        if (typeof attachment === "object" && attachment !== null) {
          return {
            originalPath: attachment.path,
            customName: attachment.displayName,
          };
        } else {
          return {
            originalPath: attachment,
            customName: attachment.split(/[\\/]/).pop(),
          };
        }
      });
      setExistingAttachments(formattedExistingAttachments);
    } else {
      setFormData({ title: "", description: "", dueDate: "", priority: "" });
      setExistingAttachments([]);
    }
  }, [taskToEdit]);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + "px";
    }
  }, [formData.description]);

  const handleTitleChange = (e) => {
    setFormData((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleChange = (e) => {
    if (e.target.name === "title") {
      handleTitleChange(e);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      customName: file.name,
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRenameNewFile = (index, newName) => {
    const originalFileName = attachments[index].file.name;
    const originalExt = originalFileName.split(".").pop();
    let sanitized = newName.replace(forbiddenCharsRegex, "");
    if (!sanitized.endsWith(`.${originalExt}`)) {
      const dotIndex = sanitized.lastIndexOf(".");
      if (dotIndex === -1) {
        sanitized = sanitized + "." + originalExt;
      } else {
        sanitized = sanitized.substring(0, dotIndex) + "." + originalExt;
      }
    }
    setAttachments((prev) =>
      prev.map((file, i) => (i === index ? { ...file, customName: sanitized } : file))
    );
  };

  const handleRenameExistingFile = (index, newName) => {
    const currentName = existingAttachments[index].customName;
    const originalExt = currentName.split(".").pop();
    let sanitized = newName.replace(forbiddenCharsRegex, "");
    if (!sanitized.endsWith(`.${originalExt}`)) {
      const dotIndex = sanitized.lastIndexOf(".");
      if (dotIndex === -1) {
        sanitized = sanitized + "." + originalExt;
      } else {
        sanitized = sanitized.substring(0, dotIndex) + "." + originalExt;
      }
    }
    setExistingAttachments((prev) =>
      prev.map((file, i) => (i === index ? { ...file, customName: sanitized } : file))
    );
  };

  const handleRemoveNewAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = async (index) => {
    if (!taskToEdit) return;
    const filePathToRemove = existingAttachments[index].originalPath;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskToEdit._id}/attachments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { filePath: filePathToRemove },
      });
      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Failed to delete attachment. Please try again.");
    }
  };

  const clearForm = () => {
    setFormData({ title: "", description: "", dueDate: "", priority: "" });
    setAttachments([]);
    setExistingAttachments([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("dueDate", formData.dueDate);
    data.append("priority", formData.priority);

    if (attachments.length > 0) {
      attachments.forEach((item) => {
        const renamedFile = new File([item.file], item.customName, { type: item.file.type });
        data.append("attachments", renamedFile);
      });
    }
    const updatedExistingAttachments = existingAttachments.map((file) => ({
      originalPath: file.originalPath,
      newName: file.customName,
    }));
    data.append("existingAttachments", JSON.stringify(updatedExistingAttachments));
    const token = localStorage.getItem("token");
    try {
      if (taskToEdit) {
        await axios.put(`http://localhost:5000/api/tasks/${taskToEdit._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:5000/api/tasks", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchTasks(currentPage);
      clearForm();
      if (closeModal) closeModal();
    } catch (error) {
      console.error("Error submitting task:", error);
      alert(
        error.response?.data?.message ||
        "Task submission failed. Please try again."
      );
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <Form onSubmit={handleSubmit} className="task-form">
        <Form.Group className="mb-3" controlId="formTitle" style={{ position: "relative" }}>
          <Form.Label>Title</Form.Label>
          <Form.Control
            ref={titleInputRef}
            type="text"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            name="description"
            rows={1}
            value={formData.description}
            onChange={handleChange}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            ref={descriptionRef}
            style={{ overflow: "hidden" }}
          />
        </Form.Group>

        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formDueDate">
              <Form.Label>Date &amp; Time</Form.Label>
              <CustomReactDatetimePicker
                selectedDate={formData.dueDate}
                onChange={(newDate) => setFormData({ ...formData, dueDate: newDate })}
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formPriority">
              <Form.Label>Priority</Form.Label>
              <PrioritySelect
                value={formData.priority}
                onChange={(newPriority) => setFormData({ ...formData, priority: newPriority })}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="formAttachments">
          <Form.Label>Attachments</Form.Label>
          <Form.Control type="file" multiple onChange={handleFileChange} />
        </Form.Group>

        {attachments.length > 0 && (
          <div className="mb-3">
            <h6>New Attachments:</h6>
            {attachments.map((item, index) => (
              <div key={index} className="attachment-wrapper">
                <AttachmentInput
                  value={item.customName}
                  onRename={(newVal) => handleRenameNewFile(index, newVal)}
                />
                <span className="attachment-delete-btn" onClick={() => handleRemoveNewAttachment(index)}>
                  <FiTrash2 size={18} />
                </span>
              </div>
            ))}
          </div>
        )}

        {existingAttachments.length > 0 && (
          <div className="mb-3">
            <h6>Existing Attachments:</h6>
            {existingAttachments.map((item, index) => (
              <div key={index} className="attachment-wrapper">
                <AttachmentInput
                  value={item.customName}
                  onRename={(newVal) => handleRenameExistingFile(index, newVal)}
                />
                <span className="attachment-delete-btn" onClick={() => handleRemoveExistingAttachment(index)}>
                  <FiTrash2 size={18} />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="button-group">
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" variant="outline-primary">
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default TaskForm;
