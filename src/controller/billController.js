const { Op } = require("sequelize");
const { inquiries, bills } = require("../database/connection");

// CREATE BILL
const createBillForConfirmedInquiry = async (req, res) => {
  const { inquiryId } = req.params;
  const { items } = req.body;

  const inquiry = await inquiries.findByPk(inquiryId);
  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found" });
  }

  if (inquiry.status !== "CONFIRMED") {
    return res.status(400).json({
      message: "Cannot create bill. Inquiry is not confirmed.",
    });
  }

  // Prevent duplicate bill
  const existingBill = await bills.findOne({ where: { inquiryId } });
  if (existingBill) {
    return res.status(400).json({
      message: "Bill already exists for this inquiry",
    });
  }

  const lastBill = await bills.findOne({
    order: [["createdAt", "DESC"]],
  });

  const nextBillNo = lastBill
    ? String(parseInt(lastBill.billNo, 10) + 1).padStart(3, "0")
    : "001";

  // Process items array if provided
  let processedItems = [];
  let grandTotal = 0;

  if (items && Array.isArray(items)) {
    processedItems = items.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;

      // Calculate totalAmount: if both qty and rate exist, calculate; otherwise use manual amount
      let totalAmount = parseFloat(item.amount) || 0;
      if (qty > 0 && rate > 0) {
        totalAmount = qty * rate;
      }

      grandTotal += totalAmount;

      return {
        description: item.description || "",
        qty: qty > 0 ? qty : null,
        rate: rate > 0 ? rate : null,
        totalAmount: totalAmount,
        type: item.type || "manual",
      };
    });
  } else {
    // Fallback to inquiry data if items not provided
    grandTotal = inquiry.finalAmount;
  }

  // Use calculated grandTotal or fallback to inquiry finalAmount
  const finalAmount = grandTotal > 0 ? grandTotal : inquiry.finalAmount;

  // Extract costs from items if available, otherwise use inquiry data
  let baseCost = inquiry.baseCost;
  let packagingFee = inquiry.packagingFee;
  let liquorCost = inquiry.liquorCost || 0;

  if (processedItems.length > 0) {
    // Find country row
    const countryRow = processedItems.find(
      (item) =>
        item.description === inquiry.destinationCountry ||
        item.description?.toLowerCase().includes("country")
    );
    if (countryRow) {
      baseCost = countryRow.totalAmount || inquiry.baseCost;
    }

    // Find packing row
    const packingRow = processedItems.find(
      (item) =>
        item.description?.toLowerCase().includes("pack") ||
        item.description === "Packing Charge"
    );
    if (packingRow) {
      packagingFee = packingRow.totalAmount || inquiry.packagingFee;
    }

    // Calculate liquor cost from liquor-type items
    liquorCost = processedItems
      .filter((item) => item.description?.toLowerCase().includes("liquor"))
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }

  const bill = await bills.create({
    billNo: nextBillNo,
    inquiryId,
    baseCost,
    packagingFee,
    liquorCost,
    finalAmount,
    items: processedItems,
  });

  // Update inquiry status to BILL
  await inquiries.update({ status: "BILL" }, { where: { id: inquiryId } });

  return res.status(201).json({
    message: "Bill created successfully",
    data: bill,
  });
};

// FETCH BILLS
const fetchBills = async (req, res) => {
  const { page = 1, limit = 10, search = "", status } = req.query;
  const offset = (page - 1) * limit;

  const billWhere = {};
  const inquiryWhere = {};

  if (search) {
    billWhere.billNo = { [Op.like]: `%${search}%` };
  }

  if (status) {
    inquiryWhere.status = status;
  }

  const { count, rows } = await bills.findAndCountAll({
    where: billWhere,
    include: [
      {
        model: inquiries,
        as: "inquiry",
        where: inquiryWhere,
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  // Ensure items is always an array for each bill (parse if it's a JSON string)
  const processedBills = rows.map((bill) => {
    const billData = bill.toJSON();
    if (billData.items) {
      if (typeof billData.items === "string") {
        try {
          billData.items = JSON.parse(billData.items);
        } catch (e) {
          console.error("Error parsing items JSON:", e);
          billData.items = [];
        }
      } else if (!Array.isArray(billData.items)) {
        billData.items = [];
      }
    } else {
      billData.items = [];
    }
    return billData;
  });

  const totalPages = Math.ceil(count / limit);

  return res.status(200).json({
    message: "Bills fetched successfully",
    data: processedBills,
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

// UPDATE BILL
const updateBill = async (req, res) => {
  const { id } = req.params;
  const { items, baseCost, packagingFee, liquorCost, finalAmount } = req.body;

  const bill = await bills.findByPk(id);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  // billNo cannot be changed - it's immutable
  const updateData = {};

  // Process items array if provided
  if (items && Array.isArray(items)) {
    const processedItems = items.map((item) => {
      // Parse quantity - handle different formats
      let qty = null;
      if (item.quantity === "__" || item.quantity === null || item.quantity === undefined) {
        qty = null;
      } else if (typeof item.quantity === "string") {
        // Handle formats like "1 L", "1 KG", or "1"
        const parsed = parseFloat(
          item.quantity
            .replace(" L", "")
            .replace("L", "")
            .replace(" KG", "")
            .replace("KG", "")
            .trim()
        );
        qty = !isNaN(parsed) && parsed > 0 ? parsed : null;
      } else if (typeof item.quantity === "number") {
        // Already a number
        qty = !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : null;
      } else {
        // Try to parse as number
        const parsed = parseFloat(item.quantity);
        qty = !isNaN(parsed) && parsed > 0 ? parsed : null;
      }

      const rate = parseFloat(item.rate) || 0;
      const rateValue = rate > 0 ? rate : null;

      // Calculate totalAmount: if both qty and rate exist, calculate; otherwise use manual amount
      let totalAmount = parseFloat(item.amount) || 0;
      if (qty && rateValue) {
        totalAmount = qty * rateValue;
      }

      return {
        description: item.description || "",
        qty: qty,
        rate: rateValue,
        totalAmount: totalAmount,
        type: item.type || "manual",
      };
    });

    updateData.items = processedItems;

    // Calculate grandTotal from items
    const calculatedGrandTotal = processedItems.reduce(
      (sum, item) => sum + (item.totalAmount || 0),
      0
    );
    updateData.finalAmount = calculatedGrandTotal;

    // Extract costs from items for backward compatibility
    const countryRow = processedItems.find(
      (item) =>
        item.type === "country" ||
        item.description === bill.inquiry?.destinationCountry
    );
    if (countryRow) {
      updateData.baseCost = countryRow.totalAmount || bill.baseCost;
    }

    const packingRow = processedItems.find(
      (item) =>
        item.type === "packing" ||
        item.description?.toLowerCase().includes("pack")
    );
    if (packingRow) {
      updateData.packagingFee = packingRow.totalAmount || bill.packagingFee;
    }

    const liquorRows = processedItems.filter((item) => item.type === "liquor");
    if (liquorRows.length > 0) {
      updateData.liquorCost = liquorRows.reduce(
        (sum, item) => sum + (item.totalAmount || 0),
        0
      );
    }
  } else {
    // Allow direct updates to costs if items not provided
    if (baseCost !== undefined) updateData.baseCost = baseCost;
    if (packagingFee !== undefined) updateData.packagingFee = packagingFee;
    if (liquorCost !== undefined) updateData.liquorCost = liquorCost;
    if (finalAmount !== undefined) updateData.finalAmount = finalAmount;
  }

  await bill.update(updateData);

  const updatedBill = await bills.findByPk(id, {
    include: [{ model: inquiries, as: "inquiry" }],
  });

  // Parse items if it's a JSON string
  if (updatedBill && typeof updatedBill.items === "string") {
    try {
      updatedBill.items = JSON.parse(updatedBill.items);
    } catch (e) {
      console.error("Error parsing items JSON in updateBill:", e);
      updatedBill.items = [];
    }
  }

  return res.status(200).json({
    message: "Bill updated successfully",
    data: updatedBill,
  });
};

// GET SINGLE BILL
const getBillById = async (req, res) => {
  const { id } = req.params;

  const bill = await bills.findByPk(id, {
    include: [{ model: inquiries, as: "inquiry" }],
  });

  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  // Ensure items is always an array (parse if it's a JSON string)
  const billData = bill.toJSON();
  if (billData.items) {
    if (typeof billData.items === "string") {
      try {
        billData.items = JSON.parse(billData.items);
      } catch (e) {
        console.error("Error parsing items JSON:", e);
        billData.items = [];
      }
    } else if (!Array.isArray(billData.items)) {
      billData.items = [];
    }
  } else {
    billData.items = [];
  }

  return res.status(200).json({
    message: "Bill fetched successfully",
    data: billData,
  });
};

module.exports = {
  createBillForConfirmedInquiry,
  fetchBills,
  updateBill,
  getBillById,
};
