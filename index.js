const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const socketIo = require("socket.io");
const Document = require("./models/Document");

const authRoute = require("./routes/auth");
const documentRoutes = require("./routes/documents");

const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const io = socketIo(server, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "https://collab-io-lovat.vercel.app",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

dotenv.config();
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URL)
  .then(console.log("Connected to MongoDB"))
  .catch((err) => {
    console.log("log error ~~", err);
  });

app.use("/api/auth", authRoute);
app.use("/api/document", documentRoutes);

app.get("/", (req, res) => {
  try {
    res.send("Server is running");
  } catch (error) {
    res.status(404).json("Server is DOWN");
  }
});

// app.listen(PORT, () => {
//   console.log("Backend is up and running...");
// });

const activeUsersByRoom = new Map();

io.on("connection", (socket) => {
  const { username } = socket.handshake.query;

  socket.on("get-document", async (documentId) => {
    const document = await findDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.to(documentId).emit("user-joined", username);

    const activeUsers = activeUsersByRoom.get(documentId) || new Set();
    activeUsers.add(username);
    activeUsersByRoom.set(documentId, activeUsers);
    socket.emit("active-users", Array.from(activeUsers));

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta.ops);

      const activeUserId = delta.attributes.author;
      socket.to(documentId).emit("highlight-user", activeUserId);
    });

    //autosave
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, {
        title: data.title,
        content: data.content,
      });
    });

    // as user leaves the doc
    socket.on("disconnect", () => {
      socket.to(documentId).emit("user-left", username);

      const activeUsers = activeUsersByRoom.get(documentId);
      if (activeUsers) {
        activeUsers.delete(username);
        if (activeUsers.size === 0) {
          // No active users left, remove the room from the map
          activeUsersByRoom.delete(documentId);
        } else {
          activeUsersByRoom.set(documentId, activeUsers);
        }
      }
    });
  });
});

async function findDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
}

server.listen(PORT, () => {
  console.log(`Backend live on ${PORT}`);
});
