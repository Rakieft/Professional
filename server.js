const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

const apiRouter = require("./server/routes");
const { requireStaffPage, redirectIfAuthenticated } = require("./server/middleware/authMiddleware");

const app = express();
const port = Number(process.env.PORT || 5000);
const rootDir = __dirname;

const pageMap = {
  "/": "index.html",
  "/index.html": "index.html",
  "/about": "about.html",
  "/about.html": "about.html",
  "/services": "services.html",
  "/services.html": "services.html",
  "/portfolio": "portfolio.html",
  "/portfolio.html": "portfolio.html",
  "/tarifs": "tarifs.html",
  "/tarifs.html": "tarifs.html",
  "/contact": "contact.html",
  "/contact.html": "contact.html",
  "/mentions-legales": "mentions-legales.html",
  "/mentions-legales.html": "mentions-legales.html"
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "webfy.sid",
    secret: process.env.SESSION_SECRET || "webfy_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 10
    }
  })
);

app.use("/api", apiRouter);
app.use("/assset", express.static(path.join(rootDir, "assset")));
app.use("/image", express.static(path.join(rootDir, "image")));
app.use("/js", express.static(path.join(rootDir, "js")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "webfy-platform",
    timestamp: new Date().toISOString()
  });
});

Object.entries(pageMap).forEach(([routePath, fileName]) => {
  app.get(routePath, (_req, res) => {
    res.sendFile(path.join(rootDir, fileName));
  });
});

app.get("/login", redirectIfAuthenticated, (_req, res) => {
  res.sendFile(path.join(rootDir, "login.html"));
});

app.get("/login.html", redirectIfAuthenticated, (_req, res) => {
  res.redirect("/login");
});

app.get("/staff", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "staff.html"));
});

app.get("/staff.html", requireStaffPage, (_req, res) => {
  res.redirect("/staff");
});

app.get("/clients", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "clients.html"));
});

app.get("/projects", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "projects.html"));
});

app.get("/tasks", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "tasks.html"));
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

app.listen(port, () => {
  console.log(`WebFy platform running on http://localhost:${port}`);
});
