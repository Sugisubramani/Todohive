const Team = require("../models/Team");
const jwt = require("jsonwebtoken");
const { sendInvitationEmail } = require("../utils/emailService");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, members } = req.body; // 'members' is an array of emails
    const adminId = req.user.id;
    // Convert the admin email to lowercase
    const adminEmail = req.user.email.toLowerCase();
    // Convert all invited emails to lowercase
    const normalizedMembers = members.map(email => email.toLowerCase());

    const newTeam = await Team.create({
      name: teamName,
      admin: adminId,
      members: [adminEmail],
      pendingInvites: normalizedMembers,
    });

    const emailPromises = normalizedMembers.map(async (email) => {
      try {
        const token = jwt.sign(
          { teamId: newTeam._id.toString(), email },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        const invitationLink = `http://localhost:5000/api/teams/invite?token=${token}`;
        await sendInvitationEmail(email, invitationLink, teamName);
        console.log(`Invitation email sent to ${email}`);
      } catch (error) {
        console.error(`Failed to send invitation to ${email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    res.status(201).json({
      message: "Team created and invitation emails processed.",
      team: newTeam,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Failed to create team" });
  }
};

exports.getTeams = async (req, res) => {
  try {
    // Convert the logged-in user's email to lowercase for consistent matching.
    const userEmail = req.user.email.toLowerCase();
    const teams = await Team.find({ members: userEmail });
    res.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize the email to lowercase and trim it.
    const emailFromToken = decoded.email.toLowerCase().trim();
    const teamId = decoded.teamId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found." });

    // Normalize pendingInvites entries for comparison.
    const normalizedInvites = team.pendingInvites.map((e) => e.toLowerCase().trim());

    if (!normalizedInvites.includes(emailFromToken)) {
      return res.status(400).json({ message: "Invitation not found or already accepted" });
    }

    // Remove the invitation. (Use filter on normalized emails but remove the original string.)
    team.pendingInvites = team.pendingInvites.filter(
      (e) => e.toLowerCase().trim() !== emailFromToken
    );

    // Also, normalize members before adding.
    const normalizedMembers = team.members.map((e) => e.toLowerCase().trim());
    if (!normalizedMembers.includes(emailFromToken)) {
      team.members.push(emailFromToken);
    }
    await team.save();

    res.redirect(`${process.env.APP_URL}/team/${team.name}?invited=true`);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

