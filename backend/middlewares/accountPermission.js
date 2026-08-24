const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { accountPermissionModel } = require("../models");

/**
 * Middleware to check if user has required permissions for an account
 * @param {string} requiredPermission - Required permission ('view', 'edit', 'delete')
 * @returns {Function} Express middleware function
 */
const checkAccountPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { accountId } = req.params;
      const userId = req.user.id; // Assuming user ID is attached to request by auth middleware

      console.log("accountId", accountId);

      if (!accountId) {
        return responseHelper.sendResponse(
          res,
          400,
          false,
          null,
          null,
          "Account ID is required",
          null,
        );
      }

      // Super admin bypasses all permission checks
      if (req.user.roleType === "super_admin") {
        return next();
      }

      const accountPermission = await accountPermissionModel.findOne({
        where: {
          userId,
          accountId,
        },
      });

      if (!accountPermission) {
        return responseHelper.sendResponse(
          res,
          httpStatus.FORBIDDEN,
          false,
          null,
          null,
          "You don't have permission to access this account",
          null,
        );
      }

      // Check specific permission based on requiredPermission
      let hasPermission = false;
      switch (requiredPermission) {
        case "view":
          hasPermission = accountPermission.canView;
          break;
        case "edit":
          hasPermission = accountPermission.canEdit;
          break;
        case "delete":
          hasPermission = accountPermission.canDelete;
          break;
        default:
          return responseHelper.sendResponse(
            res,
            httpStatus.BAD_REQUEST,
            false,
            null,
            null,
            "Invalid permission type",
            null,
          );
      }

      if (!hasPermission) {
        return responseHelper.sendResponse(
          res,
          httpStatus.FORBIDDEN,
          false,
          null,
          null,
          `You don't have ${requiredPermission} permission for this account`,
          null,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkAccountPermission,
};
