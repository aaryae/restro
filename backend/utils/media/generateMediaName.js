const generateFileName = (req) => {
  const date = new Date().toISOString().replace(/[:.]/g, "-"); // Format the date to avoid invalid filename characters
  const fileExtension = req.file.originalname.split(".").pop(); // Extract the file extension
  const baseFileName =
    req.body?.name?.split(" ").join("") ||
    req.file.filename.split(" ").join(""); // Use name from body or fallback to filename

  return `${baseFileName}-${date}.${fileExtension}`.toLowerCase(); // Concatenate and convert to lowercase

  // return req.file.originalname.Join(' ').toLowerCase();
};

// Usage
module.exports = generateFileName;
