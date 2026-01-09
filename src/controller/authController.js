const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { secretConfig } = require("../config/config");
const { users } = require("../database/connection");


const isLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  const data = await users.findOne({ where: { email } });
  if (!data) {
    return res.status(400).json({ message: "No user with that email" });
  }

  const isAuthenticated = bcrypt.compareSync(password, data.password);
  if (!isAuthenticated) {
    return res.status(400).json({ message: "Incorrect email or password" });
  }

  const token = jwt.sign({ id: data.id }, secretConfig.secretKey, {
    expiresIn: "1h",
  });

  // Determine if we're in production and using HTTPS
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure =
    isProduction || req.secure || req.headers["x-forwarded-proto"] === "https";

  // For cross-site cookies (different domains), we need sameSite: "None" with secure: true
  // In production, always use "None" for cross-site compatibility
  // In development, use "Lax" for same-site cookies
  const sameSiteValue = isProduction ? "None" : "Lax";
  const secureValue = isProduction ? true : isSecure; // Always secure in production for sameSite: "None"

  res.cookie("token", token, {
    httpOnly: true,
    secure: secureValue,
    sameSite: sameSiteValue,
    maxAge: 3600000, // 1 hour
    path: "/",
  });

  return res.status(200).json({
    message: "Login successful",
  });
};

const verifyToken = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token is valid",
    user: { id: req.user.id, email: req.user.email }
  });
};


const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure =
    isProduction || req.secure || req.headers["x-forwarded-proto"] === "https";

  const sameSiteValue = isProduction ? "None" : "Lax";
  const secureValue = isProduction ? true : isSecure;

  res.clearCookie("token", {
    httpOnly: true,
    secure: secureValue,
    sameSite: sameSiteValue,
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { isLogin, verifyToken, logout };
