import fs from "fs/promises";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, "../../public/temp");
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Configure Multer to handle specific file fields
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, false);
    }
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images are allowed"));
  },
});

// Override the `fields` method to include auto-deletion logic
upload.fields = ((originalFields) => {
  return function (fields) {
    const middleware = originalFields.call(this, fields);

    return async (req, res, next) => {
      middleware(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        // Schedule file deletion for each uploaded file
        if (req.files) {
          for (const field in req.files) {
            req.files[field].forEach((file) => {
              if (file.path) {
                scheduleFileDeletion(file.path);
              }
            });
          }
        }

        next();
      });
    };
  };
})(upload.fields);

// Function to schedule file deletion
const scheduleFileDeletion = async (filePath) => {
  setTimeout(async () => {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      // Silently handle errors (e.g., ENOENT, permissions)
    }
  }, 60000); // 60000ms = 1 minute
};

// Apply fields configuration
const configuredUpload = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

export { configuredUpload as upload };
