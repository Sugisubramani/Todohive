const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const { 
  createTask, 
  getTasks, 
  updateTask, 
  deleteTask, 
  deleteAttachment, 
  renameAttachment, 
  clearTasks,
  createComment,
} = require("../controllers/taskController");

const storagePath = path.join(__dirname, "../uploads");
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("Received file:", file);
    cb(null, true);
  }
});

router.use(authMiddleware);

router.put("/:id/attachments/rename", renameAttachment);
router.post('/:taskId/comments', createComment);
router.post("/", upload.array("attachments", 5), createTask);
router.get("/", getTasks);

// Updated deletion route to match the frontend call:
router.delete("/:id/delete-attachment", deleteAttachment);

router.delete("/clear", clearTasks);

router.put("/:id", upload.array("attachments", 5), updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
