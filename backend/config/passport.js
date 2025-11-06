const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../database.sqlite");
const db = new sqlite3.Database(dbPath);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      db.get("SELECT * FROM users WHERE googleId = ?", [profile.id], (err, user) => {
        if (err) return done(err);

        if (user) {
          return done(null, user);
        } else {
          const { id, displayName, emails } = profile;
          db.run(
            "INSERT INTO users (googleId, name, email) VALUES (?, ?, ?)",
            [id, displayName, emails[0].value],
            function (err) {
              if (err) return done(err);
              db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newUser) => {
                done(err, newUser);
              });
            }
          );
        }
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    done(err, user);
  });
});

module.exports = passport;