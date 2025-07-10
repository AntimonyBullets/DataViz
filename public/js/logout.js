// Modal display functions
export function showLogoutModal(logoutModal) {
    logoutModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

export function hideLogoutModal(logoutModal, confirmLogoutBtn) {
    logoutModal.classList.remove("show");
    document.body.style.overflow = "auto";

    // Reset confirm button state
    confirmLogoutBtn.disabled = false;
    confirmLogoutBtn.querySelector("span").textContent = "Logout";
}

// Error popup function
export function showErrorPopup(errorMessage, errorPopup) {
    errorMessage.textContent = message;
    errorPopup.classList.add("show");

    // Hide popup after 2 seconds
    setTimeout(() => {
        errorPopup.classList.remove("show");
    }, 2000);
}

// Main logout function with API integration
export async function performLogout(logoutModal, confirmLogoutBtn, errorPopup, errorMessage) {
    console.log("Performing logout...");

    // Disable confirm button during API call
    confirmLogoutBtn.disabled = true;
    confirmLogoutBtn.querySelector("span").textContent = "Logging out...";

    try {
        // Make logout API call with credentials
        const response = await fetch("/api/v1/users/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
        });

        const data = await response.json();

        // Check if logout was successful
        if (data.success !== false && response.ok) {
            // Clear all localStorage data
            localStorage.clear();
            sessionStorage.clear();

            console.log("Logout successful");

            // Hide modal first
            hideLogoutModal(logoutModal, confirmLogoutBtn);

            // Small delay before redirect for better UX
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 300);
        } else {
            // Hide modal and show error popup
            hideLogoutModal(logoutModal, confirmLogoutBtn);
            showErrorPopup("Logout failed due to server error", errorMessage, errorPopup);
            console.error("Logout failed:", data.message || "Unknown error");
        }
    } catch (error) {
        console.error("Logout error:", error);
        hideLogoutModal(logoutModal, confirmLogoutBtn);
        showErrorPopup("Logout failed due to connection error", errorMessage, errorPopup);
    }
}

// Setup logout functionality
export function setupLogout(options) {
    const {
        logoutBtn,
        logoutModal,
        cancelLogoutBtn,
        confirmLogoutBtn,
        errorPopup,
        errorMessage
    } = options;

    // Event listeners for logout flow
    logoutBtn.addEventListener("click", () => showLogoutModal(logoutModal));
    cancelLogoutBtn.addEventListener("click", () => hideLogoutModal(logoutModal, confirmLogoutBtn));
    confirmLogoutBtn.addEventListener("click", () => performLogout(logoutModal, confirmLogoutBtn, errorPopup, errorMessage));

    // Close modal when clicking outside
    logoutModal.addEventListener("click", (e) => {
        if (e.target === logoutModal) {
            hideLogoutModal(logoutModal, confirmLogoutBtn);
        }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && logoutModal.classList.contains("show")) {
            hideLogoutModal(logoutModal, confirmLogoutBtn);
        }
    });
}
