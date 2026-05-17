import { Resend } from "resend";

const apiKey = String(process.env.RESEND_API_KEY || "").trim();

export const getResendClient = () => {
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
};
