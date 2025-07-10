document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuthStatus()

  // Initialize industry management
  initializeIndustryManagement()

  // Set up event listeners
  setupEventListeners()

  // Load industries data
  loadIndustries()
})

// Global variables
let allIndustries = []
let filteredIndustries = []

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

function initializeIndustryManagement() {
  console.log("DataViz Industry Management initialized")
}

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch)
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

  // Add industry button
  const addIndustryBtn = document.getElementById("addIndustryBtn")
  if (addIndustryBtn) {
    addIndustryBtn.addEventListener("click", openAddIndustryModal)
  }

  // Modal event listeners
  setupModalEventListeners()
}

function setupModalEventListeners() {
  // Add industry modal
  const addModal = document.getElementById("addIndustryModal")
  const closeAddBtn = document.getElementById("closeAddModal")
  const cancelBtn = document.getElementById("cancelAddBtn")
  const saveBtn = document.getElementById("saveIndustryBtn")
  const industryNameInput = document.getElementById("industryName")

  if (closeAddBtn) {
    closeAddBtn.addEventListener("click", closeAddIndustryModal)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeAddIndustryModal)
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveIndustry)
  }

  if (industryNameInput) {
    industryNameInput.addEventListener("input", validateIndustryName)
    industryNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !saveBtn.disabled) {
        e.preventDefault()
        saveIndustry()
      }
    })
  }

  if (addModal) {
    addModal.addEventListener("click", (e) => {
      if (e.target === addModal) {
        closeAddIndustryModal()
      }
    })
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (addModal.classList.contains("show")) {
        closeAddIndustryModal()
      }
    }
  })
}

async function loadIndustries() {
  try {
    showLoadingState()

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

    // Get industries from response - assuming data.data structure
    allIndustries = Array.isArray(data) ? data : data.data || []
    filteredIndustries = [...allIndustries]

    console.log("Industries loaded:", allIndustries)

    renderIndustriesTable()
    updateTotalIndustriesCount()
  } catch (error) {
    console.error("Error loading industries:", error)
    showErrorState("Failed to load industries. Please try again.")
  }
}

function showLoadingState() {
  const tableBody = document.getElementById("industriesTableBody")
  tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="3">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Loading industries...</span>
                </div>
            </td>
        </tr>
    `
}

function showErrorState(message) {
  const tableBody = document.getElementById("industriesTableBody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="no-data">
                <div style="color: #ef4444;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>${message}</p>
                    <button onclick="loadIndustries()" style="margin-top: 12px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `
}

function renderIndustriesTable() {
  const tableBody = document.getElementById("industriesTableBody")

  if (filteredIndustries.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">
                    <div>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; color: #64748b;">
                            <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p>No industries found matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `
    return
  }

  const rows = filteredIndustries
    .map((industry) => {
      const formattedDate = formatDate(industry.createdAt)
      const industryId = industry._id || industry.id
      const industryName = industry.name || "N/A"

      return `
            <tr data-industry-id="${industryId}">
                <td>
                    <div class="industry-name">${escapeHtml(industryName)}</div>
                </td>
                <td>
                    <div class="date">${formattedDate}</div>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="delete-btn" onclick="deleteIndustry('${industryId}', '${escapeHtml(industryName)}')" title="Delete Industry">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                    </div>
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
  const dateFromFilter = document.getElementById("dateFromFilter").value
  const dateToFilter = document.getElementById("dateToFilter").value

  filteredIndustries = allIndustries.filter((industry) => {
    // Search filter - matches industry name (case-insensitive)
    const matchesSearch = !searchTerm || (industry.name && industry.name.toLowerCase().includes(searchTerm))

    // Date range filter
    const industryDate = formatDateForComparison(industry.createdAt)
    let matchesDateRange = true

    if (dateFromFilter && industryDate) {
      matchesDateRange = matchesDateRange && industryDate >= dateFromFilter
    }

    if (dateToFilter && industryDate) {
      matchesDateRange = matchesDateRange && industryDate <= dateToFilter
    }

    return matchesSearch && matchesDateRange
  })

  renderIndustriesTable()
  updateTotalIndustriesCount()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("dateFromFilter").value = ""
  document.getElementById("dateToFilter").value = ""

  filteredIndustries = [...allIndustries]
  renderIndustriesTable()
  updateTotalIndustriesCount()
}

function updateTotalIndustriesCount() {
  const totalIndustriesElement = document.getElementById("totalIndustries")
  if (totalIndustriesElement) {
    const total = filteredIndustries.length
    const totalAll = allIndustries.length

    if (total === totalAll) {
      totalIndustriesElement.textContent = `Total: ${total} industries`
    } else {
      totalIndustriesElement.textContent = `Showing: ${total} of ${totalAll} industries`
    }
  }
}

// Modal functions
function openAddIndustryModal() {
  const modal = document.getElementById("addIndustryModal")
  const industryNameInput = document.getElementById("industryName")
  const saveBtn = document.getElementById("saveIndustryBtn")

  // Reset form
  industryNameInput.value = ""
  industryNameInput.classList.remove("error")
  document.getElementById("industryNameError").textContent = ""
  saveBtn.disabled = true

  // Show modal
  modal.classList.add("show")
  document.body.style.overflow = "hidden"

  // Focus on input
  setTimeout(() => {
    industryNameInput.focus()
  }, 100)
}

function closeAddIndustryModal() {
  const modal = document.getElementById("addIndustryModal")
  modal.classList.remove("show")
  document.body.style.overflow = ""
}

function validateIndustryName() {
  const industryNameInput = document.getElementById("industryName")
  const saveBtn = document.getElementById("saveIndustryBtn")
  const errorElement = document.getElementById("industryNameError")

  const name = industryNameInput.value.trim()

  // Clear previous error state
  industryNameInput.classList.remove("error")
  errorElement.textContent = ""

  if (name.length === 0) {
    saveBtn.disabled = true
    return false
  }

  if (name.length < 2) {
    industryNameInput.classList.add("error")
    errorElement.textContent = "Industry name must be at least 2 characters long"
    saveBtn.disabled = true
    return false
  }

  if (name.length > 50) {
    industryNameInput.classList.add("error")
    errorElement.textContent = "Industry name must be less than 50 characters"
    saveBtn.disabled = true
    return false
  }

  // Check for duplicate names (case-insensitive)
  const isDuplicate = allIndustries.some((industry) => industry.name.toLowerCase() === name.toLowerCase())

  if (isDuplicate) {
    industryNameInput.classList.add("error")
    errorElement.textContent = "An industry with this name already exists"
    saveBtn.disabled = true
    return false
  }

  // All validations passed
  saveBtn.disabled = false
  return true
}

async function saveIndustry() {
  const industryNameInput = document.getElementById("industryName")
  const saveBtn = document.getElementById("saveIndustryBtn")
  const originalText = saveBtn.textContent

  // Validate before saving
  if (!validateIndustryName()) {
    return
  }

  const industryName = industryNameInput.value.trim()

  try {
    // Show loading state
    saveBtn.disabled = true
    saveBtn.textContent = "Adding..."

    // Make API call to add industry
    const response = await fetch("/api/v1/industry-management/add", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: industryName,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("Industry added successfully:", result)

    // Add to local data (assuming the API returns the created industry)
    const newIndustry = result.data || result
    if (newIndustry) {
      allIndustries.unshift(newIndustry) // Add to beginning of array
      applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())
    } else {
      // If API doesn't return the created industry, reload all data
      await loadIndustries()
    }

    // Close modal
    closeAddIndustryModal()

    // Show success message
    showSuccessMessage(`Industry "${industryName}" has been added successfully.`)
  } catch (error) {
    console.error("Error adding industry:", error)

    // Show error message
    showErrorMessage(`Failed to add industry "${industryName}". Please try again.`)
  } finally {
    // Reset button state
    saveBtn.disabled = false
    saveBtn.textContent = originalText
  }
}

async function deleteIndustry(industryId, industryName) {
  console.log(`Delete industry ${industryId} (${industryName})`)

  // Show confirmation dialog
  if (!confirm(`Are you sure you want to delete industry "${industryName}"? This action cannot be undone.`)) {
    return
  }

  try {
    // Find the delete button for this industry to show loading state
    const deleteBtn = document.querySelector(
      `button[onclick="deleteIndustry('${industryId}', '${escapeHtml(industryName)}')"]`,
    )
    const originalText = deleteBtn ? deleteBtn.innerHTML : ""

    if (deleteBtn) {
      deleteBtn.disabled = true
      deleteBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        </svg>
        Deleting...
      `
    }

    // Make API call to delete industry
    const response = await fetch(`/api/v1/industry-management/delete/${industryId}`, {
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

    console.log("Industry deleted successfully:", result)

    // Remove from local data and re-render
    allIndustries = allIndustries.filter((industry) => (industry._id || industry.id) !== industryId)
    applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())

    // Show success message
    showSuccessMessage(`Industry "${industryName}" has been deleted successfully.`)
  } catch (error) {
    console.error("Error deleting industry:", error)

    // Reset button state on error
    const deleteBtn = document.querySelector(
      `button[onclick="deleteIndustry('${industryId}', '${escapeHtml(industryName)}')"]`,
    )
    if (deleteBtn) {
      deleteBtn.disabled = false
      deleteBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Delete
      `
    }

    // Show error message
    showErrorMessage(`Failed to delete industry "${industryName}". Please try again.`)
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
  console.error("Industry Management error:", e.error)
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking auth status...")
    checkAuthStatus()
  }
})
