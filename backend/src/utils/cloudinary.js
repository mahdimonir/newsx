import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility to extract publicId from Cloudinary URL
const getPublicIdFromUrl = (fileUrl) => {
  if (!fileUrl?.trim()) return null;
  const match = fileUrl.match(/\/(Newsx|Blogsphere)\/([^\/]+)\.\w+$/);
  return match ? match[1] : null;
};

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.warn("No file path provided for Cloudinary upload");
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder: "Newsx",
    });
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    return null;
  } finally {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};

// Delete file from Cloudinary
const deleteFileFromCloudinary = async (fileUrl) => {
  try {
    const publicId = getPublicIdFromUrl(fileUrl);
    if (!publicId) {
      return { success: true, message: "No file to delete" };
    }
    const fullPublicId = `${"Newsx" || "Blogsphere"}/${publicId}`;
    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: "image",
    });
    if (result.result === "ok") {
      return { success: true };
    }
    return { success: false, message: result.result };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export { deleteFileFromCloudinary, uploadOnCloudinary };
