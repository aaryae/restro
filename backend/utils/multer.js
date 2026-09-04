require("dotenv").config();
const multer = require("multer");
const { runWithTenantContext } = require("../lib/tenant-context");
let maxFileSize = 45;
const uploaderHelper = {};

let imageMimeType = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/ico": "ico",
  "image/gif": "gif",
  "image/webp": "webp",
};

let xlsxMimeType = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  // Browsers/OSes disagree on the CSV mime type, so accept the common ones.
  "text/csv": "csv",
  "application/csv": "csv",
  "text/plain": "csv",
  "application/octet-stream": "csv",
};

/**
 * Multer finishes on stream callbacks that leave AsyncLocalStorage, so the
 * following handlers would query public schema instead of the tenant. Re-bind
 * from req.tenant (set by tenant middleware) before calling next().
 */
function continueAfterUpload(req, res, next, error, maxMb) {
  if (error) {
    if (error.code == "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ message: `File size must not exceed ${maxMb}MB` });
    }
    return res.status(400).json({ message: error.message });
  }

  const proceed = () => next();
  if (req.tenant?.schemaName) {
    return runWithTenantContext({ tenant: req.tenant }, proceed);
  }
  return proceed();
}

function createStorage(destinationPath) {
  var storage = multer.diskStorage({
    destination: destinationPath,
    filename: async (req, file, cb) => {
      const randomString = Math.random().toString(36).substring(2, 10);
      const parseName = file.originalname
        .replace(/[\\/&?$%']/g, "")
        .replace(/\s+/g, "_");
      const uniqueFileName = `${Date.now()}-${randomString}-${parseName}`;
      cb(null, uniqueFileName);
    },
  });
  return storage;
}

function createUploader(storage, mimeType, maxFileSize) {
  const uploader = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
      const isValid = !!mimeType[file.mimetype];
      console.log("****\nfile meme \n", mimeType);
      const error = isValid
        ? null
        : new Error("Only images and video files are allowed!");
      callback(error, isValid);
    },
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });
  return uploader;
}

function configureUpload(uploader, uploadType, fieldData) {
  if (uploadType === "array") {
    return uploader.array(fieldData[0], fieldData[1]);
  } else if (uploadType === "fields") {
    return uploader.fields(fieldData);
  } else if (uploadType === "single") {
    return uploader.single(fieldData);
  } else if (uploadType === "any") {
    return uploader.any(fieldData);
  }
}

const SHEET_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/** Mime alone is unreliable for spreadsheets, so the extension decides too. */
function createSheetUploader(storage, maxFileSize) {
  return multer({
    storage,
    fileFilter: function (req, file, callback) {
      const name = String(file.originalname || "").toLowerCase();
      const hasValidExtension = SHEET_EXTENSIONS.some((ext) =>
        name.endsWith(ext),
      );
      const hasValidMime = !!xlsxMimeType[file.mimetype];
      const isValid = hasValidExtension && hasValidMime;
      callback(
        isValid ? null : new Error("Only .xlsx, .xls or .csv files are allowed!"),
        isValid,
      );
    },
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });
}

uploaderHelper.uploadXlsxDoc = (
  destinationPath,
  uploadType,
  fieldData,
  maxFileSize = 10,
) => {
  var storage = createStorage(destinationPath);
  const uploader = createSheetUploader(storage, maxFileSize);
  const upload = configureUpload(uploader, uploadType, fieldData);

  return (fileUpload = (req, res, next) => {
    upload(req, res, function (error) {
      continueAfterUpload(req, res, next, error, maxFileSize);
    });
  });
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
  }

  var storage = createStorage(destinationPath);
  const uploader = createUploader(storage, imageMimeType, 45);
  const upload = configureUpload(uploader, uploadType, fieldData);

  return (fileUpload = (req, res, next) => {
    upload(req, res, function (error) {
      continueAfterUpload(req, res, next, error, maxFileSize);
    });
  });
};

module.exports = uploaderHelper;
