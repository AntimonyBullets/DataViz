document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuthStatus()
  // Initialize metric data management
  initializeMetricDataManagement()
  // Set up event listeners
  setupEventListeners()
  // Load initial data
  loadManualMetrics()
  loadMetricData()
})

// Global variables
let allMetricData = []
let filteredMetricData = [] // Add this for frontend filtering
let currentPage = 1
let isLoading = false
let hasMoreData = true
let availableMetrics = []
let availableCountries = [] // Add this for country filtering
let currentEditingData = null
let selectedMetricId = null // Add this to track selected metric

function checkAuthStatus() {
  const adminData = localStorage.getItem("adminData")
  if (!adminData) {
    console.log("User not authenticated, redirecting to login...")
    window.location.href = "../login.html"
    return
  }

  try {
    const userData = JSON.parse(adminData)
    console.log("User authenticated:", userData)
    if (userData.name || userData.username) {
      updateUserInfo(userData)
    }
  } catch (error) {
    console.error("Error parsing admin data:", error)
    localStorage.removeItem("adminData")
    window.location.href = "../login.html"
  }
}

function updateUserInfo(userData) {
  const headerSubtitle = document.querySelector(".header-subtitle")
  if (headerSubtitle && (userData.name || userData.username)) {
    headerSubtitle.textContent = `Welcome back, ${userData.name || userData.username}!`
  }
}

function initializeMetricDataManagement() {
  console.log("DataViz Metric Data Management initialized")
  // Initialize country filter as disabled
  disableCountryFilter()
  // Initialize delete button as disabled
  updateDeleteButtonState()
}

function setupEventListeners() {
  // Filter event listeners
  const metricFilter = document.getElementById("metricFilter")
  const countryFilter = document.getElementById("countryFilter")
  const clearFiltersBtn = document.getElementById("clearFiltersBtn")

  if (metricFilter) {
    metricFilter.addEventListener("change", handleFilters)
  }

  if (countryFilter) {
    countryFilter.addEventListener("change", handleFilters)
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters)
  }

  // Action button event listeners
  const viewFormatBtn = document.getElementById("viewFormatBtn")
  const uploadCsvBtn = document.getElementById("uploadCsvBtn")
  const deleteDataBtn = document.getElementById("deleteDataBtn")

  if (viewFormatBtn) {
    viewFormatBtn.addEventListener("click", showCsvFormatModal)
  }

  if (uploadCsvBtn) {
    uploadCsvBtn.addEventListener("click", handleUploadCsv)
  }

  if (deleteDataBtn) {
    deleteDataBtn.addEventListener("click", handleDeleteData)
  }

  // Modal event listeners
  setupModalEventListeners()

  // Infinite scroll
  setupInfiniteScroll()
}

function setupModalEventListeners() {
  // Edit Value Modal
  const editValueModal = document.getElementById("editValueModal")
  const closeEditValueBtn = document.getElementById("closeEditValueModal")
  const cancelEditValueBtn = document.getElementById("cancelEditValueBtn")
  const saveValueBtn = document.getElementById("saveValueBtn")

  if (closeEditValueBtn) {
    closeEditValueBtn.addEventListener("click", closeEditValueModal)
  }

  if (cancelEditValueBtn) {
    cancelEditValueBtn.addEventListener("click", closeEditValueModal)
  }

  if (saveValueBtn) {
    saveValueBtn.addEventListener("click", saveMetricValue)
  }

  if (editValueModal) {
    editValueModal.addEventListener("click", (e) => {
      if (e.target === editValueModal) {
        closeEditValueModal()
      }
    })
  }

  // CSV Format Modal
  const csvFormatModal = document.getElementById("csvFormatModal")
  const closeCsvFormatBtn = document.getElementById("closeCsvFormatModal")
  const downloadTemplateBtn = document.getElementById("downloadTemplateBtn")

  if (closeCsvFormatBtn) {
    closeCsvFormatBtn.addEventListener("click", closeCsvFormatModal)
  }

  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener("click", downloadCsvTemplate)
  }

  if (csvFormatModal) {
    csvFormatModal.addEventListener("click", (e) => {
      if (e.target === csvFormatModal) {
        closeCsvFormatModal()
      }
    })
  }

  // Close modals with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (editValueModal.classList.contains("show")) {
        closeEditValueModal()
      }
      if (csvFormatModal.classList.contains("show")) {
        closeCsvFormatModal()
      }
    }
  })

  // Form validation for edit value
  const newValueInput = document.getElementById("newValue")
  if (newValueInput) {
    newValueInput.addEventListener("input", validateValueInput)
    newValueInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !document.getElementById("saveValueBtn").disabled) {
        e.preventDefault()
        saveMetricValue()
      }
    })
  }
}

function setupInfiniteScroll() {
  const tableWrapper = document.getElementById("tableWrapper")
  if (tableWrapper) {
    tableWrapper.addEventListener("scroll", () => {
      if (tableWrapper.scrollTop + tableWrapper.clientHeight >= tableWrapper.scrollHeight - 5) {
        if (!isLoading && hasMoreData) {
          loadMoreMetricData()
        }
      }
    })
  }
}

function updateDeleteButtonState() {
  const deleteBtn = document.getElementById("deleteDataBtn")
  if (deleteBtn) {
    if (selectedMetricId) {
      deleteBtn.disabled = false
      deleteBtn.style.opacity = "1"
      deleteBtn.style.cursor = "pointer"
    } else {
      deleteBtn.disabled = true
      deleteBtn.style.opacity = "0.5"
      deleteBtn.style.cursor = "not-allowed"
    }
  }
}

async function loadManualMetrics() {
  try {
    const response = await fetch("/api/v1/metric-data-management/get-manual-metrics", {
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
    availableMetrics = Array.isArray(data) ? data : data.data || []
    populateMetricFilter()
    console.log("Manual metrics loaded:", availableMetrics)
  } catch (error) {
    console.error("Error loading manual metrics:", error)
    showErrorMessage("Failed to load metrics for filtering.")
  }
}

function populateMetricFilter() {
  const metricFilter = document.getElementById("metricFilter")
  if (!metricFilter) return

  // Clear existing options except the first one
  metricFilter.innerHTML = '<option value="">All Metrics</option>'

  availableMetrics.forEach((metric) => {
    const option = document.createElement("option")
    option.value = metric._id || metric.id // Use metric ID as value
    option.dataset.metricId = metric._id || metric.id // Store metric ID
    // Format: "Name - INDUSTRY" or just "Name" if no industry
    if (metric.industry && metric.industry.trim() !== "") {
      option.textContent = `${metric.name} - ${metric.industry.toUpperCase()}`
    } else {
      option.textContent = metric.name
    }
    metricFilter.appendChild(option)
  })
}

async function loadMetricData(reset = false) {
  if (isLoading) return

  try {
    isLoading = true
    if (reset) {
      currentPage = 1
      allMetricData = []
      hasMoreData = true
      showLoadingState()
    }

    const response = await fetch(`/api/v1/metric-data-management/all-metric-data?page=${currentPage}`, {
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
    const newData = Array.isArray(data) ? data.data : data.data.data || []

    if (newData.length === 0) {
      hasMoreData = false
    } else {
      allMetricData = reset ? newData : [...allMetricData, ...newData]
      currentPage++
    }

    renderMetricDataTable()
    updateTotalCount()
    console.log(`Loaded ${newData.length} metric data entries. Total: ${allMetricData.length}`)
  } catch (error) {
    console.error("Error loading metric data:", error)
    if (reset) {
      showErrorState("Failed to load metric data. Please try again.")
    } else {
      showErrorMessage("Failed to load more data.")
    }
  } finally {
    isLoading = false
    hideLoadMoreIndicator()
  }
}

async function loadMoreMetricData() {
  if (isLoading || !hasMoreData) return
  showLoadMoreIndicator()
  await loadMetricData(false)
}

function showLoadingState() {
  const tableBody = document.getElementById("metricDataTableBody")
  tableBody.innerHTML = `
    <tr class="loading-row">
      <td colspan="5">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading metric data...</span>
        </div>
      </td>
    </tr>
  `
}

function showErrorState(message) {
  const tableBody = document.getElementById("metricDataTableBody")
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="no-data">
        <div style="color: #ef4444;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
          </svg>
          <p>${message}</p>
          <button onclick="loadMetricData(true)" style="margin-top: 12px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Retry
          </button>
        </div>
      </td>
    </tr>
  `
}

function showLoadMoreIndicator() {
  const indicator = document.getElementById("loadMoreIndicator")
  if (indicator) {
    indicator.style.display = "block"
  }
}

function hideLoadMoreIndicator() {
  const indicator = document.getElementById("loadMoreIndicator")
  if (indicator) {
    indicator.style.display = "none"
  }
}

function handleFilters() {
  const metricFilter = document.getElementById("metricFilter")
  const countryFilter = document.getElementById("countryFilter")

  const newSelectedMetricId = metricFilter.value
  const selectedCountry = countryFilter.value

  // If metric selection changed
  if (newSelectedMetricId !== selectedMetricId) {
    selectedMetricId = newSelectedMetricId

    if (selectedMetricId) {
      // Specific metric selected - load its data and enable country filter
      loadMetricSpecificData(selectedMetricId)
      enableCountryFilter()
    } else {
      // All metrics selected - load all data and disable country filter
      selectedMetricId = null
      disableCountryFilter()
      loadMetricData(true) // Reset to load all data
    }

    // Update delete button state
    updateDeleteButtonState()
  } else if (selectedMetricId) {
    // Same metric, but country filter might have changed
    applyCountryFilter(selectedCountry)
  }
}

async function loadMetricSpecificData(metricId) {
  if (isLoading) return

  try {
    isLoading = true
    selectedMetricId = metricId
    showLoadingState()

    const response = await fetch(`/api/v1/metric-data-management/get-manual-metric-data?metricId=${metricId}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data || {}

    allMetricData = data.data || []
    filteredMetricData = [...allMetricData]
    availableCountries = data.countries || []

    // Disable infinite scroll for specific metric data
    hasMoreData = false
    currentPage = 1

    populateCountryFilter()
    renderMetricDataTable()
    updateTotalCount()

    console.log(`Loaded ${allMetricData.length} entries for metric ${metricId}`)
    console.log("Available countries:", availableCountries)
  } catch (error) {
    console.error("Error loading metric-specific data:", error)
    showErrorState("Failed to load metric data. Please try again.")
  } finally {
    isLoading = false
    hideLoadMoreIndicator()
  }
}

function populateCountryFilter() {
  const countryFilter = document.getElementById("countryFilter")
  if (!countryFilter) return

  // Clear existing options
  countryFilter.innerHTML = '<option value="">All Countries</option>'

  // Add countries from the API response
  availableCountries.forEach((country) => {
    const option = document.createElement("option")
    option.value = country
    option.textContent = country
    countryFilter.appendChild(option)
  })
}

function enableCountryFilter() {
  const countryFilter = document.getElementById("countryFilter")
  if (countryFilter) {
    countryFilter.disabled = false
    countryFilter.style.opacity = "1"
    countryFilter.style.cursor = "pointer"
  }
}

function disableCountryFilter() {
  const countryFilter = document.getElementById("countryFilter")
  if (countryFilter) {
    countryFilter.disabled = true
    countryFilter.value = ""
    countryFilter.style.opacity = "0.5"
    countryFilter.style.cursor = "not-allowed"
    // Reset to default options
    countryFilter.innerHTML = `
      <option value="">All Countries</option>
      <option value="US">United States</option>
      <option value="UK">United Kingdom</option>
      <option value="CA">Canada</option>
      <option value="AU">Australia</option>
      <option value="DE">Germany</option>
      <option value="FR">France</option>
      <option value="JP">Japan</option>
      <option value="CN">China</option>
      <option value="IN">India</option>
      <option value="BR">Brazil</option>
    `
  }
}

function applyCountryFilter(selectedCountry) {
  const countryFilter = document.getElementById("countryFilter")
  // Set the dropdown to show the selected country
  countryFilter.value = selectedCountry || ""

  if (!selectedCountry) {
    filteredMetricData = [...allMetricData]
  } else {
    filteredMetricData = allMetricData.filter((data) => data.country === selectedCountry)
  }

  renderFilteredMetricDataTable()
  updateTotalCount()
}

function renderFilteredMetricDataTable() {
  const tableBody = document.getElementById("metricDataTableBody")

  if (filteredMetricData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          <div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; color: #64748b;">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>No metric data found for the selected filters.</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  const rows = filteredMetricData
    .map((data, index) => {
      const dataId = data._id || data.id || index
      const metricName = data.metricName || data.metric_name || data.name || "N/A"
      const industry = data.industry || "N/A"
      const country = data.country || "N/A"
      const value = data.value !== undefined ? data.value : "N/A"
      const year = data.year || "N/A"

      const industryDisplay =
        industry !== "N/A" && industry.trim() !== ""
          ? `<span class="industry-badge">${escapeHtml(industry)}</span>`
          : `<span style="color: #64748b; font-style: italic;">N/A</span>`

      return `
        <tr data-id="${dataId}">
          <td>
            <div style="font-weight: 500;">${escapeHtml(metricName)}</div>
          </td>
          <td>
            ${industryDisplay}
          </td>
          <td>
            <div>${escapeHtml(country)}</div>
          </td>
          <td>
            <div class="value-cell">
              <span class="value-display">${escapeHtml(value.toString())}</span>
              <button class="edit-value-btn" onclick="openEditValueModal('${dataId}')" title="Edit Value">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 2.96086 2 3.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </td>
          <td>
            <div>${escapeHtml(year.toString())}</div>
          </td>
        </tr>
      `
    })
    .join("")

  tableBody.innerHTML = rows
}

function renderMetricDataTable() {
  if (selectedMetricId) {
    // Use filtered data for specific metric
    renderFilteredMetricDataTable()
  } else {
    // Use original rendering for all metrics
    const tableBody = document.getElementById("metricDataTableBody")

    if (allMetricData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="no-data">
            <div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; color: #64748b;">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p>No metric data found.</p>
            </div>
          </td>
        </tr>
      `
      return
    }

    const rows = allMetricData
      .map((data, index) => {
        const dataId = data._id || data.id || index
        const metricName = data.metricName || data.metric_name || data.name || "N/A"
        const industry = data.industry || "N/A"
        const country = data.country || "N/A"
        const value = data.value !== undefined ? data.value : "N/A"
        const year = data.year || "N/A"

        const industryDisplay =
          industry !== "N/A"
            ? `<span class="industry-badge">${escapeHtml(industry)}</span>`
            : `<span style="color: #64748b; font-style: italic;">N/A</span>`

        return `
          <tr data-id="${dataId}">
            <td>
              <div style="font-weight: 500;">${escapeHtml(metricName)}</div>
            </td>
            <td>
              ${industryDisplay}
            </td>
            <td>
              <div>${escapeHtml(country)}</div>
            </td>
            <td>
              <div class="value-cell">
                <span class="value-display">${escapeHtml(value.toString())}</span>
                <button class="edit-value-btn" onclick="openEditValueModal('${dataId}')" title="Edit Value">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 2.96086 2 3.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </td>
            <td>
              <div>${escapeHtml(year.toString())}</div>
            </td>
          </tr>
        `
      })
      .join("")

    tableBody.innerHTML = rows
  }
}

function updateTotalCount() {
  const totalElement = document.getElementById("totalMetricData")
  if (totalElement) {
    if (selectedMetricId) {
      // Show filtered count for specific metric
      const displayText = `Total: ${filteredMetricData.length} entries`
      totalElement.textContent = displayText
    } else {
      // Show original count for all metrics
      const displayText = hasMoreData
        ? `Showing: ${allMetricData.length}+ entries`
        : `Total: ${allMetricData.length} entries`
      totalElement.textContent = displayText
    }
  }
}

function clearFilters() {
  document.getElementById("metricFilter").value = ""
  document.getElementById("countryFilter").value = ""

  // Reset state
  selectedMetricId = null
  filteredMetricData = []
  availableCountries = []

  // Disable country filter and reload all data
  disableCountryFilter()
  updateDeleteButtonState()
  loadMetricData(true)

  console.log("Filters cleared")
}

function openEditValueModal(dataId) {
  // Look in the appropriate data array
  const dataArray = selectedMetricId ? filteredMetricData : allMetricData
  const data = dataArray.find((d) => (d._id || d.id || dataArray.indexOf(d)) == dataId)

  if (!data) {
    console.error("Metric data not found:", dataId)
    showErrorMessage("Metric data not found. Please refresh the page and try again.")
    return
  }

  currentEditingData = data

  // Populate modal with data info
  document.getElementById("editMetricName").textContent = data.metricName || data.metric_name || data.name || "N/A"
  document.getElementById("editMetricIndustry").textContent = data.industry || "N/A"
  document.getElementById("editMetricCountry").textContent = data.country || "N/A"
  document.getElementById("editMetricYear").textContent = data.year || "N/A"

  // Set current value
  document.getElementById("newValue").value = data.value || ""

  // Clear any previous errors
  clearValueError()

  // Show modal
  const modal = document.getElementById("editValueModal")
  modal.classList.add("show")
  document.body.style.overflow = "hidden"

  // Focus on input
  setTimeout(() => {
    document.getElementById("newValue").focus()
  }, 100)
}

function closeEditValueModal() {
  const modal = document.getElementById("editValueModal")
  modal.classList.remove("show")
  document.body.style.overflow = ""
  currentEditingData = null

  // Clear form
  document.getElementById("newValue").value = ""
  clearValueError()
}

function validateValueInput() {
  const input = document.getElementById("newValue")
  const saveBtn = document.getElementById("saveValueBtn")
  const value = input.value.trim()

  clearValueError()

  let isValid = true

  if (value === "") {
    showValueError("Value is required")
    isValid = false
  } else if (isNaN(value)) {
    showValueError("Value must be a valid number")
    isValid = false
  }

  saveBtn.disabled = !isValid
  return isValid
}

function showValueError(message) {
  const input = document.getElementById("newValue")
  const errorElement = document.getElementById("newValueError")
  input.classList.add("error")
  errorElement.textContent = message
}

function clearValueError() {
  const input = document.getElementById("newValue")
  const errorElement = document.getElementById("newValueError")
  input.classList.remove("error")
  errorElement.textContent = ""
}

async function saveMetricValue() {
  if (!validateValueInput() || !currentEditingData) {
    return
  }

  const saveBtn = document.getElementById("saveValueBtn")
  const originalText = saveBtn.textContent
  const newValue = Number.parseFloat(document.getElementById("newValue").value.trim())
  const dataId = currentEditingData._id || currentEditingData.id

  try {
    // Show loading state
    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."

    console.log(`Updating metric data ${dataId} value to:`, newValue)

    // Make API call to update value
    const response = await fetch(`/api/v1/metric-data-management/edit-metric-data-value`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metricDataId: dataId,
        value: newValue,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse response
    let result
    try {
      result = await response.json()
    } catch (e) {
      result = { success: true }
    }

    console.log("Metric value updated successfully:", result)

    // Update local data in both arrays
    const updateValue = (dataArray) => {
      const dataIndex = dataArray.findIndex((data) => (data._id || data.id) === dataId)
      if (dataIndex !== -1) {
        dataArray[dataIndex].value = newValue
        return true
      }
      return false
    }

    // Update in allMetricData
    updateValue(allMetricData)

    // Update in filteredMetricData if it exists
    if (filteredMetricData.length > 0) {
      updateValue(filteredMetricData)
    }

    // Re-render the table
    renderMetricDataTable()

    // Close modal
    closeEditValueModal()

    // Show success message
    showSuccessMessage(`Metric value has been updated to ${newValue}.`)
  } catch (error) {
    console.error("Error updating metric value:", error)

    // Show error message with more specific details
    let errorMessage = "Failed to update metric value. Please try again."
    if (error.message.includes("404")) {
      errorMessage = "Metric data not found. Please refresh the page and try again."
    } else if (error.message.includes("403")) {
      errorMessage = "You don't have permission to update this value."
    } else if (error.message.includes("500")) {
      errorMessage = "Server error occurred. Please try again later."
    }

    showErrorMessage(errorMessage)
  } finally {
    // Reset button state
    saveBtn.disabled = false
    saveBtn.textContent = originalText
  }
}

// CSV Format Modal
function showCsvFormatModal() {
  const modal = document.getElementById("csvFormatModal")
  modal.classList.add("show")
  document.body.style.overflow = "hidden"
}

function closeCsvFormatModal() {
  const modal = document.getElementById("csvFormatModal")
  modal.classList.remove("show")
  document.body.style.overflow = ""
}

// Download CSV Template
function downloadCsvTemplate() {
  // Define the CSV headers
  const headers = ["metricName", "industry", "country", "year", "value"]

  // Create CSV content with just the headers
  const csvContent = headers.join(",") + "\n"

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "metric-data-template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show success message
    showSuccessMessage("CSV template downloaded successfully!")
  } else {
    showErrorMessage("Your browser doesn't support file downloads.")
  }
}

// Upload CSV functionality
async function handleUploadCsv() {
  // Create file input element
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.accept = ".csv"
  fileInput.style.display = "none"

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showErrorMessage("Please select a valid CSV file.")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showErrorMessage("File size must be less than 10MB.")
      return
    }

    await uploadCsvFile(file)
  })

  // Trigger file selection
  document.body.appendChild(fileInput)
  fileInput.click()
  document.body.removeChild(fileInput)
}

function showUploadProgressModal() {
  // Create progress modal
  const modal = document.createElement("div")
  modal.id = "uploadProgressModal"
  modal.className = "modal-overlay show"
  modal.innerHTML = `
    <div class="modal-content upload-progress-modal">
      <div class="modal-body">
        <div class="upload-progress-content">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-bar-fill"></div>
            </div>
          </div>
          <p class="upload-message">Please wait, your data is being parsed...</p>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  document.body.style.overflow = "hidden"
  return modal
}

function showUploadResultModal(result) {
  const modal = document.getElementById("uploadProgressModal")
  if (!modal) return

  const data = result.data || {}
  const processed = data.processed || 0
  const inserted = data.inserted || 0
  const skipped = data.skipped || 0
  const errors = data.errors || []

  let errorsHtml = ""
  if (errors.length > 0) {
    errorsHtml = `
      <div class="upload-errors">
        <h4>Errors:</h4>
        <ul>
          ${errors.map((error) => `<li>Row ${error.row}: ${error.reason}</li>`).join("")}
        </ul>
      </div>
    `
  }

  modal.innerHTML = `
    <div class="modal-content upload-result-modal">
      <div class="modal-header">
        <h3>✅ CSV Upload Complete</h3>
        <button class="modal-close" onclick="closeUploadModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="upload-summary">
          <div class="summary-item">
            <span class="summary-label">Total rows processed:</span>
            <span class="summary-value">${processed}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Inserted:</span>
            <span class="summary-value success">${inserted}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Skipped:</span>
            <span class="summary-value warning">${skipped}</span>
          </div>
          ${errorsHtml}
        </div>
      </div>
    </div>
  `
}

function closeUploadModal() {
  const modal = document.getElementById("uploadProgressModal")
  if (modal) {
    modal.remove()
    document.body.style.overflow = ""
  }
}

async function uploadCsvFile(file) {
  const progressModal = showUploadProgressModal()

  try {
    // Create FormData
    const formData = new FormData()
    formData.append("file", file)

    console.log("Uploading CSV file:", file.name)

    // Make API call
    const response = await fetch("/api/v1/metric-data-management/upload-data", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse response
    const result = await response.json()
    console.log("CSV upload successful:", result)

    // Show result in modal
    showUploadResultModal(result)

    // Refresh table data
    if (selectedMetricId) {
      // If a specific metric is selected, reload its data
      loadMetricSpecificData(selectedMetricId)
    } else {
      // If showing all metrics, reload all data
      loadMetricData(true)
    }
  } catch (error) {
    console.error("Error uploading CSV:", error)

    // Show error in modal
    progressModal.innerHTML = `
      <div class="modal-content upload-error-modal">
        <div class="modal-header">
          <h3>❌ Upload Failed</h3>
          <button class="modal-close" onclick="closeUploadModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="error-message">
            <p>Failed to upload CSV file. Please try again.</p>
            ${error.message.includes("400") ? "<p>Invalid CSV format. Please check your file and try again.</p>" : ""}
            ${error.message.includes("413") ? "<p>File too large. Please upload a smaller CSV file.</p>" : ""}
            ${error.message.includes("500") ? "<p>Server error occurred. Please try again later.</p>" : ""}
          </div>
        </div>
      </div>
    `
  }
}

async function handleDeleteData() {
  // Check if we have filtered data to delete
  if (!selectedMetricId) {
    showErrorMessage("Please select a specific metric to delete data.")
    return
  }

  const selectedMetric = availableMetrics.find((m) => (m._id || m.id) === selectedMetricId)
  const metricName = selectedMetric ? selectedMetric.name : "Unknown Metric"

  const countryFilter = document.getElementById("countryFilter")
  const selectedCountry = countryFilter.value

  // Create confirmation message
  let confirmMessage = `Are you sure you want to delete all data for metric "${metricName}"`
  if (selectedCountry) {
    confirmMessage += ` in country "${selectedCountry}"`
  }
  confirmMessage += "? This action cannot be undone."

  // Show confirmation dialog
  if (!confirm(confirmMessage)) {
    return
  }

  const deleteBtn = document.getElementById("deleteDataBtn")
  const originalText = deleteBtn.innerHTML

  try {
    // Show loading state
    deleteBtn.disabled = true
    deleteBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Deleting...
    `

    // Prepare request body
    const requestBody = {
      metricId: selectedMetricId,
    }

    // Add country only if selected
    if (selectedCountry) {
      requestBody.country = selectedCountry
    }

    console.log("Deleting metric data:", requestBody)

    // Make API call
    const response = await fetch("/api/v1/metric-data-management/delete-selected-data", {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse response
    let result
    try {
      result = await response.json()
    } catch (e) {
      result = { success: true }
    }

    console.log("Data deletion successful:", result)

    // Clear filters and reset state
    clearFilters()

    // Show success message
    let successMessage = `Data for metric "${metricName}"`
    if (selectedCountry) {
      successMessage += ` in country "${selectedCountry}"`
    }
    successMessage += " has been deleted successfully."

    showSuccessMessage(successMessage)
  } catch (error) {
    console.error("Error deleting data:", error)

    // Show error message with more specific details
    let errorMessage = "Failed to delete data. Please try again."
    if (error.message.includes("404")) {
      errorMessage = "Data not found. Please refresh the page and try again."
    } else if (error.message.includes("403")) {
      errorMessage = "You don't have permission to delete this data."
    } else if (error.message.includes("500")) {
      errorMessage = "Server error occurred. Please try again later."
    }

    showErrorMessage(errorMessage)
  } finally {
    // Reset button state
    deleteBtn.disabled = false
    deleteBtn.innerHTML = originalText
  }
}

// Helper function to show success message
function showSuccessMessage(message) {
  // Create a temporary success notification
  const notification = document.createElement("div")
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `
  notification.textContent = message

  // Add animation keyframes if not already added
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style")
    style.id = "notification-styles"
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(notification)

  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 4000)
}

// Helper function to show error message
function showErrorMessage(message) {
  // Create a temporary error notification
  const notification = document.createElement("div")
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `
  notification.textContent = message

  document.body.appendChild(notification)

  // Remove notification after 5 seconds (longer for error messages)
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 5000)
}

// Helper function to show info message
function showInfoMessage(message) {
  // Create a temporary info notification
  const notification = document.createElement("div")
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `
  notification.textContent = message

  document.body.appendChild(notification)

  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 4000)
}

// Utility functions
function escapeHtml(text) {
  if (!text) return ""
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Error handling
window.addEventListener("error", (e) => {
  console.error("Metric Data Management error:", e.error)
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking auth status...")
    checkAuthStatus()
  }
})
