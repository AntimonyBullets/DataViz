import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import {Metric} from '../models/metric.model.js'
import {MetricData} from '../models/metricData.model.js'

// Fetch live metric data from World Bank API
const getWorldBankIndicator = asyncHandler(async (req, res, next) => {
  const { countryCode, indicatorCode, startYear, endYear } = req.query
  if (!countryCode || !indicatorCode) {
    throw new ApiError(400, 'countryCode and indicatorCode are required.')
  }

  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new ApiError(502, 'Failed to fetch data from World Bank API.')
  }
  const data = await response.json()

  // Extract year and value from World Bank API response
  let result = []
  let minYear = null
  let maxYear = null
  let countries = null
  if (Array.isArray(data) && Array.isArray(data[1])) {
    result = data[1]
      .filter(item => item && item.date && item.value !== null)
      .map(item => ({ year: item.date, value: item.value }))
    if (result.length > 0) {
      const years = result.map(item => parseInt(item.year, 10)).filter(y => !isNaN(y))
      minYear = Math.min(...years)
      maxYear = Math.max(...years)
    }
    // Filter by startYear and endYear if provided
    if (startYear || endYear) {
      result = result.filter(item => {
        const y = parseInt(item.year, 10)
        if (startYear && y < parseInt(startYear, 10)) return false
        if (endYear && y > parseInt(endYear, 10)) return false
        return true
      })
    }
    // Always fetch countries
    const countryUrl = `https://api.worldbank.org/v2/country?format=json&per_page=300`
    const countryRes = await fetch(countryUrl)
    if (countryRes.ok) {
      const countryData = await countryRes.json()
      if (Array.isArray(countryData) && Array.isArray(countryData[1])) {
        countries = countryData[1]
          .filter(c => c.id && c.name && c.region && c.region.id !== 'NA')
          .map(c => ({ code: c.id, name: c.name }))
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { data: result, minYear, maxYear, countries }, 'World Bank data fetched successfully.')
  )
})

// Fetch manual metric data from DB
const getManualMetricData = asyncHandler(async (req, res, next) => {
  const { name, industry, startYear, endYear, country } = req.query;
  if (!name) {
    throw new ApiError(400, 'name is required.');
  }
  // Check if the metric exists
  const metric = await Metric.findOne({ name, industry: industry || '' });
  if (!metric) {
    throw new ApiError(404, 'Metric not found for the given name and industry.');
  }
  // Default to India if no country is provided
  const countryName = country ? country : 'India';
  // Find all matching metric data by country name
  const query = {
    metricName: name,
    industry: industry || '',
    country: countryName,
  };
  if (startYear || endYear) {
    query.year = {};
    if (startYear) query.year.$gte = parseInt(startYear, 10);
    if (endYear) query.year.$lte = parseInt(endYear, 10);
  }
  const data = await MetricData.find(query).lean();
  let result = [];
  let minYear = null;
  let maxYear = null;
  let countries = null;
  if (Array.isArray(data) && data.length > 0) {
    result = data.map(item => ({ year: item.year, value: item.value }));
    const years = data.map(item => parseInt(item.year, 10)).filter(y => !isNaN(y));
    if (years.length > 0) {
      minYear = Math.min(...years);
      maxYear = Math.max(...years);
    }
    // List all unique countries for this metric (not just the requested one)
    const allCountries = await MetricData.find({ metricName: name, industry: industry || '' }).distinct('country');
    countries = allCountries.map(c => ({ code: c, name: c }));
  }
  return res.status(200).json(
    new ApiResponse(200, { data: result, minYear, maxYear, countries }, 'Manual metric data fetched successfully.')
  );
});

export { getWorldBankIndicator, getManualMetricData }
