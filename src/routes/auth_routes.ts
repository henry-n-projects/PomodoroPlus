import { Router } from "express";
import passport from "passport";

const router = Router();

// Google login -> displays google login and request profile+email
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback -> Add or create user if successful + sets session and cookie info, redirect if not
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: "/",
  })
);

// Google logout -> removes user from session, remove cookie
router.post("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// Get current User
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(req.user);
});

export default router;
