import { loadChartJs } from "./chartjs-loader.js"

document.addEventListener("DOMContentLoaded", () => {
  // Add back button event
  const backBtn = document.getElementById("backToMetricBtn")
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "../select-metric/select-metric.html"
    })
  }
  // Initialize logout functionality
  setupLogout()

  // Initialize explorer
  initializeExplorer()
})

// Global variables
let currentMetric = null
let metricId = null
let chartInstance = null
let liveMetricData = null
let minYear = null
let maxYear = null
let selectedCountries = [{ code: "IN", name: "India" }];
let availableCountries = [];
let currentView = "chart"; // Track current view mode
let userInfo = null; // Store user information

// Add country dropdown
let countryDropdown = null;

function setupLogout() {
  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn")
  const logoutModal = document.getElementById("logoutModal")
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn")
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn")
  const errorPopup = document.getElementById("errorPopup")
  const errorMessage = document.getElementById("errorMessage")

  if (logoutBtn && logoutModal && cancelLogoutBtn && confirmLogoutBtn && errorPopup && errorMessage) {
    // Show logout modal
    logoutBtn.addEventListener("click", () => {
      logoutModal.classList.add("show")
    })

    // Cancel logout
    cancelLogoutBtn.addEventListener("click", () => {
      logoutModal.classList.remove("show")
    })

    // Confirm logout
    confirmLogoutBtn.addEventListener("click", async () => {
      try {
        confirmLogoutBtn.disabled = true
        confirmLogoutBtn.innerHTML = "<span>Logging out...</span>"

        const response = await fetch("/api/v1/users/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok) {
          localStorage.removeItem("authData")
          window.location.href = "../index.html"
        } else {
          throw new Error("Logout failed")
        }
      } catch (error) {
        console.error("Logout error:", error)
        logoutModal.classList.remove("show")
        errorMessage.textContent = "Logout failed due to an error"
        errorPopup.classList.add("show")

        setTimeout(() => {
          errorPopup.classList.remove("show")
        }, 3000)

        confirmLogoutBtn.disabled = false
        confirmLogoutBtn.innerHTML = "<span>Logout</span>"
      }
    })

    // Close modal when clicking outside
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        logoutModal.classList.remove("show")
      }
    })

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && logoutModal.classList.contains("show")) {
        logoutModal.classList.remove("show")
      }
    })
  }
}

function initializeExplorer() {
  // Extract metric ID from URL
  metricId = getMetricIdFromUrl()

  if (!metricId) {
    showError("No metric ID provided in URL")
    return
  }

  // Load metric details
  loadMetricDetails()

  // Setup event listeners
  setupEventListeners()
}

function getMetricIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("metricId")
}

function setupEventListeners() {
  // Retry button
  const retryBtn = document.getElementById("retryBtn")
  if (retryBtn) {
    retryBtn.addEventListener("click", loadMetricDetails)
  }

  // Date range inputs
  const fromYearInput = document.getElementById("from-year")
  const toYearInput = document.getElementById("to-year")

  if (fromYearInput) {
    fromYearInput.addEventListener("change", handleDateRangeChange)
  }

  if (toYearInput) {
    toYearInput.addEventListener("change", handleDateRangeChange)
  }

  // Add country button
  const addCountryBtn = document.getElementById("add-country-btn")
  if (addCountryBtn) {
    addCountryBtn.addEventListener("click", handleAddCountry)
  }

  // View toggle buttons - Updated to handle view switching properly
  const chartViewBtn = document.getElementById("chart-view-btn")
  const histogramViewBtn = document.getElementById("histogram-view-btn")

  if (chartViewBtn) {
    chartViewBtn.addEventListener("click", () => switchToView("chart"))
  }

  if (histogramViewBtn) {
    histogramViewBtn.addEventListener("click", () => switchToView("histogram"))
  }

  // Download CSV button
  const downloadCsvBtn = document.getElementById("download-csv-btn")
  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener("click", handleDownloadCsv)
  }
}

async function switchToView(viewType) {
  // Check if user is premium for histogram view
  if (viewType === "histogram") {
    if (!userInfo || userInfo.data.type !== "premium") {
      showPremiumRequiredModal()
      return
    }
  }

  currentView = viewType
  setActiveView(viewType)

  // Toggle Key Figures section
  const keyFiguresSection = document.getElementById("key-figures-section")
  console.log(keyFiguresSection);
  if (keyFiguresSection) {
    if (viewType === "histogram") {
      keyFiguresSection.classList.add('hidden-element')
    } else {
      keyFiguresSection.classList.remove('hidden-element');
    }
  }

  if (viewType === "chart") {
    // Switch to line chart
    showYearRangeSelectors()
    hideHistogramYearSelector()
    if (liveMetricData) {
      await loadChartJs(() => {
        plotMultiLineChart()
        updateKeyFigures() // Update key figures when switching to chart view
      })
    }
  } else if (viewType === "histogram") {
    // Switch to histogram
    hideYearRangeSelectors()
    showHistogramYearSelector()
    if (liveMetricData) {
      await loadChartJs(() => {
        plotHistogramChart()
        updateKeyFigures() // Update key figures when switching to histogram view
      })
    }
  }

  // Toggle Download CSV button visibility
  const downloadCsvBtn = document.getElementById("download-csv-btn")
  if (downloadCsvBtn) {
    if (viewType === "histogram") {
      downloadCsvBtn.style.display = "none"
    } else {
      downloadCsvBtn.style.display = ""
    }
  }
}

function showPremiumRequiredModal() {
  // Remove any existing modal
  const existing = document.getElementById('premiumRequiredModal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'premiumRequiredModal'
  modal.style.position = 'fixed'
  modal.style.top = '0'
  modal.style.left = '0'
  modal.style.width = '100vw'
  modal.style.height = '100vh'
  modal.style.background = 'rgba(0,0,0,0.18)'
  modal.style.display = 'flex'
  modal.style.alignItems = 'center'
  modal.style.justifyContent = 'center'
  modal.style.zIndex = '99999'

  modal.innerHTML = `
    <div style="background:#fff;padding:2rem 2.2rem;border-radius:13px;box-shadow:0 8px 32px rgba(0,0,0,0.13);min-width:320px;max-width:90vw;text-align:center;">
      <div style="color:#f59e0b;font-size:2.5rem;margin-bottom:1rem;">👑</div>
      <div style="font-size:1.25rem;font-weight:600;margin-bottom:1rem;color:#1e293b;">Premium Feature</div>
      <div style="margin-bottom:1.5rem;color:#64748b;font-size:1rem;">Histogram charts are available for premium users only. Upgrade your account to access this feature.</div>
      <button id="premiumUpgradeBtn" style="padding:10px 24px;border-radius:8px;border:none;background:#f59e0b;color:#fff;font-weight:600;font-size:1rem;cursor:pointer;box-shadow:0 2px 8px rgba(245,158,11,0.13);transition:background 0.2s;">Upgrade to Premium</button>
    </div>
  `

  document.body.appendChild(modal)

  document.getElementById('premiumUpgradeBtn').onclick = () => {
    modal.remove()
    // Redirect to upgrade page or show upgrade modal (customize as needed)
    window.location.href = "../package-offer/package-offer.html";
  }

  // Close on click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
      switchToView("chart")
    }
  })
}

function showYearRangeSelectors() {
  const dateControls = document.querySelector('.date-controls')
  if (dateControls) {
    dateControls.style.display = 'flex'
  }
}

function hideYearRangeSelectors() {
  const dateControls = document.querySelector('.date-controls')
  if (dateControls) {
    dateControls.style.display = 'none'
  }
}

function showHistogramYearSelector() {
  let histogramYearSelector = document.getElementById('histogram-year-selector')
  if (!histogramYearSelector) {
    // Create histogram year selector
    histogramYearSelector = document.createElement('div')
    histogramYearSelector.id = 'histogram-year-selector'
    histogramYearSelector.className = 'histogram-year-controls'
    histogramYearSelector.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <label for="histogram-year" style="margin-bottom:0;font-weight:500;color:#374151;">Year</label>
        <select id="histogram-year" class="year-select">
          <option value="" disabled selected>Select Year</option>
        </select>
      </div>
    `

    // Insert after date controls
    const controlsGrid = document.querySelector('.controls-grid')
    if (controlsGrid) {
      controlsGrid.insertBefore(histogramYearSelector, controlsGrid.firstChild)
    }

    // Populate years and set to maxYear
    const histogramYearSelect = document.getElementById('histogram-year')
    if (histogramYearSelect && minYear && maxYear) {
      histogramYearSelect.innerHTML = '<option value="" disabled>Select Year</option>'
      for (let y = maxYear; y >= minYear; y--) {
        const option = document.createElement('option')
        option.value = y
        option.textContent = y
        histogramYearSelect.appendChild(option)
      }
      histogramYearSelect.value = maxYear
      histogramYearSelect.addEventListener('change', handleHistogramYearChange)
    }
  }
  histogramYearSelector.style.display = 'block'
}

function hideHistogramYearSelector() {
  const histogramYearSelector = document.getElementById('histogram-year-selector')
  if (histogramYearSelector) {
    histogramYearSelector.style.display = 'none'
  }
}

async function handleHistogramYearChange() {
  if (currentView === "histogram" && liveMetricData) {
    await loadChartJs(() => {
      plotHistogramChart()
      updateKeyFigures() // Update key figures when histogram year changes
    })
  }
}

async function loadMetricDetails() {
  try {
    showLoading()

    // Fetch user info first
    const userResponse = await fetch("/api/v1/users/me", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (userResponse.ok) {
      userInfo = await userResponse.json()
    }

    const response = await fetch(`/api/v1/metrics/get-metric/${metricId}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success || !data.data) {
      throw new Error("Invalid response format")
    }

    currentMetric = data.data
    displayMetricDetails(currentMetric)
    // If metric is live, fetch and plot live data
    if (currentMetric.type === "live" && currentMetric.indicatorCode) {
      await fetchAndPlotLiveMetric(currentMetric.indicatorCode)
    } else if (currentMetric.type === "manual") {
      await fetchAndPlotManualMetric(currentMetric)
    } else {
      // Hide chart or show placeholder for unknown/unsupported metrics
      showChartPlaceholder()
    }
    hideLoading()
  } catch (error) {
    console.error("Error loading metric details:", error)
    showError("Failed to load metric details. Please try again.")
  }
}

async function fetchAndPlotManualMetric(metric) {
  try {
    // Default to India for initial load
    const defaultCountry = "India"
    let url = `/api/v1/metric-data/fetch-manual-metric-data?name=${encodeURIComponent(metric.name)}&industry=${encodeURIComponent(metric.industry || '')}&country=${encodeURIComponent(defaultCountry)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch manual metric data")
    const result = await response.json()
    if (!result.success || !result.data) throw new Error("Invalid manual metric response")
    // Use the same variable names as live metric for chart logic
    liveMetricData = result.data.data || []
    minYear = result.data.minYear
    maxYear = result.data.maxYear
    availableCountries = result.data.countries || []
    // Set selectedCountries to default country
    selectedCountries = [{ code: defaultCountry, name: defaultCountry, data: liveMetricData }]
    console.log(minYear, maxYear)
    setYearSelectors(minYear, maxYear)
    await loadChartJs(() => {
      if (currentView === "histogram") {
        showHistogramYearSelector()
        plotHistogramChart()
      } else {
        plotMultiLineChart()
      }
      updateKeyFigures() // Update key figures after plotting
    })
    renderSelectedCountries()
  } catch (error) {
    showChartPlaceholder("Failed to load manual metric data.")
    console.error("Manual metric fetch error:", error)
  }
}

function setYearSelectors(min, max) {
  // Year selector setup
  let prevFrom = null, prevTo = null
  const oldFrom = document.getElementById("from-year")
  const oldTo = document.getElementById("to-year")
  if (oldFrom && oldTo) {
    prevFrom = oldFrom.value
    prevTo = oldTo.value
  }
  const fromGroup = document.querySelector('.date-input-group label[for="from-year"]').parentElement
  const toGroup = document.querySelector('.date-input-group label[for="to-year"]').parentElement
  fromGroup.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><label for="from-year" style="margin-bottom:0;">From</label><select id="from-year" class="year-select"><option value="" disabled selected>Select Year</option></select></div>`
  toGroup.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><label for="to-year" style="margin-bottom:0;">To</label><select id="to-year" class="year-select"><option value="" disabled selected>Select Year</option></select></div>`
  const fromSelect = document.getElementById("from-year")
  const toSelect = document.getElementById("to-year")
  for (let y = max; y >= min; y--) {
    const optFrom = document.createElement("option")
    optFrom.value = y
    optFrom.textContent = y
    fromSelect.appendChild(optFrom)
    const optTo = document.createElement("option")
    optTo.value = y
    optTo.textContent = y
    toSelect.appendChild(optTo)
  }
  fromSelect.value = (prevFrom && fromSelect.querySelector(`option[value='${prevFrom}']`)) ? prevFrom : min
  toSelect.value = (prevTo && toSelect.querySelector(`option[value='${prevTo}']`)) ? prevTo : max
  fromSelect.onchange = handleYearDropdownChange
  toSelect.onchange = handleYearDropdownChange
}

// Year select styles function
(function addYearSelectStyles() {
  if (document.getElementById('year-select-style')) return
  const style = document.createElement('style')
  style.id = 'year-select-style'
  style.textContent = `
    .year-select {
      width: 100%;
      padding: 7px 12px;
      border: 1.5px solid #d1d5db;
      border-radius: 7px;
      background: #fff;
      font-size: 1rem;
      color: #374151;
      margin-top: 4px;
      transition: border 0.2s;
      outline: none;
      appearance: none;
      cursor: pointer;
    }
    .year-select:focus, .year-select:hover {
      border-color: #2563eb;
      background: #f3f6fd;
    }
    .date-input-group label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 2px;
      display: block;
    }
  `
  document.head.appendChild(style)
})()

async function handleYearDropdownChange() {
  // Year dropdown change handler
  const fromYear = document.getElementById("from-year").value
  const toYear = document.getElementById("to-year").value
  if (parseInt(fromYear) > parseInt(toYear)) {
    document.getElementById("from-year").value = toYear
    document.getElementById("to-year").value = fromYear
    return
  }
  if (currentMetric && currentMetric.type === "live" && currentMetric.indicatorCode) {
    await fetchAndPlotLiveMetric(currentMetric.indicatorCode, fromYear, toYear)
  } else if (currentMetric && currentMetric.type === "manual") {
    await fetchAndPlotManualMetric(currentMetric)
  }
  updateKeyFigures() // Update key figures when year range changes
}

async function fetchAndPlotLiveMetric(indicatorCode, startYear, endYear) {
  // Fetch live metric data
  try {
    let url = `/api/v1/metric-data/fetch-live-metric-data?countryCode=IN&indicatorCode=${encodeURIComponent(indicatorCode)}`
    if (startYear) url += `&startYear=${startYear}`
    if (endYear) url += `&endYear=${endYear}`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch live metric data")
    const result = await response.json()
    if (!result.success || !result.data) throw new Error("Invalid live metric response")
    liveMetricData = result.data.data || []
    minYear = result.data.minYear
    maxYear = result.data.maxYear
    availableCountries = result.data.countries || []
    setYearSelectors(minYear, maxYear)
    await loadChartJs(() => {
      if (currentView === "histogram") {
        showHistogramYearSelector()
        plotHistogramChart()
      } else {
        plotMultiLineChart()
      }
      updateKeyFigures() // Update key figures after plotting
    })
    renderSelectedCountries()
  } catch (error) {
    showChartPlaceholder("Failed to load live data.")
    console.error("Live metric fetch error:", error)
  }
}

async function plotHistogramChart() {
  const ctxId = "histogram-chart"
  let chartContainer = document.getElementById("chart-container")
  chartContainer.innerHTML = `<canvas id="${ctxId}" height="120"></canvas>`
  const ctx = document.getElementById(ctxId).getContext("2d")
  if (chartInstance) chartInstance.destroy()

  // Get selected year for histogram
  const selectedYear = parseInt(document.getElementById("histogram-year")?.value || maxYear)

  // Ensure all selected countries have data for the selected year
  await Promise.all(selectedCountries.map(async (country) => {
    // India uses liveMetricData, skip fetch
    if (country.code === "IN") return
    const countryData = country.data || []
    const hasYear = countryData.some(d => parseInt(d.year) === selectedYear)
    if (!hasYear) {
      // Fetch only the missing year for this country
      let url = `/api/v1/metric-data/fetch-live-metric-data?countryCode=${country.code}&indicatorCode=${encodeURIComponent(currentMetric.indicatorCode)}&startYear=${selectedYear}&endYear=${selectedYear}`
      try {
        const response = await fetch(url)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && Array.isArray(result.data.data)) {
            // Merge new year data into country.data
            const newYearData = result.data.data
            if (!country.data) country.data = []
            // Avoid duplicates
            newYearData.forEach(nd => {
              if (!country.data.some(cd => cd.year === nd.year)) {
                country.data.push(nd)
              }
            })
          }
        }
      } catch (e) {
        // Ignore fetch errors for missing years
      }
    }
  }))

  // Collect data for the selected year from all countries
  const labels = []
  const data = []
  const backgroundColors = []

  selectedCountries.forEach((country, idx) => {
    const countryData = country.data || (country.code === "IN" ? liveMetricData : [])
    const yearData = countryData.find(d => parseInt(d.year) === selectedYear)
    if (yearData && yearData.value !== null && yearData.value !== undefined) {
      labels.push(country.name)
      data.push(yearData.value)
      backgroundColors.push(getColor(idx, 1))
    }
  })

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: `${currentMetric.unit || "Value"} (${selectedYear})`,
        data: data,
        backgroundColor: backgroundColors,
        borderColor: "black",
        borderWidth: 2,
        barThickness: 30, // Consistently thin bars
        maxBarThickness: 32 // Prevent stretching
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `${context[0].label} (${selectedYear})`
            },
            label: function (context) {
              return `${formatLargeNumber(context.parsed.y)} ${currentMetric.unit || ""}`
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Countries", color: "#000" },
          grid: { display: false },
          ticks: { color: "#000" },
          border: { color: "#000" }
        },
        y: {
          title: { display: true, text: currentMetric.unit || "Value", color: "#000" },
          beginAtZero: true,
          grid: { display: false },
          ticks: {
            color: "#000",
            callback: function (value) {
              return formatLargeNumber(value)
            }
          },
          border: { color: "#000" }
        }
      }
    }
  })
}

function plotMultiLineChart() {
  // Multi-line chart plotting
  const ctxId = "live-metric-chart"
  let chartContainer = document.getElementById("chart-container")
  chartContainer.innerHTML = `<canvas id="${ctxId}"></canvas>`
  const ctx = document.getElementById(ctxId).getContext("2d")
  if (chartInstance) chartInstance.destroy()

  const fromYear = parseInt(document.getElementById("from-year")?.value)
  const toYear = parseInt(document.getElementById("to-year")?.value)

  let yearSet = new Set()
  selectedCountries.forEach(country => {
    const data = country.data || (country.code === "IN" ? liveMetricData : [])
    data.forEach(d => {
      const y = parseInt(d.year)
      if (!isNaN(y) && (!fromYear || y >= fromYear) && (!toYear || y <= toYear)) {
        yearSet.add(y)
      }
    })
  })
  const years = Array.from(yearSet).sort((a, b) => a - b)

  const datasets = []
  selectedCountries.forEach((country, idx) => {
    const data = country.data || (country.code === "IN" ? liveMetricData : [])
    const yearValueMap = {}
    data.forEach(d => {
      const y = parseInt(d.year)
      if (!isNaN(y) && (!fromYear || y >= fromYear) && (!toYear || y <= toYear)) {
        yearValueMap[y] = d.value
      }
    })
    const values = years.map(y => yearValueMap[y] !== undefined ? yearValueMap[y] : null)
    datasets.push({
      label: country.name, // Only country name, no unit in legend
      data: values,
      borderColor: getColor(idx),
      backgroundColor: getColor(idx, 0.08),
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0.25,
      spanGaps: true
    })
  })

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 18,
            boxHeight: 18,
            font: { size: 14 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          position: 'nearest',
          callbacks: {
            title: function (context) {
              return `Year: ${context[0].label}`
            },
            label: function (context) {
              return ` ${context.dataset.label.replace(/ \(.+\)$/, '')}: ${formatLargeNumber(context.parsed.y)} ${currentMetric.unit || ""}`
            }
          }
        },
        crosshairLine: true
      },
      hover: {
        mode: 'index',
        intersect: false
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          title: { display: true, text: "Year", color: "#000" },
          grid: { display: false },
          ticks: {
            autoSkip: false,
            color: "#000",
            callback: function (value, index, ticks) {
              const total = years.length
              let interval = 1
              if (total > 40) interval = 10
              else if (total > 20) interval = 5
              else if (total > 10) interval = 2
              return index % interval === 0 ? this.getLabelForValue(value) : ""
            }
          },
          border: { color: "#000" }
        },
        y: {
          title: { display: true, text: currentMetric.unit || "Value", color: "#000" },
          beginAtZero: false,
          grid: { display: false },
          ticks: {
            color: "#000",
            callback: function (value) {
              return formatLargeNumber(value)
            }
          },
          border: { color: "#000" }
        }
      }
    },
    plugins: [verticalCrosshairPlugin]
  })
}

// Key Figures Calculation Functions
function updateKeyFigures() {
  if (!selectedCountries.length || !currentMetric) {
    hideKeyFigures()
    return
  }

  const keyFigures = calculateKeyFigures()
  displayKeyFigures(keyFigures)
  showKeyFigures()
}

function calculateKeyFigures() {
  let allValues = []
  let yearValuePairs = []
  let countryYearValues = []

  const fromYear = parseInt(document.getElementById("from-year")?.value) || minYear
  const toYear = parseInt(document.getElementById("to-year")?.value) || maxYear

  // Collect all data points
  selectedCountries.forEach(country => {
    const data = country.data || (country.code === "IN" ? liveMetricData : [])
    data.forEach(d => {
      const year = parseInt(d.year)
      const value = parseFloat(d.value)
      
      if (!isNaN(year) && !isNaN(value) && value !== null && value !== undefined) {
        if (year >= fromYear && year <= toYear) {
          allValues.push(value)
          yearValuePairs.push({ year, value })
          countryYearValues.push({ country: country.name, year, value })
        }
      }
    })
  })

  if (allValues.length === 0) {
    return {
      average: null,
      minimum: null,
      maximum: null,
      change: null,
      trend: null,
      period: `${fromYear}–${toYear}`
    }
  }

  // Calculate statistics
  const average = allValues.reduce((sum, val) => sum + val, 0) / allValues.length

  const minEntry = countryYearValues.reduce((min, curr) => 
    curr.value < min.value ? curr : min
  )

  const maxEntry = countryYearValues.reduce((max, curr) => 
    curr.value > max.value ? curr : max
  )

  // Calculate overall change (first year vs last year average)
  const firstYearValues = yearValuePairs.filter(p => p.year === fromYear).map(p => p.value)
  const lastYearValues = yearValuePairs.filter(p => p.year === toYear).map(p => p.value)
  
  let change = null
  if (firstYearValues.length > 0 && lastYearValues.length > 0) {
    const firstYearAvg = firstYearValues.reduce((sum, val) => sum + val, 0) / firstYearValues.length
    const lastYearAvg = lastYearValues.reduce((sum, val) => sum + val, 0) / lastYearValues.length
    change = {
      value: lastYearAvg - firstYearAvg,
      percentage: ((lastYearAvg - firstYearAvg) / Math.abs(firstYearAvg)) * 100,
      fromYear,
      toYear
    }
  }

  // Calculate trend (simple linear regression)
  let trend = null
  if (yearValuePairs.length > 1) {
    // Group by year and average values for each year
    const yearAverages = {}
    yearValuePairs.forEach(p => {
      if (!yearAverages[p.year]) {
        yearAverages[p.year] = []
      }
      yearAverages[p.year].push(p.value)
    })

    const trendData = Object.keys(yearAverages).map(year => ({
      year: parseInt(year),
      value: yearAverages[year].reduce((sum, val) => sum + val, 0) / yearAverages[year].length
    })).sort((a, b) => a.year - b.year)

    if (trendData.length > 1) {
      const n = trendData.length
      const sumX = trendData.reduce((sum, d) => sum + d.year, 0)
      const sumY = trendData.reduce((sum, d) => sum + d.value, 0)
      const sumXY = trendData.reduce((sum, d) => sum + (d.year * d.value), 0)
      const sumXX = trendData.reduce((sum, d) => sum + (d.year * d.year), 0)

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      
      trend = {
        slope,
        direction: slope > 0.01 ? 'upward' : slope < -0.01 ? 'downward' : 'stable',
        perYear: slope
      }
    }
  }

  return {
    average,
    minimum: minEntry,
    maximum: maxEntry,
    change,
    trend,
    period: `${fromYear}–${toYear}`
  }
}

function displayKeyFigures(figures) {
  // Update period badge
  const periodBadge = document.getElementById('key-figures-period')
  if (periodBadge) {
    periodBadge.textContent = figures.period
  }

  // Update average
  const averageValue = document.getElementById('average-value')
  if (averageValue) {
    averageValue.textContent = figures.average !== null 
      ? `${formatLargeNumber(figures.average)} ${currentMetric.unit || ''}`
      : '--'
  }

  // Update minimum
  const minimumValue = document.getElementById('minimum-value')
  const minimumDetail = document.getElementById('minimum-detail')
  if (minimumValue && minimumDetail) {
    if (figures.minimum) {
      minimumValue.textContent = `${formatLargeNumber(figures.minimum.value)} ${currentMetric.unit || ''}`
      minimumDetail.textContent = `${figures.minimum.country}, ${figures.minimum.year}`
    } else {
      minimumValue.textContent = '--'
      minimumDetail.textContent = '--'
    }
  }

  // Update maximum
  const maximumValue = document.getElementById('maximum-value')
  const maximumDetail = document.getElementById('maximum-detail')
  if (maximumValue && maximumDetail) {
    if (figures.maximum) {
      maximumValue.textContent = `${formatLargeNumber(figures.maximum.value)} ${currentMetric.unit || ''}`
      maximumDetail.textContent = `${figures.maximum.country}, ${figures.maximum.year}`
    } else {
      maximumValue.textContent = '--'
      maximumDetail.textContent = '--'
    }
  }

  // Update change
  const changeValue = document.getElementById('change-value')
  const changeDetail = document.getElementById('change-detail')
  if (changeValue && changeDetail) {
    if (figures.change) {
      const sign = figures.change.value >= 0 ? '+' : ''
      changeValue.textContent = `${sign}${formatLargeNumber(figures.change.value)} ${currentMetric.unit || ''}`
      changeDetail.textContent = `${figures.change.fromYear} → ${figures.change.toYear}`
    } else {
      changeValue.textContent = '--'
      changeDetail.textContent = '--'
    }
  }

  // Update trend
  const trendValue = document.getElementById('trend-value')
  const trendDetail = document.getElementById('trend-detail')
  const trendIcon = document.getElementById('trend-icon')
  if (trendValue && trendDetail && trendIcon) {
    if (figures.trend) {
      const direction = figures.trend.direction
      trendValue.textContent = direction.charAt(0).toUpperCase() + direction.slice(1)
      
      const sign = figures.trend.perYear >= 0 ? '+' : ''
      trendDetail.textContent = `${sign}${formatLargeNumber(figures.trend.perYear)} ${currentMetric.unit || ''} per year`
      
      // Update trend icon
      if (direction === 'upward') {
        trendIcon.textContent = '📈'
      } else if (direction === 'downward') {
        trendIcon.textContent = '📉'
      } else {
        trendIcon.textContent = '➡️'
      }
    } else {
      trendValue.textContent = '--'
      trendDetail.textContent = '--'
      trendIcon.textContent = '📊'
    }
  }
}

function showKeyFigures() {
  const keyFiguresSection = document.getElementById('key-figures-section')
  if (keyFiguresSection) {
    keyFiguresSection.style.display = 'block'
  }
}

function hideKeyFigures() {
  const keyFiguresSection = document.getElementById('key-figures-section')
  if (keyFiguresSection) {
    keyFiguresSection.style.display = 'none'
  }
}

// Vertical crosshair plugin for Chart.js
const verticalCrosshairPlugin = {
  id: 'crosshairLine',
  afterDraw(chart) {
    if (chart.tooltip?._active && chart.tooltip._active.length) {
      const ctx = chart.ctx
      ctx.save()
      const activePoint = chart.tooltip._active[0]
      ctx.beginPath()
      ctx.moveTo(activePoint.element.x, chart.chartArea.top)
      ctx.lineTo(activePoint.element.x, chart.chartArea.bottom)
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#2563eb'
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }
  }
}

function getColor(idx, alpha = 1) {
  const colors = [
    `rgba(37,99,235,${alpha})`,
    `rgba(234,88,12,${alpha})`,
    `rgba(16,185,129,${alpha})`,
    `rgba(139,92,246,${alpha})`,
    `rgba(239,68,68,${alpha})`,
    `rgba(251,191,36,${alpha})`,
    `rgba(59,130,246,${alpha})`,
    `rgba(168,85,247,${alpha})`,
    `rgba(34,197,94,${alpha})`,
    `rgba(245,158,11,${alpha})`
  ]
  return colors[idx % colors.length]
}

function renderSelectedCountries() {
  // Render selected countries
  const container = document.getElementById("selected-countries")
  if (!container) return
  container.innerHTML = ""
  selectedCountries.forEach((country, idx) => {
    const tag = document.createElement("div")
    tag.className = "country-tag"
    tag.setAttribute("data-country-code", country.code)
    tag.innerHTML = `
      ${country.name}
      <button class="remove-country" title="Remove" data-remove-country="${country.code}">×</button>
    `
    container.appendChild(tag)
  })
  container.querySelectorAll(".remove-country").forEach(btn => {
    btn.onclick = function () {
      const code = this.getAttribute("data-remove-country")
      removeCountryFromChart(code)
    }
  })
  updateCountryCount()
}

function removeCountryFromChart(code) {
  selectedCountries = selectedCountries.filter(c => c.code !== code)
  if (currentView === "histogram") {
    plotHistogramChart()
  } else {
    plotMultiLineChart()
  }
  renderSelectedCountries()
  updateCountryCount()
  updateKeyFigures() // Update key figures when country is removed
}

// Add country dropdown setup
function setupAddCountryDropdown() {
  if (countryDropdown) countryDropdown.remove()
  countryDropdown = document.createElement("div")
  countryDropdown.className = "country-dropdown-modal"
  countryDropdown.style.position = "fixed"
  countryDropdown.style.zIndex = 9999
  countryDropdown.style.background = "#fff"
  countryDropdown.style.border = "1.5px solid #d1d5db"
  countryDropdown.style.borderRadius = "10px"
  countryDropdown.style.boxShadow = "0 6px 32px rgba(0,0,0,0.13)"
  countryDropdown.style.padding = "1rem"
  countryDropdown.style.minWidth = "260px"
  countryDropdown.style.maxHeight = "340px"
  countryDropdown.style.overflowY = "auto"
  countryDropdown.innerHTML = `
    <div style="font-weight:600;font-size:1.08rem;margin-bottom:0.7rem;">Add a Country</div>
    <input type="text" id="country-search-input" placeholder="Search country..." style="width:100%;margin-bottom:10px;padding:7px 12px;border:1.5px solid #d1d5db;border-radius:7px;font-size:1rem;">
    <div id="country-options-list"></div>
  `
  const already = new Set(selectedCountries.map(c => c.code))
  let options = availableCountries.filter(c => !already.has(c.code))
  const optionsList = countryDropdown.querySelector('#country-options-list')
  function renderOptions(filter = "") {
    optionsList.innerHTML = ""
    let filtered = options
    if (filter) {
      filtered = options.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    }
    if (filtered.length === 0) {
      optionsList.innerHTML = `<div style="color:#64748b;">${filter ? "No countries found." : "All available countries added."}</div>`
    } else {
      filtered.forEach(c => {
        const btn = document.createElement("button")
        btn.className = "country-option-btn"
        btn.textContent = c.name
        btn.style.display = "block"
        btn.style.width = "100%"
        btn.style.textAlign = "left"
        btn.style.padding = "7px 12px"
        btn.style.marginBottom = "2px"
        btn.style.background = "#f3f6fd"
        btn.style.border = "none"
        btn.style.borderRadius = "6px"
        btn.style.cursor = "pointer"
        btn.style.fontSize = "1rem"
        btn.onmouseenter = () => btn.style.background = "#e0e7ff"
        btn.onmouseleave = () => btn.style.background = "#f3f6fd"
        btn.onclick = async () => {
          btn.disabled = true
          await addCountryToChart(c)
          options = options.filter(opt => opt.code !== c.code)
          renderOptions(document.getElementById('country-search-input').value)
          countryDropdown.remove()
        }
        optionsList.appendChild(btn)
      })
    }
  }
  renderOptions()
  countryDropdown.querySelector('#country-search-input').addEventListener('input', e => {
    renderOptions(e.target.value)
  })
  document.body.appendChild(countryDropdown)
  const btn = document.getElementById("add-country-btn")
  const rect = btn.getBoundingClientRect()
  countryDropdown.style.left = `${rect.left}px`
  countryDropdown.style.top = `${rect.bottom + 6}px`
  setTimeout(() => {
    document.addEventListener("mousedown", function handler(e) {
      if (!countryDropdown.contains(e.target)) {
        countryDropdown.remove()
        document.removeEventListener("mousedown", handler)
      }
    })
  }, 0)
}

document.getElementById("add-country-btn").onclick = setupAddCountryDropdown

async function addCountryToChart(country) {
  // Add country to chart
  if (selectedCountries.some(c => c.code === country.code)) return
  const optionsList = document.getElementById('country-options-list')
  if (optionsList) {
    const btns = optionsList.querySelectorAll('.country-option-btn')
    btns.forEach(btn => {
      if (btn.textContent === country.name) {
        btn.disabled = true
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:7px;">${country.name}<span class='mini-spinner' style='width:15px;height:15px;display:inline-block;vertical-align:middle;'><svg style='display:block' width='15' height='15' viewBox='0 0 50 50'><circle cx='25' cy='25' r='20' fill='none' stroke='#2563eb' stroke-width='5' stroke-linecap='round' stroke-dasharray='31.4 31.4' transform='rotate(-90 25 25)'><animateTransform attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='0.7s' repeatCount='indefinite'/></circle></svg></span></span>`
      }
    })
  }

  // Determine if metric is live or manual
  if (currentMetric && currentMetric.type === "manual") {
    // Fetch manual metric data for the selected country
    let url = `/api/v1/metric-data/fetch-manual-metric-data?name=${encodeURIComponent(currentMetric.name)}&industry=${encodeURIComponent(currentMetric.industry || '')}&country=${encodeURIComponent(country.name)}`
    const response = await fetch(url)
    if (!response.ok) return
    const result = await response.json()
    if (!result.success || !result.data) return
    const countryData = result.data.data || []
    selectedCountries.push({ code: country.name, name: country.name, data: countryData })
  } else {
    // Live metric logic (existing)
    let url = `/api/v1/metric-data/fetch-live-metric-data?countryCode=${country.code}&indicatorCode=${encodeURIComponent(currentMetric.indicatorCode)}`
    const fromYear = document.getElementById("from-year")?.value
    const toYear = document.getElementById("to-year")?.value
    if (fromYear) url += `&startYear=${fromYear}`
    if (toYear) url += `&endYear=${toYear}`
    const response = await fetch(url)
    if (!response.ok) return
    const result = await response.json()
    if (!result.success || !result.data) return
    const countryData = result.data.data || []
    selectedCountries.push({ code: country.code, name: country.name, data: countryData })
  }

  if (currentView === "histogram") {
    plotHistogramChart()
  } else {
    plotMultiLineChart()
  }
  renderSelectedCountries()
  updateKeyFigures() // Update key figures when country is added
}

// Mini spinner styles
(function addMiniSpinnerStyle() {
  if (document.getElementById('mini-spinner-style')) return
  const style = document.createElement('style')
  style.id = 'mini-spinner-style'
  style.textContent = `
    .mini-spinner svg {
      animation: mini-spin 0.7s linear infinite;
    }
    @keyframes mini-spin {
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
})()

function showChartPlaceholder(msg) {
  const chartContainer = document.getElementById("chart-container")
  chartContainer.innerHTML = `<div class="chart-placeholder"><svg class="chart-icon" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg><h4>Chart Ready</h4><p>${msg || "Your data visualization will appear here once countries are selected."}</p></div>`
}

function formatLargeNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T"
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
  return num?.toLocaleString() || "0"
}

function displayMetricDetails(metric) {
  // Display metric details
  const metricTitle = document.getElementById("metric-title")
  if (metricTitle) {
    metricTitle.textContent = metric.name || "Unknown Metric"
  }

  const metricDescription = document.getElementById("metric-description")
  if (metricDescription) {
    metricDescription.textContent = metric.description || ""
  }

  const metricMeta = document.getElementById("metric-meta")
  if (metricMeta) {
    metricMeta.innerHTML = `
      <div class="meta-item">
        <div class="meta-label">Unit</div>
        <div class="meta-value">${metric.unit || "N/A"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Source</div>
        <div class="meta-value">${metric.source || "N/A"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Type</div>
        <div class="meta-value">${(metric.type || "manual").toUpperCase()}</div>
      </div>
      ${metric.industry
        ? `
        <div class="meta-item">
          <div class="meta-label">Industry</div>
          <div class="meta-value">${metric.industry}</div>
        </div>
      `
        : ""
      }
    `
  }

  document.title = `${metric.name || "Metric"} - Explorer - EconoViz`

  const explorerContent = document.getElementById("explorer-content")
  if (explorerContent) {
    explorerContent.style.display = "block"
  }

  let sourceNote = document.getElementById("data-source-note")
  if (!sourceNote) {
    sourceNote = document.createElement("div")
    sourceNote.id = "data-source-note"
    sourceNote.style.margin = "18px 0 0 0"
    sourceNote.style.fontSize = "0.98rem"
    sourceNote.style.color = "#64748b"
    sourceNote.style.textAlign = "right"
    sourceNote.style.fontStyle = "italic"
    const chartContainer = document.getElementById("chart-container")
    if (chartContainer && chartContainer.parentElement) {
      chartContainer.parentElement.insertBefore(sourceNote, chartContainer.nextSibling)
    }
  }
  sourceNote.textContent = metric.source ? `Source: ${metric.source}` : ""

  addCountryTag("India", "IN")
  updateCountryCount()

  console.log("Metric details loaded:", metric)
}

function updateCountryCount() {
  // Update country count
  const selectedCountries = document.getElementById("selected-countries")
  const countryCount = document.getElementById("country-count")

  if (selectedCountries && countryCount) {
    const count = selectedCountries.children.length
    countryCount.textContent = `${count} ${count === 1 ? "country" : "countries"}`
  }
}

function addCountryTag(countryName, countryCode) {
  // Add country tag
  const selectedCountries = document.getElementById("selected-countries")
  if (!selectedCountries) return

  const existingTag = selectedCountries.querySelector(`[data-country-code="${countryCode}"]`)
  if (existingTag) return

  const countryTag = document.createElement("div")
  countryTag.className = "country-tag"
  countryTag.setAttribute("data-country-code", countryCode)
  countryTag.innerHTML = `
        ${countryName}
        <button class="remove-country" onclick="removeCountryTag('${countryCode}')">×</button>
    `

  selectedCountries.appendChild(countryTag)
  updateCountryCount()
}

function removeCountryTag(countryCode) {
  // Remove country tag
  const selectedCountries = document.getElementById("selected-countries")
  if (!selectedCountries) return

  const countryTag = selectedCountries.querySelector(`[data-country-code="${countryCode}"]`)
  if (countryTag) {
    countryTag.remove()
    updateCountryCount()
  }
}

function setActiveView(viewType) {
  const chartViewBtn = document.getElementById("chart-view-btn")
  const histogramViewBtn = document.getElementById("histogram-view-btn")

  if (chartViewBtn && histogramViewBtn) {
    chartViewBtn.classList.toggle("active", viewType === "chart")
    histogramViewBtn.classList.toggle("active", viewType === "histogram")
  }

  console.log(`Switched to ${viewType} view`)
}

function handleDateRangeChange() {
  // Handle date range change
  const fromYear = document.getElementById("from-year").value
  const toYear = document.getElementById("to-year").value

  console.log(`Date range changed: ${fromYear} - ${toYear}`)
}

function handleAddCountry() {
  setupAddCountryDropdown();
}

// CSV download functions
function showCsvDownloadConfirm(onConfirm) {
  const existing = document.getElementById('csvDownloadModal')
  if (existing) existing.remove()
  const modal = document.createElement('div')
  modal.id = 'csvDownloadModal'
  modal.style.position = 'fixed'
  modal.style.top = '0'
  modal.style.left = '0'
  modal.style.width = '100vw'
  modal.style.height = '100vh'
  modal.style.background = 'rgba(0,0,0,0.18)'
  modal.style.display = 'flex'
  modal.style.alignItems = 'center'
  modal.style.justifyContent = 'center'
  modal.style.zIndex = 99999
  modal.innerHTML = `
    <div style="background:#fff;padding:2rem 2.2rem;border-radius:13px;box-shadow:0 8px 32px rgba(0,0,0,0.13);min-width:320px;max-width:90vw;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.1rem;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#2563eb"/></svg>
        <span style="font-size:1.13rem;font-weight:600;">Download CSV?</span>
      </div>
      <div style="margin-bottom:1.3rem;color:#374151;font-size:1rem;">Do you want to download the current data as a CSV file?</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button id="csvCancelBtn" style="padding:7px 18px;border-radius:7px;border:none;background:#e5e7eb;color:#374151;font-weight:500;font-size:1rem;cursor:pointer;">Cancel</button>
        <button id="csvConfirmBtn" style="padding:7px 18px;border-radius:7px;border:none;background:#2563eb;color:#fff;font-weight:600;font-size:1rem;cursor:pointer;">Download</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  document.getElementById('csvCancelBtn').onclick = () => modal.remove()
  document.getElementById('csvConfirmBtn').onclick = () => {
    modal.remove()
    onConfirm()
  }
}

function handleDownloadCsv() {
  if (!currentMetric || !selectedCountries.length) {
    alert("No metric data available to download")
    return
  }
  showCsvDownloadConfirm(() => {
    const fromYear = parseInt(document.getElementById("from-year")?.value)
    const toYear = parseInt(document.getElementById("to-year")?.value)
    const yearSet = new Set()
    selectedCountries.forEach(country => {
      const data = country.data || (country.code === "IN" ? liveMetricData : [])
      data.forEach(d => {
        const y = parseInt(d.year)
        if (!isNaN(y) && (!fromYear || y >= fromYear) && (!toYear || y <= toYear)) {
          yearSet.add(y)
        }
      })
    })
    const years = Array.from(yearSet).filter(y => (!fromYear || y >= fromYear) && (!toYear || y <= toYear)).sort((a, b) => b - a)
    let csv = 'Year'
    selectedCountries.forEach(country => {
      csv += `,${country.name}`
    })
    csv += '\n'
    const countryYearMap = {}
    selectedCountries.forEach(country => {
      const data = country.data || (country.code === "IN" ? liveMetricData : [])
      countryYearMap[country.code] = {}
      data.forEach(d => {
        const y = parseInt(d.year)
        if (!isNaN(y) && (!fromYear || y >= fromYear) && (!toYear || y <= toYear)) {
          countryYearMap[country.code][y] = d.value
        }
      })
    })
    years.forEach(year => {
      let row = `${year}`
      selectedCountries.forEach(country => {
        const val = countryYearMap[country.code][year]
        row += `,${val !== undefined && val !== null ? val : ''}`
      })
      csv += row + '\n'
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentMetric.name || 'metric-data'}.csv`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  })
}

function showLoading() {
  // Show loading
  const loading = document.getElementById("loading")
  const error = document.getElementById("error")
  const explorerContent = document.getElementById("explorer-content")

  if (loading) loading.style.display = "flex"
  if (error) error.style.display = "none"
  if (explorerContent) explorerContent.style.display = "none"
}

function hideLoading() {
  const loading = document.getElementById("loading")
  if (loading) loading.style.display = "none"
}

function showError(message) {
  // Show error
  const loading = document.getElementById("loading")
  const error = document.getElementById("error")
  const errorMessage = document.getElementById("errorMessage")
  const explorerContent = document.getElementById("explorer-content")

  if (loading) loading.style.display = "none"
  if (error) error.style.display = "flex"
  if (errorMessage) errorMessage.textContent = message
  if (explorerContent) explorerContent.style.display = "none"
}

// Auth functions, error handling, visibility change
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/v1/users/me", {
      method: "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      throw new Error("Not authenticated")
    }

    const data = await response.json()
    const user = data.data

    if (!user || user.status !== true) {
      await fetch("/api/v1/users/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      })
      localStorage.removeItem("authData")
      window.location.href = "../index.html"
      return
    }
  } catch (error) {
    await fetch("/api/v1/users/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    })
    localStorage.removeItem("authData")
    window.location.href = "../index.html"
    return
  }
}

checkAuthStatus()

window.addEventListener("error", (e) => {
  console.error("Explorer error:", e.error)
})

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking auth status...")
    checkAuthStatus()
  }
})
