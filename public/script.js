document.addEventListener("DOMContentLoaded", () => {
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Enhanced entrance animation
  const heroContent = document.querySelector(".hero-content")
  const header = document.querySelector("header")

  if (heroContent && header) {
    // Initial state
    heroContent.style.opacity = "0"
    heroContent.style.transform = "translateY(30px)"
    header.style.opacity = "0"
    header.style.transform = "translateY(-20px)"

    // Animate header first
    setTimeout(() => {
      header.style.transition = "opacity 0.6s ease, transform 0.6s ease"
      header.style.opacity = "1"
      header.style.transform = "translateY(0)"
    }, 100)

    // Then animate hero content
    setTimeout(() => {
      heroContent.style.transition = "opacity 0.8s ease, transform 0.8s ease"
      heroContent.style.opacity = "1"
      heroContent.style.transform = "translateY(0)"
    }, 300)
  }

  // Add enhanced hover effects
  const ctaButton = document.querySelector(".cta-button")
  const loginBtn = document.querySelector(".login-btn")

  if (ctaButton) {
    ctaButton.addEventListener("mouseover", function () {
      this.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    })
  }

  if (loginBtn) {
    loginBtn.addEventListener("mouseover", function () {
      this.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    })
  }

  // Add subtle parallax effect on scroll
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset
    const heroContent = document.querySelector(".hero-content")

    if (heroContent) {
      heroContent.style.transform = `translateY(${scrolled * 0.1}px)`
    }
  })
})
