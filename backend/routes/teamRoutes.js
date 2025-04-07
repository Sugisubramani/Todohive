const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const validateInviteToken = (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded; 
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};

router.post("/", authMiddleware, teamController.createTeam);

router.get("/", authMiddleware, teamController.getTeams);

router.get("/invite", validateInviteToken, teamController.acceptInvitation);

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
