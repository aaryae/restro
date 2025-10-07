require("dotenv").config();
const multer = require("multer");
let maxFileSize = 45;
const uploaderHelper = {};

let mimeType = {
  // Images
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/svg": "svg",
  "image/ico": "ico",
  "image/svg+xml": "svg+xml",
  "image/gif": "gif",
  "image/webp": "webp",
  // Excel files
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
};

uploaderHelper.uploadFiles = (
  destinationPath,
  uploadType,
  fieldData,
  is_Video,
) => {
  // Set file type specific configurations
  if (is_Video) {
    mimeType = {
      "video/mp4": "mp4",
      "video/mpeg": "mpeg",
      "video/quicktime": "mov",
    };
    maxFileSize = 100; // 100MB for videos
  } else if (destinationPath === 'excel') {
    mimeType = {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "application/vnd.ms-excel": "xls",
    };
    maxFileSize = 10; // 10MB for Excel files
  }

  var storage = multer.diskStorage({
    destination: destinationPath,
    filename: async (req, file, cb) => {
      const randomString = Math.random().toString(36).substring(2, 10);
      const parseName = file.originalname
        .replace(/[\\/&?$%]/g, "")
        .replace(/\s+/g, "_");
      const uniqueFileName = `${Date.now()}-${randomString}-${parseName}`;
      cb(null, uniqueFileName);
    },
  });

  const uploader = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
      const isValid = !!mimeType[file.mimetype];
      const error = isValid
        ? null
        : new Error("Only images and video files are allowed!");
      callback(error, isValid);
    },
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });

  if (uploadType === "array") {
    var upload = uploader.array(fieldData[0], fieldData[1]);
  } else if (uploadType === "fields") {
    var upload = uploader.fields(fieldData);
  } else if (uploadType === "single") {
    var upload = uploader.single(fieldData);
  } else if (uploadType === "any") {
    var upload = uploader.any(fieldData);
  }

  return (fileUpload = (req, res, next) => {
    upload(req, res, async function (error) {
      if (error) {
        if (error.code == "LIMIT_FILE_SIZE") {
          return res
            .status(413)
            .json({ message: `File size must not exceed ${maxFileSize}MB` });
        } else {
          return res.status(400).json({ message: error.message });
        }
      }

      next();
    });
  });
};

module.exports = uploaderHelper;
