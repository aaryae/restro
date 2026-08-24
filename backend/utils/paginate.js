const paginate = async (model, { limit, page, filters, include, order }) => {
  const pageNum = parseInt(page) || 1;
  const size = parseInt(limit) || 20;

  const query = {
    where: filters || {},
    order: order || [["createdAt", "DESC"]],
    limit: size,
    offset: (pageNum - 1) * size,
    include: include || [],
    distinct: true,
  };
  const { count, rows: data } = await model.findAndCountAll(query);

  return {
    data,
    total: count,
    limit: size,
    page: pageNum,
    totalPages: Math.ceil(count / size),
  };
};

module.exports = paginate;
