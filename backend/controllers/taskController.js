const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");
const moment = require("moment");
const jwt = require("jsonwebtoken");

function getCurrentLocalDateString() {
  return moment().format("YYYY-MM-DD");
}

exports.renameAttachment = async (req, res) => {
  const { id } = req.params; 
  let { originalPath, newFileName } = req.body;

  newFileName = newFileName.trim();
  if (!newFileName) {
    return res.status(400).json({ message: "New file name cannot be empty" });
  }

  const originalExt = path.extname(originalPath);
  const baseName = path.basename(newFileName, path.extname(newFileName));

  if (!baseName) {
    return res
      .status(400)
      .json({ message: "New file name must have characters before the extension" });
  }

  const finalFileName = baseName + originalExt;
  const uploadsDir = path.join(__dirname, "../uploads");
  const oldFilePath = path.join(uploadsDir, path.basename(originalPath));
  const newFilePath = path.join(uploadsDir, finalFileName);

  if (!fs.existsSync(oldFilePath)) {
    return res.status(400).json({ message: "Original file not found" });
  }

  try {
    fs.renameSync(oldFilePath, newFilePath);

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, "attachments.path": originalPath },
      {
        $set: {
          "attachments.$.path": `/uploads/${finalFileName}`,
          "attachments.$.displayName": finalFileName,
        },
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Attachment not found in task" });
    }

    const io = req.app.get("io");
    if (updatedTask.teamId) {
      io.to(updatedTask.teamId.toString()).emit("taskUpdated", updatedTask);
    } else {
      io.to("personal").emit("taskUpdated", updatedTask);
    }

    res.status(200).json({ message: "Attachment renamed", task: updatedTask });
  } catch (error) {
    console.error("Error renaming attachment:", error);
    res.status(500).json({ message: "Error renaming attachment" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, teamId, personal } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ 
        message: "Title is required and must be a string." 
      });
    }

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

    // Save createdBy as simply the user’s ObjectId.
    const task = new Task({
      user: req.user.id,
      createdBy: req.user.id,
      title,
      description,
      dueDate: finalDueDate,
      localDueDate,
      priority,
      attachments,
      isDateOnly,
      teamId: personal === "true" ? null : teamId || null
    });

    await task.save();

    // Magic fix: populate createdBy (with name) before returning.
    await task.populate("createdBy", "name");

    const io = req.app.get("io");
    if (task.teamId) {
      io.to(task.teamId.toString()).emit("taskAdded", task);
    } else {
      io.to("personal").emit("taskAdded", task);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({ message: err.message });
  }
};


exports.getTasks = async (req, res) => {
  try {
    const { page = 1, priority, status, teamId, personal, search } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    let queryObj = {};

    // Handle personal tasks vs. team tasks.
    if (personal === "true") {
      queryObj = { 
        user: req.user.id,
        $or: [
          { teamId: null },
          { teamId: { $exists: false } }
        ]
      };
    } else if (teamId) {
      queryObj = { teamId };
    }

    // Filter by priority.
    if (priority && priority !== "All") {
      if (priority.includes(",")) {
        const priorities = priority.split(",").map((p) => p.trim());
        queryObj.priority = { $in: priorities };
      } else {
        queryObj.priority = priority;
      }
    }

    // Filter by status.
    if (status && status !== "All") {
      const now = new Date();
      const currentLocalDate = moment().format("YYYY-MM-DD");
      const statusArr = status.includes(",") ? status.split(",").map(s => s.trim()) : [status];

      const statusConditions = [];

      if (statusArr.includes("Completed")) {
        statusConditions.push({ completed: true });
      }
      if (statusArr.includes("Active")) {
        statusConditions.push({
          completed: false,
          $or: [
            { dueDate: null },
            { isDateOnly: false, dueDate: { $gt: now } },
            { isDateOnly: true, localDueDate: { $gte: currentLocalDate } }
          ]
        });
      }
      if (statusArr.includes("Pending")) {
        statusConditions.push({
          completed: false,
          $or: [
            { isDateOnly: false, dueDate: { $lte: now } },
            { isDateOnly: true, localDueDate: { $lt: currentLocalDate } }
          ]
        });
      }

      if (statusConditions.length > 0) {
        queryObj = { $and: [ queryObj, { $or: statusConditions } ] };
      }
    }

    // Search functionality.
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      if (Object.keys(queryObj).length > 0) {
        queryObj = { 
          $and: [
            queryObj,
            { $or: [{ title: searchRegex }, { description: searchRegex }] }
          ]
        };
      } else {
        queryObj = { $or: [{ title: searchRegex }, { description: searchRegex }] };
      }
    }

    let tasksQuery = Task.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .populate("user", "name");

    const tasks = await tasksQuery;
    const total = await Task.countDocuments(queryObj);

    res.json({
      tasks,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
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
      if (!file.originalPath || typeof file.originalPath !== "string") continue;
      if (!file.newName || typeof file.newName !== "string") continue;

      let oldPath = path.join(__dirname, "..", file.originalPath.replace("/uploads/", "uploads/"));
      let newPath = path.join(__dirname, "..", "uploads", file.newName);

      if (fs.existsSync(oldPath)) {
        try {
          fs.renameSync(oldPath, newPath);
          renamedAttachments.push({ path: `/uploads/${file.newName}`, displayName: file.newName });
          originalsToRemove.push(file.originalPath);
        } catch (err) {
          console.error("Error renaming file:", err);
          renamedAttachments.push({ path: file.originalPath, displayName: path.basename(file.originalPath) });
        }
      } else {
        renamedAttachments.push({ path: file.originalPath, displayName: path.basename(file.originalPath) });
      }
    }

    task.attachments = task.attachments.filter((att) => !originalsToRemove.includes(att.path));
    const newAttachments = req.files
      ? req.files.map((file) => ({ path: `/uploads/${file.filename}`, displayName: file.originalname }))
      : [];

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;

    if (!req.body.dueDate) {
      await Task.updateOne({ _id: task._id }, { $unset: { dueDate: 1, isDateOnly: 1, localDueDate: 1 } });
      task.dueDate = null;
      task.isDateOnly = false;
      task.localDueDate = null;
    } else {
      let updatedDate = null;
      let updatedIsDateOnly = false;
      let updatedLocalDueDate = null;
      if (
        (req.body.fullDate && (req.body.fullDate === "true" || req.body.fullDate === true)) ||
        req.body.dueDate.includes("T")
      ) {
        updatedDate = new Date(req.body.dueDate);
        updatedIsDateOnly = false;
        updatedLocalDueDate = null;
      } else {
        const mDueDate = moment(req.body.dueDate, "YYYY-MM-DD", true);
        if (mDueDate.isValid()) {
          updatedIsDateOnly = true;
          updatedLocalDueDate = mDueDate.format("YYYY-MM-DD");
          updatedDate = mDueDate.endOf("day").toDate();
        } else {
          updatedDate = new Date(req.body.dueDate);
        }
      }
      task.dueDate = updatedDate;
      task.isDateOnly = updatedIsDateOnly;
      task.localDueDate = updatedLocalDueDate;
    }

    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.completed !== undefined) task.completed = req.body.completed;

    task.attachments = [...task.attachments, ...renamedAttachments, ...newAttachments];

    await task.save();

    const io = req.app.get("io");
    if (task.teamId) {
      io.to(task.teamId.toString()).emit("taskUpdated", task);
    } else {
      io.to("personal").emit("taskUpdated", task);
    }

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

    task.attachments = task.attachments.map((att) =>
      typeof att === "string" ? { path: att, displayName: path.basename(att) } : att
    );

    const index = task.attachments.findIndex((att) => att.path === filePath);
    if (index === -1) {
      return res.status(404).json({ message: "Attachment not found in task" });
    }
    task.attachments.splice(index, 1);
    await task.save();

    const fullPath = path.resolve(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    } else {
      console.warn("File not found on disk:", fullPath);
    }

    const io = req.app.get("io");
    if (task.teamId) {
      io.to(task.teamId.toString()).emit("taskUpdated", task);
    } else {
      io.to("personal").emit("taskUpdated", task);
    }

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
      const filePath = typeof att === "string" ? att : att.path;
      const fullPath = path.resolve(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
    });

    await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    if (task.teamId) {
      io.to(task.teamId.toString()).emit("taskDeleted", req.params.id);
    } else {
      io.to("personal").emit("taskDeleted", req.params.id);
    }

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
    const userId = req.user.id;
    let { teamId, priority, status } = req.query;
    
    if (teamId === "null" || teamId === undefined) {
      teamId = null;
    }
    
    let queryObj = {};
    if (teamId) {
      queryObj = { teamId: teamId, user: userId };
    } else {
      queryObj = {
        user: userId,
        $or: [{ teamId: null }, { teamId: { $exists: false } }],
      };
    }
    
    if (priority && priority !== "All") {
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
        statusArr = status.includes(",") ? status.split(",").map((s) => s.trim()) : [status];
      } else if (Array.isArray(status)) {
        statusArr = status;
      }
      const now = new Date();
      const currentLocalDate = getCurrentLocalDateString();
      const statusConditions = statusArr
        .map((s) => {
          if (s === "Completed") {
            return { completed: true };
          } else if (s === "Active") {
            return {
              completed: false,
              $or: [
                { dueDate: null },
                { isDateOnly: false, dueDate: { $gt: now } },
                { isDateOnly: true, localDueDate: { $gte: currentLocalDate } },
              ],
            };
          } else if (s === "Pending") {
            return {
              completed: false,
              $or: [
                { isDateOnly: false, dueDate: { $lte: now } },
                { isDateOnly: true, localDueDate: { $lt: currentLocalDate } },
              ],
            };
          }
        })
        .filter(Boolean);
      if (statusConditions.length > 0) {
        queryObj.$or = statusConditions;
      }
    }
    
    console.log("Deleting tasks with query:", queryObj);
    await Task.deleteMany(queryObj);
    
    const io = req.app.get("io");
    if (teamId) {
      io.to(teamId.toString()).emit("tasksCleared");
    } else {
      io.to("personal").emit("tasksCleared");
    }
    
    res.json({ message: "Filtered tasks cleared" });
  } catch (err) {
    console.error("Error in clearTasks:", err);
    res.status(500).json({ message: err.message });
  }
};
