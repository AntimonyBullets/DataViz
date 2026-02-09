import { setupLogout } from "../js/logout.js"

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

document.addEventListener("DOMContentLoaded", () => {
  // Button elements
  const exploreBtn = document.getElementById("exploreBtn")
  const upgradeBtn = document.getElementById("upgradeBtn")
  const logoutBtn = document.getElementById("logoutBtn")
  const errorPopup = document.getElementById("errorPopup")
  const errorMessage = document.getElementById("errorMessage")

  // Modal elements
  const logoutModal = document.getElementById("logoutModal")
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn")
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn")

  // Setup logout functionality
  setupLogout({
    logoutBtn,
    logoutModal,
    cancelLogoutBtn,
    confirmLogoutBtn,
    errorPopup,
    errorMessage,
  })

  // Check if user is a guest and show banner
  checkGuestStatus()

  // Handle premium status
  handlePremiumStatus()

  // Navigation functions
  function navigateToExplore() {
    window.location.href = "../select-metric/select-metric.html";
  }

  function navigateToUpgrade() {
    window.location.href = "../package-offer/package-offer.html"
  }

  // Other event listeners
  exploreBtn.addEventListener("click", navigateToExplore)
  upgradeBtn.addEventListener("click", navigateToUpgrade)

  // Add smooth hover effects
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)"
    })

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
    })
  })

  // Add click animation
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mousedown", function () {
      this.style.transform = "translateY(0) scale(0.98)"
    })

    button.addEventListener("mouseup", function () {
      this.style.transform = "translateY(-2px) scale(1)"
    })
  })

  // Check if user is logged in (example implementation)
  function checkAuthStatus() {
    const authData = localStorage.getItem("authData")
    const accessToken = localStorage.getItem("accessToken")

    if (!authData && !accessToken) {
      console.log("No authentication token found")
    }
  }

  // Check premium status and handle upgrade button
  async function handlePremiumStatus() {
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      const user = data.data; // API returns data in { statusCode, data, message } format

      if (user && user.type === "premium") {
        // Check if premium has expired
        const premiumExpiresAt = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
        const now = new Date();

        if (premiumExpiresAt && now > premiumExpiresAt) {
          // Premium has expired, keep button enabled
          console.log("Premium subscription has expired");
        } else {
          // User is premium and subscription is active
          const upgradeBtn = document.getElementById("upgradeBtn");
          if (upgradeBtn) {
            upgradeBtn.disabled = true;
            upgradeBtn.classList.add("premium-user");
            upgradeBtn.innerHTML = "Premium Active ✓";
            upgradeBtn.setAttribute("title", `Your premium plan will expire in ${Math.ceil((premiumExpiresAt - now) / (1000 * 60 * 60 * 24))} days.`);
            upgradeBtn.removeEventListener("click", navigateToUpgrade);

            // Prevent any hover effects for premium users
            const preventDefaultBehavior = (e) => {
              e.stopPropagation();
            };

            upgradeBtn.addEventListener("mouseenter", preventDefaultBehavior);
            upgradeBtn.addEventListener("mouseleave", preventDefaultBehavior);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Optionally show error in the error popup
      if (errorPopup && errorMessage) {
        errorMessage.textContent = "Failed to verify premium status. Please try refreshing the page.";
        errorPopup.style.display = "flex";
        setTimeout(() => {
          errorPopup.style.display = "none";
        }, 3000);
      }
    }
  }

  // Check if user is a guest and show banner
  async function checkGuestStatus() {
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const user = data.data;

      if (user && user.isGuest) {
        // Create and display guest banner
        const banner = document.createElement('div');
        banner.className = 'guest-banner';
        banner.innerHTML = `
          <div class="guest-banner-content">
            <svg viewBox="0 0 24 24" class="guest-banner-icon">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            <span>You're using <strong>Guest mode</strong>. <a href="../register/register.html" class="guest-signup-link">Sign up</a> to save your data permanently.</span>
          </div>
        `;
        document.body.insertBefore(banner, document.body.firstChild);

        // Disable upgrade button for guest users
        const upgradeBtn = document.getElementById("upgradeBtn");
        if (upgradeBtn) {
          upgradeBtn.disabled = true;
          upgradeBtn.style.opacity = '0.5';
          upgradeBtn.style.cursor = 'not-allowed';
          upgradeBtn.setAttribute("title", "Sign up for a full account to upgrade to premium");
          upgradeBtn.removeEventListener("click", navigateToUpgrade);
        }
      }
    } catch (error) {
      console.error("Error checking guest status:", error);
    }
  }
})
