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

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use("/api/teams", teamRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server); 
const jwt = require("jsonwebtoken");

io.on("connection", (socket) => {
  const token = socket.handshake.query.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("User connected:", decoded.user.id);

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

app.set("io", io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
