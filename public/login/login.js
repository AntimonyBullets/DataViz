function decodeToken(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  function isTokenExpired(token) {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;

    const now = Date.now() / 1000; // current time in seconds
    return now >= payload.exp;
  }

  const authDataRaw = localStorage.getItem('authData');
  if (authDataRaw) {
    try {
      const authData = JSON.parse(authDataRaw);
      const token = authData.accessToken;
      // Only check token validity here, not status
      if (token && !isTokenExpired(token)) {
        // Now check user status via API
        fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(res => {
          if (!res.ok) throw new Error('Not authenticated');
          return res.json();
        })
        .then(data => {
          const user = data.data;
          if (user && user.status === true) {
            window.location.href = '../home/home.html';
          } else {
            localStorage.removeItem('authData');
          }
        })
        .catch(() => {
          localStorage.removeItem('authData');
        });
      } else {
        // Token is expired → remove authData
        localStorage.removeItem('authData');
      }
    } catch (err) {
      // If parsing fails or anything else, clean it up
      localStorage.removeItem('authData');
    }
  }
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const loginBtn = document.getElementById("loginBtn")
  const successMessage = document.getElementById("successMessage")
  const verificationMessage = document.getElementById("verificationMessage")
  const resendBtn = document.getElementById("resendBtn")
  const errorAlert = document.getElementById("errorAlert")
  const guestLoginBtn = document.getElementById("guestLoginBtn")

  // Forgot Password Modal Elements
  const forgotPasswordLink = document.getElementById("forgotPasswordLink")
  const forgotPasswordModal = document.getElementById("forgotPasswordModal")
  const modalCloseBtn = document.getElementById("modalCloseBtn")
  const forgotPasswordForm = document.getElementById("forgotPasswordForm")
  const resetBtn = document.getElementById("resetBtn")
  const resetErrorAlert = document.getElementById("resetErrorAlert")
  const resetSuccessMessage = document.getElementById("resetSuccessMessage")
  const resetResendBtn = document.getElementById("resetResendBtn")

  // Store user input (email or username) for resend functionality
  let userInput = ""
  let resetUserInput = ""

  // Guest Login Handler
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
            window.location.href = '../home/home.html'
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

  // Modal functionality
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault()
    forgotPasswordModal.style.display = "flex"
    document.body.style.overflow = "hidden"
  })

  modalCloseBtn.addEventListener("click", () => {
    closeForgotPasswordModal()
  })

  // Close modal when clicking outside
  forgotPasswordModal.addEventListener("click", (e) => {
    if (e.target === forgotPasswordModal) {
      closeForgotPasswordModal()
    }
  })

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && forgotPasswordModal.style.display === "flex") {
      closeForgotPasswordModal()
    }
  })

  function closeForgotPasswordModal() {
    forgotPasswordModal.style.display = "none"
    document.body.style.overflow = "auto"

    // Reset form
    forgotPasswordForm.reset()
    resetErrorAlert.style.display = "none"
    resetSuccessMessage.style.display = "none"
    forgotPasswordForm.style.display = "block"
    document.getElementById("resetEmailOrUsernameError").textContent = ""

    // Reset button state
    resetBtn.disabled = false
    resetBtn.textContent = "Send Reset Link"
  }

  // Forgot Password Form Submission
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const resetEmailOrUsername = document.getElementById("resetEmailOrUsername")
    const resetEmailOrUsernameError = document.getElementById("resetEmailOrUsernameError")

    // Clear previous errors
    resetErrorAlert.style.display = "none"
    resetEmailOrUsernameError.textContent = ""

    // Validate input
    if (!resetEmailOrUsername.value.trim()) {
      resetEmailOrUsernameError.textContent = "Email or username is required"
      return
    }

    // Store the input for resend functionality
    resetUserInput = resetEmailOrUsername.value.trim()

    // Disable button and show loading state
    resetBtn.disabled = true
    resetBtn.textContent = "Sending..."

    try {
      const response = await fetch("/api/v1/users/send-reset-password-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrUsername: resetUserInput }),
      })

      const data = await response.json()

      if (data.success === false) {
        resetErrorAlert.textContent = data.message
        resetErrorAlert.style.display = "block"

        // Reset button state
        resetBtn.disabled = false
        resetBtn.textContent = "Send Reset Link"
        return
      }

      // Show success message and hide form
      forgotPasswordForm.style.display = "none"
      resetSuccessMessage.style.display = "block"
    } catch (error) {
      console.error("Reset password error:", error)
      resetErrorAlert.textContent = "Connection error. Please try again later."
      resetErrorAlert.style.display = "block"

      // Reset button state
      resetBtn.disabled = false
      resetBtn.textContent = "Send Reset Link"
    }
  })

  // Reset Resend Button
  if (resetResendBtn) {
    resetResendBtn.addEventListener("click", async () => {
      if (resetResendBtn.disabled) {
        return
      }

      if (!resetUserInput) {
        alert("Username or email not found. Please try again.")
        return
      }

      // Update button state
      resetResendBtn.textContent = "Sending..."
      resetResendBtn.disabled = true
      resetResendBtn.classList.add("resend-cooldown")

      try {
        const response = await fetch("/api/v1/users/send-reset-password-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emailOrUsername: resetUserInput }),
        })

        const data = await response.json()

        if (data.success === false) {
          alert(data.message)

          // Reset button state
          resetResendBtn.textContent = "Resend"
          resetResendBtn.disabled = false
          resetResendBtn.classList.remove("resend-cooldown")
          return
        }

        // Show success message
        const statusMessage = document.createElement("span")
        statusMessage.className = "resend-status"
        statusMessage.textContent = "Email sent!"

        // Insert status message before the resend button
        const resendSection = resetSuccessMessage.querySelector(".resend-section")
        resendSection.insertBefore(statusMessage, resetResendBtn)

        // Update button text during cooldown
        resetResendBtn.textContent = "Resend"

        // Start cooldown timer
        let cooldownTime = 30
        const cooldownInterval = setInterval(() => {
          cooldownTime--
          resetResendBtn.textContent = `Resend (${cooldownTime}s)`

          if (cooldownTime <= 0) {
            clearInterval(cooldownInterval)
            resetResendBtn.textContent = "Resend"
            resetResendBtn.disabled = false
            resetResendBtn.classList.remove("resend-cooldown")

            // Remove the status message
            if (statusMessage.parentNode) {
              statusMessage.parentNode.removeChild(statusMessage)
            }
          }
        }, 1000)
      } catch (error) {
        console.error("Error resending reset password link:", error)
        alert("Connection error. Please try again later.")

        // Reset button state
        resetResendBtn.textContent = "Resend"
        resetResendBtn.disabled = false
        resetResendBtn.classList.remove("resend-cooldown")
      }
    })
  }

  // Password visibility toggle
  const togglePasswordButton = document.querySelector(".toggle-password")
  togglePasswordButton.addEventListener("click", function () {
    const passwordInput = document.getElementById("password")
    const eyeIcon = this.querySelector(".eye-icon")
    const eyeOffIcon = this.querySelector(".eye-off-icon")

    if (passwordInput.type === "password") {
      passwordInput.type = "text"
      eyeIcon.style.display = "none"
      eyeOffIcon.style.display = "block"
    } else {
      passwordInput.type = "password"
      eyeIcon.style.display = "block"
      eyeOffIcon.style.display = "none"
    }
  })

  // Form validation
  const emailOrUsername = document.getElementById("emailOrUsername")
  const password = document.getElementById("password")

  const emailOrUsernameError = document.getElementById("emailOrUsernameError")
  const passwordError = document.getElementById("passwordError")

  // Form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Clear all error messages
    emailOrUsernameError.textContent = ""
    passwordError.textContent = ""
    errorAlert.style.display = "none"

    // Validate form
    let isValid = true

    if (!emailOrUsername.value.trim()) {
      emailOrUsernameError.textContent = "Email or username is required"
      isValid = false
    }

    if (!password.value) {
      passwordError.textContent = "Password is required"
      isValid = false
    }

    if (!isValid) {
      return
    }

    // Store the user input for resend functionality
    userInput = emailOrUsername.value.trim()

    // Disable button and show loading state
    loginBtn.disabled = true
    loginBtn.textContent = "Logging in..."

    try {
      // Prepare request data
      const userData = {
        emailOrUsername: userInput,
        password: password.value,
      }

      // Send API request
      const response = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      // Check if the response indicates success
      if (data.success === false) {
        // Check if it's a verification error (403)
        if (response.status === 403 && data.message.includes("verification")) {
          // Show verification message
          loginForm.style.display = "none"
          verificationMessage.style.display = "block"
        } else {
          // Show error message
          errorAlert.textContent = data.message
          errorAlert.style.display = "block"
        }

        // Reset button state
        loginBtn.disabled = false
        loginBtn.textContent = "Login"
        return
      }

      // If we get here, login was successful
      console.log("Login successful:", data)
      // Store both access token and user data
      const authData = {
        accessToken: data.data.accessToken,
        user: data.data.user,
      }
      localStorage.setItem("authData", JSON.stringify(authData))

      // Show success message before redirecting
      loginForm.style.display = "none"
      successMessage.style.display = "block"

      // Redirect after a short delay (0.5 seconds)
      setTimeout(() => {
        window.location.href = "../home/home.html"
      }, 500)
    } catch (error) {
      console.error("Login error:", error)

      // Show error message
      errorAlert.textContent = "Connection error. Please try again later."
      errorAlert.style.display = "block"

      // Reset button state
      loginBtn.disabled = false
      loginBtn.textContent = "Login"
    }
  })

  // Make sure resendBtn exists before attaching event listener
  if (resendBtn) {
    // Resend verification email
    resendBtn.addEventListener("click", async () => {
      if (resendBtn.disabled) {
        return // Prevent clicks during cooldown
      }

      // If we don't have user input, show an error
      if (!userInput) {
        alert("Username or email not found. Please try logging in again.")
        return
      }

      console.log("Sending verification email to:", userInput) // Debug log

      // Update button state
      resendBtn.textContent = "Sending..."
      resendBtn.disabled = true
      resendBtn.classList.add("resend-cooldown")

      try {
        // Make API call to resend verification email with the new format
        const response = await fetch("/api/v1/users/resend-verification-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emailOrUsername: userInput }), // Updated to use emailOrUsername
        })

        const data = await response.json()

        // Check if the response indicates success
        if (data.success === false) {
          alert(data.message)

          // Reset button state
          resendBtn.textContent = "Resend"
          resendBtn.disabled = false
          resendBtn.classList.remove("resend-cooldown")
          return
        }

        // Show success message
        const statusMessage = document.createElement("span")
        statusMessage.className = "resend-status"
        statusMessage.textContent = "Email sent!"

        // Insert status message before the resend button
        const resendSection = document.querySelector(".resend-section")
        resendSection.insertBefore(statusMessage, resendBtn)

        // Update button text during cooldown
        resendBtn.textContent = "Resend"

        // Start cooldown timer
        let cooldownTime = 30
        const cooldownInterval = setInterval(() => {
          cooldownTime--
          resendBtn.textContent = `Resend (${cooldownTime}s)`

          if (cooldownTime <= 0) {
            clearInterval(cooldownInterval)
            resendBtn.textContent = "Resend"
            resendBtn.disabled = false
            resendBtn.classList.remove("resend-cooldown")

            // Remove the status message
            if (statusMessage.parentNode) {
              statusMessage.parentNode.removeChild(statusMessage)
            }
          }
        }, 1000)
      } catch (error) {
        console.error("Error resending verification email:", error)
        alert("Connection error. Please try again later.")

        // Reset button state
        resendBtn.textContent = "Resend"
        resendBtn.disabled = false
        resendBtn.classList.remove("resend-cooldown")
      }
    })
  } else {
    console.error("Resend button not found in the DOM")
  }
})
