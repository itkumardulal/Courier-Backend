const { isAuthenticated } = require("../middleware/isAuthenticated");
const { loginRateLimiter, resetLoginAttempts } = require("../middleware/rateLimiter");
const {isLogin,verifyToken,logout} = require("../controller/authController")
const catchError = require("../util/catchError");

const router = require("express").Router();
router.post("/login", loginRateLimiter, async (req, res) => {
  const originalSend = res.send;
  let statusCode;

  // Wrap res.send to get status code
  res.send = function (body) {
    statusCode = res.statusCode;
    return originalSend.call(this, body);
  };

  await isLogin(req, res);

  if (res.headersSent) {
    if (statusCode < 400) {
      // Success: reset attempts for this email+IP
      resetLoginAttempts(req.rateLimitData.key);
    } else {
      // Failure: increment count for this email+IP
      req.rateLimitData.data.count++;
    }
  }
});
router.route("/verify").get(isAuthenticated, catchError(verifyToken));
router.route("/logout").post(catchError(logout));

module.exports = router;
