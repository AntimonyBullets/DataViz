import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import {Metric} from '../../models/metric.model.js'
import {MetricData} from '../../models/metricData.model.js'

// Admin CSV upload for manual metric data
const uploadMetricDataCsv = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded.')
  }
  // Check file extension and mimetype for CSV
  const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel']
  const ext = path.extname(req.file.originalname).toLowerCase()
  if (ext !== '.csv' || (req.file.mimetype && !allowedMimeTypes.includes(req.file.mimetype))) {
    // Remove file if not valid
    fs.unlink(req.file.path, () => {})
    throw new ApiError(400, 'Only CSV files are accepted.')
  }
  const filePath = req.file.path
  const results = []
  const summary = {
    processed: 0,
    inserted: 0,
    skipped: 0,
    errors: []
  }
  // Read and parse CSV (header row handled automatically)
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', resolve)
      .on('error', reject)
  })
  // Remove file after parsing
  fs.unlink(filePath, () => {})
  for (const [i, row] of results.entries()) {
    summary.processed++
    // Validate required fields
    const metricName = (row.metricName || '').trim()
    const industry = (row.industry || '').trim()
    const country = (row.country || '').trim()
    const year = parseInt(row.year)
    const value = row.value !== undefined ? Number(row.value) : null
    if (!metricName || !country || !year || isNaN(value)) {
      summary.skipped++
      summary.errors.push({ row: i+1, reason: 'Missing or invalid fields' })
      continue
    }
    // Find metric by name + industry
    const metric = await Metric.findOne({ name: metricName, industry: industry || '' })
    if (!metric) {
      summary.skipped++
      summary.errors.push({ row: i+1, reason: 'Metric not found' })
      continue
    }
    if (metric.type === 'live') {
      summary.skipped++
      summary.errors.push({ row: i+1, reason: 'Cannot upload data for live metric' })
      continue
    }
    // Prepare data for insert
    const doc = {
      metricName,
      industry: industry || '',
      country,
      year,
      value
    }
    try {
      await MetricData.create(doc)
      summary.inserted++
    } catch (err) {
      // Duplicate or other error
      summary.skipped++
      let reason = 'Unknown error'
      if (err.code === 11000) reason = 'Duplicate entry'
      summary.errors.push({ row: i+1, reason })
    }
  }
  return res.status(200).json(new ApiResponse(200, summary, 'CSV upload processed.'))
})

// Admin: Fetch all metric data with pagination (max 20 per page)
const getAllMetricDataPaginated = asyncHandler(async (req, res, next) => {
  // Parse page from query, default to 1
  let page = parseInt(req.query.page) || 1;
  if (page < 1) page = 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  // Sort by creation date (most recent first)
  const [total, data] = await Promise.all([
    MetricData.countDocuments(),
    MetricData.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json(new ApiResponse(200, {
    data,
    page,
    totalPages,
    total: total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  }, 'Metric data fetched with pagination.'));
});

// Admin: Fetch all manual metrics (type: 'manual')
const getAllManualMetrics = asyncHandler(async (req, res, next) => {
  const metrics = await Metric.find({ type: 'manual' }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, metrics, 'All manual metrics fetched.'));
});

// Admin: Fetch all metric data for a selected manual metric (by name)
const getMetricDataByManualMetric = asyncHandler(async (req, res, next) => {
  const metricId = (req.query.metricId || '').trim();
  if (!metricId) {
    throw new ApiError(400, 'Metric ID is required.');
  }
  // Ensure the metric is manual and exists
  const metric = await Metric.findOne({ _id: metricId, type: 'manual' });
  if (!metric) {
    throw new ApiError(404, 'Manual metric not found.');
  }
  // Fetch all metric data for this metric, sorted by country then year (descending)
  const data = await MetricData.find({ metricName: metric.name, industry: metric.industry || '' })
    .sort({ country: 1, year: -1 });
  // Get unique list of countries from the data
  const countries = [...new Set(data.map(d => d.country).filter(Boolean))].sort();
  return res.status(200).json(new ApiResponse(200, { data, countries }, 'Metric data for selected manual metric fetched.'));
});

// Admin: Delete metric data for a manual metric by metricId and optional country
const deleteMetricDataByMetric = asyncHandler(async (req, res, next) => {
  const metricId = (req.body.metricId || '').trim();
  const country = (req.body.country || '').trim();

  if (!metricId) {
    throw new ApiError(400, 'Metric ID is required.');
  }
  // Ensure the metric is manual and exists
  const metric = await Metric.findOne({ _id: metricId, type: 'manual' });
  if (!metric) {
    throw new ApiError(404, 'Manual metric not found.');
  }
  // Build delete query
  const query = { metricName: metric.name, industry: metric.industry || '' };
  if (country) query.country = country;
  const result = await MetricData.deleteMany(query);
  if (!result.deletedCount) {
    throw new ApiError(404, `No metric data found to delete for metric '${metric.name}'${country ? ' and country ' + country : ''}.`);
  }
  return res.status(200).json(new ApiResponse(200, { deletedCount: result.deletedCount }, `Metric data deleted for metric '${metric.name}'${country ? ' and country ' + country : ''}.`));
});

// Admin: Edit the value attribute of a metricData document by its id
const editMetricDataValue = asyncHandler(async (req, res, next) => {
  const metricDataId = (req.body.metricDataId || '').trim();
  const value = req.body.value;

  if (!metricDataId) {
    throw new ApiError(400, 'MetricData ID is required.');
  }
  if (value === undefined || value === null || isNaN(Number(value))) {
    throw new ApiError(400, 'A valid value is required.');
  }

  const updated = await MetricData.findByIdAndUpdate(
    metricDataId,
    { value: Number(value) },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(404, 'MetricData document not found.');
  }
  return res.status(200).json(new ApiResponse(200, updated, 'MetricData value updated successfully.'));
});

export { uploadMetricDataCsv, getAllMetricDataPaginated, getAllManualMetrics, getMetricDataByManualMetric, deleteMetricDataByMetric, editMetricDataValue }
