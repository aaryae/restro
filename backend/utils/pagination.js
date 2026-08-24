const getTotalPages = (totalItems, limit) => {
  return Math.ceil(totalItems / limit);
};

const getPaginationData = (page, totalItems, limit, data) => {
  return {
    totalPages: getTotalPages(totalItems, limit),
    currentPage: page,
    totalItems: totalItems,
    itemsPerPage: limit,
    data: data,
  };
};

module.exports = { getPaginationData };
