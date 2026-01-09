const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Store: { "email-ip": { count, firstAttemptTime } }
const attemptsStore = new Map();

function getKey(email, ip) {
  return `${email.toLowerCase()}-${ip}`;
}

const loginRateLimiter = (req, res, next) => {
  const { email } = req.body;
  const ip = req.ip;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required for rate limiting." });
  }

  const key = getKey(email, ip);
  const now = Date.now();
  let data = attemptsStore.get(key);

  if (!data) {
    data = { count: 0, firstAttemptTime: now };
    attemptsStore.set(key, data);
  }

  // Reset if window expired
  if (now - data.firstAttemptTime > WINDOW_MS) {
    data.count = 0;
    data.firstAttemptTime = now;
  }

if (data.count >= MAX_ATTEMPTS) {
  const secondsLeft = Math.ceil((WINDOW_MS - (now - data.firstAttemptTime)) / 1000);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  let timeLeftMsg;
  if (minutes > 0) {
    timeLeftMsg = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (seconds > 0) {
      timeLeftMsg += ` and ${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  } else {
    timeLeftMsg = `${seconds} second${seconds > 1 ? 's' : ''}`;
  }

  return res.status(429).json({
    success: false,
    message: `Too many failed login attempts. Try again after ${timeLeftMsg}.`,
    remainingAttempts: 0,
  });
}


  // Attach attempt data and key for next middleware
  req.rateLimitData = { key, data };
  next();
};

// Call this after successful login to reset attempts
function resetLoginAttempts(key) {
  attemptsStore.delete(key);
}

module.exports = {
  loginRateLimiter,
  resetLoginAttempts,
};

