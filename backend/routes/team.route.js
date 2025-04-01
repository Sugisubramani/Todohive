const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure auth middleware is in place

// Route to create a team
router.post('/', authMiddleware, teamController.createTeam);

// Route to accept an invitation
router.post('/accept-invite', authMiddleware, teamController.acceptInvite);



module.exports = router;
