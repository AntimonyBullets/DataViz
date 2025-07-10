// admin/js/logout.js

document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function () {
            try {
                const response = await fetch("/api/v1/admins/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });
                if (response.ok) {
                    window.location.href = "../index.html";
                } else {
                    alert("Logout failed. Please try again.");
                }
            } catch (error) {
                alert("An error occurred during logout.");
            }
        });
    }
});
