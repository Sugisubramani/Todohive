const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  localDueDate: { type: String }, // NEW: stores the date portion (YYYY-MM-DD) in local time
  priority: { type: String },
  isDateOnly: { type: Boolean, default: false },
  attachments: [
    {
      path: { type: String },
      displayName: { type: String }
    }
  ],
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
