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

      if (token && !isTokenExpired(token)) {
        // Token exists and is valid → redirect to home
        window.location.href = '../home/home.html';
      } else {
        // Token is expired → remove authData
        localStorage.removeItem('authData');
      }
    } catch (err) {
      // If parsing fails or anything else, clean it up
      localStorage.removeItem('authData');
    }
  }
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const verificationMessage = document.getElementById('verificationMessage');
    const resendBtn = document.getElementById('resendBtn');
    
    // Store user email for resend functionality
    let userEmail = '';
    
    // Password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const eyeIcon = this.querySelector('.eye-icon');
            const eyeOffIcon = this.querySelector('.eye-off-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    });
    
    // Form validation
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    // Username validation
    username.addEventListener('input', function() {
        if (username.value.length < 3) {
            usernameError.textContent = 'Username must be at least 3 characters';
        } else {
            usernameError.textContent = '';
        }
    });
    
    // Email validation
    email.addEventListener('input', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            emailError.textContent = 'Please enter a valid email address';
        } else {
            emailError.textContent = '';
        }
    });
    
    // Password validation
    password.addEventListener('input', function() {
        if (password.value.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
        } else {
            passwordError.textContent = '';
        }
        
        // Check if confirm password matches
        if (confirmPassword.value && confirmPassword.value !== password.value) {
            confirmPasswordError.textContent = 'Passwords do not match';
        } else if (confirmPassword.value) {
            confirmPasswordError.textContent = '';
        }
    });
    
    // Confirm password validation
    confirmPassword.addEventListener('input', function() {
        if (confirmPassword.value !== password.value) {
            confirmPasswordError.textContent = 'Passwords do not match';
        } else {
            confirmPasswordError.textContent = '';
        }
    });
    
    // Form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear all error messages
        usernameError.textContent = '';
        emailError.textContent = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
        
        // Remove any existing error alert
        const existingError = document.getElementById('errorAlert');
        if (existingError) {
            existingError.remove();
        }
        
        // Validate form
        let isValid = true;
        
        if (username.value.length < 3) {
            usernameError.textContent = 'Username must be at least 3 characters';
            isValid = false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            emailError.textContent = 'Please enter a valid email address';
            isValid = false;
        }
        
        if (password.value.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            isValid = false;
        }
        
        if (confirmPassword.value !== password.value) {
            confirmPasswordError.textContent = 'Passwords do not match';
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Disable button and show loading state
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
        
        try {
            // Store email for resend functionality
            userEmail = email.value;
            
            // Prepare request data
            const userData = {
                username: username.value,
                email: userEmail,
                password: password.value
            };
            
            // Send API request
            const response = await fetch('/api/v1/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            // Simple check: if success is false, show the error message
            if (data.success === false) {
                // Create error alert
                const errorAlert = document.createElement('div');
                errorAlert.id = 'errorAlert';
                errorAlert.className = 'error-alert';
                errorAlert.textContent = data.message;
                
                // Insert at the top of the form
                registerForm.insertBefore(errorAlert, registerForm.firstChild);
                
                // Reset button state
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
                return;
            }
            
            // If we get here, registration was successful
            registerForm.style.display = 'none';
            verificationMessage.style.display = 'block';
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Create error alert for network errors
            const errorAlert = document.createElement('div');
            errorAlert.id = 'errorAlert';
            errorAlert.className = 'error-alert';
            errorAlert.textContent = 'Connection error. Please try again later.';
            
            // Insert at the top of the form
            registerForm.insertBefore(errorAlert, registerForm.firstChild);
            
            // Reset button state
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    });
    
    // Resend verification email
    resendBtn.addEventListener('click', async function() {
        if (resendBtn.disabled) {
            return; // Prevent clicks during cooldown
        }
        
        // Update button state
        resendBtn.textContent = 'Sending...';
        resendBtn.disabled = true;
        resendBtn.classList.add('resend-cooldown');
        
        try {
            // Make API call to resend verification email
            const response = await fetch('/api/v1/users/resend-verification-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emailOrUsername: userEmail })
            });
            
            const data = await response.json();
            
            // Simple check: if success is false, show the error message
            if (data.success === false) {
                alert(data.message);
                
                // Reset button state
                resendBtn.textContent = 'Resend';
                resendBtn.disabled = false;
                resendBtn.classList.remove('resend-cooldown');
                return;
            }
            
            // Show success message
            const statusMessage = document.createElement('span');
            statusMessage.className = 'resend-status';
            statusMessage.textContent = 'Email sent!';
            
            // Insert status message before the resend button
            const resendSection = document.querySelector('.resend-section');
            resendSection.insertBefore(statusMessage, resendBtn);
            
            // Update button text during cooldown
            resendBtn.textContent = 'Resend';
            
            // Start cooldown timer
            let cooldownTime = 30;
            const cooldownInterval = setInterval(() => {
                cooldownTime--;
                resendBtn.textContent = `Resend (${cooldownTime}s)`;
                
                if (cooldownTime <= 0) {
                    clearInterval(cooldownInterval);
                    resendBtn.textContent = 'Resend';
                    resendBtn.disabled = false;
                    resendBtn.classList.remove('resend-cooldown');
                    
                    // Remove the status message
                    if (statusMessage.parentNode) {
                        statusMessage.parentNode.removeChild(statusMessage);
                    }
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error resending verification email:', error);
            alert('Connection error. Please try again later.');
            
            // Reset button state
            resendBtn.textContent = 'Resend';
            resendBtn.disabled = false;
            resendBtn.classList.remove('resend-cooldown');
        }
    });
});