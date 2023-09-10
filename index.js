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

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, {
        title: data.title,
        content: data.content,
      });
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
