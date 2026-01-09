require("dotenv").config();

module.exports = {
  envPort: {
    port: Number(process.env.PORT_NUMBER),
  },

  seederConfig: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  secretConfig: {
    secretKey: process.env.SECRET_KEY,
  },

  originConfig:{
    adminUrl:process.env.ADMIN_URL,
    clientUrl:process.env.CLIENT_URL
  },

  dbConfig: {
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
