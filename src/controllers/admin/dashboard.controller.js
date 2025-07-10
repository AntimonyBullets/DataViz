import { ApiResponse } from '../../utils/ApiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { User } from '../../models/user.model.js'
import { Metric } from '../../models/metric.model.js'
import { MetricData } from '../../models/metricData.model.js'
import { Industry } from '../../models/industry.model.js'
import { Payment } from '../../models/payment.model.js'

// Admin: Fetch dashboard info summary
const getDashboardInfo = asyncHandler(async (req, res, next) => {
  const [
    premiumUsers,
    freeUsers,
    macroMetrics,
    industryMetrics,
    totalMetricData,
    totalIndustries,
    totalPayments
  ] = await Promise.all([
    User.countDocuments({ type: 'premium' }),
    User.countDocuments({ type: 'free' }),
    Metric.countDocuments({ $or: [ { industry: '' }, { industry: null }, { industry: { $exists: false } } ] }),
    Metric.countDocuments({ industry: { $nin: [null, ''] } }),
    MetricData.countDocuments(),
    Industry.countDocuments(),
    Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).then(res => res[0]?.total || 0)
  ])

  return res.status(200).json(new ApiResponse(200, {
    premiumUsers,
    freeUsers,
    macroMetrics,
    industryMetrics,
    totalMetricData,
    totalIndustries,
    totalPayments
  }, 'Dashboard info fetched.'))
})

export { getDashboardInfo }
