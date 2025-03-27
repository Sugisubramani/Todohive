  const express = require('express');
  const router = express.Router();
  const path = require('path');
  const fs = require('fs');
  const authMiddleware = require('../middleware/authMiddleware');
  const multer = require('multer');
  const { createTask, getTasks, updateTask, deleteTask, deleteAttachment, clearTasks } = require('../controllers/taskController');

  // Ensure uploads folder exists
  const storagePath = path.join(__dirname, '../uploads');
  if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads');  // 🔥 FIXED PATH
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
      console.log('Received file:', file);  // Debugging line
      cb(null, true);
    }
  });

  router.use(authMiddleware);

  router.post('/', upload.array('attachments', 5), createTask);
  router.get('/', getTasks);
  
  // Clear tasks route comes first
  router.delete('/clear', clearTasks);
  
  // Now dynamic routes
  router.put('/:id', upload.array('attachments', 5), updateTask);
  router.delete('/:id', deleteTask);
  router.delete('/:id/attachments', deleteAttachment);
  

  module.exports = router;
