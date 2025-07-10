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

// Check user's premium status when page loads
async function checkPremiumStatus() {
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
    const user = data.data;

    if (user && user.type === "premium") {
      // Replace premium card with active premium status
      const container = document.querySelector('.container');
      container.innerHTML = `
        <div class="premium-card premium-active">
          <div class="plan-badge">✨ ACTIVE PREMIUM</div>
          <div class="plan-title">Your Premium Benefits</div>
          
          <div class="premium-status">
            <svg viewBox="0 0 24 24" class="premium-check">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Premium Plan Active</span>
          </div>

          <ul class="features-list">
            <li class="feature-item">
              <div class="check-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span>Histogram based analysis</span>
            </li>
            <li class="feature-item">
              <div class="check-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span>Line chart based analysis</span>
            </li>
            <li class="feature-item">
              <div class="check-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span>Macro-level metrics</span>
            </li>
            <li class="feature-item">
              <div class="check-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span>Industry-specific metrics</span>
            </li>
          </ul>

          <div class="premium-expires">
            Premium expires: ${new Date(user.premiumExpiresAt).toLocaleDateString()}
          </div>

          <a href="#" class="back-to-home" onclick="window.location.href = '../home/home.html'">
            <svg class="back-arrow" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Dashboard
          </a>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error checking premium status:", error);
  }
}

const authData = JSON.parse(localStorage.getItem("authData"));


// Initialize logout functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check premium status
  checkPremiumStatus();

  // Get logout-related elements
  const logoutBtn = document.getElementById("logoutBtn")
  const logoutModal = document.getElementById("logoutModal")
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn")
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn")
  const errorPopup = document.getElementById("errorPopup")
  const errorMessage = document.getElementById("errorMessage")

  // Setup logout functionality
  setupLogout({
    logoutBtn,
    logoutModal,
    cancelLogoutBtn,
    confirmLogoutBtn,
    errorPopup,
    errorMessage,
  })

  // Payment modal elements
  const paymentModal = document.getElementById("paymentModal")
  const cancelPaymentBtn = document.getElementById("cancelPaymentBtn")
  const confirmPaymentBtn = document.getElementById("confirmPaymentBtn")

  // Payment modal functions
  function showPaymentModal() {
    paymentModal.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  function hidePaymentModal() {
    paymentModal.classList.remove("show")
    document.body.style.overflow = "auto"

    // Reset confirm button state
    confirmPaymentBtn.disabled = false
    confirmPaymentBtn.querySelector("span").textContent = "Proceed to Pay"
  }

  // Payment modal event listeners
  cancelPaymentBtn.addEventListener("click", hidePaymentModal)

  // Close modal when clicking outside
  paymentModal.addEventListener("click", (e) => {
    if (e.target === paymentModal) {
      hidePaymentModal()
    }
  })

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && paymentModal.classList.contains("show")) {
      hidePaymentModal()
    }
  })


  function handleUpgrade() {
    console.log("Showing payment confirmation...")
    showPaymentModal()
  }

  // Make handleUpgrade available globally
  window.handleUpgrade = handleUpgrade

  // Add smooth hover effects for buttons
  const upgradeBtn = document.querySelector(".upgrade-btn")
  if (upgradeBtn) {
    upgradeBtn.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)"
    })

    upgradeBtn.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
    })

    // Add click animation
    upgradeBtn.addEventListener("mousedown", function () {
      this.style.transform = "translateY(0) scale(0.98)"
    })

    upgradeBtn.addEventListener("mouseup", function () {
      this.style.transform = "translateY(-2px) scale(1)"
    })
  }

  document.getElementById('confirmPaymentBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/v1/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authData?.user?._id }),
      credentials: "same-origin"
    });

    // Check if response is not OK (status code not in 200–299)
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // redirect to Stripe Checkout
    } else {
      throw new Error('Invalid checkout session URL received.');
    }

  } catch (err) {
    console.error('Payment initiation failed:', err.message);
    alert(`Payment failed: ${err.message}`);
  }
});
})
