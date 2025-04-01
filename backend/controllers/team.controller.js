const Team = require('../models/Team');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');


const isValidObjectId = mongoose.Types.ObjectId.isValid;


// Helper to generate a human-readable team ID for public teams
const generateTeamId = () => crypto.randomBytes(4).toString('hex');

// Helper to generate an invitation token
const generateInviteToken = () => crypto.randomBytes(20).toString('hex');

exports.createTeam = async (req, res) => {
  const { projectName, privacy, inviteMembers } = req.body;
  const adminId = req.user && req.user.id; // Auth middleware should populate req.user

  // Debug log: ensure user is available
  console.log("Creating team. Admin:", req.user);

  if (!projectName || !adminId) {
    return res.status(400).json({ message: 'Project name and valid user are required' });
  }

  try {
    const newTeam = new Team({
      projectName,
      privacy,
      adminId,
      teamId: privacy === 'Public' ? generateTeamId() : undefined,
      members: [adminId],
    });
    await newTeam.save();

    // Process invite emails if provided using Promise.all for async consistency
    if (Array.isArray(inviteMembers) && inviteMembers.length > 0) {
      await Promise.all(inviteMembers.map(async (email) => {
        const inviteToken = generateInviteToken();
        // Construct the invitation link (frontend will handle acceptance)
        const invitationLink = `http://localhost:3000/invite?teamId=${newTeam.teamId || newTeam._id}&token=${inviteToken}`;
        const html = `
          <p>You have been invited to join the team "<strong>${projectName}</strong>".</p>
          <p>Please click <a href="${invitationLink}">here</a> to accept the invitation.</p>
        `;
        try {
          await sendEmail({
            to: email,
            subject: 'You\'re Invited to Join a Team!',
            html,
          });
        } catch (emailErr) {
          console.error(`Error sending invitation to ${email}:`, emailErr);
        }
      }));
    }

    res.status(201).json({
      message: 'Team created successfully. Invitation emails sent.',
      team: newTeam,
    });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.acceptInvite = async (req, res) => {
  const { teamId, token } = req.body;
  try {
    let query;
    if (isValidObjectId(teamId)) {
      // If teamId is a valid ObjectId, check both fields.
      query = { $or: [{ teamId: teamId }, { _id: teamId }] };
    } else {
      // Otherwise, only check the teamId field.
      query = { teamId: teamId };
    }
    
    const team = await Team.findOne(query);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Get the authenticated user's ID
    const userId = req.user.id;
    if (team.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of the team' });
    }

    team.members.push(userId);
    await team.save();
    res.json({ message: 'Invitation accepted, you have joined the team', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};