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
    const userEmail = req.user.email.toLowerCase();
    // First, populate the admin field to get admin details
    const teams = await Team.find({ members: userEmail }).populate('admin', 'id');
    
    // Add role information to each team
    const teamsWithRoles = teams.map(team => ({
      _id: team._id,
      name: team.name,
      members: team.members,
      admin: team.admin,
      role: team.admin._id.toString() === req.user.id ? "admin" : "member" // Fix: use _id instead of id
    }));

    console.log('Teams with roles:', teamsWithRoles); // Debug log
    res.json(teamsWithRoles);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required" });
    }
    
    // Ensure the user's email is normalized
    const userEmail = req.user.email.toLowerCase();

    // Find the team by ID
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is actually a member of the team
    if (!team.members.includes(userEmail)) {
      return res.status(400).json({ message: "User is not a member of this team" });
    }

    // Remove the user from the team members array
    team.members = team.members.filter((member) => member !== userEmail);

    // Optionally, you might want to handle the situation where the leaving user is the admin.
    // For example, you could either assign a new admin or restrict admins from leaving via this endpoint.
    // if (team.admin === req.user.id) {
    //   return res.status(400).json({ message: "Admin cannot leave the team. Please assign a new admin first." });
    // }

    await team.save();
    res.status(200).json({ message: "Successfully left the team" });
  } catch (error) {
    console.error("Error leaving team:", error);
    res.status(500).json({ message: "Server error while leaving team" });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const emailFromToken = decoded.email.toLowerCase().trim();
    const teamId = decoded.teamId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found." });

    const normalizedInvites = team.pendingInvites.map((e) => e.toLowerCase().trim());

    if (!normalizedInvites.includes(emailFromToken)) {
      return res.status(400).json({ message: "Invitation not found or already accepted" });
    }

    // Remove the invitation and add the user to the team
    team.pendingInvites = team.pendingInvites.filter(
      (e) => e.toLowerCase().trim() !== emailFromToken
    );

    const normalizedMembers = team.members.map((e) => e.toLowerCase().trim());
    if (!normalizedMembers.includes(emailFromToken)) {
      team.members.push(emailFromToken);
    }
    await team.save();

    // Redirect to the Personal Dashboard with the joined team name
    res.redirect(`${process.env.APP_URL}/dashboard?joinedTeam=${team.name}`);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

