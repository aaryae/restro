const generalConstant = require("../../constants/general-constant");
const {
  supplierModel,
  sequelize,
  purchaseModel,
  expenseModel,
} = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

// const create = async (req) => {
//   const transaction = await sequelize.transaction();
//   try {
//     req.body.slug = slugGenerator(req.body.name);
//     const Supplier = await supplierModel.create(req.body, {
//       transaction,
//     });
//     await transaction.commit();
//     return {
//       ...generalConstant.EN.SUPPLIER.CREATE_SUCCESS,
//       data: Supplier,
//     };
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// };

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    // Generate base slug from name
    const slugBase = slugGenerator(req.body.name);
    let slug = slugBase;
    let count = 1;

    // Check for existing slug and make it unique
    while (await supplierModel.findOne({ where: { slug } })) {
      slug = `${slugBase}-${count}`;
      count++;
    }

    req.body.slug = slug;

    const Supplier = await supplierModel.create(req.body, {
      transaction,
    });

    await transaction.commit();
    return {
      status: 200,
      ...generalConstant.EN.SUPPLIER.CREATE_SUCCESS,
      data: Supplier,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getList = async (req) => {
  try {
    let {
      limit,
      page,
      name,
      slug,
      address,
      pan_vat_number,
      contact_person,
      contact_number,
    } = req.query;
    const filters = {};
    const include = [];

    if (name) {
      filters.name = { [Op.iLike]: `%${name}%` };
    }
    if (slug) {
      filters.slug = { [Op.iLike]: `%${slug}%` };
    }

    if (address) {
      filters.address = { [Op.iLike]: `%${address}%` };
    }

    if (pan_vat_number) {
      filters.pan_vat_number = { [Op.iLike]: `%${pan_vat_number}%` };
    }

    if (contact_person) {
      filters.contact_person = { [Op.iLike]: `%${contact_person}%` };
    }

    if (contact_number) {
      filters.contact_number = { [Op.iLike]: `%${contact_number}%` };
    }

    const order = [["createdAt", "DESC"]];

    const result = await paginate(supplierModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    return {
      status: 200,
      ...generalConstant.EN.SUPPLIER.LIST_SUPPLIER_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const Supplier = await supplierModel.findByPk(+req.params.id);
    if (!Supplier) {
      return {
        ...generalConstant.EN.SUPPLIER.NOT_FOUND,
        data: null,
      };
    }
    return {
      status: 200,
      ...generalConstant.EN.SUPPLIER.GET_SUCCESS,
      data: Supplier,
    };
  } catch (error) {
    throw error;
  }
};

const update = async (id, data) => {
  if (!id) throw new Error("Supplier ID is required");
  const transaction = await sequelize.transaction();
  try {
    if (data.name) {
      data.slug = slugGenerator(data.name);
    }

    const [updated] = await supplierModel.update(data, {
      where: { id },
      transaction,
    });

    if (!updated) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.SUPPLIER.UPDATE_FAILURE,
        data: null,
      };
    }

    await transaction.commit();
    const supplier = await supplierModel.findByPk(id);
    return {
      status: 200,
      ...generalConstant.EN.SUPPLIER.UPDATE_SUCCESS,
      data: supplier,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteById = async (id, req) => {
  const supplierId = Number(id);

  try {
    // Prevent delete if supplier is referenced in purchases or expenses
    const [purchaseCount, expenseCount] = await Promise.all([
      purchaseModel.count({ where: { supplierId } }),
      expenseModel.count({ where: { supplierId } }),
    ]);

    if (purchaseCount > 0 || expenseCount > 0) {
      const linkedTo = [];
      if (purchaseCount > 0) {
        linkedTo.push(
          `${purchaseCount} purchase record${purchaseCount > 1 ? "s" : ""}`,
        );
      }
      if (expenseCount > 0) {
        linkedTo.push(
          `${expenseCount} expense record${expenseCount > 1 ? "s" : ""}`,
        );
      }

      return {
        status: 400,
        success: false,
        message: `This supplier cannot be deleted because it is linked to ${linkedTo.join(" and ")}.`,
        data: null,
      };
    }

    const supplier = await supplierModel.findByPk(supplierId);
    if (!supplier) {
      return {
        ...generalConstant.EN.SUPPLIER.DELETE_FAILURE,
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({ resourceType: "supplier", record: supplier, req });
    const deleted = await supplier.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.SUPPLIER.DELETE_FAILURE,
        data: null,
      };
    }

    return {
      status: 200,
      ...generalConstant.EN.SUPPLIER.DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    if (
      error?.name === "SequelizeForeignKeyConstraintError" ||
      error?.original?.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return {
        status: 400,
        success: false,
        message:
          "This supplier cannot be deleted because it is linked to purchases or expenses.",
        data: null,
      };
    }
    throw error;
  }
};

module.exports = {
  create,
  getList,
  getById,
  update,
  deleteById,
};
