document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuthStatus()

  // Initialize metric management
  initializeMetricManagement()

  // Set up event listeners
  setupEventListeners()

  // Load metrics data
  loadMetrics()
})

// Global variables
let allMetrics = []
let filteredMetrics = []
let currentEditingMetric = null
let deleteBtn = null
let originalText = ""
let availableIndustries = []
let isEditMode = false // New variable to track edit mode

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

function initializeMetricManagement() {
  console.log("DataViz Metric Management initialized")
}

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch)
  }

  // Status filter
  const statusFilter = document.getElementById("statusFilter")
  if (statusFilter) {
    statusFilter.addEventListener("change", handleFilters)
  }

  // Date filters
  const dateFromFilter = document.getElementById("dateFromFilter")
  const dateToFilter = document.getElementById("dateToFilter")
  if (dateFromFilter) {
    dateFromFilter.addEventListener("change", handleFilters)
  }
  if (dateToFilter) {
    dateToFilter.addEventListener("change", handleFilters)
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById("clearFiltersBtn")
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters)
  }

  // Add metric button
  const addMetricBtn = document.getElementById("addMetricBtn")
  if (addMetricBtn) {
    addMetricBtn.addEventListener("click", handleAddMetric)
  }

  // Modal event listeners
  setupModalEventListeners()
}

function setupModalEventListeners() {
  // Description modal
  const descriptionModal = document.getElementById("descriptionModal")
  const closeDescriptionBtn = document.getElementById("closeDescriptionModal")

  if (closeDescriptionBtn) {
    closeDescriptionBtn.addEventListener("click", closeDescriptionModal)
  }

  if (descriptionModal) {
    descriptionModal.addEventListener("click", (e) => {
      if (e.target === descriptionModal) {
        closeDescriptionModal()
      }
    })
  }

  // Status edit modal
  const statusModal = document.getElementById("editStatusModal")
  const closeStatusBtn = document.getElementById("closeEditModal")
  const cancelBtn = document.getElementById("cancelEditBtn")
  const saveBtn = document.getElementById("saveStatusBtn")

  if (closeStatusBtn) {
    closeStatusBtn.addEventListener("click", closeEditModal)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeEditModal)
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveMetricStatus)
  }

  if (statusModal) {
    statusModal.addEventListener("click", (e) => {
      if (e.target === statusModal) {
        closeEditModal()
      }
    })
  }

  // Add/Edit Metric modal
  const addMetricModal = document.getElementById("addMetricModal")
  const closeAddMetricBtn = document.getElementById("closeAddMetricModal")
  const cancelAddMetricBtn = document.getElementById("cancelAddMetricBtn")
  const saveMetricBtn = document.getElementById("saveMetricBtn")

  if (closeAddMetricBtn) {
    closeAddMetricBtn.addEventListener("click", closeAddMetricModal)
  }

  if (cancelAddMetricBtn) {
    cancelAddMetricBtn.addEventListener("click", closeAddMetricModal)
  }

  if (saveMetricBtn) {
    saveMetricBtn.addEventListener("click", handleSaveMetric) // Updated to handle both add and edit
  }

  if (addMetricModal) {
    addMetricModal.addEventListener("click", (e) => {
      if (e.target === addMetricModal) {
        closeAddMetricModal()
      }
    })
  }

  // Form validation listeners
  const metricNameInput = document.getElementById("metricName")
  const metricDescriptionInput = document.getElementById("metricDescription")
  const metricUnitInput = document.getElementById("metricUnit")
  const metricTypeSelect = document.getElementById("metricType")
  const metricIndicatorCodeInput = document.getElementById("metricIndicatorCode")

  if (metricNameInput) {
    metricNameInput.addEventListener("input", handleNameInput)
    metricNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !document.getElementById("saveMetricBtn").disabled) {
        e.preventDefault()
        handleSaveMetric()
      }
    })
  }

  if (metricDescriptionInput) {
    metricDescriptionInput.addEventListener("input", handleDescriptionInput)
  }

  if (metricUnitInput) {
    metricUnitInput.addEventListener("input", validateAddMetricForm)
    metricUnitInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !document.getElementById("saveMetricBtn").disabled) {
        e.preventDefault()
        handleSaveMetric()
      }
    })
  }

  // Type dropdown change listener
  if (metricTypeSelect) {
    metricTypeSelect.addEventListener("change", handleTypeChange)
  }

  // Indicator code input validation
  if (metricIndicatorCodeInput) {
    metricIndicatorCodeInput.addEventListener("input", validateAddMetricForm)
  }

  // Close modals with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (descriptionModal.classList.contains("show")) {
        closeDescriptionModal()
      }
      if (statusModal.classList.contains("show")) {
        closeEditModal()
      }
      if (addMetricModal.classList.contains("show")) {
        closeAddMetricModal()
      }
    }
  })
}

// NEW: Handle name input with character counter
function handleNameInput() {
  const nameInput = document.getElementById("metricName")
  const counter = document.getElementById("nameCharCounter")

  const currentLength = nameInput.value.length
  const maxLength = 38

  counter.textContent = `${currentLength}/${maxLength}`

  // Update counter color based on usage
  if (currentLength >= maxLength * 0.9) {
    counter.classList.add("danger")
    counter.classList.remove("warning")
  } else if (currentLength >= maxLength * 0.8) {
    counter.classList.add("warning")
    counter.classList.remove("danger")
  } else {
    counter.classList.remove("warning", "danger")
  }

  validateAddMetricForm()
}

// NEW: Handle description input with character counter
function handleDescriptionInput() {
  const descInput = document.getElementById("metricDescription")
  const counter = document.getElementById("descCharCounter")

  const currentLength = descInput.value.length
  const maxLength = 125

  counter.textContent = `${currentLength}/${maxLength}`

  // Update counter color based on usage
  if (currentLength >= maxLength * 0.9) {
    counter.classList.add("danger")
    counter.classList.remove("warning")
  } else if (currentLength >= maxLength * 0.8) {
    counter.classList.add("warning")
    counter.classList.remove("danger")
  } else {
    counter.classList.remove("warning", "danger")
  }

  validateAddMetricForm()
}

// NEW: Handle type dropdown change
function handleTypeChange() {
  const typeSelect = document.getElementById("metricType")
  const indicatorCodeInput = document.getElementById("metricIndicatorCode")

  if (typeSelect.value === "live") {
    // Enable and make required
    indicatorCodeInput.disabled = false
    indicatorCodeInput.required = true
  } else {
    // Disable and remove required
    indicatorCodeInput.disabled = true
    indicatorCodeInput.required = false
    indicatorCodeInput.value = "" // Clear the value when disabled
    clearFieldError("metricIndicatorCode") // Clear any existing errors
  }

  // Re-validate form
  validateAddMetricForm()
}

async function loadMetrics() {
  try {
    showLoadingState()

    const response = await fetch("/api/v1/metric-management/fetch-all-metrics", {
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

    // Get metrics from response - assuming direct array or data.data structure
    allMetrics = Array.isArray(data) ? data : data.data || []
    filteredMetrics = [...allMetrics]

    console.log("Metrics loaded:", allMetrics)

    renderMetricsTable()
    updateTotalMetricsCount()
  } catch (error) {
    console.error("Error loading metrics:", error)
    showErrorState("Failed to load metrics. Please try again.")
  }
}

function showLoadingState() {
  const tableBody = document.getElementById("metricsTableBody")
  tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="9">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Loading metrics...</span>
                </div>
            </td>
        </tr>
    `
}

function showErrorState(message) {
  const tableBody = document.getElementById("metricsTableBody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="no-data">
                <div style="color: #ef4444;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>${message}</p>
                    <button onclick="loadMetrics()" style="margin-top: 12px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `
}

function renderMetricsTable() {
  const tableBody = document.getElementById("metricsTableBody")

  if (filteredMetrics.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    <div>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; color: #64748b;">
                            <path d="M18 20V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 20V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p>No metrics found matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `
    return
  }

  const rows = filteredMetrics
    .map((metric) => {
      const formattedDate = formatDate(metric.createdAt)
      const status = metric.status ? "active" : "inactive"
      const industry = metric.industry || "N/A"
      const metricId = metric._id || metric.id

      // Actions for all metrics (both manual and live)
      const actionsHtml = `
                <div class="actions-cell">
                    <button class="edit-btn" onclick="editMetric('${metricId}')" title="Edit Metric">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Edit
                    </button>
                    <button class="delete-btn" onclick="deleteMetric('${metricId}', '${escapeHtml(metric.name)}')" title="Delete Metric">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Delete
                    </button>
                </div>
            `

      return `
            <tr data-metric-id="${metricId}">
                <td>
                    <div style="font-weight: 500;">${escapeHtml(metric.name || "N/A")}</div>
                </td>
                <td>
                    <div class="description-cell">
                        <button class="view-description-btn" onclick="viewDescription('${metricId}')" title="View Description">
                            View
                        </button>
                    </div>
                </td>
                <td>
                    <div>${escapeHtml(industry)}</div>
                </td>
                <td>
                    <div>${escapeHtml(metric.unit || "N/A")}</div>
                </td>
                <td>
                    <span class="type-badge ${metric.type || "manual"}">${(metric.type || "manual").toUpperCase()}</span>
                </td>
                <td>
                    <div>${escapeHtml(metric.source || "N/A")}</div>
                </td>
                <td>
                    <div class="status-cell">
                        <span class="status-badge ${status}">${status.toUpperCase()}</span>
                        <button class="edit-status-btn" onclick="openEditStatusModal('${metricId}')" title="Edit Status">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td>
                    <div style="color: #64748b;">${formattedDate}</div>
                </td>
                <td>
                    ${actionsHtml}
                </td>
            </tr>
        `
    })
    .join("")

  tableBody.innerHTML = rows
}

function handleSearch() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()
  applyFilters(searchTerm)
}

function handleFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()
  applyFilters(searchTerm)
}

function applyFilters(searchTerm = "") {
  const statusFilter = document.getElementById("statusFilter").value
  const dateFromFilter = document.getElementById("dateFromFilter").value
  const dateToFilter = document.getElementById("dateToFilter").value

  filteredMetrics = allMetrics.filter((metric) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      (metric.name && metric.name.toLowerCase().includes(searchTerm)) ||
      (metric.description && metric.description.toLowerCase().includes(searchTerm)) ||
      (metric.source && metric.source.toLowerCase().includes(searchTerm)) ||
      (metric.industry && metric.industry.toLowerCase().includes(searchTerm))

    // Status filter
    const metricStatus = metric.status ? "active" : "inactive"
    const matchesStatus = !statusFilter || metricStatus === statusFilter

    // Date range filter
    const metricDate = formatDateForComparison(metric.createdAt)
    let matchesDateRange = true

    if (dateFromFilter && metricDate) {
      matchesDateRange = matchesDateRange && metricDate >= dateFromFilter
    }

    if (dateToFilter && metricDate) {
      matchesDateRange = matchesDateRange && metricDate <= dateToFilter
    }

    return matchesSearch && matchesStatus && matchesDateRange
  })

  renderMetricsTable()
  updateTotalMetricsCount()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("statusFilter").value = ""
  document.getElementById("dateFromFilter").value = ""
  document.getElementById("dateToFilter").value = ""

  filteredMetrics = [...allMetrics]
  renderMetricsTable()
  updateTotalMetricsCount()
}

function updateTotalMetricsCount() {
  const totalMetricsElement = document.getElementById("totalMetrics")
  if (totalMetricsElement) {
    const total = filteredMetrics.length
    const totalAll = allMetrics.length

    if (total === totalAll) {
      totalMetricsElement.textContent = `Total: ${total} metrics`
    } else {
      totalMetricsElement.textContent = `Showing: ${total} of ${totalAll} metrics`
    }
  }
}

// Modal functions
function viewDescription(metricId) {
  const metric = allMetrics.find((m) => (m._id || m.id) === metricId)
  if (!metric) {
    console.error("Metric not found:", metricId)
    return
  }

  // Populate modal with metric info
  document.getElementById("descMetricName").textContent = metric.name || "N/A"
  document.getElementById("descMetricIndustry").textContent = metric.industry || "N/A"
  document.getElementById("descMetricUnit").textContent = metric.unit || "N/A"
  document.getElementById("descMetricDescription").textContent = metric.description || "No description available"

  // Show modal
  const modal = document.getElementById("descriptionModal")
  modal.classList.add("show")
  document.body.style.overflow = "hidden"
}

function closeDescriptionModal() {
  const modal = document.getElementById("descriptionModal")
  modal.classList.remove("show")
  document.body.style.overflow = ""
}

function openEditStatusModal(metricId) {
  const metric = allMetrics.find((m) => (m._id || m.id) === metricId)
  if (!metric) {
    console.error("Metric not found:", metricId)
    return
  }

  currentEditingMetric = metric

  // Populate modal with metric info
  document.getElementById("editMetricName").textContent = metric.name || "N/A"
  document.getElementById("editMetricType").textContent = (metric.type || "manual").toUpperCase()
  document.getElementById("editMetricIndustry").textContent = metric.industry || "N/A"

  // Set current status
  const statusActive = document.getElementById("statusActive")
  const statusInactive = document.getElementById("statusInactive")

  if (metric.status) {
    statusActive.checked = true
  } else {
    statusInactive.checked = true
  }

  // Show modal
  const modal = document.getElementById("editStatusModal")
  modal.classList.add("show")
  document.body.style.overflow = "hidden"
}

function closeEditModal() {
  const modal = document.getElementById("editStatusModal")
  modal.classList.remove("show")
  document.body.style.overflow = ""
  currentEditingMetric = null
}

async function saveMetricStatus() {
  if (!currentEditingMetric) {
    console.error("No metric selected for editing")
    showErrorMessage("No metric selected for editing. Please try again.")
    return
  }

  const statusActive = document.getElementById("statusActive")
  const newStatus = statusActive.checked

  const saveBtn = document.getElementById("saveStatusBtn")
  const originalText = saveBtn.textContent
  const metricId = currentEditingMetric._id || currentEditingMetric.id

  try {
    // Show loading state
    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."

    console.log(`Updating metric ${metricId} status to:`, newStatus)

    // Make API call to update status
    const response = await fetch(`/api/v1/metric-management/update-status/${metricId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
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
      // If response is not JSON, that's okay for some APIs
      result = { success: true }
    }

    console.log("Metric status updated successfully:", result)

    // Update local data
    const metricIndex = allMetrics.findIndex((metric) => (metric._id || metric.id) === metricId)

    if (metricIndex !== -1) {
      allMetrics[metricIndex].status = newStatus
      // Re-apply current filters to update the display
      applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())
    } else {
      // If metric not found locally, reload all data
      console.warn("Metric not found in local data, reloading...")
      await loadMetrics()
    }

    // Close modal
    closeEditModal()

    // Show success message
    const statusText = newStatus ? "Active" : "Inactive"
    showSuccessMessage(`Metric status has been updated to ${statusText}.`)
  } catch (error) {
    console.error("Error updating metric status:", error)

    // Show error message with more specific details
    let errorMessage = "Failed to update metric status. Please try again."

    if (error.message.includes("404")) {
      errorMessage = "Metric not found. Please refresh the page and try again."
    } else if (error.message.includes("403")) {
      errorMessage = "You don't have permission to update this metric."
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

// Action functions
function handleAddMetric() {
  console.log("Add metric button clicked")
  openAddMetricModal()
}

// NEW: Edit metric function
async function editMetric(metricId) {
  console.log(`Edit metric ${metricId}`)

  const metric = allMetrics.find((m) => (m._id || m.id) === metricId)
  if (!metric) {
    console.error("Metric not found:", metricId)
    showErrorMessage("Metric not found. Please refresh the page and try again.")
    return
  }

  // Set edit mode and current editing metric
  isEditMode = true
  currentEditingMetric = metric

  // Open the modal with pre-filled data
  await openAddMetricModal(metric)
}

async function openAddMetricModal(metricToEdit = null) {
  const modal = document.getElementById("addMetricModal")

  // Reset form first
  resetAddMetricForm()

  // Load industries for dropdown
  await loadIndustriesForDropdown()

  // Update modal title and button text based on mode
  const modalTitle = modal.querySelector(".modal-header h3")
  const saveBtn = document.getElementById("saveMetricBtn")

  if (metricToEdit) {
    // Edit mode
    isEditMode = true
    currentEditingMetric = metricToEdit
    modalTitle.textContent = "Edit Metric"
    saveBtn.textContent = "Save"

    // Debug: Log the metric object to see available properties
    console.log("Editing metric:", metricToEdit)

    // Pre-fill form with existing data
    document.getElementById("metricName").value = metricToEdit.name || ""
    document.getElementById("metricDescription").value = metricToEdit.description || ""
    document.getElementById("metricUnit").value = metricToEdit.unit || ""
    document.getElementById("metricSource").value = metricToEdit.source || ""
    document.getElementById("metricType").value = metricToEdit.type || "manual"

    // Set industry dropdown - if industry exists, select it; otherwise "No Industry" is already selected
    const industrySelect = document.getElementById("metricIndustry")
    if (metricToEdit.industry && metricToEdit.industry.trim() !== "") {
      industrySelect.value = metricToEdit.industry
    } else {
      // Explicitly set to "No Industry" (empty value)
      industrySelect.value = ""
    }

    // IMPORTANT: Trigger type change first to enable/disable the indicator code field
    handleTypeChange()

    // THEN set the indicator code value - check multiple possible property names
    const indicatorCodeValue =
      metricToEdit.indicatorCode ||
      metricToEdit.indicator_code ||
      metricToEdit.worldBankIndicatorCode ||
      metricToEdit.worldBankCode ||
      metricToEdit.code ||
      ""

    console.log("Indicator code value found:", indicatorCodeValue)

    if (indicatorCodeValue) {
      document.getElementById("metricIndicatorCode").value = indicatorCodeValue
      console.log("Set indicator code field to:", indicatorCodeValue)
    }

    // Update character counters
    handleNameInput()
    handleDescriptionInput()

    // Validate form to enable save button if data is valid
    validateAddMetricForm()
  } else {
    // Add mode
    isEditMode = false
    currentEditingMetric = null
    modalTitle.textContent = "Add New Metric"
    saveBtn.textContent = "Add Metric"

    // Set default type to manual
    document.getElementById("metricType").value = "manual"
    handleTypeChange() // This will disable the indicator code field

    // Set industry to "No Industry" by default (empty value)
    document.getElementById("metricIndustry").value = ""

    // Initialize character counters
    handleNameInput()
    handleDescriptionInput()
  }

  // Show modal
  modal.classList.add("show")
  document.body.style.overflow = "hidden"

  // Focus on first input
  setTimeout(() => {
    document.getElementById("metricName").focus()
  }, 100)
}

function closeAddMetricModal() {
  const modal = document.getElementById("addMetricModal")
  modal.classList.remove("show")
  document.body.style.overflow = ""

  // Reset edit mode
  isEditMode = false
  currentEditingMetric = null
}

function resetAddMetricForm() {
  const form = document.getElementById("addMetricForm")
  form.reset()

  // Clear all error states
  const inputs = form.querySelectorAll("input, select, textarea")
  inputs.forEach((input) => {
    input.classList.remove("error")
  })

  const errorElements = form.querySelectorAll(".input-error")
  errorElements.forEach((error) => {
    error.textContent = ""
  })

  // Reset character counters
  const nameCounter = document.getElementById("nameCharCounter")
  const descCounter = document.getElementById("descCharCounter")
  if (nameCounter) {
    nameCounter.textContent = "0/38"
    nameCounter.classList.remove("warning", "danger")
  }
  if (descCounter) {
    descCounter.textContent = "0/125"
    descCounter.classList.remove("warning", "danger")
  }

  // Disable save button
  document.getElementById("saveMetricBtn").disabled = true

  // Reset indicator code field
  const indicatorCodeInput = document.getElementById("metricIndicatorCode")
  indicatorCodeInput.disabled = true
  indicatorCodeInput.required = false
  indicatorCodeInput.value = ""
}

async function loadIndustriesForDropdown() {
  const industrySelect = document.getElementById("metricIndustry")

  try {
    // Show loading state
    industrySelect.classList.add("loading")
    industrySelect.disabled = true

    const response = await fetch("/api/v1/industry-management/fetch-all-industries", {
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
    availableIndustries = Array.isArray(data) ? data : data.data || []

    // Clear existing options
    industrySelect.innerHTML = ""

    // Add "No Industry" option as the first option with empty value
    const noIndustryOption = document.createElement("option")
    noIndustryOption.value = ""
    noIndustryOption.textContent = "No Industry"
    industrySelect.appendChild(noIndustryOption)

    // Add industry options
    availableIndustries.forEach((industry) => {
      const option = document.createElement("option")
      option.value = industry.name
      option.textContent = industry.name
      industrySelect.appendChild(option)
    })

    console.log("Industries loaded for dropdown:", availableIndustries)
  } catch (error) {
    console.error("Error loading industries:", error)
    // Even on error, provide the "No Industry" option
    industrySelect.innerHTML = ""
    const noIndustryOption = document.createElement("option")
    noIndustryOption.value = ""
    noIndustryOption.textContent = "No Industry"
    industrySelect.appendChild(noIndustryOption)
  } finally {
    // Remove loading state
    industrySelect.classList.remove("loading")
    industrySelect.disabled = false
  }
}

function validateAddMetricForm() {
  const nameInput = document.getElementById("metricName")
  const descriptionInput = document.getElementById("metricDescription")
  const unitInput = document.getElementById("metricUnit")
  const typeSelect = document.getElementById("metricType")
  const indicatorCodeInput = document.getElementById("metricIndicatorCode")
  const saveBtn = document.getElementById("saveMetricBtn")

  const name = nameInput.value.trim()
  const description = descriptionInput.value.trim()
  const unit = unitInput.value.trim()
  const type = typeSelect.value
  const indicatorCode = indicatorCodeInput.value.trim()

  // Clear previous errors
  clearFieldError("metricName")
  clearFieldError("metricDescription")
  clearFieldError("metricUnit")
  clearFieldError("metricIndicatorCode")

  let isValid = true

  // Validate name (required, 1-38 characters) - only show character limit errors
  if (name.length === 0) {
    isValid = false
  } else if (name.length > 38) {
    showFieldError("metricName", "Name must be 38 characters or less")
    isValid = false
  }

  // Validate description (required, 1-125 characters) - only show character limit errors
  if (description.length === 0) {
    isValid = false
  } else if (description.length > 125) {
    showFieldError("metricDescription", "Description must be 125 characters or less")
    isValid = false
  }

  // Validate unit (required) - only show character limit errors
  if (unit.length === 0) {
    isValid = false
  } else if (unit.length > 20) {
    showFieldError("metricUnit", "Unit must be less than 20 characters")
    isValid = false
  }

  // Validate indicator code if type is live
  if (type === "live") {
    if (indicatorCode.length === 0) {
      showFieldError("metricIndicatorCode", "Indicator code is required for live metrics")
      isValid = false
    } else if (indicatorCode.length < 3) {
      showFieldError("metricIndicatorCode", "Indicator code must be at least 3 characters long")
      isValid = false
    } else if (indicatorCode.length > 50) {
      showFieldError("metricIndicatorCode", "Indicator code must be less than 50 characters")
      isValid = false
    }
  }

  // Enable/disable save button
  saveBtn.disabled = !isValid

  return isValid
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "Error")

  input.classList.add("error")
  errorElement.textContent = message
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "Error")

  input.classList.remove("error")
  errorElement.textContent = ""
}

// NEW: Handle both add and edit operations
async function handleSaveMetric() {
  if (!validateAddMetricForm()) {
    return
  }

  if (isEditMode) {
    await updateExistingMetric()
  } else {
    await saveNewMetric()
  }
}

async function saveNewMetric() {
  const saveBtn = document.getElementById("saveMetricBtn")
  const originalText = saveBtn.textContent

  // Get form data
  const formData = {
    name: document.getElementById("metricName").value.trim(),
    description: document.getElementById("metricDescription").value.trim(),
    industry: document.getElementById("metricIndustry").value || "", // Ensure empty string for no industry
    unit: document.getElementById("metricUnit").value.trim(),
    source: document.getElementById("metricSource").value.trim(),
    type: document.getElementById("metricType").value,
  }

  // Add indicator code if type is live
  if (formData.type === "live") {
    formData.indicatorCode = document.getElementById("metricIndicatorCode").value.trim()
  }

  // Remove empty optional fields, but keep industry as empty string if selected
  if (!formData.source) delete formData.source
  // Don't delete industry or description - they are now required/handled

  try {
    // Show loading state
    saveBtn.disabled = true
    saveBtn.textContent = "Adding..."

    const response = await fetch("/api/v1/metric-management/add", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("Metric added successfully:", result)

    // Add to local data (assuming the API returns the created metric)
    const newMetric = result.data || result
    if (newMetric) {
      allMetrics.unshift(newMetric) // Add to beginning of array
      applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())
    } else {
      // If API doesn't return the created metric, reload all data
      await loadMetrics()
    }

    // Close modal
    closeAddMetricModal()

    // Show success message
    showSuccessMessage(`Metric "${formData.name}" has been added successfully.`)
  } catch (error) {
    console.error("Error adding metric:", error)

    // Show error message
    showErrorMessage(`Failed to add metric "${formData.name}". Please try again.`)
  } finally {
    // Reset button state
    saveBtn.disabled = false
    saveBtn.textContent = originalText
  }
}

// NEW: Update existing metric function
async function updateExistingMetric() {
  if (!currentEditingMetric) {
    console.error("No metric selected for editing")
    return
  }

  const saveBtn = document.getElementById("saveMetricBtn")
  const originalText = saveBtn.textContent

  // Get form data
  const formData = {
    name: document.getElementById("metricName").value.trim(),
    description: document.getElementById("metricDescription").value.trim(),
    industry: document.getElementById("metricIndustry").value || "", // Ensure empty string for no industry
    unit: document.getElementById("metricUnit").value.trim(),
    source: document.getElementById("metricSource").value.trim(),
    type: document.getElementById("metricType").value,
  }

  // Add indicator code if type is live
  if (formData.type === "live") {
    formData.indicatorCode = document.getElementById("metricIndicatorCode").value.trim()
  } else {
    // Explicitly set to null for manual metrics
    formData.indicatorCode = null
  }

  // Remove empty optional fields, but keep industry as empty string if selected
  if (!formData.source) delete formData.source
  // Don't delete industry or description - they are now required/handled

  const metricId = currentEditingMetric._id || currentEditingMetric.id

  try {
    // Show loading state
    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."

    const response = await fetch(`/api/v1/metric-management/edit/${metricId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("Metric updated successfully:", result)

    // Update local data
    const metricIndex = allMetrics.findIndex((metric) => (metric._id || metric.id) === metricId)
    if (metricIndex !== -1) {
      // Update the metric with new data
      allMetrics[metricIndex] = { ...allMetrics[metricIndex], ...formData }
      applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())
    } else {
      // If metric not found locally, reload all data
      await loadMetrics()
    }

    // Close modal
    closeAddMetricModal()

    // Show success message
    showSuccessMessage(`Metric "${formData.name}" has been updated successfully.`)
  } catch (error) {
    console.error("Error updating metric:", error)

    // Show error message
    showErrorMessage(`Failed to update metric "${formData.name}". Please try again.`)
  } finally {
    // Reset button state
    saveBtn.disabled = false
    saveBtn.textContent = originalText
  }
}

async function deleteMetric(metricId, metricName) {
  console.log(`Delete metric ${metricId} (${metricName})`)

  // Show confirmation dialog
  if (!confirm(`Are you sure you want to delete metric "${metricName}"? This action cannot be undone.`)) {
    return
  }

  try {
    // Find the delete button for this metric to show loading state
    deleteBtn = document.querySelector(`button[onclick="deleteMetric('${metricId}', '${escapeHtml(metricName)}')"]`)
    originalText = deleteBtn ? deleteBtn.innerHTML : ""

    if (deleteBtn) {
      deleteBtn.disabled = true
      deleteBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Deleting...
      `
    }

    // Make API call to delete metric
    const response = await fetch(`/api/v1/metric-management/delete/${metricId}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse response (some APIs return JSON, others just status)
    let result
    try {
      result = await response.json()
    } catch (e) {
      // If response is not JSON, that's okay for DELETE requests
      result = { success: true }
    }

    console.log("Metric deleted successfully:", result)

    // Remove from local data and re-render
    allMetrics = allMetrics.filter((metric) => (metric._id || metric.id) !== metricId)
    applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())

    // Show success message (you can replace this with a toast notification)
    showSuccessMessage(`Metric "${metricName}" has been deleted successfully.`)
  } catch (error) {
    console.error("Error deleting metric:", error)

    // Reset button state on error
    if (deleteBtn) {
      deleteBtn.disabled = false
      deleteBtn.innerHTML = originalText
    }

    // Show error message
    showErrorMessage(`Failed to delete metric "${metricName}". Please try again.`)
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

// Utility functions
function formatDate(dateString) {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  } catch (error) {
    return "Invalid Date"
  }
}

function formatDateForComparison(dateString) {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    return date.toISOString().split("T")[0] // YYYY-MM-DD format
  } catch (error) {
    return ""
  }
}

function truncateText(text, maxLength) {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

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
  console.error("Metric Management error:", e.error)
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking auth status...")
    checkAuthStatus()
  }
})
