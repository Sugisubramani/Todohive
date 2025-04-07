// server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');
const teamRoutes = require("./routes/teamRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Create an uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use("/api/teams", teamRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create an HTTP server from the Express app (needed for Socket.IO)
const http = require("http");
const server = http.createServer(app);

// Set up Socket.IO on the server
const io = require("socket.io")(server); // Replace `server` with your HTTP server instance
const jwt = require("jsonwebtoken");

io.on("connection", (socket) => {
  const token = socket.handshake.query.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("User connected:", decoded.user.id);

    // Handle room joining
    socket.on("joinTeamRoom", (teamId) => {
      console.log(`User joined team room: ${teamId}`);
      socket.join(teamId);
    });

    socket.on("joinPersonalRoom", () => {
      console.log("User joined personal room");
      socket.join("personal");
    });

    socket.on("leaveTeamRoom", (teamId) => {
      console.log(`User left team room: ${teamId}`);
      socket.leave(teamId);
    });

    socket.on("leavePersonalRoom", () => {
      console.log("User left personal room");
      socket.leave("personal");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  } catch (error) {
    console.error("Invalid token:", error.message);
    socket.disconnect();
  }
});

// Make the Socket.IO instance available in request handlers
app.set("io", io);

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
