const httpStatus = require("http-status");
const messageConstant = require("../constants/message-constant");
const responseHelper = {};

responseHelper.parseFilters = (
  req,
  defaultSorting,
  isDeleted,
  default_sort,
) => {
  const size_default = defaultSorting ? defaultSorting : 10;
  let page;
  let size;
  let sortQuery = [["id", "DESC"]];
  let sort_key;
  let searchQuery = {};
  let includeModels = [];
  let selectQuery = { __v: 0 };
  if (default_sort) {
    sortQuery = default_sort;
  }
  if (isDeleted === undefined) {
  } else if (isDeleted === null) {
  } else {
    if (!isNaN(isDeleted)) {
      searchQuery = { ...searchQuery, isDeleted: isDeleted };
      selectQuery = {
        ...selectQuery,
        isDeleted: 0,
        deleted_at: 0,
        deleted_by: 0,
      };
    }
  }
  if (req.query.find_is_active && req.query.find_is_active.length >= 3) {
    let is_active = req.query.find_is_active == "true" ? true : false;
    searchQuery = { ...searchQuery, is_active: is_active };
  }
  if (req.query.page && !isNaN(req.query.page) && req.query.page != 0) {
    page = Math.abs(req.query.page);
  } else {
    page = 1;
  }
  if (req.query.size == "") {
    size = size_default;
  } else if (
    (req.query.size && !isNaN(req.query.size)) ||
    req.query.size >= 0
  ) {
    size = Math.abs(req.query.size);
  } else {
    size = size_default;
  }
  if (req.query.sort) {
    let sort = req.query.sort.split(":");
    sort_key = sort[0];
    let sort_order = sort[1] === "DESC" ? "DESC" : "ASC";
    sortQuery = [[sort_key, sort_order]];
  }
  return { page, size, sortQuery, searchQuery, selectQuery, includeModels };
};

responseHelper.sendResponse = (
  res,
  status,
  success,
  data,
  errors,
  msg,
  token,
) => {
  let response = {};
  if (success !== null) response.success = success;
  if (data !== null) response.data = data;
  if (errors !== null) response.errors = errors;
  if (msg !== null) response.msg = msg;
  if (token !== null) response.token = token;
  if (status) response.status = status;
  res.status(status).json(response);
};

responseHelper.paginationSendResponse = (
  res,
  status,
  success,
  data,
  msg,
  pageNo,
  pagesize,
  totalData,
  sort,
) => {
  if (status) {
    const response = {};
    if (data) response.data = data;
    if (success !== null) response.success = success;
    if (msg) response.msg = msg;
    if (pageNo) response.page = pageNo;
    if (pagesize) response.size = pagesize;
    if (sort) response.sort = sort;
    if (typeof totalData === "number")
      response.totalData = totalData ? totalData : 0;
    return res.status(status).json(response);
  } else {
    let response = {
      success: false,
      data: null,
      errors: null,
      pagesize: pagesize ? pagesize : 0,
      pageNo: pageNo ? pageNo : 0,
      totalData: totalData ? totalData : 0,
      msg: messageConstant.EN.INTERNAL_SERVER_ERROR,
      token: null,
    };
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
  }
};

responseHelper.getQueryResponse = async (
  model,
  page,
  size,
  sortQuery,
  searchQuery,
  selectQuery,
  includeModels,
) => {
  try {
    const offset = (page - 1) * size;
    const limit = size;
    const { rows, count } = await model.findAndCountAll({
      where: searchQuery,
      attributes: selectQuery,
      order: sortQuery,
      offset: offset,
      limit: limit,
      include: includeModels,
      raw: true,
    });

    return { data: rows, totalData: count, page, size, sortQuery };
  } catch (err) {
    throw err;
  }
};

module.exports = responseHelper;
