const router = require("express").Router();
const {
  userModel,
  roleModel,
  roleMenuModel,
  roleMenuActionModel,
  roleActionModel,
  settingModel,
  mediaCategoryModel,
  bannerModel,
  bannerItemsModel,
  departmentModel,
  productModel,
  productMediaModel,
  productCategoryModel,
  mediaModel,
} = require("../models/index");
const setupData = require("./setup.json");
const { getQueryResponse } = require("../helpers/response-helper");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");
const mime = require("mime-types");
const internal = {};

// Utility function to generate unique file name
const generateFileName = (originalFileName) => {
  const timestamp = Date.now();
  const uuid = uuidv4().split("-")[0]; // Use first part of UUID for brevity
  const parsed = path.parse(originalFileName);
  return `${timestamp}-${uuid}-${parsed.name}${parsed.ext}`;
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

internal.saveRoles = async (req, rolesArray) => {
  try {
    for (const role of rolesArray) {
      let checkRole = await roleModel.findOne({
        where: { title: role.title },
        raw: true,
      });
      if (!checkRole) {
        await roleModel.create({
          title: role.title,
          roleType: role.roleType,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};
internal.saveUsers = async (req, usersArray) => {
  try {
    let superAdmin = await roleModel.findOne({
      where: { title: "Super Admin" },
      raw: true,
    });
    let admin = await roleModel.findOne({
      where: { title: "Admin" },
      raw: true,
    });
    for (let user of usersArray) {
      if (user.username == "superadmin") {
        user.roleId = superAdmin.id;
      }
      if (user.username == "admin") {
        user.roleId = admin.id;
      }
      let checkUser = await userModel.findOne({
        where: { email: user.email },
        raw: true,
      });
      if (!checkUser) {
        await userModel.create({
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleId: user.roleId,
          gender: user.gender,
          mobileNo: user.mobileNo,
          mobilePrefix: user.mobilePrefix,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};
internal.saveRoleMenuActions = async (
  req,
  roleMenuId,
  roleMenuTitle,
  roleMenuActionArray,
) => {
  try {
    for (const roleMenuAction of roleMenuActionArray) {
      let checkRoleMenuAction = await roleMenuActionModel.findOne({
        where: { roleMenuId, key: roleMenuAction.key },
        raw: true,
      });
      if (!(checkRoleMenuAction && checkRoleMenuAction.id)) {
        if (
          (roleMenuAction.requestMethod && !roleMenuAction.serverPath) ||
          (!roleMenuAction.requestMethod && roleMenuAction.serverPath)
        ) {
          throw `Issue With Server Path, Both Server Path and Request Method are required in pair or not, -----Role Menu: ${roleMenuTitle}-----Key: ${roleMenuAction.key}-----`;
        }
        await roleMenuActionModel.create({
          roleMenuId,
          title: roleMenuAction.title,
          key: roleMenuAction.key,
          clientPath: roleMenuAction.clientPath,
          list: roleMenuAction.list,
          serverPath: roleMenuAction.serverPath,
          requestMethod: roleMenuAction.requestMethod,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};
internal.saveAllAccessToSuperAdmin = async (req) => {
  try {
    let superAdmin = await userModel.findOne({
      where: { username: "superadmin" },
      raw: true,
    });
    let allRoleMenuAction = await roleMenuActionModel.findAll({
      isDeleted: false,
    });
    let insertData = allRoleMenuAction.map((x) => ({
      roleId: superAdmin.roleId,
      roleMenuActionId: x.id,
    }));
    await roleActionModel.destroy({ where: { roleId: superAdmin.roleId } });
    await roleActionModel.bulkCreate(insertData);
  } catch (err) {
    throw err;
  }
};
internal.saveRoleMenu = async (req, roleMenuArray) => {
  try {
    for (const roleMenu of roleMenuArray) {
      let checkRoleMenu = await roleMenuModel.findOne({
        where: { key: roleMenu.key },
        raw: true,
      });
      if (!(checkRoleMenu && checkRoleMenu.id)) {
        checkRoleMenu = await roleMenuModel.create({
          title: roleMenu.title,
          key: roleMenu.key,
        });
      }
      await internal.saveRoleMenuActions(
        req,
        checkRoleMenu.id,
        checkRoleMenu.title,
        roleMenu.actions,
      );
    }
    await internal.saveAllAccessToSuperAdmin(req);
  } catch (err) {
    throw err;
  }
};
internal.saveSettings = async (setting) => {
  try {
    const isCreated = await settingModel.findOne({
      where: { id: setting.id },
      raw: true,
    });
    if (!isCreated) {
      await settingModel.create(setting);
    }
  } catch (err) {
    throw err;
  }
};
// internal.saveRTEMediaCategory = async (mediaCategory) => {
//   try {
//     const isCreated = await mediaCategoryModel.findOne({
//       where: { id: mediaCategory.id },
//       raw: true,
//     });
//     if (!isCreated) {
//       await mediaCategoryModel.create(mediaCategory);
//     }
//   } catch (err) {
//     throw err;
//   }
// };

internal.saveBannerItems = async (req, bannerItems) => {
  try {
    for (const bannerItem of bannerItems) {
      let checkBannerItem = await bannerItemsModel.findOne({
        where: { id: bannerItem.id },
        raw: true,
      });
      if (!checkBannerItem) {
        await bannerItemsModel.create({
          id: bannerItem.id,
          bannerId: bannerItem.bannerId,
          image: bannerItem.image,
          caption: bannerItem.caption,
          title: bannerItem.title,
          subTitle: bannerItem.subTitle,
          primaryButton: bannerItem.primaryButton,
          primaryButtonUrl: bannerItem.primaryButtonUrl,
          secondaryButton: bannerItem.secondaryButton,
          secondaryButtonUrl: bannerItem.secondaryButtonUrl,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};

internal.saveBanner = async (req, banner) => {
  try {
    for (const bannerData of banner) {
      const isCreated = await bannerModel.findOne({
        where: { id: bannerData.id },
        raw: true,
      });
      if (!isCreated) {
        await bannerModel.create({
          id: bannerData.id,
          name: bannerData.name,
          slug: bannerData.slug,
        });
      }
      await internal.saveBannerItems(req, bannerData.bannerItems);
    }
  } catch (err) {
    throw err;
  }
};

internal.saveRTEMediaCategory = async (req, mediaCategory) => {
  console.log(mediaCategory);

  try {
    for (const mediaCat of mediaCategory) {
      const isMediaCat = await mediaCategoryModel.findOne({
        where: { id: mediaCat.id },
        raw: true,
      });
      if (!isMediaCat) {
        await mediaCategoryModel.create(mediaCat);
      }
    }
  } catch (err) {
    throw err;
  }
};

internal.seedFolderBasedMedia = async (req, categoryConfigs) => {
  try {
    // Ensure categoryConfigs is an array
    console.log(categoryConfigs, typeof categoryConfigs);
    if (!Array.isArray(categoryConfigs)) {
      throw new Error("categoryConfigs must be an array");
    }

    // Define the resources folder path (target for all media files)
    const resourcesFolder = path.join(__dirname, "..", "resources");

    // Ensure resources folder exists, create if not
    if (
      !(await fs
        .access(resourcesFolder)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs.mkdir(resourcesFolder, { recursive: true });
      console.log(`Created resources folder: ${resourcesFolder}`);
    }

    // Process each category configuration
    for (const config of categoryConfigs) {
      let {
        departmentName,
        departmentId,
        categoryName,
        categorySlug,
        categoryId,
        folderPath, // Source folder where files currently live
        captionPrefix = "",
        descriptionPrefix = "",
      } = config;

      // Validate required fields
      if (
        !departmentName ||
        !departmentId ||
        !categoryName ||
        !categorySlug ||
        !categoryId ||
        !folderPath
      ) {
        console.warn(
          `Skipping invalid config: ${JSON.stringify(config)} - missing required fields`,
        );
        continue;
      }

      // Create or find department
      let department = await departmentModel.findOne({
        where: { id: departmentId },
        raw: true,
      });

      if (!department) {
        department = await departmentModel.create({
          id: departmentId,
          name: departmentName,
          slug: generateSlug(departmentName),
          isActive: true, // Required field with default
        });
        console.log(`Created department: ${departmentName}`);
      } else {
        console.log(`Department already exists: ${departmentName}`);
      }

      // Create or find media category (for mediaModel)
      let mediaCategory = await mediaCategoryModel.findOne({
        where: { id: categoryId },
        raw: true,
      });

      if (!mediaCategory) {
        mediaCategory = await mediaCategoryModel.create({
          id: categoryId,
          name: categoryName,
          slug: categorySlug,
        });
        console.log(`Created media category: ${categoryName}`);
      } else {
        console.log(`Media category already exists: ${categoryName}`);
      }

      // Create or find product category (for productModel)
      let productCategory = await productCategoryModel.findOne({
        where: { id: categoryId },
        raw: true,
      });

      if (!productCategory) {
        productCategory = await productCategoryModel.create({
          id: categoryId,
          name: categoryName,
          slug: categorySlug,
          orders: 0,
          loyaltyRequired: 0,
        });
        console.log(`Created product category: ${categoryName}`);
      } else {
        console.log(`Product category already exists: ${categoryName}`);
      }

      // Resolve source folder path
      const sourceFolder = path.join(__dirname, folderPath);

      // Check if source folder exists
      if (
        !(await fs
          .access(sourceFolder)
          .then(() => true)
          .catch(() => false))
      ) {
        console.warn(
          `Source folder not found: ${sourceFolder}. Skipping media seeding for ${categoryName}`,
        );
        continue;
      }

      // Read and filter files from the source folder
      const files = await fs.readdir(sourceFolder);
      const validFiles = [];
      for (const file of files) {
        const filePath = path.join(sourceFolder, file);
        const stat = await fs.stat(filePath);
        if (
          stat.isFile() &&
          [".jpg", ".jpeg", ".png"].includes(path.extname(file).toLowerCase())
        ) {
          validFiles.push(file);
        }
      }

      // Seed media entries, products, and product media
      for (const file of validFiles) {
        const sourcePath = path.join(sourceFolder, file);
        let targetFileName = generateFileName(file); // Generate unique name
        let targetPath = path.join(resourcesFolder, targetFileName);
        let counter = 1;

        // Check for conflicts in resources; rename if necessary
        while (
          await fs
            .access(targetPath)
            .then(() => true)
            .catch(() => false)
        ) {
          const parsed = path.parse(file);
          targetFileName = `${parsed.name}-${counter}${parsed.ext}`;
          targetFileName = generateFileName(targetFileName); // Regenerate with counter
          targetPath = path.join(resourcesFolder, targetFileName);
          counter++;
        }

        // Copy file to resources
        await fs.copyFile(sourcePath, targetPath);
        console.log(`Copied file to resources: ${targetPath}`);

        const stats = await fs.stat(targetPath);
        const dbPath = `resources/${targetFileName}`; // e.g., resources/1747215288312-fmhnauq0-espresso.png

        // Create product using original file name
        const productName = path.parse(file).name;
        let product = await productModel.findOne({
          where: { slug: generateSlug(productName) },
          raw: true,
        });

        if (!product) {
          product = await productModel.create({
            productCategoryId: categoryId,
            departmentId: departmentId,
            name: productName,
            slug: generateSlug(productName),
            quantity: 10, // Default value
            orders: 0,
            price: 5.99, // Default value
            stockStatus: "in_stock",
            reservedQuantity: 0,
          });
          console.log(`Created product: ${productName}`);
        } else {
          console.log(`Product already exists: ${productName}`);
        }

        // Create media entry
        const mediaEntry = {
          name: generateFileName(file), // Unique name for DB record
          path: dbPath,
          caption: `${captionPrefix}${productName}`,
          description: `${descriptionPrefix}${productName}`,
          sizeInBytes: stats.size,
          mimeType: mime.lookup(targetPath) || "application/octet-stream",
          mediaCategoryId: categoryId,
          createdBy: req?.user?.id || null,
        };

        let media = await mediaModel.findOne({
          where: { path: mediaEntry.path },
          raw: true,
        });

        if (!media) {
          media = await mediaModel.create(mediaEntry);
          console.log(`Created media entry: ${mediaEntry.path}`);
        } else {
          console.log(`Media entry already exists: ${mediaEntry.path}`);
        }

        // Create product media entry
        const productMedia = await productMediaModel.findOne({
          where: { productId: product.id, imageUrl: dbPath },
          raw: true,
        });

        if (!productMedia) {
          await productMediaModel.create({
            productId: product.id,
            imageUrl: dbPath,
          });
          console.log(
            `Created product media entry for product: ${productName}`,
          );
        } else {
          console.log(
            `Product media entry already exists for product: ${productName}`,
          );
        }
      }

      console.log(
        `Folder-based seeding completed for category: ${categoryName}`,
      );
    }

    console.log("All folder-based media seeding completed");
  } catch (err) {
    console.error("Error in folder-based seeding:", err);
    throw err;
  }
};

router.get("/", async (req, res, next) => {
  //save data if they don't exist
  try {
    await internal.saveRTEMediaCategory(req, setupData.mediaCategory);
    await internal.seedFolderBasedMedia(req, setupData.categoryConfigs);
    await internal.saveRoles(req, setupData.roles);
    await internal.saveUsers(req, setupData.users);
    await internal.saveRoleMenu(req, setupData.roleMenus);
    await internal.saveSettings(setupData.setting);
    await internal.saveBanner(req, setupData.banner);
    res.send(`
            <h1>Setup completed</h1>
            <br/>
            <h2>Username: superadmin</h2>
            <h2>Password: admin123</h2>
        `);
  } catch (err) {
    res.status(400).send(`
            <h1>Setup Error</h1>
            <br/>
            <h2>Error</h2>
            <p>${err}</p>
        `);
  }
});

module.exports = router;
