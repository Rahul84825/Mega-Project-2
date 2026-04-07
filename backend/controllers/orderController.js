import { getIo } from "../socket.js";

const isValidOrderPayload = (orderData) => {
  return Boolean(orderData && typeof orderData === "object" && !Array.isArray(orderData));
};

export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    if (!isValidOrderPayload(orderData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order payload"
      });
    }

    orderData._id = orderData._id || Date.now().toString();
    orderData.createdAt = orderData.createdAt || new Date().toISOString();

    const io = getIo();
    if (io) {
      io.emit("newOrder", orderData);
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: orderData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order"
    });
  }
};
