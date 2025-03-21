const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    const attachments = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
    const task = new Task({ user: req.user.id, title, description, dueDate, priority, attachments });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, priority, search } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    // Base query with user and optional priority filter
    const queryObj = { user: req.user.id };
    if (priority && priority !== 'Priority') {
      queryObj.priority = priority;
    }
    
    if (search) {
      // Create an exact match regex for title (case-insensitive)
      const exactRegex = new RegExp(`^${search}$`, 'i');
      const exactCount = await Task.countDocuments({ ...queryObj, title: exactRegex });
      
      if (exactCount > 0) {
        // Use exact match if available
        queryObj.title = exactRegex;
      } else {
        // Otherwise, use a partial match on title only (no description hints)
        queryObj.title = new RegExp(search, 'i');
      }
    }
    
    const tasks = await Task.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Task.countDocuments(queryObj);
    res.json({ tasks, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Parse existingAttachments if provided (for attachments that are being renamed)
    let existingAttachments = [];
    if (req.body.existingAttachments) {
      try {
        existingAttachments = JSON.parse(req.body.existingAttachments);
      } catch (error) {
        console.error("Error parsing existingAttachments:", error);
        return res.status(400).json({ message: "Invalid existingAttachments format." });
      }
    }

    let renamedAttachments = [];
    // Collect original paths from the attachments being renamed
    let originalsToRemove = [];
    for (let file of existingAttachments) {
      if (!file.originalPath || typeof file.originalPath !== "string") {
        console.warn("Skipping invalid attachment (missing originalPath):", file);
        continue;
      }
      if (!file.newName || typeof file.newName !== "string") {
        console.warn("Skipping invalid attachment (missing newName):", file);
        continue;
      }

      // Build file paths
      let oldPath = path.join(__dirname, "..", file.originalPath.replace("/uploads/", "uploads/"));
      let newPath = path.join(__dirname, "..", "uploads", file.newName);

      if (fs.existsSync(oldPath)) {
        try {
          fs.renameSync(oldPath, newPath);
          renamedAttachments.push(`/uploads/${file.newName}`);
          originalsToRemove.push(file.originalPath);
        } catch (err) {
          console.error("Error renaming file:", err);
          // In case of error, keep the original
          renamedAttachments.push(file.originalPath);
        }
      } else {
        console.warn("File not found on disk, keeping old path:", oldPath);
        renamedAttachments.push(file.originalPath);
      }
    }

    // Remove the original attachments that were renamed from the existing attachments array.
    task.attachments = task.attachments.filter(
      (attachment) => !originalsToRemove.includes(attachment)
    );

    // Handle new attachments (files uploaded with this request)
    const newAttachments = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    // Update only the provided fields
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.completed !== undefined) task.completed = req.body.completed;

    // Merge existing attachments with renamed and new attachments.
    if (renamedAttachments.length > 0 || newAttachments.length > 0) {
      task.attachments = [...new Set([...task.attachments, ...renamedAttachments, ...newAttachments])];
    }
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { filePath } = req.body;
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.attachments.includes(filePath)) {
      return res.status(404).json({ message: "Attachment not found in task" });
    }

    task.attachments = task.attachments.filter((file) => file !== filePath);
    await task.save();

    const fullPath = path.resolve(__dirname, "..", filePath);
    fs.unlink(fullPath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.json({ message: "Attachment deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.attachments.forEach((filePath) => {
      const fullPath = path.resolve(__dirname, "..", filePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
