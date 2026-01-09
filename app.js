const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { envPort, originConfig } = require("./src/config/config");
const adminSeeder= require('./adminSedder')

const app = express();
require("./src/database/connection");
//security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.disable("x-powered-by");

//cors config
const allowedOrigins = [originConfig.adminUrl,originConfig.clientUrl].filter(
  Boolean
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / server-side / mobile apps
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//body-parser
app.use(express.json());
app.use(cookieParser());

//adminSeeder
adminSeeder()

//route import
const authRoute = require("./src/routes/authRoute");
const inquiryRoute = require("./src/routes/inquiryRoute");
const billRoute = require("./src/routes/billRoute")

//routes
app.use("/", authRoute);
app.use("/", inquiryRoute);
app.use('/',billRoute)

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Courier API running ",
  });
});

//404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("ERROR :", err.message);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

//server start
const port = envPort.port;
app.listen(port, () => {
  console.log(` Server started successfully on port ${port}`);
});
