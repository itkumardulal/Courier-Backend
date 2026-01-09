const { Op } = require("sequelize");
const { inquiries } = require("../database/connection");

//addInquiry
const addInquiry = async (req, res) => {
  const {
    senderName,
    senderPhone,
    senderAddress,
    receiverName,
    receiverPhone,
    receiverAddress,
    zipCode,
    destinationCountry,
    weightKg,
    hasLiquorItems,
    hasSpecialItems,
    liquorItems,
    specialItems,
    baseCost,
    packagingFee,
    liquorCost,
    finalAmount,
    notes,
  } = req.body;

  const data = await inquiries.create({
    senderName,
    senderPhone,
    senderAddress,
    receiverName,
    receiverPhone,
    receiverAddress,
    zipCode,
    destinationCountry,
    weightKg,
    hasLiquorItems,
    hasSpecialItems,
    liquorItems,
    specialItems,
    baseCost,
    packagingFee,
    liquorCost,
    finalAmount,
    status: "PENDING",
    notes,
  });

  return res.status(201).json({
    message: "Inquiry submitted successfully",
    data,
  });
};

//fetchInquiries
const fetchInquiries = async (req, res) => {
  const { page = 1, limit = 10, search = "", status } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause[Op.or] = [
      { senderName: { [Op.like]: `%${search}%` } },
      { receiverName: { [Op.like]: `%${search}%` } },
      { destinationCountry: { [Op.like]: `%${search}%` } },
      { senderPhone: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await inquiries.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  const totalPages = Math.ceil(count / limit);

  return res.status(200).json({
    message: "Inquiries fetched successfully",
    data: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

//fetchSingleInquiry
const fetchSingleInquiry = async (req, res) => {
  const { id } = req.params;
  const data = await inquiries.findByPk(id);
  if (!data) {
    return res.status(404).json({ message: "Inquiry not found" });
  }
  return res.status(200).json({
    message: "Inquiry fetched successfully",
    data,
  });
};

//updateInquiry
const updateInquiry = async (req, res) => {
  const { id } = req.params;
  const inquiry = await inquiries.findByPk(id);
  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found" });
  }

  const updateData = { ...req.body };

  // If status is being updated to CONFIRMED, set confirmedAt
  if (updateData.status === "CONFIRMED" && inquiry.status !== "CONFIRMED") {
    updateData.confirmedAt = new Date();
  }

  // Preserve liquorItems and specialItems if they exist in the inquiry but not in update
  if (!updateData.liquorItems && inquiry.liquorItems) {
    updateData.liquorItems = inquiry.liquorItems;
  }
  if (!updateData.specialItems && inquiry.specialItems) {
    updateData.specialItems = inquiry.specialItems;
  }

  await inquiries.update(updateData, {
    where: { id },
  });

  const updatedInquiry = await inquiries.findByPk(id);

  return res.status(200).json({
    message: "Inquiry updated successfully",
    data: updatedInquiry,
  });
};

const confirmInquiry = async (req, res) => {
  const { id } = req.params;
  const inquiry = await inquiries.findByPk(id);
  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found" });
  }
  if (inquiry.status !== "PENDING") {
    return res.status(400).json({
      message: "Only pending status can be confirmed",
    });
  }
  await inquiries.update(
    {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
    { where: { id } }
  );
  return res.status(200).json({
    message: "Inquiry confirmed successfully",
  });
};

const cancelInquiry = async (req, res) => {
  const { id } = req.params;

  const inquiry = await inquiries.findByPk(id);
  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found" });
  }

  await inquiries.update({ status: "CANCELLED" }, { where: { id } });

  return res.status(200).json({
    message: "Inquiry cancelled successfully",
  });
};

// Approve inquiry (set status to CONFIRMED)
const approveInquiry = async (req, res) => {
  const { id } = req.params;
  const inquiry = await inquiries.findByPk(id);

  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found" });
  }

  await inquiries.update(
    {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
    { where: { id } }
  );

  const updatedInquiry = await inquiries.findByPk(id);

  return res.status(200).json({
    message: "Inquiry approved successfully",
    data: updatedInquiry,
  });
};

// Fetch confirmed inquiries without bills
const fetchConfirmedInquiriesWithoutBill = async (req, res) => {
  const { bills } = require("../database/connection");

  const confirmedInquiries = await inquiries.findAll({
    where: { status: "CONFIRMED" },
    attributes: ["id", "senderName"],
  });

  const billsWithInquiryIds = await bills.findAll({
    attributes: ["inquiryId"],
  });

  const inquiryIdsWithBills = new Set(
    billsWithInquiryIds.map((bill) => bill.inquiryId)
  );

  const inquiriesWithoutBills = confirmedInquiries.filter(
    (inquiry) => !inquiryIdsWithBills.has(inquiry.id)
  );

  return res.status(200).json({
    message: "Confirmed inquiries without bills fetched successfully",
    data: inquiriesWithoutBills.map((inq) => ({
      id: inq.id,
      senderName: inq.senderName,
    })),
  });
};

// Admin inquiries list (excludes BILL status)
const fetchAdminInquiries = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};

  // If status param exists and is valid, filter by it
  if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
    whereClause.status = status;
  } else {
    // If no status filter, exclude BILL
    whereClause.status = { [Op.ne]: "BILL" };
  }

  const { count, rows } = await inquiries.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  const totalPages = Math.ceil(count / limit);

  return res.status(200).json({
    message: "Inquiries fetched successfully",
    data: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// Update confirmed inquiry data (qty, rates, amounts)
const updateConfirmedInquiryData = async (req, res) => {
  const { id } = req.params;
  const {
    weightKg,
    baseCost,
    packagingFee,
    liquorCost,
    finalAmount,
    liquorItems,
    specialItems,
  } = req.body;

  const inquiry = await inquiries.findByPk(id);

  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found" });
  }

  if (inquiry.status !== "CONFIRMED") {
    return res.status(400).json({
      message: "Only confirmed inquiries can be updated",
    });
  }

  await inquiries.update(
    {
      weightKg,
      baseCost,
      packagingFee,
      liquorCost,
      finalAmount,
      liquorItems,
      specialItems,
    },
    { where: { id } }
  );

  const updatedInquiry = await inquiries.findByPk(id);

  return res.status(200).json({
    message: "Inquiry updated successfully",
    data: updatedInquiry,
  });
};

module.exports = {
  addInquiry,
  fetchInquiries,
  fetchSingleInquiry,
  updateInquiry,
  confirmInquiry,
  cancelInquiry,
  approveInquiry,
  fetchConfirmedInquiriesWithoutBill,
  fetchAdminInquiries,
  updateConfirmedInquiryData,
};
