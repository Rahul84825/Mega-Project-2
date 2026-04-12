import { Readable } from "node:stream";
import { configureCloudinary } from "../config/cloudinary.js";

const uploadBufferToCloudinary = (buffer, folder = "mithai-world/uploads") => {
  const cloudinary = configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "image file is required"
      });
    }

    const uploaded = await uploadBufferToCloudinary(req.file.buffer);

    return res.status(200).json({
      success: true,
      url: uploaded?.secure_url || ""
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadMultipleImages = async (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "at least one image file is required"
      });
    }

    const uploads = await Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer)));

    return res.status(200).json({
      success: true,
      images: uploads
        .filter((upload) => Boolean(upload?.secure_url))
        .map((upload) => ({ url: upload.secure_url }))
    });
  } catch (error) {
    return next(error);
  }
};
