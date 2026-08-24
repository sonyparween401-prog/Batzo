require("dotenv").config();

const express = require("express");
const cors = require("cors");

const cricketRoutes = require("./cricket-routes");

const app = express();

app.use(cors());
app.use(express.json());

console.log("CRICKET ROUTER TYPE:", typeof cricketRoutes);
console.log("CRICKET ROUTER STACK:",
  Array.isArray(cricketRoutes?.stack)
    ? cricketRoutes.stack.map(x => x.route?.path).filter(Boolean)
    : "NO ROUTER STACK"
);

app.use("/api/cricket", cricketRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Batzo Cricket API",
    status: "online"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path
  });
});

const PORT = 3101;

app.listen(PORT, "0.0.0.0", () => {
  console.log("ISOLATED CRICKET SERVER:", PORT);
});
