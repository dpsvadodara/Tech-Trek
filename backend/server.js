const express = require("express");
const path = require("path");
const db = require("./database");
const app = express();
const PORT = 3000;
const bcrypt = require("bcrypt");

// Middleware
app.use(express.json());
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport config
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Here, check if school exists in DB or create new
  console.log(profile);
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
app.use(
  session({
    secret: "688463067789-cgiil96hkamjq898i9abj5lj68ntrm0g.apps.googleusercontent.com",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.post("/api/register", async (req, res) => {
  const { school_name, email, password } = req.body;

  if (!school_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Encrypt password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert into database
  const query = `INSERT INTO schools (school_name, email, password) VALUES (?, ?, ?)`;

  db.run(query, [school_name, email, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint")) {
        return res.status(400).json({ message: "Email already registered." });
      }
      console.error(err);
      return res.status(500).json({ message: "Database error." });
    }
    res.status(200).json({ message: "School registered successfully!" });
  });
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/index.html"); // Redirect after successful login
  }
);
app.use(express.static(path.join(__dirname, ".."))); // serves your website folder

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working perfectly!" });
});

// Register a new school
app.post("/api/register", (req, res) => {
  const { school_name, email, password } = req.body;
  if (!school_name || !email || !password) {
    return res.json({ message: "Please fill all fields" });
  }

  const query = `INSERT INTO schools (school_name, email, password) VALUES (?, ?, ?)`;
  db.run(query, [school_name, email, password], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        res.json({ message: "Email already registered" });
      } else {
        console.error(err);
        res.json({ message: "Error registering school" });
      }
    } else {
      res.json({ message: "Registration successful! You can now log in." });
    }
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ message: "Please fill all fields" });
  }

  const query = `SELECT * FROM schools WHERE email = ? AND password = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) {
      console.error(err);
      res.json({ message: "Error logging in" });
    } else if (!row) {
      res.json({ message: "Invalid email or password" });
    } else {
      res.json({ message: "Login successful!" });
    }
  });
});

// Google Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  (req, res) => {
    res.redirect("/index.html"); // Redirect after successful login
  }
);


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
