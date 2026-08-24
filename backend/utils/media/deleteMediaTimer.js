const { mediaModel } = require("../../models");
const { deleteMedia } = require("./deleteMedia");
const checkIfMediaPathInUse = require("./isMediaUsed"); // Import your existing function
const cron = require("node-cron");
const logger = require("../../configs/logger");

async function deleteMediaTimer() {
  try {
    // Step 1: Retrieve all media paths from the mediaModel
    const allMediaPaths = await mediaModel.findAll({
      attributes: ["id", "path"], // Assuming 'path' is the field storing media paths
    });

    // Step 2: Check each media path
    const deletionPromises = allMediaPaths.map(async (media) => {
      const mediaPath = media.path;
      const mediaId = media.id;
      const usedInModules = await checkIfMediaPathInUse(mediaPath);

      // Step 3: If not used, delete from mediaModel
      if (usedInModules.length === 0) {
        await deleteMedia(mediaModel, mediaId);
        logger.info(`Deleted unused media path: ${mediaPath}`);
      }
    });

    // Wait for all deletions to complete
    await Promise.all(deletionPromises);
    logger.info("Unused media cleanup completed.");
  } catch (error) {
    logger.error("Error during unused media cleanup:", error);
  }
}

// Schedule the function to run every Sunday at midnight
//if wanna check its working or not then change the time to every 10 seconds : "*/10 * * * * *""
cron.schedule("0 0 * * 0", () => {
  logger.info("Starting weekly unused media cleanup...");
  // console.log("Starting weekly unused media cleanup...");
  deleteMediaTimer();
});

module.exports = deleteMediaTimer;
