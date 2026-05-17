import {
  createOrder,
  getOrders,
  resendDeliveryOTP,
  updateDeliveryStatus,
  verifyDeliveryOTP
} from "./api";

export const orderService = {
  createOrder,
  getOrders,
  updateDeliveryStatus,
  verifyDeliveryOTP,
  resendDeliveryOTP
};

export {
  createOrder,
  getOrders,
  updateDeliveryStatus,
  verifyDeliveryOTP,
  resendDeliveryOTP
};
