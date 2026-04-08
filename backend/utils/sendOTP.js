export const sendDeliveryOTP = async (order, otp) => {
  const orderId = order?._id ? String(order._id) : "unknown-order";
  console.log(`[Delivery OTP] Order ${orderId}: ${otp}`);
};