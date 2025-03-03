// client/src/components/Dashboard/TaskForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import { Form, Button, Row, Col } from 'react-bootstrap';
import '../../styles/Dashboard.css';


const TaskForm = ({ fetchTasks, taskToEdit, clearEdit, closeModal }) => {
  const [formData, setFormData] = useState({
    title: taskToEdit ? taskToEdit.title : '',
    description: taskToEdit ? taskToEdit.description : '',
    dueDate: taskToEdit && taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 16) : '',
    priority: taskToEdit ? taskToEdit.priority : ''
  });
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(taskToEdit ? taskToEdit.attachments : []);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 16) : '',
        priority: taskToEdit.priority
      });
      setExistingAttachments(taskToEdit.attachments || []);
    } else {
      setFormData({ title: '', description: '', dueDate: '', priority: '' });
      setExistingAttachments([]);
    }
  }, [taskToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    // Filter duplicates based on new file name vs. existing display names
    const filteredFiles = newFiles.filter((newFile) => {
      const duplicateInNew = attachments.some((file) => file.name === newFile.name);
      const duplicateInExisting = existingAttachments.some((filePath) => {
        const fileName = filePath.split(/[\\/]/).pop();
        const displayName = fileName.includes('-') ? fileName.substring(fileName.indexOf('-') + 1) : fileName;
        return displayName === newFile.name;
      });
      return !duplicateInNew && !duplicateInExisting;
    });
    if (filteredFiles.length < newFiles.length) {
      setMessage('Some duplicate files were not added.');
    }
    setAttachments((prev) => [...prev, ...filteredFiles]);
  };

  const handleDeleteNewFile = (fileName) => {
    setAttachments((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleDeleteExistingFile = async (filePath) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskToEdit._id}/attachment`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { filePath }
      });
      setExistingAttachments((prev) => prev.filter((file) => file !== filePath));
      fetchTasks();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setMessage('Error deleting attachment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('dueDate', formData.dueDate);
    data.append('priority', formData.priority);
    attachments.forEach((file) => {
      data.append('attachments', file);
    });

    const token = localStorage.getItem('token');
    try {
      if (taskToEdit) {
        await axios.put(`http://localhost:5000/api/tasks/${taskToEdit._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/tasks', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchTasks();
      setFormData({ title: '', description: '', dueDate: '', priority: '' });
      setAttachments([]);
      setExistingAttachments([]);
      setMessage('');
      if (closeModal) closeModal();
    } catch (error) {
      console.error('Error submitting task:', error);
      setMessage(error.response?.data?.message || 'Task submission failed. Please try again.');
    }
  };

  const handleDeleteTask = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskToEdit._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
      if (closeModal) closeModal();
    } catch (error) {
      console.error('Error deleting task:', error);
      setMessage('Error deleting task. Please try again.');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {message && <div className="alert alert-danger">{message}</div>}
      <Form.Group className="mb-3" controlId="formTitle">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-control form-control-lg"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formDescription">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={formData.description}
          onChange={handleChange}
          style={{ resize: 'vertical', minHeight: '2.5rem' }}
        />
      </Form.Group>

      <Row className="mb-3">
        <Col>
          <Form.Group controlId="formDueDate">
            <Form.Label>Date & Time</Form.Label>
            <Form.Control
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group controlId="formPriority">
            <Form.Label>Priority</Form.Label>
            <Form.Control
              as="select"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{ color: formData.priority === 'High' ? 'red' : formData.priority === 'Medium' ? 'orange' : formData.priority === 'Low' ? 'green' : 'inherit' }}
            >
              <option value="">Select Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="formAttachments">
        <Form.Label>Attachments</Form.Label>
        <Form.Control type="file" name="attachments" multiple onChange={handleFileChange} />
      </Form.Group>
      {/* Display new attachments */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <h6>New Attachments:</h6>
          {attachments.map((file, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center">
              <span>{file.name}</span>
              <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteNewFile(file.name)}>
                <FaTrash />
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Display existing attachments (edit mode) */}
      {taskToEdit && existingAttachments.length > 0 && (
        <div className="mb-3">
          <h6>Existing Attachments:</h6>
          {existingAttachments.map((filePath, index) => {
            const fileName = filePath.split(/[\\/]/).pop();
            const displayName = fileName.includes('-') ? fileName.substring(fileName.indexOf('-') + 1) : fileName;
            return (
              <div key={index} className="d-flex justify-content-between align-items-center">
                <a href={`http://localhost:5000/${filePath}`} target="_blank" rel="noopener noreferrer">
                  {displayName}
                </a>
                <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteExistingFile(filePath)}>
                  <FaTrash />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="d-flex justify-content-end">
        <Button type="submit" variant="success">
          {taskToEdit ? 'Update Task' : 'Add Task'}
        </Button>
        {taskToEdit && (
          <>
            <Button variant="danger" className="ms-2" onClick={handleDeleteTask}>
              Delete Task
            </Button>
            <Button variant="secondary" className="ms-2" onClick={closeModal}>
              Cancel
            </Button>
          </>
        )}
        {!taskToEdit && (
          <Button variant="secondary" className="ms-2" onClick={closeModal}>
            Cancel
          </Button>
        )}
      </div>
    </Form>
  );
};

export default TaskForm;
