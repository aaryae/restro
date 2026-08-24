const fs = require("fs");
const path = require("path");

module.exports.deleteMedia = async (Model, itemId) => {
  try {
    // Find the item by ID to retrieve any associated image path
    const data = await Model.findOne({ where: { id: itemId } });

    if (!data) {
      throw new Error("Item not found.");
    }

    // Assuming the image path is stored in `data.image` (adjust as needed)
    const imagePath = path.join(data.path);

    // Check if the file exists and delete it
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Permanently delete the item from the database
    await Model.destroy({ where: { id: itemId } });

    return { success: true };
  } catch (err) {
    // Log error if something goes wrong
    return { success: false, message: err.message };
  }
};
