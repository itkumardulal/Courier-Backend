module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define("inquiries", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    senderName: {
      type: DataTypes.STRING,
    },
    senderPhone: {
      type: DataTypes.STRING,
    },
    senderAddress: {
      type: DataTypes.TEXT,
    },

    receiverName: {
      type: DataTypes.STRING,
    },
    receiverPhone: {
      type: DataTypes.STRING,
    },
    receiverAddress: {
      type: DataTypes.TEXT,
    },
    zipCode: {
      type: DataTypes.STRING,
    },
    destinationCountry: {
      type: DataTypes.STRING,
    },

    weightKg: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    hasLiquorItems: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    hasSpecialItems: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    liquorItems: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    specialItems: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    baseCost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    packagingFee: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    liquorCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    finalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED", "BILL"),
      defaultValue: "PENDING",
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Inquiry;
};
