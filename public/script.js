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

  // Guest Login Handler
  const guestLoginBtn = document.getElementById("guestLoginBtn")
  
  if (guestLoginBtn) {
    guestLoginBtn.addEventListener("click", async function(e) {
      e.preventDefault()
      
      // Disable button and show loading state
      const originalText = this.innerHTML
      this.disabled = true
      this.innerHTML = '<span>Loading...</span>'
      this.style.opacity = '0.7'
      
      try {
        const response = await fetch('/api/v1/users/guest-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          // Store token in localStorage
          localStorage.setItem('accessToken', data.data.accessToken)
          localStorage.setItem('user', JSON.stringify(data.data.user))
          
          // Show success message briefly
          this.innerHTML = '<svg class="guest-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Success!'
          this.style.background = '#10b981'
          this.style.borderColor = '#10b981'
          this.style.color = 'white'
          
          // Redirect to home page after brief delay
          setTimeout(() => {
            window.location.href = './home/home.html'
          }, 500)
        } else {
          throw new Error(data.message || 'Guest login failed')
        }
      } catch (error) {
        console.error('Guest login error:', error)
        
        // Show error state
        this.innerHTML = originalText
        this.disabled = false
        this.style.opacity = '1'
        
        // Show error message to user
        alert('Failed to create guest session. Please try again.')
      }
    })
  }
})
