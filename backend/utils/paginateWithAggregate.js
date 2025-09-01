const { Sequelize, Op } = require("sequelize");

const paginateWithAggregate = async (
  model,
  {
    limit,
    page,
    filters,
    include,
    order,
    aggregates = [], // Array of { column, function, alias }
  },
) => {
  const pageNum = parseInt(page) || 1;
  const size = parseInt(limit) || 20;

  // Validate aggregate functions
  const validAggregateFunctions = ["SUM", "AVG", "MIN", "MAX", "COUNT"];
  for (const agg of aggregates) {
    if (!agg.column || !agg.function || !agg.alias) {
      throw new Error(
        "Each aggregate must have column, function, and alias properties.",
      );
    }
    if (!validAggregateFunctions.includes(agg.function.toUpperCase())) {
      throw new Error(
        `Invalid aggregate function: ${agg.function}. Must be one of ${validAggregateFunctions.join(", ")}.`,
      );
    }
  }

  // Prepare the query for pagination
  const query = {
    where: filters || {},
    order: order || [["createdAt", "DESC"]],
    limit: size,
    offset: (pageNum - 1) * size,
    include: include || [],
    distinct: true,
  };

  // Fetch paginated data and total count
  const { count, rows: data } = await model.findAndCountAll(query);

  // Calculate aggregate values if aggregates are provided
  const aggregateResults = {};
  if (aggregates.length > 0) {
    const attributes = aggregates.map((agg) => [
      Sequelize.fn(agg.function, Sequelize.col(agg.column)),
      agg.alias,
    ]);
    const result = await model.findOne({
      attributes,
      where: filters || {},
      raw: true,
    });

    // Process each aggregate result
    aggregates.forEach((agg) => {
      const value =
        result && result[agg.alias] !== null
          ? parseFloat(result[agg.alias]) // Use parseFloat for SUM, AVG, etc.
          : 0;
      aggregateResults[agg.alias] = value;
    });
  }

  // Build response
  const response = {
    data,
    total: count,
    limit: size,
    page: pageNum,
    totalPages: Math.ceil(count / size),
    ...aggregateResults, // Spread aggregate results into response
  };

  return response;
};

module.exports = paginateWithAggregate;
