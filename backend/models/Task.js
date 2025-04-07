const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  teamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team',
    default: null,
    sparse: true
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  dueDate: { 
    type: Date 
  },
  localDueDate: { 
    type: String 
  },
  priority: { 
    type: String,
    enum: ['High', 'Medium', 'Low', null],
    default: null
  },
  isDateOnly: { 
    type: Boolean, 
    default: false 
  },
  attachments: [{
    path: { type: String },
    displayName: { type: String }
  }],
  completed: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

TaskSchema.index({ user: 1, teamId: 1 });
TaskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', TaskSchema);
