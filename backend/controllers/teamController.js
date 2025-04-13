const Team = require("../models/Team");
const jwt = require("jsonwebtoken");
const { sendInvitationEmail } = require("../utils/emailService");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, members } = req.body; 
    const adminId = req.user.id;
    const adminEmail = req.user.email.toLowerCase();
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
        // Pass the sender's name (req.user.name) as the fourth parameter
        await sendInvitationEmail(email, invitationLink, teamName, req.user.name);
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
    const teams = await Team.find({ members: userEmail }).populate('admin', 'id');
    
    const teamsWithRoles = teams.map(team => {
      // If team.admin is null, assume the user is not admin.
      const isAdmin = team.admin && team.admin._id && team.admin._id.toString() === req.user.id;
      return {
        _id: team._id,
        name: team.name,
        members: team.members,
        admin: team.admin,
        role: isAdmin ? "admin" : "member",
      };
    });

    console.log('Teams with roles:', teamsWithRoles); 
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
    
    const userEmail = req.user.email.toLowerCase();

    // Find the team by ID
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.members.includes(userEmail)) {
      return res.status(400).json({ message: "User is not a member of this team" });
    }

    team.members = team.members.filter((member) => member !== userEmail);

    await team.save();
    res.status(200).json({ message: "Successfully left the team" });
  } catch (error) {
    console.error("Error leaving team:", error);
    res.status(500).json({ message: "Server error while leaving team" });
  }
};  

exports.addMember = async (req, res) => {
  try {
    const { teamId, newMemberEmail } = req.body;
    if (!teamId || !newMemberEmail) {
      return res.status(400).json({ message: "Team ID and new member email are required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the admin can add members" });
    }

    const email = newMemberEmail.toLowerCase();
    if (team.members.includes(email) || team.pendingInvites.includes(email)) {
      return res.status(400).json({ message: "User already invited or a member" });
    }

    team.pendingInvites.push(email);

    const token = jwt.sign(
      { teamId: team._id.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const invitationLink = `http://localhost:5000/api/teams/invite?token=${token}`;
    await sendInvitationEmail(email, invitationLink, team.name, req.user.name);

    await team.save();
    res.status(200).json({ message: "Invitation sent successfully", team });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({ members: team.members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.editTeamName = async (req, res) => {
  try {
    const { teamId, newName } = req.body;

    if (!teamId || !newName) {
      return res.status(400).json({ message: "Team ID and new name are required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the requester is the admin
    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the admin can rename the team" });
    }

    team.name = newName;
    await team.save();

    res.status(200).json({ message: "Team name updated successfully", team });
  } catch (error) {
    console.error("Error updating team name:", error);
    res.status(500).json({ message: "Server error while updating team name" });
  }
};

// REMOVE A MEMBER FROM A TEAM
exports.removeMember = async (req, res) => {
  try {
    const { teamId, userIdToRemove } = req.body;

    if (!teamId || !userIdToRemove) {
      return res.status(400).json({ message: "Team ID and User ID are required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Only the admin can remove members
    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the team admin can remove members" });
    }

    // Don't allow removing the admin themselves
    if (userIdToRemove === req.user.id) {
      return res.status(400).json({ message: "Admin cannot remove themselves" });
    }

    const memberIndex = team.members.indexOf(userIdToRemove);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "User is not a team member" });
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    res.status(200).json({ message: "Member removed successfully", team });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Internal server error" });
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

    team.pendingInvites = team.pendingInvites.filter(
      (e) => e.toLowerCase().trim() !== emailFromToken
    );

    const normalizedMembers = team.members.map((e) => e.toLowerCase().trim());
    if (!normalizedMembers.includes(emailFromToken)) {
      team.members.push(emailFromToken);
    }
    await team.save();

    res.redirect(`${process.env.APP_URL}/teams/${team.name}/dashboard?id=${team._id}`);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

