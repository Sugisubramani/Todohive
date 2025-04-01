const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  privacy: { type: String, enum: ['Public', 'Private'], default: 'Private' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // For public teams, we generate a human-readable teamId. For private teams, this can be omitted.
  teamId: { type: String, unique: true },
  // Initially, only the admin is in the members array.
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Optionally, you could store invitations if you want persistent invite tokens.
  // invites: [{ email: String, token: String, createdAt: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
