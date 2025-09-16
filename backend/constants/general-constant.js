const httpStatus = require("http-status");
const { TIME } = require("sequelize");
const { UPDATE, DELETE } = require("sequelize/lib/query-types");

module.exports = {
  EN: {
    SERVER_ERROR: {
      status: httpStatus.SERVER_ERROR,
      success: false,
      message: "Something Went Wrong",
    },
    ROLES: {
      ROLES_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Roles not found",
      },
      ROLES_IS_IN_USE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Roles is used in other module",
      },
      SUPERADMIN_CANNOT_UPDATE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Super Admin Cannot be updated",
      },
      ROLES_SAVE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Roles Created Successfully",
      },
      ROLES_SAVE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Roles Create Failure",
      },
      ROLES_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Roles List Success",
      },
      ROLES_LIST_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Roles List Failure",
      },
      ROLES_VIEW_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Roles View Success",
      },
      ROLES_VIEW_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Roles View Failure",
      },
      ROLES_EDIT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Roles Edit Success",
      },
      ROLES_EDIT_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Roles Edit Failure",
      },
      ROLES_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Roles Delete Success",
      },
      ROLES_DELETE_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Roles Delete Failure",
      },
    },
    ROLE_MENU: {
      ROLE_MENU_SAVE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Role Menu Created Successfully",
      },
      ROLE_MENU_SAVE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Role Menu Create Failure",
      },
      ROLE_MENU_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: false,
        message: "Role Menu List Success",
      },
      ROLE_MENU_LIST_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Role Menu List Failure",
      },
      ROLE_MENU_VIEW_SUCCESS: {
        status: httpStatus.OK,
        success: false,
        message: "Role Menu View Success",
      },
      ROLE_MENU_VIEW_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Role Menu View Failure",
      },
      ROLE_MENU_EDIT_SUCCESS: {
        status: httpStatus.OK,
        success: false,
        message: "Role Menu Edit Success",
      },
      ROLE_MENU_EDIT_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Role Menu Edit Failure",
      },
      ROLE_MENU_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: false,
        message: "Role Menu Delete Success",
      },
      ROLE_MENU_DELETE_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Role Menu Delete Failure",
      },
    },
    ACCESS_MODULE: {
      ACCESS_MODULE_LIST_SUCCESS: {
        message: "Access Module List Success",
        status: httpStatus.OK,
        success: true,
      },
      ROLE_MENU_ACTION_VIEW_SUCCESS: {
        message: "Role Menu Action View Success",
        success: true,
        status: httpStatus.OK,
      },
      ROLE_MENU_NOT_FOUND: {
        message: "Role Menu Not Found",
        success: false,
        status: httpStatus.NOT_FOUND,
      },
      ACCESS_MODULE_LIST_FAILURE: {
        message: "Access Module List Failure",
        success: false,
        status: httpStatus.NOT_FOUND,
      },
      ACCESS_MODULE_VIEW_SUCCESS: {
        message: "Access Module View Success",
        success: true,
        status: httpStatus.OK,
      },
      ACCESS_MODULE_VIEW_FAILURE: {
        message: "Access Module View Failure",
        success: false,
        status: httpStatus.NOT_FOUND,
      },
      ACCESS_MODULE_NOT_FOUND: {
        message: "Access Module Not Found",
        success: false,
        status: httpStatus.NOT_FOUND,
      },
    },
    USERS: {
      MODEL_COUNT_SUCCESS: {
        message: "Model Count Success",
        success: true,
        status: httpStatus.OK,
      },
      MODEL_COUNT_FAILURE: {
        message: "Model Count Failure",
        success: false,
        status: httpStatus.NOT_ACCEPTABLE,
      },
      CREATE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Created Successfully",
      },
      UPDATE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Updated Successfully",
      },
      USER_IS_DELETED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User is deleted",
      },
      OLD_PASSWORD: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "This is an old password ! Please enter new password",
      },
      USER_NOT_ACTIVE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User is not active",
      },
      UPDATE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Update Failure",
      },
      CREATE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Create Failure",
      },
      USER_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User List Success",
      },
      USER_LIST_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "User List Failure",
      },
      PASSWORD_CHANGE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Password Changed Successfully",
      },
      PASSWORD_CHANGE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Password Change Failure",
      },
      PASSWORD_RESET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Password Reset Successfully",
      },
      PASSWORD_RESET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Password Reset Failure",
      },
      User_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "User not found",
      },
      USER_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "User Found",
      },
      LOGIN_FAILURE: {
        message: "User Login Failure",
        status: httpStatus.BAD_REQUEST,
        success: false,
      },
      LOGIN_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Login Successfully",
      },
      LOGOUT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Logout Successfully",
      },
      LOGOUT_FAILURE: {
        message: "User Logout Failure",
        status: httpStatus.BAD_REQUEST,
        success: false,
      },
      DELETE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Deleted Successfully",
      },
      ACTIVE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active User Successfully",
      },
      UN_ACTIVE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "InActive User Successfully",
      },
      UN_DELETE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User unDeleted Successfully",
      },
      DELETE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Delete Failure",
      },
      ACTIVE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Active Toggle Failure",
      },
      USER_NAME_EXISTS: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Name Already Exists",
      },
    },
    ACTION_REQUEST: {
      APPROVE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Action Request Approved Successfully",
      },
      APPROVE_REJECTED: {
        status: httpStatus.OK,
        success: true,
        message: "Action Request Rejected Successfully",
      },
      ACTION_FAILURE: {
        status: httpStatus.BAD_REQUEST,
        success: false,
        message: "Action Request Failed",
      },
      ACTION_ALREADY_PROCESSED: {
        status: httpStatus.BAD_REQUEST,
        success: false,
        message: "Action request has already been processed",
      },
      NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Action Request Not Found",
      },
    },
    MEDIA_CATEGORY: {
      CREATE_MEDIA_CATEGORY_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Category Created Successfully",
      },
      MEDIA_CATEGORY_CANNOT_BE_DELETED: {
        status: httpStatus.OK,
        success: true,
        message: "This Media Category Cannot Be Deleted",
      },
      CREATE_MEDIA_CATEGORY_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Category Not Created",
      },
      UPDATE_MEDIA_CATEGORY_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Category Updated Successfully",
      },
      UPDATE_MEDIA_CATEGORY_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Category Not Updated",
      },
      MEDIA_CATEGORY_IN_USED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Category is used in media",
      },
      MEDIA_CATEGORY_NAME_ALREADY_USED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Category Name Already Used",
      },
      MEDIA_CATEGORY_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Media Category Not Found",
      },
      MEDIA_CATEGORY_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Media Category Found",
      },
      MEDIA_CATEGORY_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Category List ",
      },
      MEDIA_CATEGORY_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Media Category List Failure ",
      },
      MEDIA_CATEGORY_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Category Deleted Successfully",
      },
      MEDIA_CATEGORY_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Category Delete Failure",
      },
      MEDIA_CATEGORY_CONTAINS_MEDIA: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Category Contains Media",
      },
    },
    MEDIA: {
      CREATE_MEDIA_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Created Successfully",
      },
      CREATE_MEDIA_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Not Created",
      },
      UPDATE_MEDIA_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Updated Successfully",
      },
      UPDATE_MEDIA_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Not Updated",
      },
      MEDIA_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Media Not Found",
      },
      MEDIA_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Media Found",
      },
      MEDIA_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media List ",
      },
      MEDIA_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Media List Failure ",
      },
      MEDIA_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Media Deleted Successfully",
      },
      MEDIA_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media Delete Failure",
      },
      MEDIA_IN_USED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Media is used in other module",
      },
      NO_FILE_UPLOADED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "No file uploaded",
      },
    },

    SEO: {
      CREATE_SEO_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SEO Created Successfully",
      },
      CREATE_SEO_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SEO Not Created",
      },
      UPDATE_SEO_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SEO Updated Successfully",
      },
      UPDATE_SEO_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SEO Not Updated",
      },
      SEO_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "SEO Not Found",
      },
      SEO_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "SEO Found",
      },
      SEO_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SEO List ",
      },
      SEO_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "SEO List Failure ",
      },
      SEO_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SEO Get Successfully",
      },
      SEO_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SEO Get Failure",
      },
      SEO_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SEO Deleted Successfully",
      },
      SEO_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SEO Delete Failure",
      },
    },
    SETTING: {
      SETTING_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Setting not found",
      },
      SETTING_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Setting Found",
      },
      SETTING_UPDATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Setting Updated Successfully",
      },
      SETTING_UPDATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Setting Update Failure",
      },
    },
    SOCIAL: {
      SOCIAL_CREATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Social Created Successfully",
      },
      SOCIAL_CREATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Social Not Created",
      },
      SOCIAL_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Social List Success",
      },
      SOCIAL_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Social List Failure",
      },
      SOCIAL_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Social not found",
      },
      SOCIAL_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Social Found",
      },
      SOCIAL_UPDATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Social Updated Successfully",
      },
      SOCIAL_UPDATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Social Update Failure",
      },
      SOCIAL_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Social Deleted Successfully",
      },
      SOCIAL_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Social Delete Failure",
      },
    },
    NOTIFICATION: {
      CREATE_NOTIFICATION_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Notification Created Successfully",
      },
      CREATE_NOTIFICATION_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Notification Not Created",
      },
      NOTIFICATION_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Notification not found",
      },
      NOTIFICATION_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Notification Found",
      },
      NOTIFICATION_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Notification List ",
      },
      NOTIFICATION_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Notification List Failure ",
      },
      NOTIFICATION_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Notification Deleted Successfully",
      },
      NOTIFICATION_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Notification Delete Failure",
      },
      NOTIFICATION_ALREADY_READ: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Notification Already Read",
      },
    },
    EMAIL_TEMPLATE: {
      CREATE_EMAIL_TEMPLATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template Created Successfully",
      },
      EMAIL_TEMPLATE_USED_IN: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Email Template Already Used In Active Template",
      },
      CREATE_EMAIL_TEMPLATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Email Template Not Created",
      },
      UPDATE_EMAIL_TEMPLATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template Updated Successfully",
      },
      UPDATE_EMAIL_TEMPLATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Email Template Not Updated",
      },
      EMAIL_TEMPLATE_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Email Template Not Found",
      },
      EMAIL_TEMPLATE_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template Found",
      },
      EMAIL_TEMPLATE_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template List Success",
      },
      EMAIL_TEMPLATE_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Email Template List Failure ",
      },
      EMAIL_TEMPLATE_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template Get Successfully",
      },
      EMAIL_TEMPLATE_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Email Template Get Failure",
      },
      EMAIL_TEMPLATE_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template Deleted Successfully",
      },
      EMAIL_TEMPLATE_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Email Template Delete Failure",
      },
    },
    ACTIVE_EMAIL_TEMPLATE: {
      REQUIRED_AT_LEAST_ONE_ACTIVE_TEMPLATE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Activate Another Email Template Before Undoing This",
      },
      CREATE_ACTIVE_EMAIL_TEMPLATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Email Template Assigned Successfully",
      },
      CREATE_ACTIVE_EMAIL_TEMPLATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Active Email Template Not Created",
      },
      UPDATE_ACTIVE_EMAIL_TEMPLATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active Email Template Updated Successfully",
      },
      UPDATE_ACTIVE_EMAIL_TEMPLATE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Active Email Template Not Updated",
      },
      ACTIVE_EMAIL_TEMPLATE_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Active Email Template Not Found",
      },
      ACTIVE_EMAIL_TEMPLATE_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Active Email Template Found",
      },
      ACTIVE_EMAIL_TEMPLATE_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active Email Template List ",
      },
      ACTIVE_EMAIL_TEMPLATE_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Active Email Template List Failure ",
      },
      ACTIVE_EMAIL_TEMPLATE_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active Email Template Get Successfully",
      },
      ACTIVE_EMAIL_TEMPLATE_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Active Email Template Get Failure",
      },
      ACTIVE_EMAIL_TEMPLATE_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active Email Template Deleted Successfully",
      },
      ACTIVE_EMAIL_TEMPLATE_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Active Email Template Delete Failure",
      },
    },
    SMTP: {
      CREATE_SMTP_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active Email Template Created Successfully",
      },
      ALREADY_HAS_ONE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SMTP data already exists.",
      },
      CREATE_SMTP_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SMTP Not Created",
      },
      UPDATE_SMTP_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SMTP Updated Successfully",
      },
      UPDATE_SMTP_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SMTP Not Updated",
      },
      SMTP_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "SMTP Not Found",
      },
      SMTP_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "SMTP Found",
      },
      SMTP_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "SMTP Get Successfully",
      },
      SMTP_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "SMTP Get Failure",
      },
    },
    PRODUCT_CATEGORY: {
      CREATE_PRODUCT_CATEGORY_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Category Created Successfully",
      },
      PRODUCT_CATEGORY_USED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Category Is Used In Products",
      },
      CREATE_PRODUCT_CATEGORY_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Category Not Created",
      },
      UPDATE_PRODUCT_CATEGORY_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Category Updated Successfully",
      },
      UPDATE_PRODUCT_CATEGORY_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Category Not Updated",
      },
      PRODUCT_CATEGORY_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Product Category Not Found",
      },
      PRODUCT_CATEGORY_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Product Category Found",
      },
      PRODUCT_CATEGORY_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Category List ",
      },
      PRODUCT_CATEGORY_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Product Category List Failure ",
      },
      PRODUCT_CATEGORY_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Category Get Successfully",
      },
      PRODUCT_CATEGORY_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Category Get Failure",
      },
      PRODUCT_CATEGORY_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Category Deleted Successfully",
      },
      PRODUCT_CATEGORY_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Category Delete Failure",
      },
    },
    ORDER: {
      CREATE_ORDER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Order Created Successfully",
      },
    },

    SUPPLIER: {
      CREATE_SUPPLIER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Supplier Created Successfully",
      },
    },

    PRODUCT: {
      CREATE_PRODUCT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Created Successfully",
      },
      PRODUCT_QUANTITY_NOT_AVAILABLE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Quantity Not Available",
      },
      CREATE_PRODUCT_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Not Created",
      },
      UPDATE_PRODUCT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Updated Successfully",
      },
      UPDATE_PRODUCT_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Not Updated",
      },
      UPDATE_PRODUCT_QUANTITY_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Sorry this quantity is lock for now!",
      },
      PRODUCT_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Product Not Found",
      },
      PRODUCT_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Product Found",
      },
      PRODUCT_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product List ",
      },
      PRODUCT_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Product List Failure ",
      },
      PRODUCT_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Get Successfully",
      },
      PRODUCT_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Get Failure",
      },
      PRODUCT_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Deleted Successfully",
      },
      PRODUCT_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Delete Failure",
      },
    },
    PRODUCT_VARIANT: {
      CREATE_PRODUCT_VARIANT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Variant Created Successfully",
      },
      CREATE_PRODUCT_VARIANT_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Variant Not Created",
      },
      UPDATE_PRODUCT_VARIANT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Variant Updated Successfully",
      },
      UPDATE_PRODUCT_VARIANT_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Variant Not Updated",
      },
      PRODUCT_VARIANT_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Product Variant Not Found",
      },
      PRODUCT_VARIANT_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Product Variant Found",
      },
      PRODUCT_VARIANT_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Variant List ",
      },
      PRODUCT_VARIANT_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Product Variant List Failure ",
      },
      PRODUCT_VARIANT_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Variant Get Successfully",
      },
      PRODUCT_VARIANT_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Variant Get Failure",
      },
      PRODUCT_VARIANT_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Product Variant Deleted Successfully",
      },
      PRODUCT_VARIANT_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Product Variant Delete Failure",
      },
    },
    PAGE: {
      SLUG_ALREADY_USED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Page Name Already Used",
      },
      CREATE_PAGE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Page Created Successfully",
      },
      CREATE_PAGE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Page Not Created",
      },
      UPDATE_PAGE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Page Updated Successfully",
      },
      UPDATE_PAGE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Page Not Updated",
      },
      PAGE_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Page Not Found",
      },
      PAGE_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Page Found",
      },
      PAGE_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Page List ",
      },
      PAGE_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: true,
        message: "Page List Failure ",
      },
      PAGE_GET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Page Get Successfully",
      },
      PAGE_GET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Page Get Failure",
      },
      PAGE_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Page Deleted Successfully",
      },
      PAGE_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Page Delete Failure",
      },
    },
    CUSTOMER: {
      CREATE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Customer Created Successfully",
      },
      GUEST_ACC_NOT_CREATED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Guest Account Creation Failure",
      },
      CREATE_GUEST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Guest Created Successfully",
      },
      GUEST_ACCOUNT_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Guest Account Not Found.",
      },
      REGISTER_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Customer Register Successfully",
      },
      REGISTER_USER_FAILED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Customer Register Failed",
      },
      USER_VERIFY_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Verified and Login Successfully",
      },
      OTP_EXPIRE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "OTP MisMatch Or Expired",
      },
      OTP_MISMATCHED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "OTP Mismatched",
      },
      TOKEN_MISMATCHED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Token Mismatched",
      },
      TOKEN_EXPIRED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Time limit has passed. Please try again from start",
      },
      OTP_REGENERATE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "OTP regenerate successfully",
      },
      CANNOT_CHANGE_PASSWORD: {
        status: httpStatus.UNAUTHORIZED,
        success: false,
        message: "This account is made through socials. Cannot change password",
      },
      VERIFY_TOKEN_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Verify token successfully",
      },
      PASSWORD_RESET_TOKEN_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Password reset token generated successfully",
      },
      UNAUTHORIZED_USER: {
        status: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authorized",
      },
      UPDATE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Customer Updated Successfully",
      },
      CLEAR_REDIS_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Unable to clear redis",
      },
      INCORRECT_PASSWORD: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Incorrect Old Password",
      },
      USER_IS_DELETED: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User is deleted",
      },
      USER_NOT_ACTIVE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User is not active",
      },
      UPDATE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Update Failure",
      },
      CREATE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Create Failure",
      },
      USER_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User List Success",
      },
      USER_LIST_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "User List Failure",
      },
      USER_BLOCK_SUCCESS: {
        status: httpStatus.OK,
        success: true,
      },
      USER_ARCHIVE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
      },
      PASSWORD_CHANGE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Password Changed Successfully",
      },
      PASSWORD_CHANGE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Password Change Failure",
      },
      PASSWORD_RESET_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Password Reset Successfully",
      },
      PASSWORD_RESET_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Password Reset Failure",
      },
      USER_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "User not found",
      },
      OTP_SECRET_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "OTP Secret Not Found",
      },
      USER_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "User Profile Fetch Success",
      },
      USER_FETCH_FAILURE: {
        status: httpStatus.OK,
        success: true,
        message: "User Profile Fetch Failure",
      },
      LOGIN_FAILURE: {
        message: "User Login Failure",
        status: httpStatus.BAD_REQUEST,
        success: false,
      },
      LOGIN_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Login Successfully",
      },
      LOGOUT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Logout Successfully",
      },
      LOGOUT_FAILURE: {
        message: "User Logout Failure",
        status: httpStatus.BAD_REQUEST,
        success: false,
      },
      DELETE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User Deleted Successfully",
      },
      ACTIVE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Active User Successfully",
      },
      UN_ACTIVE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "InActive User Successfully",
      },
      UN_DELETE_USER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "User unDeleted Successfully",
      },
      DELETE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Delete Failure",
      },
      ACTIVE_USER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "User Active Toggle Failure",
      },
      USER_ALREADY_EXISTS: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Emailed Already In Used",
      },
      ORDER_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Order List Success",
      },
      ORDER_LIST_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Order List Failure",
      },
    },
    CONTACT: {
      CREATE_CONTACT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Contact created successfully",
      },
      CREATE_CONTACT_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Contact creation failure",
      },
      CONTACT_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Contact listed Successfully",
      },

      CONTACT_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Contact list Failure",
      },
      CONTACT_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Contact Not Found",
      },
      CONTACT_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Contact Found",
      },
      UPDATE_CONTACT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Contact Updated Successfully",
      },
      UPDATE_CONTACT_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Contact Update Failure",
      },
      DELETE_CONTACT_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Contact Deleted Successfully",
      },
      DELETE_CONTACT_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Contact Delete Failure",
      },
    },
    ANALYTICS: {
      WEEKLY_ANALYTICS_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Analytics Generated Successfully",
      },
      WEEKLY_ANALYTICS_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Analytics Generation Failure",
      },
      WEEKLY_ANALYTICS_FORMAT_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Analytics require  include",
      },
      FUTURE_DATE_FAILURE: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Future date is not allowed",
      },
    },
    BANNER: {
      CREATE_BANNER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Package BANNER Created Successfully",
      },
      CREATE_BANNER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Package BANNER Not Created",
      },
      UPDATE_BANNER_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Package BANNER Updated Successfully",
      },
      UPDATE_BANNER_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Package BANNER Not Updated",
      },
      BANNER_NOT_FOUND: {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: "Package BANNER Not Found",
      },
      BANNER_FOUND: {
        status: httpStatus.OK,
        success: true,
        message: "Package BANNER Found",
      },
      BANNER_LIST_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Package BANNER List Success",
      },
      BANNER_LIST_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Package BANNER List Failure",
      },
      BANNER_DELETE_SUCCESS: {
        status: httpStatus.OK,
        success: true,
        message: "Package BANNER Deleted Successfully",
      },
      BANNER_DELETE_FAILURE: {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Package BANNERS Delete Failure",
      },
    },
    PURCHASE: {
      CREATE_PURCHASE_SUCCESS: {
        status: 201,
        success: true,
        message: "Purchase created successfully",
      },
      CREATE_PURCHASE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to create purchase",
      },
      PURCHASE_LIST_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchases retrieved successfully",
      },
      PURCHASE_LIST_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to retrieve purchases",
      },
      PURCHASE_NOT_FOUND: {
        status: 404,
        success: false,
        message: "Purchase not found",
      },
      PURCHASE_GET_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase retrieved successfully",
      },
      UPDATE_PURCHASE_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase updated successfully",
      },
      UPDATE_PURCHASE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to update purchase",
      },
      COMPLETE_PURCHASE_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase completed successfully",
      },
      COMPLETE_PURCHASE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to complete purchase",
      },
      PAY_PURCHASE_SUCCESS: {
        status: 200,
        success: true,
        message: "Credit payment recorded successfully",
      },
      PAY_PURCHASE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to record credit payment",
      },
      CANCEL_PURCHASE_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase cancelled successfully",
      },
      CANCEL_PURCHASE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to cancel purchase",
      },
      UNPAID_CREDITS_SUCCESS: {
        status: 200,
        success: true,
        message: "Unpaid credit purchases retrieved successfully",
      },
      UNPAID_CREDITS_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to retrieve unpaid credit purchases",
      },
    },
    PURCHASE_CATEGORY: {
      CREATE_CATEGORY_SUCCESS: {
        status: 201,
        success: true,
        message: "Purchase category created successfully",
      },
      CREATE_CATEGORY_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to create purchase category",
      },
      CATEGORY_LIST_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase categories retrieved successfully",
      },
      CATEGORY_LIST_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to retrieve purchase categories",
      },
      CATEGORY_NOT_FOUND: {
        status: 404,
        success: false,
        message: "Purchase category not found",
      },
      CATEGORY_GET_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase category retrieved successfully",
      },
      UPDATE_CATEGORY_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase category updated successfully",
      },
      UPDATE_CATEGORY_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to update purchase category",
      },
      DELETE_CATEGORY_SUCCESS: {
        status: 200,
        success: true,
        message: "Purchase category deleted successfully",
      },
      DELETE_CATEGORY_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to delete purchase category",
      },
    },
    EXPENSE: {
      CREATE_EXPENSE_SUCCESS: {
        status: 201,
        success: true,
        message: "Expense created successfully",
      },
      CREATE_EXPENSE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to create expense",
      },
      EXPENSE_LIST_SUCCESS: {
        status: 200,
        success: true,
        message: "Expenses retrieved successfully",
      },
      EXPENSE_LIST_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to retrieve expenses",
      },
      EXPENSE_NOT_FOUND: {
        status: 404,
        success: false,
        message: "Expense not found",
      },
      EXPENSE_GET_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense retrieved successfully",
      },
      UPDATE_EXPENSE_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense updated successfully",
      },
      UPDATE_EXPENSE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to update expense",
      },
      PAY_EXPENSE_SUCCESS: {
        status: 200,
        success: true,
        message: "Credit payment recorded successfully",
      },
      PAY_EXPENSE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to record credit payment",
      },
      CANCEL_EXPENSE_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense cancelled successfully",
      },
      CANCEL_EXPENSE_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to cancel expense",
      },
      UNPAID_CREDITS_SUCCESS: {
        status: 200,
        success: true,
        message: "Unpaid credit expenses retrieved successfully",
      },
      UNPAID_CREDITS_FAILURE: {
        status: 400,
        success: false,
        message: "Failed to retrieve unpaid credit expenses",
      },
    },
    EXPENSE_CATEGORY: {
      CREATE_EXPENSE_CATEGORY_SUCCESS: {
        status: 201,
        success: true,
        message: "Expense category created successfully",
      },
      EXPENSE_CATEGORY_LIST_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense categories retrieved successfully",
      },
      EXPENSE_CATEGORY_NOT_FOUND: {
        status: 404,
        success: false,
        message: "Expense category not found",
      },
      UPDATE_EXPENSE_CATEGORY_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense category updated successfully",
      },
      DELETE_EXPENSE_CATEGORY_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense category deleted successfully",
      },
      EXPENSE_CATEGORY_GET_SUCCESS: {
        status: 200,
        success: true,
        message: "Expense category retrieved successfully",
      },
    },
  },
};
