const jwt = require("jsonwebtoken");
const { users } = require("../database/connection");
const { secretConfig } = require("../config/config");

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  jwt.verify(token, secretConfig.secretKey, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      const userData = await users.findByPk(decoded.id);
      if (!userData) {
        return res.status(404).json({ message: "No user with that ID found" });
      }

      req.user = userData;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  });
};


module.exports = { isAuthenticated};
