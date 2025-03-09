import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Row, Col } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import "../../styles/TaskForm.css";
import PrioritySelect from "./PrioritySelect";

// Helper function to format ISO date for datetime-local input
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(Date.parse(dateString));
  const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
};

const TaskForm = ({ fetchTasks, taskToEdit, clearEdit, closeModal }) => {
  const [formData, setFormData] = useState({
    title: taskToEdit ? taskToEdit.title : "",
    description: taskToEdit ? taskToEdit.description : "",
    dueDate: taskToEdit && taskToEdit.dueDate ? formatDateForInput(taskToEdit.dueDate) : "",
    priority: taskToEdit ? taskToEdit.priority : "",
  });

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        dueDate: taskToEdit.dueDate ? formatDateForInput(taskToEdit.dueDate) : "",
        priority: taskToEdit.priority,
      });

      // Convert existing attachments into objects so they can be renamed
      const formattedExistingAttachments = (taskToEdit.attachments || []).map((filePath) => ({
        originalPath: filePath,
        customName: filePath.split(/[\\/]/).pop(), // Extract filename
      }));

      setExistingAttachments(formattedExistingAttachments);
    } else {
      setFormData({ title: "", description: "", dueDate: "", priority: "" });
      setExistingAttachments([]);
    }
  }, [taskToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      customName: file.name,
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRenameNewFile = (index, newName) => {
    setAttachments((prev) => {
      return prev.map((file, i) =>
        i === index ? { ...file, customName: newName } : file
      );
    });
  };

  const handleRenameExistingFile = (index, newName) => {
    setExistingAttachments((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, customName: newName } : file
      )
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
        data: { filePath: filePathToRemove }, // ✅ Send filePath inside request body
      });

      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Failed to delete attachment. Please try again.");
    }
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

    // ✅ Convert existingAttachments to include updated file names
    const updatedExistingAttachments = existingAttachments.map(file => ({
      originalPath: file.originalPath,
      newName: file.customName
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

      fetchTasks();
      setFormData({ title: "", description: "", dueDate: "", priority: "" });
      setAttachments([]);
      setExistingAttachments([]);
      if (closeModal) closeModal();
    } catch (error) {
      console.error("Error submitting task:", error);
      alert(error.response?.data?.message || "Task submission failed. Please try again.");
    }
  };


  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="formTitle">
        <Form.Label>Title</Form.Label>
        <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formDescription">
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} />
      </Form.Group>

      <Row className="mb-3">
        <Col>
          <Form.Group controlId="formDueDate">
            <Form.Label>Date & Time</Form.Label>
            <Form.Control type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group controlId="formPriority">
            <Form.Label>Priority</Form.Label>
            <PrioritySelect value={formData.priority} onChange={(newPriority) => setFormData({ ...formData, priority: newPriority })} />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="formAttachments">
        <Form.Label>Attachments</Form.Label>
        <Form.Control type="file" multiple onChange={handleFileChange} />
      </Form.Group>

      {/* Display New Attachments */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <h6>New Attachments:</h6>
          {attachments.map((item, index) => (
            <div key={index} className="d-flex align-items-center">
              <input type="text" value={item.customName} onChange={(e) => handleRenameNewFile(index, e.target.value)} className="form-control me-2" />
              <Button variant="outline-danger" size="sm" onClick={() => handleRemoveNewAttachment(index)}>
                <FaTrash />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Display Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="mb-3">
          <h6>Existing Attachments:</h6>
          {existingAttachments.map((item, index) => (
            <div key={index} className="d-flex align-items-center">
              <input type="text" value={item.customName} onChange={(e) => handleRenameExistingFile(index, e.target.value)} className="form-control me-2" />
              <Button variant="outline-danger" size="sm" onClick={() => handleRemoveExistingAttachment(index)}>
                <FaTrash />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" variant="success">{taskToEdit ? "Update Task" : "Add Task"}</Button>
      <Button variant="secondary" className="ms-2" onClick={closeModal}>Cancel</Button>
    </Form>
  );
};

export default TaskForm;
