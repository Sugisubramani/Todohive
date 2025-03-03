const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { createTask, getTasks, updateTask, deleteTask, deleteAttachment } = require('../controllers/taskController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.use(authMiddleware);

router.post('/', upload.array('attachments', 5), createTask);
router.get('/', getTasks);
router.put('/:id', upload.array('attachments', 5), updateTask);
router.delete('/:id', deleteTask);
router.delete('/:id/attachment', deleteAttachment);

module.exports = router;
