// src/components/tasks/TaskForm.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Form, Button, Row, Col } from "react-bootstrap";
import { FiTrash2, FiCamera } from "react-icons/fi";       // ← added FiCamera
import "../../styles/TaskForm.css";
import PrioritySelect from "./PrioritySelect";
import CustomReactDatetimePicker from "./CustomReactDatetimePicker";
import moment from "moment";

const formatDateForInput = (dateString, isDateOnly = false) => {
  if (!dateString) return "";
  if (isDateOnly) {
    return moment.utc(dateString).format("YYYY-MM-DD");
  }
  const mLocal = moment(dateString).local();
  return mLocal.isValid() ? mLocal.format("YYYY-MM-DDTHH:mm") : "";
};

const forbiddenCharsSet = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|']);
const forbiddenCharsRegex = /[\\/:*?"<>|]/g;

const AttachmentTooltip = ({ show, message }) => {
  if (!show) return null;
  return (
    <div style={{
      position: "absolute",
      top: "calc(100% + 5px)",
      left: "30%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      pointerEvents: "none"
    }}>
      <div style={{
        position: "relative",
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "5px 10px",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        fontSize: "0.875rem"
      }}>
        <div style={{
          position: "absolute",
          top: "-5px",
          left: "10%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: "5px solid rgba(0,0,0,0.8)"
        }} />
        {message}
      </div>
    </div>
  );
};

const AttachmentInput = ({ value, onRename }) => {
  const inputRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  const triggerTooltip = (message) => {
    setTooltipText(message);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1500);
  };
  const clearTooltipIfValid = (val) => {
    if (!forbiddenCharsRegex.test(val)) setShowTooltip(false);
  };

  const allowedKeys = [
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "Home", "End", "Tab", "Shift", "Control", "Alt", "Meta"
  ];

  const handleKeyDown = (e) => {
    const currentValue = value || "";
    const dotIndex = currentValue.lastIndexOf(".");
    const { selectionStart, selectionEnd } = e.target;

    if (
      selectionStart === 0 &&
      selectionEnd === currentValue.length &&
      (e.key === "Backspace" || e.key === "Delete")
    ) {
      onRename("");
      return;
    }
    if (allowedKeys.includes(e.key)) return;
    if (dotIndex !== -1 && selectionStart > dotIndex) {
      e.preventDefault();
      return;
    }
    if (e.key.length === 1 && forbiddenCharsSet.has(e.key)) {
      e.preventDefault();
      triggerTooltip('A file name can’t contain: \\ / : * ? " < > |');
      return;
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
    const newValue = e.target.value;
    onRename(newValue);
    clearTooltipIfValid(newValue);
  };

  const handleBlur = (e) => {
    const newValue = e.target.value.trim();
    if (newValue === "" || /^\.[^.]+$/.test(newValue)) {
      onRename("");
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

const TaskForm = ({
  fetchTasks,
  taskToEdit,
  clearEdit,
  closeModal,
  currentPage,
  teamId,
  onDeleteTask
}) => {
  // form state
  const [formData, setFormData] = useState({
    title: taskToEdit ? taskToEdit.title : "",
    description: taskToEdit ? taskToEdit.description : "",
    dueDate: taskToEdit && taskToEdit.dueDate
      ? formatDateForInput(taskToEdit.dueDate, taskToEdit.isDateOnly)
      : "",
    priority: taskToEdit ? taskToEdit.priority : ""
  });
  const [attachments, setAttachments] = useState([]);
  const [isEditingTime, setIsEditingTime] = useState(() => {
    if (taskToEdit && taskToEdit.dueDate) {
      return !taskToEdit.isDateOnly;
    }
    return true;
  });

  const descriptionRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== "PHOTO")
        return;
      const dataUrl = e.data.payload;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `photo_${Date.now()}.png`, {
        type: blob.type,
      });
      setAttachments((prev) => [...prev, { file, customName: file.name }]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);


  // resize textarea as needed
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height =
        descriptionRef.current.scrollHeight + "px";
    }
  }, [formData.description]);

  // preload edit data
  useEffect(() => {
    if (taskToEdit) {
      const newDueDate =
        taskToEdit.dueDate && moment(taskToEdit.dueDate).isValid()
          ? taskToEdit.isDateOnly
            ? moment(taskToEdit.dueDate).format("YYYY-MM-DD")
            : formatDateForInput(taskToEdit.dueDate)
          : "";
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        dueDate: newDueDate,
        priority: taskToEdit.priority
      });
      setIsEditingTime(!taskToEdit.isDateOnly);
    } else {
      setFormData({ title: "", description: "", dueDate: "", priority: "" });
    }
  }, [taskToEdit]);

  const handleTitleChange = (e) =>
    setFormData((p) => ({ ...p, title: e.target.value }));

  const handleChange = (e) => {
    if (e.target.name === "title") return handleTitleChange(e);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      customName: file.name
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRenameNewFile = (index, newName) => {
    const original = attachments[index].file.name;
    if (!newName.trim()) {
      return setAttachments((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, customName: original } : f
        )
      );
    }
    const ext = original.split(".").pop();
    let sanitized = newName.replace(forbiddenCharsRegex, "").trim();
    if (!sanitized.includes(".")) sanitized += "." + ext;
    setAttachments((prev) =>
      prev.map((f, i) => (i === index ? { ...f, customName: sanitized } : f))
    );
  };

  const handleRemoveNewAttachment = (i) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const clearForm = () => {
    setFormData({ title: "", description: "", dueDate: "", priority: "" });
    setAttachments([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    if (formData.dueDate) data.append("dueDate", formData.dueDate);
    if (formData.priority !== "") data.append("priority", formData.priority);
    if (teamId) data.append("teamId", teamId);
    else data.append("personal", "true");

    attachments.forEach(({ file, customName }) => {
      const renamed = new File([file], customName, { type: file.type });
      data.append("attachments", renamed);
    });

    const token = localStorage.getItem("token");
    try {
      if (taskToEdit) {
        await axios.put(
          `http://localhost:5000/api/tasks/${taskToEdit._id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("http://localhost:5000/api/tasks", data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchTasks(currentPage);
      clearForm();
      closeModal?.();
    } catch (error) {
      console.error("Error submitting task:", error);
      alert(error.response?.data?.message || "Task submission failed.");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <Form onSubmit={handleSubmit} className="task-form">
        {/* Title */}
        <Form.Group className="mb-3" controlId="formTitle">
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

        {/* Description */}
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

        {/* Due Date & Priority */}
        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formDueDate">
              <Form.Label>
                Date {isEditingTime ? "& Time" : ""}
              </Form.Label>
              <CustomReactDatetimePicker
                mode={isEditingTime ? "datetime-local" : "date"}
                selectedDate={formData.dueDate}
                onChange={(d) => setFormData({ ...formData, dueDate: d || "" })}
              />
              {formData.dueDate && (
                <Button
                  variant="link"
                  onClick={(e) => {
                    e.preventDefault();
                    let d = formData.dueDate;
                    if (!isEditingTime) {
                      if (d && !d.includes("T")) d += "T00:00";
                    } else {
                      if (d && d.includes("T")) d = d.split("T")[0];
                    }
                    setFormData({ ...formData, dueDate: d });
                    setIsEditingTime(!isEditingTime);
                  }}
                  style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
                >
                  {isEditingTime ? "Remove Time" : "Add Time"}
                </Button>
              )}
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formPriority">
              <Form.Label>Priority</Form.Label>
              <PrioritySelect
                value={formData.priority}
                onChange={(p) => setFormData({ ...formData, priority: p })}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Attachments + Camera */}
        <Form.Group className="mb-3" controlId="formAttachments">
          <Form.Label>Attachments</Form.Label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Form.Control type="file" multiple onChange={handleFileChange} />
            <Button
              variant="outline-secondary"
              onClick={() =>
                window.open("/camera", "_blank")
              }
              title="Open camera in new tab"
            >
              <FiCamera />
            </Button>
          </div>
        </Form.Group>

        {/* Preview new attachments */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <h6>New Attachments:</h6>
            {attachments.map((item, i) => (
              <div key={i} className="attachment-wrapper">
                <AttachmentInput
                  value={item.customName}
                  onRename={(val) => handleRenameNewFile(i, val)}
                />
                <span
                  className="attachment-delete-btn"
                  onClick={() => handleRemoveNewAttachment(i)}
                >
                  <FiTrash2 size={18} />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="button-group">
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" variant="outline-primary">
            {taskToEdit ? "Update Task" : "Add Task"}
          </Button>
        </div>
      </Form>
    </div >
  );
};

export default TaskForm;
