document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.querySelector('.button-text');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // API endpoint
    const API_ENDPOINT = '/api/v1/admins/login';

    // Form submission handler
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear any previous error messages
        hideError();
        
        // Get form data
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Make API call
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Login successful
                console.log('Login successful:', data);
                
                // Save admin data to localStorage
                localStorage.setItem('adminData', JSON.stringify(data));
                
                // Show success message briefly
                showSuccess('Login successful! Redirecting...');
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = './dashboard/dashboard.html'; // You can change this to any HTML file
                }, 1500);
                
            } else {
                // Login failed
                const errorMsg = data.message || data.error || 'Login failed. Please check your credentials.';
                showError(errorMsg);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showError('Network error. Please check your connection and try again.');
            } else {
                showError('An unexpected error occurred. Please try again.');
            }
        } finally {
            // Hide loading state
            setLoadingState(false);
        }
    });

    // Set loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            loginButton.disabled = true;
            buttonText.classList.add('hide');
            loadingSpinner.classList.add('show');
        } else {
            loginButton.disabled = false;
            buttonText.classList.remove('hide');
            loadingSpinner.classList.remove('show');
        }
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        errorMessage.style.background = '#fef2f2';
        errorMessage.style.color = '#ef4444';
        errorMessage.style.borderColor = '#fecaca';
    }

    // Show success message
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        errorMessage.style.background = '#f0fdf4';
        errorMessage.style.color = '#16a34a';
        errorMessage.style.borderColor = '#bbf7d0';
    }

    // Hide error/success message
    function hideError() {
        errorMessage.classList.remove('show');
    }

    // Clear error message when user starts typing
    usernameInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);

    // Handle Enter key in form fields
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Check if user is already logged in
    const existingAdminData = localStorage.getItem('adminData');
    if (existingAdminData) {
        console.log('User already logged in, redirecting...');
        // Uncomment the line below if you want to auto-redirect logged-in users
        // window.location.href = 'dashboard.html';
    }

    // Demo credentials helper (remove in production)
    console.log('Demo credentials: username="admin", password="admin1"');
});