const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");
const moment = require("moment");

function getCurrentLocalDateString() {
  return moment().format("YYYY-MM-DD");
}

// Updated renameAttachment function:
async function renameAttachment(req, res) {
  const { id } = req.params; // Task ID
  let { originalPath, newFileName } = req.body;

  newFileName = newFileName.trim();
  if (!newFileName) {
    return res.status(400).json({ message: "New file name cannot be empty" });
  }

  const originalExt = path.extname(originalPath);
  const baseName = path.basename(newFileName, path.extname(newFileName));

  if (!baseName) {
    return res.status(400).json({ message: "New file name must have characters before the extension" });
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
          "attachments.$.displayName": finalFileName
        }
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Attachment not found in task" });
    }

    res.status(200).json({ message: "Attachment renamed", task: updatedTask });
  } catch (error) {
    console.error("Error renaming attachment:", error);
    res.status(500).json({ message: "Error renaming attachment" });
  }
}
exports.renameAttachment = renameAttachment;

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

    // NEW: We add teamId if provided.
    const task = new Task({
      user: req.user.id,
      title,
      description,
      dueDate: finalDueDate,
      localDueDate,
      priority,
      attachments,
      isDateOnly,
      teamId: req.body.teamId ? req.body.teamId : null,
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
    const { page = 1, priority, search, status, teamId } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    // If teamId is provided, we'll filter by it. Otherwise, we're in personal mode.
    // In personal mode, return only tasks where teamId is null or does not exist.
    const queryObj = teamId
      ? { teamId }
      : { user: req.user.id, $or: [{ teamId: null }, { teamId: { $exists: false } }] };

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
          ? status.split(",").map((s) => s.trim())
          : [status];
      } else if (Array.isArray(status)) {
        statusArr = status;
      }
      const now = new Date();
      const currentLocalDate = getCurrentLocalDateString();

      const statusConditions = statusArr.map((s) => {
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
      }).filter(Boolean);

      if (statusConditions.length > 0) {
        queryObj.$or = statusConditions;
      }
    }

    if (search) {
      const exactRegex = new RegExp(`^${search}$`, "i");
      const exactCount = await Task.countDocuments({ ...queryObj, title: exactRegex });
      queryObj.title = exactCount > 0 ? exactRegex : new RegExp(search, "i");
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

    task.attachments = task.attachments.filter(att => !originalsToRemove.includes(att.path));
    const newAttachments = req.files ? req.files.map(file => ({ path: `/uploads/${file.filename}`, displayName: file.originalname })) : [];

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

      // In updateTask...
      if (
        (req.body.fullDate && (req.body.fullDate === "true" || req.body.fullDate === true)) ||
        req.body.dueDate.includes("T")
      ) {
        // full date/time branch here
        updatedDate = new Date(req.body.dueDate);
        updatedIsDateOnly = false;
        updatedLocalDueDate = null;
      } else {
        // Date-only branch
        const mDueDate = moment(req.body.dueDate, "YYYY-MM-DD", true);
        if (mDueDate.isValid()) {
          updatedIsDateOnly = true;
          updatedLocalDueDate = mDueDate.format("YYYY-MM-DD");
          // Here we still save the Date as the end of day for comparisons.
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
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    } else {
      console.warn("File not found on disk:", fullPath);
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
      let filePath = typeof att === "string" ? att : att.path;
      const fullPath = path.resolve(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
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
    // NEW: Check if a teamId query parameter exists. If so, clear tasks for that team.
    const { teamId, priority, status } = req.query;
    const queryObj = teamId ? { teamId } : { user: userId };

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
