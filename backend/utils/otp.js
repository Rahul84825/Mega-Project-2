export const generateOtp = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

export const getOtpExpiryDate = (ttlMinutes = 10) => {
  return new Date(Date.now() + ttlMinutes * 60 * 1000);
};
