require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandling");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// user class
const UserRepository = require("./repositories/user.reposiotry");
const UserController = require("./Controllers/users.controller");

// user instance
const userReopsitory = new UserRepository();
const userController = new UserController(userReopsitory);

// movies class
const MoviesRepository = require("./repositories/movies.repository");
const MoviesController = require("./Controllers/movies.controller");

// movies instance
const moviesRepository = new MoviesRepository(io);
const moviesController = new MoviesController(moviesRepository);

// route
const userRoutes = require("./Routers/users.routes");
const moviesRoutes = require("./Routers/movies.routes");

app.use("/api/users", userRoutes(userController));
app.use("/api/movies", moviesRoutes(moviesController, io));

io.on("connection", (socket) => {
  socket.on("registerSocket", async (userId) => {
    try {
      await userReopsitory.updateSocketId(userId, socket.id);
    } catch (e) {
      console.error("Error updating socket ID:", e.message);
    }
  });
  socket.on("disconnect", async () => {
    try {
      await userReopsitory.deleteSocketId(socket.id);
    } catch (e) {
      console.error("Error deleteing socket ID:", e.message);
    }
  });
});

app.use(errorHandler);

const port = process.env.PORT || 8888;
server.listen(port, () => {
  console.log("🚀 ~ app.listen ~ port:", port);
});
