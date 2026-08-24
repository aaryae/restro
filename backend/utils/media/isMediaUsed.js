const {
  customerModel,
  userModel,
  settingModel,
  socialModel,
  pageModel,
  productMediaModel,
  productVariantMediaModel,
  productCategoryModel,
  bannerItemsModel,
} = require("../../models");
const { Op } = require("sequelize");

async function checkIfMediaPathInUse(mediaPath) {
  // Define the models and their respective fields
  const checks = [
    // done
    {
      model: customerModel,
      fields: ["imageUrl"],
      name: "Customer",
    },
    {
      model: pageModel,
      fields: ["og_image"],
      name: "Page",
    },
    {
      model: productMediaModel,
      fields: ["imageUrl"],
      name: "Product",
    },
    {
      model: productVariantMediaModel,
      fields: ["imageUrl"],
      name: "ProductVariant",
    },
    {
      model: settingModel,
      fields: ["fav_icon", "brandingImage", "brandingFooterImage"],
      name: "Setting",
    },
    {
      model: socialModel,
      fields: ["fav_icon"],
      name: "Social",
    },
    {
      model: userModel,
      fields: ["imageUrl"],
      name: "User",
    },
    {
      model: productCategoryModel,
      fields: ["imageUrl", "imageUrlSecondary"],
      name: "ProductCategory",
    },
    {
      model: bannerItemsModel,
      fields: ["image"],
      name: "Banner Image",
    },
  ];

  // Run all checks concurrently using Promise.all
  const checksResult = await Promise.all(
    checks.map(async ({ model, fields, name }) => {
      // Construct the `where` clause with `Op.or`
      const whereClause = {
        [Op.or]: fields.map((field) => ({
          [field]: mediaPath,
        })),
      };

      const result = await model.findOne({ where: whereClause });
      return result ? name : null;
    }),
  );

  // Filter out null values and return the names of modules using the media path
  const usedInModules = checksResult.filter((module) => module !== null);

  return usedInModules;
}

module.exports = checkIfMediaPathInUse;
