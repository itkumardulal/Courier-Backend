module.exports = (sequelize, DataTypes) => {
  const Bill = sequelize.define("bills", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    billNo: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    inquiryId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, 
      references: {
        model: "inquiries",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    items: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  });

  return Bill;
};
