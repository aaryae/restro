const router = require("express").Router();
const {
  userModel,
  roleModel,
  roleMenuModel,
  roleMenuActionModel,
  roleActionModel,
  settingModel,
  mediaCategoryModel,
  departmentModel,
  productModel,
  productMediaModel,
  productCategoryModel,
  mediaModel,
  floorModel,
  tableModel,
  accountModel,
  bankAccountModel,
  cashAccountModel,
  walletAccountModel,
} = require("../models/index");
const setupData = require("./setup.json");
const { getQueryResponse } = require("../helpers/response-helper");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");
const mime = require("mime-types");
const { Op } = require("sequelize");
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
    let finance = await roleModel.findOne({
      where: { title: "Finance" },
      raw: true,
    });
    let member = await roleModel.findOne({
      where: { title: "Member" },
      raw: true,
    });
    for (let user of usersArray) {
      if (user.username == "superadmin") {
        user.roleId = superAdmin.id;
      }
      if (user.username == "admin") {
        user.roleId = admin.id;
      }
      if (user.username == "finance") {
        user.roleId = finance.id;
      }
      if (user.username == "member") {
        user.roleId = member.id;
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
// save all access for admin
internal.saveRequiredAccessToUsers = async (req) => {
  try {
    let admin = await userModel.findOne({
      where: { username: "admin" },
      raw: true,
    });
    // here admin should have all access
    let allRoleMenuAction = await roleMenuActionModel.findAll({
      isDeleted: false,
    });
    let insertData = allRoleMenuAction.map((x) => ({
      roleId: admin.roleId,
      roleMenuActionId: x.id,
    }));
    await roleActionModel.destroy({ where: { roleId: admin.roleId } });
    await roleActionModel.bulkCreate(insertData);
  } catch (err) {
    throw err;
  }
};
// save access for finance only accounts, transfer and revenue
internal.saveFinanceAccess = async (req) => {
  try {
    let finance = await userModel.findOne({
      where: { username: "finance" },
      raw: true,
    });
    // here finance should have access for accounts, transfer and revenue
    let allRoleMenuAction = await roleMenuActionModel.findAll({
      isDeleted: false,
      // where list is Account, Transfer and Revenue
      where: {
        list: {
          [Op.in]: ["Account", "Transfer", "Revenue"],
        },
      },
    });
    let insertData = allRoleMenuAction.map((x) => ({
      roleId: finance.roleId,
      roleMenuActionId: x.id,
    }));
    await roleActionModel.destroy({ where: { roleId: finance.roleId } });
    await roleActionModel.bulkCreate(insertData);
  } catch (err) {
    throw err;
  }
};
// save access for member only orders
internal.saveMemberAccess = async (req) => {
  try {
    let member = await userModel.findOne({
      where: { username: "member" },
      raw: true,
    });
    // here member should have access for only orders
    let allRoleMenuAction = await roleMenuActionModel.findAll({
      isDeleted: false,
      // where list is Order
      where: {
        list: {
          [Op.in]: ["Order"],
        },
      },
    });
    let insertData = allRoleMenuAction.map((x) => ({
      roleId: member.roleId,
      roleMenuActionId: x.id,
    }));
    await roleActionModel.destroy({ where: { roleId: member.roleId } });
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
    await internal.saveRequiredAccessToUsers(req);
    await internal.saveFinanceAccess(req);
    await internal.saveMemberAccess(req);
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

internal.saveRTEMediaCategory = async (req, mediaCategory) => {

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
      // Start ordering from 1 for products created from this category folder
      let orderCounter = 1;
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

        const stats = await fs.stat(targetPath);
        const dbPath = `resources/${targetFileName}`; // e.g., resources/1747215288312-fmhnauq0-espresso.png

        // Create product using original file name
        const productName = path.parse(file).name;
        let product = await productModel.findOne({
          where: { slug: generateSlug(productName) },
          raw: true,
        });
        // CHANGED: NO PRODUCT CREATION
        // if (!product) {
        //   product = await productModel.create({
        //     productCategoryId: categoryId,
        //     departmentId: departmentId,
        //     name: productName,
        //     slug: generateSlug(productName),
        //     quantity: 10, // Default value
        //     order: orderCounter,
        //     price: 125.0, // Default value
        //     stockStatus: "in_stock",
        //     reservedQuantity: 0,
        //   });
        //   orderCounter += 1;
        //   console.log(`Created product: ${productName}`);
        // } else {
        //   console.log(`Product already exists: ${productName}`);
        // }

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

        // CHANGED: NO PRODUCT MEDIA CREATION
        // Create product media entry
        // const productMedia = await productMediaModel.findOne({
        //   where: { productId: product.id, imageUrl: dbPath },
        //   raw: true,
        // });

        // if (!productMedia) {
        //   await productMediaModel.create({
        //     productId: product.id,
        //     imageUrl: dbPath,
        //   });
        //   console.log(
        //     `Created product media entry for product: ${productName}`,
        //   );
        // } else {
        //   console.log(
        //     `Product media entry already exists for product: ${productName}`,
        //   );
        // }
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

internal.seedFloorsAndTables = async (req, floorConfigs) => {
  try {
    // Ensure floorConfigs is an array
    console.log(floorConfigs, typeof floorConfigs);
    if (!Array.isArray(floorConfigs)) {
      throw new Error("floorConfigs must be an array");
    }

    // Process each floor configuration
    for (const config of floorConfigs) {
      let {
        floorId,
        floorNo,
        floorName,
        tables, // Array of table configurations
      } = config;

      // Validate required floor fields
      if (
        !floorId ||
        !floorNo ||
        !floorName ||
        !tables ||
        !Array.isArray(tables)
      ) {
        console.warn(
          `Skipping invalid config: ${JSON.stringify(config)} - missing required fields or tables not an array`,
        );
        continue;
      }

      // Create or find floor
      let floor = await floorModel.findOne({
        where: { id: floorId },
        raw: true,
      });

      if (!floor) {
        floor = await floorModel.create({
          id: floorId,
          floorNo: floorNo,
          name: floorName,
          isActive: true, // Required field with default
        });
        console.log(`Created floor: ${floorName}`);
      } else {
        console.log(`Floor already exists: ${floorName}`);
      }

      // Seed tables for the floor
      for (const tableConfig of tables) {
        let { tableId, tableNo, type = "regular", capacity = 4 } = tableConfig;

        // Validate required table fields
        if (!tableId || !tableNo) {
          console.warn(
            `Skipping invalid table config: ${JSON.stringify(tableConfig)} - missing required fields`,
          );
          continue;
        }

        // Create or find table
        let table = await tableModel.findOne({
          where: { id: tableId, floorId: floorId },
          raw: true,
        });

        if (!table) {
          table = await tableModel.create({
            id: tableId,
            floorId: floorId,
            tableNo: tableNo,
            type: type,
            capacity: capacity,
            status: "available", // Required field with default
          });
          console.log(`Created table: ${tableNo} on floor: ${floorName}`);
        } else {
          console.log(
            `Table already exists: ${tableNo} on floor: ${floorName}`,
          );
        }
      }

      console.log(`Floor and table seeding completed for floor: ${floorName}`);
    }

    console.log("All floor and table seeding completed");
  } catch (err) {
    console.error("Error in floor and table seeding:", err);
    throw err;
  }
};

internal.seedAccounts = async (req, accountConfigs) => {
  try {
    // Ensure accountConfigs is an array
    console.log(accountConfigs, typeof accountConfigs);
    if (!Array.isArray(accountConfigs)) {
      throw new Error("accountConfigs must be an array");
    }

    // Process each account configuration
    for (const config of accountConfigs) {
      let {
        accountId,
        accountType,
        name,
        openingBalance = 0.0,
        isDefault = false,
        bankAccountNumber, // Required for bank accounts
        walletId, // Required for wallet accounts
      } = config;

      // Validate required account fields
      if (!accountId || !accountType || !name) {
        console.warn(
          `Skipping invalid account config: ${JSON.stringify(config)} - missing required fields`,
        );
        continue;
      }

      // Validate type-specific fields
      if (accountType === "bank" && !bankAccountNumber) {
        console.warn(
          `Skipping bank account config: ${JSON.stringify(config)} - missing bankAccountNumber`,
        );
        continue;
      }
      if (accountType === "wallet" && !walletId) {
        console.warn(
          `Skipping wallet account config: ${JSON.stringify(config)} - missing walletId`,
        );
        continue;
      }

      // Create or find account
      let account = await accountModel.findOne({
        where: { id: accountId },
        raw: true,
      });

      if (!account) {
        account = await accountModel.create({
          id: accountId,
          accountType: accountType,
          name: name,
          openingBalance: openingBalance,
          currentBalance: openingBalance, // Initialize currentBalance with openingBalance
          status: "active", // Required field with default
          isDefault: isDefault,
        });
      } else {
        console.log(`Account already exists: ${name} (${accountType})`);
      }

      // Create type-specific account details
      if (accountType === "bank") {
        let bankAccount = await bankAccountModel.findOne({
          where: { accountId: accountId },
          raw: true,
        });

        if (!bankAccount) {
          await bankAccountModel.create({
            accountId: accountId,
            bankAccountNumber: bankAccountNumber,
          });
          console.log(`Created bank account for: ${name}`);
        } else {
          console.log(`Bank account already exists for: ${name}`);
        }
      } else if (accountType === "cash") {
        let cashAccount = await cashAccountModel.findOne({
          where: { accountId: accountId },
          raw: true,
        });

        if (!cashAccount) {
          await cashAccountModel.create({
            accountId: accountId,
          });
          console.log(`Created cash account for: ${name}`);
        } else {
          console.log(`Cash account already exists for: ${name}`);
        }
      } else if (accountType === "wallet") {
        let walletAccount = await walletAccountModel.findOne({
          where: { accountId: accountId },
          raw: true,
        });

        if (!walletAccount) {
          await walletAccountModel.create({
            accountId: accountId,
            walletId: walletId,
          });
          console.log(`Created wallet account for: ${name}`);
        } else {
          console.log(`Wallet account already exists for: ${name}`);
        }
      }

      console.log(`Account seeding completed for: ${name}`);
    }

    console.log("All account seeding completed");
  } catch (err) {
    console.error("Error in account seeding:", err);
    throw err;
  }
};

router.get("/", async (req, res, next) => {
  //save data if they don't exist
  try {
    await internal.saveRTEMediaCategory(req, setupData.mediaCategory);
    await internal.seedFolderBasedMedia(req, setupData.categoryConfigs);
    await internal.seedFloorsAndTables(req, setupData.floorConfigs);
    await internal.seedAccounts(req, setupData.accountConfigs);
    await internal.saveRoles(req, setupData.roles);
    await internal.saveUsers(req, setupData.users);
    await internal.saveRoleMenu(req, setupData.roleMenus);
    await internal.saveSettings(setupData.setting);
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
