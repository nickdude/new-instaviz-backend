const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");

// ...existing code...

// Aggregated plans with user count and revenue
const getPlansWithStats = async ({ isActive } = {}) => {
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  // Get all plans
  const plans = await Plan.find(filter).sort({ createdAt: -1 });
  const planIds = plans.map((p) => p._id);

  // Aggregate subscriptions by plan
  const subsAgg = await Subscription.aggregate([
    { $match: { planId: { $in: planIds }, status: "active" } },
    {
      $group: {
        _id: "$planId",
        users: { $sum: 1 },
        revenue: { $sum: "$paymentDetails.amount" },
      },
    },
  ]);

  // Map for quick lookup
  const statsMap = {};
  for (const agg of subsAgg) {
    statsMap[agg._id.toString()] = {
      users: agg.users,
      revenue: agg.revenue,
    };
  }

  // Attach stats to plans
  const plansWithStats = plans.map((plan) => {
    const stats = statsMap[plan._id.toString()] || { users: 0, revenue: 0 };
    return {
      ...plan.toObject(),
      users: stats.users,
      revenue: stats.revenue,
    };
  });

  return plansWithStats;
};

module.exports = {
  // ...existing exports...
  getPlansWithStats,
};
