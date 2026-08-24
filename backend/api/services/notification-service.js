const { notificationModel, userModel } = require("../../models");
const { Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const list = async (req) => {
  try {
    let { limit, page, isRead } = req.query;
    const userId = req.user.id;
    const filters = {};
    const include = [
      {
        // model: userModel,
        // as: "user",
        // attributes: ["id", "username"],
        // include: [
        //   {
        //     model: userModel,
        //     as: "supervisor",
        //     attributes: ["id", "username"],
        //   },
        // ],

        model: userModel,
        as: "user",
        attributes: ["username"],
        include: [
          {
            model: userModel,
            as: "supervisor",
            attributes: ["id", "username"],
          },
          {
            model: userModel,
            as: "subordinates",
            attributes: ["id", "username"],
          },
        ],
      },
    ];
    if (isRead !== undefined) {
      isRead = isRead === "true";
      filters.isRead = { [Op.eq]: isRead };
    }
    if (userId) {
      filters.userId = userId;
    }
    const result = await paginate(notificationModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.NOTIFICATION.NOTIFICATION_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.NOTIFICATION.NOTIFICATION_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const notification = await notificationModel.findByPk(+req.params.id);
    if (!notification) {
      return {
        ...generalConstant.EN.NOTIFICATION.NOTIFICATION_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.NOTIFICATION.NOTIFICATION_FOUND,
      data: notification,
    };
  } catch (error) {
    throw new AppError(error.message);
  }
};

const updateReadStatus = async (req) => {
  try {
    const notification = await notificationModel.findByPk(+req.params.id);
    if (!notification) {
      return {
        ...generalConstant.EN.NOTIFICATION.NOTIFICATION_NOT_FOUND,
        data: null,
      };
    }
    if (notification.isRead) {
      return {
        ...generalConstant.EN.NOTIFICATION.NOTIFICATION_ALREADY_READ,
        data: null,
      };
    }
    const updated = await notification.update({ isRead: true });

    if (!updated) {
      return {
        ...generalConstant.EN.FAQ.UPDATE_FAQ_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.FAQ.UPDATE_FAQ_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

// const deleteById = async (req) => {
//   try {
//     const notification = await notificationModel.findByPk(+req.params.id);
//     if (!notification) {
//       return {
//         ...generalConstant.EN.NOTIFICATION.NOTIFICATION_NOT_FOUND,
//         data: null,
//       };
//     }

//     const deleted = await notification.destroy();
//     if (!deleted) {
//       return {
//         ...generalConstant.EN.NOTIFICATION.NOTIFICATION_DELETE_FAILURE,
//         data: null,
//       };
//     }
//     return {
//       ...generalConstant.EN.NOTIFICATION.NOTIFICATION_DELETE_SUCCESS,
//       data: null,
//     };
//   } catch (error) {
//     throw error;
//   }
// };

module.exports = {
  list,
  getById,
  updateReadStatus,
  // deleteById
};
