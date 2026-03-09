require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const applicationsRoutes = require("./routes/applications");
const profileRoutes = require("./routes/profile");
const resumeRoutes = require("./routes/resume");
const emailRoutes = require("./routes/email");
const jdRoutes = require("./routes/jd");
const parseJdRoutes = require("./routes/parse-jd");

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3002"];
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/jd", jdRoutes);
app.use("/api/parse-jd", parseJdRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Candor API listening on port ${PORT}`));
