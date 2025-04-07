// teams.js

const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// Middleware to validate invite token
const validateInviteToken = (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded; // Pass the decoded token to the controller
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Create a new team
router.post("/", authMiddleware, teamController.createTeam);

// Get all teams the authenticated user belongs to
router.get("/", authMiddleware, teamController.getTeams);

// Accept a team invitation using a token
router.get("/invite", validateInviteToken, teamController.acceptInvitation);

// Leave a team
router.post(
  "/leaveTeam",
  authMiddleware,
  [
    check("teamId", "Team ID is required").notEmpty(),
    check("teamId", "Invalid Team ID").isMongoId(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  teamController.leaveTeam
);

module.exports = router;
