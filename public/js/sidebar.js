export function setupSidebar() {
  const sidebar = document.getElementById("sidebar")
  const navItems = document.querySelectorAll(".nav-item")

  // Add tooltips for collapsed state
  navItems.forEach((item) => {
    const span = item.querySelector("span")
    if (span) {
      item.setAttribute("data-tooltip", span.textContent)
    }
  })

  // Handle navigation
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const href = item.getAttribute("href")

      // Don't navigate if it's a placeholder link
      if (href === "#") {
        e.preventDefault()
        console.log(`Navigation to ${item.querySelector("span")?.textContent} not implemented yet`)
        return
      }

      // Update active state
      navItems.forEach((nav) => nav.classList.remove("active"))
      item.classList.add("active")
    })
  })

  // Handle mobile sidebar toggle
  const handleMobileToggle = () => {
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle("open")
    }
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 1024) {
      if (!sidebar.contains(e.target) && !e.target.closest(".sidebar-toggle")) {
        sidebar.classList.remove("open")
      }
    }
  })

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove("open")
    }
  })
}
