const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");

// Add POST route to create a team
router.post("/", authMiddleware, teamController.createTeam);

// GET route for retrieving teams for the logged-in user
router.get("/", authMiddleware, teamController.getTeams);

// GET route for invitation acceptance
router.get("/invite", teamController.acceptInvitation);

module.exports = router;
