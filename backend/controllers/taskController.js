const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");
const moment = require("moment");

function getCurrentLocalDateString() {
  return moment().format("YYYY-MM-DD");
}

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;

    let finalDueDate = null;
    let isDateOnly = false;
    let localDueDate = null;
    if (dueDate) {
      const mDueDate = moment(dueDate, "YYYY-MM-DD", true);
      if (mDueDate.isValid()) {
        isDateOnly = true;
        localDueDate = mDueDate.format("YYYY-MM-DD");
        finalDueDate = mDueDate.endOf("day").toDate(); 
      } else {
        finalDueDate = new Date(dueDate);
      }
    }

    const attachments = req.files
      ? req.files.map((file) => ({
          path: `/uploads/${file.filename}`,
          displayName: file.originalname,
        }))
      : [];

    const task = new Task({
      user: req.user.id,
      title,
      description,
      dueDate: finalDueDate,
      localDueDate, 
      priority,
      attachments,
      isDateOnly,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, priority, search, status } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;
    const queryObj = { user: req.user.id };

    if (priority && priority !== "Priority") {
      if (priority.includes(",")) {
        const priorities = priority.split(",").map((p) => p.trim());
        queryObj.priority = { $in: priorities };
      } else {
        queryObj.priority = priority;
      }
    }

    if (status && status !== "All") {
      let statusArr = [];
      if (typeof status === "string") {
        statusArr = status.includes(",")
          ? status.split(",").map(s => s.trim())
          : [status];
      } else if (Array.isArray(status)) {
        statusArr = status;
      }
      const now = new Date();
      const currentLocalDate = getCurrentLocalDateString();

      const statusConditions = statusArr.map(s => {
        if (s === "Completed") {
          return { completed: true };
        } else if (s === "Active") {
          return {
            completed: false,
            $or: [
              { dueDate: null },
              { isDateOnly: false, dueDate: { $gt: now } },
              { isDateOnly: true, localDueDate: { $gte: currentLocalDate } }
            ]
          };
        } else if (s === "Pending") {
          return {
            completed: false,
            $or: [
              { isDateOnly: false, dueDate: { $lte: now } },
              { isDateOnly: true, localDueDate: { $lt: currentLocalDate } }
            ]
          };
        }
      }).filter(Boolean);
      
      if (statusConditions.length > 0) {
        queryObj.$or = statusConditions;
      }
    }

    if (search) {
      const exactRegex = new RegExp(`^${search}$`, "i");
      const exactCount = await Task.countDocuments({ ...queryObj, title: exactRegex });
      if (exactCount > 0) {
        queryObj.title = exactRegex;
      } else {
        queryObj.title = new RegExp(search, "i");
      }
    }

    const tasks = await Task.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Task.countDocuments(queryObj);
    res.json({ tasks, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Error getting tasks:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.attachments = task.attachments.map((att) => {
      if (typeof att === "string") {
        return { path: att, displayName: path.basename(att) };
      }
      return att;
    });

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
      let oldPath = path.join(__dirname, "..", file.originalPath.replace("/uploads/", "uploads/"));
      let newPath = path.join(__dirname, "..", "uploads", file.newName);
      if (fs.existsSync(oldPath)) {
        try {
          fs.renameSync(oldPath, newPath);
          renamedAttachments.push({
            path: `/uploads/${file.newName}`,
            displayName: file.newName,
          });
          originalsToRemove.push(file.originalPath);
        } catch (err) {
          console.error("Error renaming file:", err);
          renamedAttachments.push({
            path: file.originalPath,
            displayName: path.basename(file.originalPath),
          });
        }
      } else {
        console.warn("File not found on disk, keeping old path:", oldPath);
        renamedAttachments.push({
          path: file.originalPath,
          displayName: path.basename(file.originalPath),
        });
      }
    }
    task.attachments = task.attachments.filter(attachment => !originalsToRemove.includes(attachment.path));
    const newAttachments = req.files
      ? req.files.map((file) => ({
          path: `/uploads/${file.filename}`,
          displayName: file.originalname,
        }))
      : [];

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.dueDate !== undefined) {
      let updatedDate = null;
      let updatedIsDateOnly = false;
      let updatedLocalDueDate = null;
      const mDueDate = moment(req.body.dueDate, "YYYY-MM-DD", true);
      if (mDueDate.isValid()) {
        updatedIsDateOnly = true;
        updatedLocalDueDate = mDueDate.format("YYYY-MM-DD");
        updatedDate = mDueDate.endOf("day").toDate();
      } else {
        updatedDate = new Date(req.body.dueDate);
      }
      task.dueDate = updatedDate;
      task.isDateOnly = updatedIsDateOnly;
      task.localDueDate = updatedLocalDueDate;
    }
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.completed !== undefined) task.completed = req.body.completed;

    task.attachments = [ ...task.attachments, ...renamedAttachments, ...newAttachments ];
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
    task.attachments = task.attachments.map((att) => {
      if (typeof att === "string") {
        return { path: att, displayName: path.basename(att) };
      }
      return att;
    });
    const index = task.attachments.findIndex((att) => att.path === filePath);
    if (index === -1) {
      return res.status(404).json({ message: "Attachment not found in task" });
    }
    task.attachments.splice(index, 1);
    await task.save();
    const fullPath = path.resolve(__dirname, "..", filePath);
    fs.unlink(fullPath, (err) => { if (err) console.error("Error deleting file:", err); });
    res.json({ message: "Attachment deleted successfully." });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.attachments.forEach((att) => {
      let filePath = typeof att === "string" ? att : att.path;
      const fullPath = path.resolve(__dirname, "..", filePath);
      fs.unlink(fullPath, (err) => { if (err) console.error("Error deleting file:", err); });
    });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.clearTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      throw new Error("User not authenticated properly");
    }
    console.log("Clearing tasks for user:", req.user.id);
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const queryObj = { user: userId };
    const { priority, status } = req.query;
    if (priority && priority !== "All") {
      if (priority.includes(",")) {
        const priorities = priority.split(",").map(p => p.trim());
        queryObj.priority = { $in: priorities };
      } else {
        queryObj.priority = priority;
      }
    }
    if (status && status !== "All") {
      let statusArr = [];
      if (typeof status === "string") {
        statusArr = status.includes(",") ? status.split(",").map(s => s.trim()) : [status];
      } else if (Array.isArray(status)) {
        statusArr = status;
      }
      const now = new Date();
      const currentLocalDate = getCurrentLocalDateString();
      const statusConditions = statusArr.map(s => {
        if (s === "Completed") {
          return { completed: true };
        } else if (s === "Active") {
          return {
            completed: false,
            $or: [
              { dueDate: null },
              { isDateOnly: false, dueDate: { $gt: now } },
              { isDateOnly: true, localDueDate: { $gte: currentLocalDate } }
            ]
          };
        } else if (s === "Pending") {
          return {
            completed: false,
            $or: [
              { isDateOnly: false, dueDate: { $lte: now } },
              { isDateOnly: true, localDueDate: { $lt: currentLocalDate } }
            ]
          };
        }
      }).filter(Boolean);
      
      if (statusConditions.length > 0) {
        queryObj.$or = statusConditions;
      }
    }
    
    console.log("Deleting tasks with query:", queryObj);
    await Task.deleteMany(queryObj);
    res.json({ message: "Filtered tasks cleared" });
  } catch (err) {
    console.error("Error in clearTasks:", err);
    res.status(500).json({ message: err.message });
  }
};