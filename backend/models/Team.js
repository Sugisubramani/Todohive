const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  members: [{ type: String }],
  pendingInvites: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("Team", TeamSchema);
