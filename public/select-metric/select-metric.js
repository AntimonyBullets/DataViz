import { setupSidebar } from "../js/sidebar.js"
import { setupLogout } from "../js/logout.js"

// DOM Elements
const metricsContainer = document.getElementById("metrics-container")
const loadingElement = document.getElementById("loading")
const errorElement = document.getElementById("error")
const errorMessage = document.getElementById("errorMessage")

let userType = null
let isGuest = false
let upgradePopup = null
let industries = []
let selectedIndustry = ""
let dropdownHideTimeout = null
let upgradePopupHideTimeout = null

// Create industry dropdown (hidden by default)
const industryDropdown = document.createElement("div")
industryDropdown.className = "industry-dropdown"
industryDropdown.style.display = "none"
document.body.appendChild(industryDropdown)

// Create upgrade popup and attach listeners on DOMContentLoaded
function createUpgradePopup() {
  if (!upgradePopup) {
    upgradePopup = document.createElement("div")
    upgradePopup.className = "upgrade-popup"
    upgradePopup.style.display = "none"
    document.body.appendChild(upgradePopup)
    upgradePopup.addEventListener("mouseenter", () => {
      clearTimeout(upgradePopupHideTimeout)
      upgradePopup.style.display = "block"
    })
    upgradePopup.addEventListener("mouseleave", () => {
      upgradePopupHideTimeout = setTimeout(() => {
        hideUpgradePopup()
      }, 150)
    })
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setupSidebar()
  loadMetrics() // Load general metrics initially
  fetchIndustries()
  setupIndustrySidebarHover()
  createUpgradePopup()
  setupSidebarClickHandlers()

  // Setup logout functionality
  const logoutBtn = document.getElementById("logoutBtn")
  const logoutModal = document.getElementById("logoutModal")
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn")
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn")
  const errorPopup = document.getElementById("errorPopup")
  const errorMessage = document.getElementById("errorMessage")

  if (logoutBtn && logoutModal && cancelLogoutBtn && confirmLogoutBtn && errorPopup && errorMessage) {
    setupLogout({
      logoutBtn,
      logoutModal,
      cancelLogoutBtn,
      confirmLogoutBtn,
      errorPopup,
      errorMessage,
    })
  }

  // Home icon click handler
  const homeBtn = document.getElementById("sidebarHomeBtn")
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "../home/home.html"
    })
  }
})

// Handle category changes from sidebar - but ignore industry clicks
document.addEventListener("categoryChange", (e) => {
  const category = e.detail.category
  // Only handle macro category changes, ignore industry
  if (category === "macro") {
    selectedIndustry = ""
    highlightSidebarIcon("macro")
    loadMetrics()
  }
  // Do nothing for industry category
})

function setupSidebarClickHandlers() {
  // Handle macro sidebar click
  const macroSidebar = document.querySelector('.sidebar-item[data-category="macro"]')
  if (macroSidebar) {
    macroSidebar.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      selectedIndustry = ""
      highlightSidebarIcon("macro")
      loadMetrics()
    })
  }

  // Handle industry sidebar click - prevent default behavior
  const industrySidebar = document.querySelector('.sidebar-item[data-category="industry"]')
  if (industrySidebar) {
    industrySidebar.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      // Do nothing - just prevent the default behavior
      console.log("Industry icon clicked - no action taken")
    })
  }
}

async function fetchIndustries() {
  try {
    const response = await fetch("/api/v1/industries/fetch-industries", {
      method: "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    })
    if (!response.ok) throw new Error("Failed to fetch industries")
    const data = await response.json()
    industries = data.data
  } catch (error) {
    industries = []
  }
}

async function fetchUserType() {
  try {
    const response = await fetch("/api/v1/users/me", {
      method: "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    })
    if (!response.ok) throw new Error("Failed to fetch user")
    const data = await response.json()
    userType = data.data.type
    isGuest = data.data.isGuest || false
  } catch (error) {
    userType = null
    isGuest = false
  }
}

// Call fetchUserType on page load
fetchUserType()

function showUpgradeCard() {
  const buttonDisabled = isGuest ? 'disabled' : '';
  const buttonStyle = isGuest 
    ? 'background: #cbd5e1; color: #64748b; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; cursor: not-allowed; opacity: 0.6;'
    : 'background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s;';
  const buttonTitle = isGuest ? 'Sign up for a full account to upgrade to premium' : '';
  const messageText = isGuest 
    ? 'Sign up for a full account to unlock industry-specific indicators.'
    : 'Unlock access to industry-specific economic indicators by upgrading to Premium.';
  
  metricsContainer.innerHTML = `
        <div class="metric-card metric-card-orange" style="max-width: 400px; margin: 2rem auto; text-align: center;">
            <div class="metric-name" style="font-size: 1.2rem; margin-bottom: 1rem;">Industry-specific indicators</div>
            <div class="metric-description" style="margin-bottom: 1.5rem;">
                ${messageText}
            </div>
            <button id="upgradeBtn" ${buttonDisabled} title="${buttonTitle}" style="${buttonStyle}">Upgrade to Premium</button>
        </div>
    `
  
  if (!isGuest) {
    document.getElementById("upgradeBtn").onclick = () => {
      window.location.href = "../package-offer/package-offer.html"
    }
  }
}

function showUpgradePopup(targetSidebar) {
  const buttonDisabled = isGuest ? 'disabled' : '';
  const buttonStyle = isGuest 
    ? 'background: #cbd5e1; color: #64748b; border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.97rem; font-weight: 600; cursor: not-allowed; opacity: 0.6;'
    : 'background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.97rem; font-weight: 600; cursor: pointer; transition: background 0.2s;';
  const buttonTitle = isGuest ? 'Sign up for a full account to upgrade to premium' : '';
  const messageText = isGuest 
    ? 'Sign up for a full account to unlock industry-specific indicators.'
    : 'Unlock access to industry-specific economic indicators by upgrading to Premium.';
  
  upgradePopup.innerHTML = `
        <div style="background: #fff; max-width: 300px; text-align: center; border-radius: 14px; padding: 1rem 1rem 1.2rem 1rem; font-size: 0.97rem;">
            <div style="font-size: 1rem; font-weight: 600; color: #f59e0b; margin-bottom: 0.7rem;">Industry-specific indicators</div>
            <div style="margin-bottom: 1.1rem; color: #64748b; font-size: 0.93rem;">
                ${messageText}
            </div>
            <button id="upgradeBtn" ${buttonDisabled} title="${buttonTitle}" style="${buttonStyle}">Upgrade to Premium</button>
        </div>
    `
  const rect = targetSidebar.getBoundingClientRect()
  upgradePopup.style.position = "absolute"
  upgradePopup.style.left = `${rect.right + 10}px`
  upgradePopup.style.top = `${rect.top}px`
  upgradePopup.style.display = "block"
  upgradePopup.style.border = "none"
  
  if (!isGuest) {
    document.getElementById("upgradeBtn").onclick = () => {
      window.location.href = "../package-offer/package-offer.html"
    }
  }
}

function hideUpgradePopup() {
  if (upgradePopup) upgradePopup.style.display = "none"
}

function setupIndustrySidebarHover() {
  const industrySidebar = document.querySelector('.sidebar-item[data-category="industry"]')
  industrySidebar.addEventListener("mouseenter", async (e) => {
    await fetchUserType()
    if (userType === "free") {
      hideIndustryDropdown()
      clearTimeout(dropdownHideTimeout)
      clearTimeout(upgradePopupHideTimeout)
      showUpgradePopup(industrySidebar)
      return
    }
    if (!industries.length) return
    clearTimeout(dropdownHideTimeout)
    industryDropdown.innerHTML = industries.map((ind) => `<div class="industry-option">${ind.name}</div>`).join("")
    const rect = industrySidebar.getBoundingClientRect()
    industryDropdown.style.left = `${rect.right + 10}px`
    industryDropdown.style.top = `${rect.top}px`
    industryDropdown.style.display = "block"
  })
  industrySidebar.addEventListener("mouseleave", () => {
    dropdownHideTimeout = setTimeout(() => {
      hideIndustryDropdown()
    }, 200)
    upgradePopupHideTimeout = setTimeout(() => {
      hideUpgradePopup()
    }, 150)
  })
  industryDropdown.addEventListener("mouseenter", () => {
    clearTimeout(dropdownHideTimeout)
    industryDropdown.style.display = "block"
  })
  industryDropdown.addEventListener("mouseleave", () => {
    dropdownHideTimeout = setTimeout(() => {
      industryDropdown.style.display = "none"
    }, 200)
  })
  industryDropdown.addEventListener("click", (e) => {
    if (e.target.classList.contains("industry-option")) {
      selectedIndustry = e.target.textContent
      highlightSidebarIcon("industry")
      loadMetrics(selectedIndustry)
      industryDropdown.style.display = "none"
    }
  })
}

function hideIndustryDropdown() {
  industryDropdown.style.display = "none"
}

function highlightSidebarIcon(category) {
  const macroSidebar = document.querySelector('.sidebar-item[data-category="macro"]')
  const industrySidebar = document.querySelector('.sidebar-item[data-category="industry"]')
  if (category === "industry") {
    macroSidebar.classList.remove("active")
    industrySidebar.classList.add("active")
  } else {
    macroSidebar.classList.add("active")
    industrySidebar.classList.remove("active")
  }
}

async function loadMetrics(industry = "") {
  try {
    showLoading()
    selectedIndustry = industry
    const response = await fetch(
      `/api/v1/metrics/fetch-metrics${industry ? `?industry=${encodeURIComponent(industry)}` : ""}`,
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch metrics")
    }

    const data = await response.json()
    let metrics = data.data
    // If an industry is selected, only show metrics with that industry
    if (industry) {
      metrics = metrics.filter((m) => m.industry && m.industry === industry)
    } else {
      // Only show general metrics (no industry)
      metrics = metrics.filter((m) => !m.industry)
    }
    if (metrics.length === 0) {
      metricsContainer.innerHTML = ""
      showError("No metrics found for this category")
      return
    }
    displayMetrics(metrics)
    hideLoading()
    hideError()
  } catch (error) {
    metricsContainer.innerHTML = ""
    console.error("Error fetching metrics:", error)
    if (error.message.includes("403")) {
      showError("Please upgrade to premium to access industry-specific metrics")
    } else {
      showError("Failed to load metrics. Please try again later.")
    }
  }
}

function displayMetrics(metrics) {
  const colorClasses = [
    "metric-card-blue",
    "metric-card-orange",
    "metric-card-red",
    "metric-card-green",
    "metric-card-purple",
  ];
  metricsContainer.innerHTML = metrics
    .map((metric, idx) => {
      const isLive = metric.type === "live";
      // Card style: wider, more balanced
      const cardStyle = `min-width: 175px; max-width: 420px; min-height: 180px; max-height: 240px; display: flex; flex-direction: column; justify-content: space-between; position: relative;`;
      // Live badge HTML
      const liveBadge = isLive
        ? `<span class=\"live-badge\" style=\"position: absolute; bottom: 16px; right: 18px; background: linear-gradient(90deg, #f43f5e 60%, #f59e42 100%); color: #fff; font-weight: 700; font-size: 0.93rem; padding: 4px 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(244,63,94,0.10); letter-spacing: 1px; z-index: 2;\">LIVE</span>`
        : "";
      if (metric.status === false) {
        return `
          <div class=\"metric-card metric-card-grey inactive-metric\" title=\"Currently Unavailable\" style=\"cursor: not-allowed; opacity: 0.6; ${cardStyle}\">
              <div class=\"metric-name\" style=\"display: flex; align-items: center; gap: 0.5rem;\">
                  ${metric.name}
              </div>
              <div class=\"metric-description\">${metric.description}</div>
              <div class=\"metric-action\" style=\"color: #aaa;\">Unavailable</div>
              ${liveBadge}
          </div>
        `
      } else {
        return `
          <div class=\"metric-card ${colorClasses[idx % colorClasses.length]}\" style=\"${cardStyle}\">
              <div class=\"metric-name\" style=\"display: flex; align-items: center; gap: 0.5rem;\">
                  ${metric.name}
              </div>
              <div class=\"metric-description\">${metric.description}</div>
              <div class=\"metric-action\">
                  Explore 
                  <svg viewBox=\"0 0 24 24\">
                      <path d=\"M16.01 11H4v2h12.01v3L20 12l-3.99-4z\"/>
                  </svg>
              </div>
              ${liveBadge}
          </div>
        `
      }
    })
    .join("")

  // Add click handlers for only active metric cards
  const activeMetricCards = document.querySelectorAll(".metric-card:not(.inactive-metric)")
  const activeMetrics = metrics.filter(m => m.status !== false)
  activeMetricCards.forEach((card, index) => {
    const metric = activeMetrics[index]
    let metricId = metric && (metric._id || metric.id)
    if (metricId) {
      card.setAttribute("data-href", `../explorer/explorer.html?metricId=${encodeURIComponent(metricId)}`)
    }
    // Left click: navigate
    card.addEventListener("click", () => {
      if (metricId) {
        window.location.href = `../explorer/explorer.html?metricId=${encodeURIComponent(metricId)}`
      } else {
        console.error("Metric id not found for navigation.")
      }
    })
    // Custom context menu for right-click (only 'Open link in new tab')
    card.addEventListener("contextmenu", (e) => {
      if (metricId) {
        e.preventDefault()
        // Remove any existing custom menu
        const oldMenu = document.getElementById("custom-context-menu")
        if (oldMenu) oldMenu.remove()
        // Create menu
        const menu = document.createElement("div")
        menu.id = "custom-context-menu"
        menu.style.position = "fixed"
        menu.style.zIndex = 9999
        menu.style.left = `${e.clientX}px`
        menu.style.top = `${e.clientY}px`
        menu.style.background = "#fff"
        menu.style.border = "1px solid #e5e7eb"
        menu.style.borderRadius = "8px"
        menu.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"
        menu.style.padding = "0.5rem 0"
        menu.style.minWidth = "180px"
        menu.style.fontSize = "15px"
        menu.innerHTML = `
          <div class="context-menu-item" style="padding: 8px 18px; cursor: pointer; color: #2563eb;">Open link in new tab</div>
        `
        document.body.appendChild(menu)
        // Menu action
        const openNewTab = menu.querySelector(".context-menu-item")
        openNewTab.addEventListener("click", () => {
          window.open(`../explorer/explorer.html?metricId=${encodeURIComponent(metricId)}`, "_blank")
          menu.remove()
        })
        // Remove menu on click elsewhere
        setTimeout(() => {
          document.addEventListener("click", function handler() {
            menu.remove()
            document.removeEventListener("click", handler)
          })
        }, 0)
      }
    })
  })

  // Add tooltip for inactive metrics (for accessibility and fallback)
  document.querySelectorAll(".inactive-metric").forEach(card => {
    card.addEventListener("mouseenter", function() {
      this.setAttribute("title", "Currently Unavailable")
    })
  })
}

function showLoading() {
  loadingElement.style.display = "flex"
  metricsContainer.style.display = "none"
}

function hideLoading() {
  loadingElement.style.display = "none"
  metricsContainer.style.display = "grid"
}

function showError(message) {
  errorElement.style.display = "flex"
  errorMessage.textContent = message
  metricsContainer.style.display = "none"
  hideLoading()
}

function hideError() {
  errorElement.style.display = "none"
}

async function logoutIfInactive() {
  try {
    const response = await fetch('/api/v1/users/me', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Not authenticated');
    const data = await response.json();
    const user = data.data;
    if (!user || user.status !== true) {
      // Logout and redirect to landing page
      await fetch('/api/v1/users/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
      });
      localStorage.removeItem('authData');
      window.location.href = '../index.html';
      return;
    }
  } catch (e) {
    // On error, also logout and redirect
    await fetch('/api/v1/users/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
    localStorage.removeItem('authData');
    window.location.href = '../index.html';
    return;
  }
}

logoutIfInactive();

// Add CSS for .live-badge if not present
(function ensureBadgeStyles() {
  if (!document.getElementById('live-badge-style')) {
    const style = document.createElement('style');
    style.id = 'live-badge-style';
    style.innerHTML = `
      .live-badge {
        transition: box-shadow 0.2s;
        user-select: none;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
})();
