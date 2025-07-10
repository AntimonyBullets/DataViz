document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuthStatus()

  // Initialize user management
  initializeUserManagement()

  // Set up event listeners
  setupEventListeners()

  // Load users data
  loadUsers()
})

// Global variables
let allUsers = []
let filteredUsers = []
let currentEditingUser = null

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

function initializeUserManagement() {
  console.log("DataViz User Management initialized")
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

  // Type filter
  const typeFilter = document.getElementById("typeFilter")
  if (typeFilter) {
    typeFilter.addEventListener("change", handleFilters)
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

  // Modal event listeners
  setupModalEventListeners()
}

function setupModalEventListeners() {
  const modal = document.getElementById("editStatusModal")
  const closeBtn = document.getElementById("closeEditModal")
  const cancelBtn = document.getElementById("cancelEditBtn")
  const saveBtn = document.getElementById("saveStatusBtn")

  // Close modal events
  if (closeBtn) {
    closeBtn.addEventListener("click", closeEditModal)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeEditModal)
  }

  // Save button
  if (saveBtn) {
    saveBtn.addEventListener("click", saveUserStatus)
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeEditModal()
      }
    })
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeEditModal()
    }
  })
}

async function loadUsers() {
  try {
    showLoadingState()

    const response = await fetch("/api/v1/user-management/fetch-users", {
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

    // Get users from data.data attribute as specified
    allUsers = data.data || []
    filteredUsers = [...allUsers]

    console.log("Users loaded:", allUsers)

    renderUsersTable()
    updateTotalUsersCount()
  } catch (error) {
    console.error("Error loading users:", error)
    showErrorState("Failed to load users. Please try again.")
  }
}

function showLoadingState() {
  const tableBody = document.getElementById("usersTableBody")
  tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Loading users...</span>
                </div>
            </td>
        </tr>
    `
}

function showErrorState(message) {
  const tableBody = document.getElementById("usersTableBody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="no-data">
                <div style="color: #ef4444;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>${message}</p>
                    <button onclick="loadUsers()" style="margin-top: 12px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `
}

function renderUsersTable() {
  const tableBody = document.getElementById("usersTableBody")

  if (filteredUsers.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <div>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; color: #64748b;">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M16 16S14 14 12 14 8 16 8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <p>No users found matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `
    return
  }

  const rows = filteredUsers
    .map((user) => {
      const formattedDate = formatDate(user.date || user.createdAt || user.created_at)
      const status = user.status ? "active" : "inactive"
      const verified = user.verified ? "yes" : "no"

      return `
            <tr data-user-id="${user.id || user._id}">
                <td>
                    <div style="font-weight: 500;">${escapeHtml(user.username || "N/A")}</div>
                </td>
                <td>
                    <div>${escapeHtml(user.email || "N/A")}</div>
                </td>
                <td>
                    <span class="type-badge ${user.type || "free"}">${(user.type || "free").toUpperCase()}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="status-badge ${status}">${status.toUpperCase()}</span>
                        <button class="edit-status-btn" onclick="openEditStatusModal('${user.id || user._id}')" title="Edit Status">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td>
                    <span class="verified-badge ${verified}">${verified.toUpperCase()}</span>
                </td>
                <td>
                    <div style="color: #64748b;">${formattedDate}</div>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="delete-btn" onclick="deleteUser('${user.id || user._id}', '${escapeHtml(user.username || "User")}')" title="Delete User">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  const statusFilter = document.getElementById("statusFilter").value
  const dateFromFilter = document.getElementById("dateFromFilter").value
  const dateToFilter = document.getElementById("dateToFilter").value

  filteredUsers = allUsers.filter((user) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      (user.username && user.username.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm))

    // Status filter
    const userStatus = user.status ? "active" : "inactive"
    const matchesStatus = !statusFilter || userStatus === statusFilter

    // Type filter
    const typeFilter = document.getElementById("typeFilter").value
    const userType = (user.type || "free").toLowerCase()
    const matchesType = !typeFilter || userType === typeFilter

    // Date range filter
    const userDate = formatDateForComparison(user.date || user.createdAt || user.created_at)
    let matchesDateRange = true

    if (dateFromFilter && userDate) {
      matchesDateRange = matchesDateRange && userDate >= dateFromFilter
    }

    if (dateToFilter && userDate) {
      matchesDateRange = matchesDateRange && userDate <= dateToFilter
    }

    return matchesSearch && matchesStatus && matchesType && matchesDateRange
  })

  renderUsersTable()
  updateTotalUsersCount()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("statusFilter").value = ""
  document.getElementById("typeFilter").value = ""
  document.getElementById("dateFromFilter").value = ""
  document.getElementById("dateToFilter").value = ""

  filteredUsers = [...allUsers]
  renderUsersTable()
  updateTotalUsersCount()
}

function updateTotalUsersCount() {
  const totalUsersElement = document.getElementById("totalUsers")
  if (totalUsersElement) {
    const total = filteredUsers.length
    const totalAll = allUsers.length

    if (total === totalAll) {
      totalUsersElement.textContent = `Total: ${total} users`
    } else {
      totalUsersElement.textContent = `Showing: ${total} of ${totalAll} users`
    }
  }
}

// Modal functions
function openEditStatusModal(userId) {
  const user = allUsers.find((u) => (u.id || u._id) === userId)
  if (!user) {
    console.error("User not found:", userId)
    return
  }

  currentEditingUser = user

  // Populate modal with user info
  document.getElementById("editUserName").textContent = user.username || "N/A"
  document.getElementById("editUserEmail").textContent = user.email || "N/A"

  // Set current status
  const statusActive = document.getElementById("statusActive")
  const statusInactive = document.getElementById("statusInactive")

  if (user.status) {
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
  currentEditingUser = null
}

async function saveUserStatus() {
  if (!currentEditingUser) {
    console.error("No user selected for editing")
    showErrorMessage("No user selected for editing. Please try again.")
    return
  }

  const statusActive = document.getElementById("statusActive")
  const newStatus = statusActive.checked

  const saveBtn = document.getElementById("saveStatusBtn")
  const originalText = saveBtn.textContent
  const userId = currentEditingUser.id || currentEditingUser._id

  try {
    // Show loading state
    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."

    console.log(`Updating user ${userId} status to:`, newStatus)

    // Make API call to update status
    const response = await fetch(`/api/v1/user-management/update-status/${userId}`, {
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

    console.log("User status updated successfully:", result)

    // Update local data
    const userIndex = allUsers.findIndex((user) => (user.id || user._id) === userId)

    if (userIndex !== -1) {
      allUsers[userIndex].status = newStatus
      // Re-apply current filters to update the display
      applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())
    } else {
      // If user not found locally, reload all data
      console.warn("User not found in local data, reloading...")
      await loadUsers()
    }

    // Close modal
    closeEditModal()

    // Show success message
    const statusText = newStatus ? "Active" : "Inactive"
    showSuccessMessage(`User status has been updated to ${statusText}.`)
  } catch (error) {
    console.error("Error updating user status:", error)

    // Show error message with more specific details
    let errorMessage = "Failed to update user status. Please try again."

    if (error.message.includes("404")) {
      errorMessage = "User not found. Please refresh the page and try again."
    } else if (error.message.includes("403")) {
      errorMessage = "You don't have permission to update this user."
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
async function deleteUser(userId, username) {
  console.log(`Delete user ${userId} (${username})`)

  // Show confirmation dialog
  if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
    return
  }

  try {
    // Find the delete button for this user to show loading state
    const deleteBtn = document.querySelector(`button[onclick="deleteUser('${userId}', '${escapeHtml(username)}')"]`)
    const originalText = deleteBtn ? deleteBtn.innerHTML : ""

    if (deleteBtn) {
      deleteBtn.disabled = true
      deleteBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Deleting...
            `
    }

    // Make API call to delete user
    const response = await fetch(`/api/v1/user-management/delete/${userId}`, {
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

    console.log("User deleted successfully:", result)

    // Remove from local data and re-render
    allUsers = allUsers.filter((user) => (user.id || user._id) !== userId)
    applyFilters(document.getElementById("searchInput").value.toLowerCase().trim())

    // Show success message
    showSuccessMessage(`User "${username}" has been deleted successfully.`)
  } catch (error) {
    console.error("Error deleting user:", error)

    // Reset button state on error
    const deleteBtn = document.querySelector(`button[onclick="deleteUser('${userId}', '${escapeHtml(username)}')"]`)
    if (deleteBtn) {
      deleteBtn.disabled = false
      deleteBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Delete
            `
    }

    // Show error message
    let errorMessage = `Failed to delete user "${username}". Please try again.`

    if (error.message.includes("404")) {
      errorMessage = "User not found. Please refresh the page and try again."
    } else if (error.message.includes("403")) {
      errorMessage = "You don't have permission to delete this user."
    } else if (error.message.includes("500")) {
      errorMessage = "Server error occurred. Please try again later."
    }

    showErrorMessage(errorMessage)
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
  console.error("User Management error:", e.error)
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking auth status...")
    checkAuthStatus()
  }
})
