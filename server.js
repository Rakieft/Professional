const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

const apiRouter = require("./server/routes");
const {
  requireStaffPage,
  requireStaffRolePage,
  redirectIfAuthenticated
} = require("./server/middleware/authMiddleware");

const app = express();
const port = Number(process.env.PORT || 5000);
const rootDir = __dirname;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET is required in production");
}

app.disable("x-powered-by");

if (isProduction) {
  app.set("trust proxy", 1);
}

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
    secret: sessionSecret || "webfy_dev_only_secret",
    resave: false,
    saveUninitialized: false,
    unset: "destroy",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
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

app.get("/clients.html", requireStaffPage, (_req, res) => {
  res.redirect("/clients");
});

app.get("/projects", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "projects.html"));
});

app.get("/projects.html", requireStaffPage, (_req, res) => {
  res.redirect("/projects");
});

app.get("/tasks", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "tasks.html"));
});

app.get("/tasks.html", requireStaffPage, (_req, res) => {
  res.redirect("/tasks");
});

app.get("/leads", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "leads.html"));
});

app.get("/leads.html", requireStaffPage, (_req, res) => {
  res.redirect("/leads");
});

app.get("/team", requireStaffRolePage("admin", "cofounder", "secretary", "operations_manager"), (_req, res) => {
  res.sendFile(path.join(rootDir, "team.html"));
});

app.get("/team.html", requireStaffRolePage("admin", "cofounder", "secretary", "operations_manager"), (_req, res) => {
  res.redirect("/team");
});

app.get("/files", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "files.html"));
});

app.get("/files.html", requireStaffPage, (_req, res) => {
  res.redirect("/files");
});

app.get("/profile", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "profile.html"));
});

app.get("/profile.html", requireStaffPage, (_req, res) => {
  res.redirect("/profile");
});

app.get("/finance", requireStaffRolePage("admin", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"), (_req, res) => {
  res.sendFile(path.join(rootDir, "finance.html"));
});

app.get("/finance.html", requireStaffRolePage("admin", "cofounder", "secretary", "operations_manager", "project_manager", "sales_manager"), (_req, res) => {
  res.redirect("/finance");
});

app.get("/notifications", requireStaffPage, (_req, res) => {
  res.sendFile(path.join(rootDir, "notifications.html"));
});

app.get("/notifications.html", requireStaffPage, (_req, res) => {
  res.redirect("/notifications");
});

app.get("/analytics", requireStaffRolePage("admin"), (_req, res) => {
  res.sendFile(path.join(rootDir, "analytics.html"));
});

app.get("/analytics.html", requireStaffRolePage("admin"), (_req, res) => {
  res.redirect("/analytics");
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
