const { Sequelize, DataTypes } = require("sequelize");
const { dbConfig } = require("../config/config");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: "mysql",
    pool: dbConfig.pool,
  }
);

sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection failed", err));

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.users = require("./model/authModel")(sequelize, DataTypes);
db.inquiries = require("./model/inquiryModel")(sequelize, DataTypes);
db.bills = require("./model/billModel")(sequelize, DataTypes);

// Define relationships
db.bills.belongsTo(db.inquiries, { foreignKey: "inquiryId", as: "inquiry" });
db.inquiries.hasOne(db.bills, { foreignKey: "inquiryId", as: "bill" });

// Sync database
db.sequelize
  .sync({ force: false })
  .then(() => console.log("Database synced successfully"))
  .catch((err) => console.error("Database sync failed", err));

module.exports = db;
