// server/controllers/taskController.js
const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    // Handle file uploads (req.files contains an array of files, if any)
    const attachments = req.files ? req.files.map(file => file.path) : [];
    const task = new Task({ user: req.user.id, title, description, dueDate, priority, attachments });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { filePath } = req.body; // Expect filePath in the request body

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if the attachment exists in the task
    if (!task.attachments.includes(filePath)) {
      return res.status(404).json({ message: 'Attachment not found in task' });
    }

    // Remove the attachment from the task's attachments array
    task.attachments = task.attachments.filter(file => file !== filePath);
    await task.save();

    // Optionally, delete the file from disk
    const fullPath = path.join(__dirname, '../uploads', path.basename(filePath));
    fs.unlink(fullPath, (err) => {
      if (err) console.error('Error deleting file from disk:', err);
    });

    res.json({ message: 'Attachment deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


exports.getTasks = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Task.countDocuments({ user: req.user.id });
    res.json({ tasks, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Extract new file attachments from multer
    const newAttachments = req.files ? req.files.map(file => file.path) : [];

    // Update fields from req.body (they will come as strings even in FormData)
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.priority = req.body.priority || task.priority;

    // Merge existing attachments with new attachments if needed (or replace, as per your app logic)
    task.attachments = [...task.attachments, ...newAttachments];

    // If you're also toggling completion via a dedicated request, handle that separately.
    if (req.body.completed !== undefined) {
      task.completed = req.body.completed;
    }

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


