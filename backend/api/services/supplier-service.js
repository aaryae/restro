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
      filters.name = { [Op.like]: `%${name}%` };
    }
    if (slug) {
      filters.slug = { [Op.like]: `%${slug}%` };
    }

    if (address) {
      filters.address = { [Op.like]: `%${address}%` };
    }

    if (pan_vat_number) {
      filters.pan_vat_number = { [Op.like]: `%${pan_vat_number}%` };
    }

    if (contact_person) {
      filters.contact_person = { [Op.like]: `%${contact_person}%` };
    }

    if (contact_number) {
      filters.contact_number = { [Op.like]: `%${contact_number}%` };
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

const deleteById = async (id) => {
  try {
    // Prevent delete if supplier is referenced in purchases or expenses
    const [purchaseCount, expenseCount] = await Promise.all([
      purchaseModel.count({ where: { supplierId: id } }),
      expenseModel.count({ where: { supplierId: id } }),
    ]);

    if (purchaseCount > 0 || expenseCount > 0) {
      return {
        status: 406,
        success: false,
        message: "Supplier is used and cannot be deleted",
        data: null,
      };
    }

    const deleted = await supplierModel.destroy({ where: { id } });
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
