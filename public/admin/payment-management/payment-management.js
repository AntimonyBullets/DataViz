document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuthStatus()

  // Initialize payment management
  initializePaymentManagement()

  // Set up event listeners
  setupEventListeners()

  // Load payments data
  loadPayments()
})

// Global variables
let allPayments = []
let filteredPayments = []

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

function initializePaymentManagement() {
  console.log("DataViz Payment Management initialized")
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
}

async function loadPayments() {
  try {
    showLoadingState()

    const response = await fetch("/api/v1/payment-management/fetch-all-payments", {
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

    // Get payments from response - assuming direct array or data.data structure
    allPayments = Array.isArray(data) ? data : data.data || []
    filteredPayments = [...allPayments]

    console.log("Payments loaded:", allPayments)

    renderPaymentsTable()
    updateTotalPaymentsCount()
  } catch (error) {
    console.error("Error loading payments:", error)
    showErrorState("Failed to load payments. Please try again.")
  }
}

function showLoadingState() {
  const tableBody = document.getElementById("paymentsTableBody")
  tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Loading payments...</span>
                </div>
            </td>
        </tr>
    `
}

function showErrorState(message) {
  const tableBody = document.getElementById("paymentsTableBody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="no-data">
                <div style="color: #ef4444;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>${message}</p>
                    <button onclick="loadPayments()" style="margin-top: 12px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `
}

function renderPaymentsTable() {
  const tableBody = document.getElementById("paymentsTableBody")

  if (filteredPayments.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <div>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; color: #64748b;">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p>No payments found matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `
    return
  }

  const rows = filteredPayments
    .map((payment) => {
      const formattedDate = formatDate(payment.createdAt)
      const paymentId = payment.paymentId || "N/A"
      const username = payment.paidBy?.username || "N/A"
      const paymentMethod = payment.paymentMethod || "N/A"
      const plan = payment.plan || "N/A"
      const amount = payment.amount || 0

      return `
            <tr data-payment-id="${payment._id || payment.id}">
                <td>
                    <span class="payment-id">${escapeHtml(paymentId)}</span>
                </td>
                <td>
                    <div class="username">${escapeHtml(username)}</div>
                </td>
                <td>
                    <span class="payment-method-badge ${paymentMethod.toLowerCase()}">${paymentMethod.toUpperCase()}</span>
                </td>
                <td>
                    <span class="plan-badge ${plan.toLowerCase()}">${plan.toUpperCase()}</span>
                </td>
                <td>
                    <div class="amount">${formatAmount(amount)}</div>
                </td>
                <td>
                    <div class="date">${formattedDate}</div>
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

  filteredPayments = allPayments.filter((payment) => {
    // Search filter - matches Payment ID, Username, or Plan
    const matchesSearch =
      !searchTerm ||
      (payment.paymentId && payment.paymentId.toLowerCase().includes(searchTerm)) ||
      (payment.paidBy?.username && payment.paidBy.username.toLowerCase().includes(searchTerm)) ||
      (payment.plan && payment.plan.toLowerCase().includes(searchTerm))

    // Date range filter
    const paymentDate = formatDateForComparison(payment.createdAt)
    let matchesDateRange = true

    if (dateFromFilter && paymentDate) {
      matchesDateRange = matchesDateRange && paymentDate >= dateFromFilter
    }

    if (dateToFilter && paymentDate) {
      matchesDateRange = matchesDateRange && paymentDate <= dateToFilter
    }

    return matchesSearch && matchesDateRange
  })

  renderPaymentsTable()
  updateTotalPaymentsCount()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("dateFromFilter").value = ""
  document.getElementById("dateToFilter").value = ""

  filteredPayments = [...allPayments]
  renderPaymentsTable()
  updateTotalPaymentsCount()
}

function updateTotalPaymentsCount() {
  const totalPaymentsElement = document.getElementById("totalPayments")
  const totalAmountElement = document.getElementById("totalAmount")

  if (totalPaymentsElement && totalAmountElement) {
    const total = filteredPayments.length
    const totalAll = allPayments.length

    // Calculate total amount from filtered payments
    const totalAmount = filteredPayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0)
    }, 0)

    const formattedAmount = totalAmount.toLocaleString()

    // Update payment count
    if (total === totalAll) {
      totalPaymentsElement.textContent = total.toLocaleString()
    } else {
      totalPaymentsElement.textContent = `${total.toLocaleString()} of ${totalAll.toLocaleString()}`
    }

    // Update total amount
    totalAmountElement.textContent = formattedAmount
  }
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

function formatAmount(amount) {
  if (typeof amount !== "number") return "0"
  return amount.toLocaleString()
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
  console.error("Payment Management error:", e.error)
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking auth status...")
    checkAuthStatus()
  }
})
