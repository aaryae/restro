const {
  parse,
  isValid,
  format,
  subDays,
  startOfDay,
  endOfDay,
  getHours,
} = require("date-fns");
const { toZonedTime, fromZonedTime } = require("date-fns-tz");
const generalConstant = require("../../constants/general-constant");
const { Op } = require("sequelize");
const { orderModel, sequelize, Sequelize } = require("../../models");

const viewWeeklyAnalytics = async (req) => {
  const { include } = req.query;

  if (!include) {
    return {
      ...generalConstant.EN.ANALYTICS.WEEKLY_ANALYTICS_FORMAT_FAILURE,
      data: null,
    };
  }

  const formattedInclude = include.split(",").map((item) => item.trim());
  if (!formattedInclude || formattedInclude.length === 0) {
    return {
      ...generalConstant.EN.ANALYTICS.WEEKLY_ANALYTICS_FORMAT_FAILURE,
      data: null,
    };
  }

  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = toZonedTime(new Date(), serverTimezone);
  const currentHour = getHours(now);
  const currentDateStr = format(now, "yyyy-MM-dd");

  const response = {};

  if (formattedInclude.includes("summary")) {
    const currentDate = startOfDay(now);
    const lastWeekDate = subDays(currentDate, 7);
    const lastWeekDateStr = format(lastWeekDate, "yyyy-MM-dd");

    const currentStart = startOfDay(currentDate);
    const currentEnd = new Date(currentDate);
    currentEnd.setHours(currentHour, 59, 59, 999);

    const lastWeekStart = startOfDay(lastWeekDate);
    const lastWeekEnd = endOfDay(lastWeekDate);

    const currentRevenueResult = await orderModel.findAll({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("totalAmount")), "total_revenue"],
      ],
      where: {
        orderDate: {
          [Op.between]: [
            fromZonedTime(currentStart, serverTimezone),
            fromZonedTime(currentEnd, serverTimezone),
          ],
        },
      },
      raw: true,
    });
    const currentRevenue = Number(currentRevenueResult[0].total_revenue) || 0;

    const lastWeekRevenueResult = await orderModel.findAll({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("totalAmount")), "total_revenue"],
      ],
      where: {
        orderDate: {
          [Op.between]: [
            fromZonedTime(lastWeekStart, serverTimezone),
            fromZonedTime(lastWeekEnd, serverTimezone),
          ],
        },
      },
      raw: true,
    });
    const lastWeekRevenue = Number(lastWeekRevenueResult[0].total_revenue) || 0;

    const currentOrderCount = await orderModel.count({
      where: {
        orderDate: {
          [Op.between]: [
            fromZonedTime(currentStart, serverTimezone),
            fromZonedTime(currentEnd, serverTimezone),
          ],
        },
      },
    });

    const lastWeekOrderCount = await orderModel.count({
      where: {
        orderDate: {
          [Op.between]: [
            fromZonedTime(lastWeekStart, serverTimezone),
            fromZonedTime(lastWeekEnd, serverTimezone),
          ],
        },
      },
    });

    const revenuePercentChange =
      lastWeekRevenue !== 0
        ? Number(
            (
              ((currentRevenue - lastWeekRevenue) / lastWeekRevenue) *
              100
            ).toFixed(2),
          )
        : 0;
    const orderCountPercentChange =
      lastWeekOrderCount !== 0
        ? Number(
            (
              ((currentOrderCount - lastWeekOrderCount) / lastWeekOrderCount) *
              100
            ).toFixed(2),
          )
        : 0;
    const currentAOV =
      currentOrderCount !== 0 ? currentRevenue / currentOrderCount : 0;
    const lastWeekAOV =
      lastWeekOrderCount !== 0 ? lastWeekRevenue / lastWeekOrderCount : 0;
    const aovPercentChange =
      lastWeekAOV !== 0
        ? Number((((currentAOV - lastWeekAOV) / lastWeekAOV) * 100).toFixed(2))
        : 0;

    response.summary = {
      metadata: {
        current_date: currentDateStr,
        previous_date: lastWeekDateStr,
        timezone: serverTimezone,
        currency: "EUR",
      },
      revenue: {
        today_revenue: Number(currentRevenue.toFixed(2)),
        percent_change: revenuePercentChange,
      },
      order_count: {
        today_order_count: currentOrderCount,
        percent_change: orderCountPercentChange,
      },
      average_order_value: {
        today_average_order_value: Number(currentAOV.toFixed(2)),
        percent_change: aovPercentChange,
      },
    };
  }

  if (formattedInclude.includes("hourly_orders")) {
    const currentDate = startOfDay(now);
    const lastWeekDate = subDays(currentDate, 7);
    const previousDateStr = format(lastWeekDate, "yyyy-MM-dd");

    const currentStart = startOfDay(currentDate);
    const currentEnd = new Date(currentDate);
    currentEnd.setHours(currentHour, 59, 59, 999);

    const lastWeekStart = startOfDay(lastWeekDate);
    const lastWeekEnd = endOfDay(lastWeekDate);

    const currentOrders = await orderModel.findAll({
      where: {
        orderDate: {
          [Op.between]: [
            fromZonedTime(currentStart, serverTimezone),
            fromZonedTime(currentEnd, serverTimezone),
          ],
        },
      },
      raw: true,
    });

    const previousOrders = await orderModel.findAll({
      where: {
        orderDate: {
          [Op.between]: [
            fromZonedTime(lastWeekStart, serverTimezone),
            fromZonedTime(lastWeekEnd, serverTimezone),
          ],
        },
      },
      raw: true,
    });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const currentCount =
        hour <= currentHour
          ? currentOrders.filter((order) => {
              const orderHour = getHours(
                toZonedTime(order.orderDate, serverTimezone),
              );
              return orderHour === hour;
            }).length
          : null;

      const previousCount = previousOrders.filter((order) => {
        const orderHour = getHours(
          toZonedTime(order.orderDate, serverTimezone),
        );
        return orderHour === hour;
      }).length;

      return {
        hour,
        current_orders: currentCount,
        previous_orders: previousCount,
      };
    });

    response.hourly_orders = {
      metadata: {
        current_date: currentDateStr,
        previous_date: previousDateStr,
        timezone: serverTimezone,
        current_hour: currentHour,
      },
      data: hourlyData,
    };
  }

  if (formattedInclude.includes("weekly_sales")) {
    const today = startOfDay(now);
    const lastWeekToday = subDays(today, 7);

    const currentWeekDates = Array.from({ length: 7 }, (_, i) =>
      subDays(today, 6 - i),
    );

    const previousWeekDates = currentWeekDates.map((date) => subDays(date, 7));

    const dayOrder = currentWeekDates.map((date) => format(date, "EEEE"));

    const [currentWeekOrders, previousWeekOrders] = await Promise.all([
      orderModel.findAll({
        where: {
          orderDate: {
            [Op.between]: [
              fromZonedTime(currentWeekDates[0], serverTimezone),
              fromZonedTime(endOfDay(today), serverTimezone),
            ],
          },
        },
        raw: true,
      }),
      orderModel.findAll({
        where: {
          orderDate: {
            [Op.between]: [
              fromZonedTime(previousWeekDates[0], serverTimezone),
              fromZonedTime(endOfDay(lastWeekToday), serverTimezone),
            ],
          },
        },
        raw: true,
      }),
    ]);

    // Generate weekly data
    const weeklyData = currentWeekDates.map((date, index) => {
      const day = format(date, "EEEE");
      const currentDateStr = format(date, "yyyy-MM-dd");
      const previousDateStr = format(previousWeekDates[index], "yyyy-MM-dd");

      const currentRevenue = currentWeekOrders
        .filter((order) => {
          const orderDate = format(
            toZonedTime(order.orderDate, serverTimezone),
            "yyyy-MM-dd",
          );
          return orderDate === currentDateStr;
        })
        .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

      const previousRevenue = previousWeekOrders
        .filter((order) => {
          const orderDate = format(
            toZonedTime(order.orderDate, serverTimezone),
            "yyyy-MM-dd",
          );
          return orderDate === previousDateStr;
        })
        .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

      return {
        day,
        current_revenue: parseFloat(currentRevenue.toFixed(2)),
        previous_revenue: parseFloat(previousRevenue.toFixed(2)),
      };
    });

    response.weekly_sales = {
      metadata: {
        current_week_start: format(currentWeekDates[0], "yyyy-MM-dd"),
        current_week_end: format(today, "yyyy-MM-dd"),
        previous_week_start: format(previousWeekDates[0], "yyyy-MM-dd"),
        previous_week_end: format(lastWeekToday, "yyyy-MM-dd"),
        timezone: serverTimezone,
      },
      data: weeklyData,
    };
  }

  return {
    ...generalConstant.EN.ANALYTICS.WEEKLY_ANALYTICS_SUCCESS,
    data: response,
  };
};

module.exports = {
  viewWeeklyAnalytics,
};
