document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
});

function checkAuthStatus() {
    const adminData = localStorage.getItem('adminData');
    
    if (!adminData) {
        // User not logged in, redirect to login
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(adminData);
        console.log('User authenticated:', userData);
        
        // You can use userData to personalize the dashboard
        // For example, show user name in header if available
        if (userData.name || userData.username) {
            updateUserInfo(userData);
        }
    } catch (error) {
        console.error('Error parsing admin data:', error);
        // Invalid data, redirect to login
        localStorage.removeItem('adminData');
        window.location.href = 'login.html';
    }
}

function updateUserInfo(userData) {
    const headerSubtitle = document.querySelector('.header-subtitle');
    if (headerSubtitle && (userData.name || userData.username)) {
        headerSubtitle.textContent = `Welcome back, ${userData.name || userData.username}!`;
    }
}

function initializeDashboard() {
    console.log('DataViz Dashboard initialized');
    
    // Load dashboard data (you can replace this with actual API calls)
    loadDashboardData();
    
    // Set active navigation
    setActiveNavigation('dashboard');
}

function loadDashboardData() {
    // Fetch real dashboard data from API
    fetch('/api/v1/dashboard/get-dashboard-info', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data && data.success && data.data) {
            updateDashboardCards(data.data);
        } else {
            showNotification('Failed to load dashboard data.', 'error');
        }
    })
    .catch(err => {
        showNotification('Failed to load dashboard data.', 'error');
        console.error('Dashboard API error:', err);
    });

    // Animate cards as before
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function updateDashboardCards(info) {
    // Map info keys to card element IDs or classes
    const mapping = {
        premiumUsers: '#premium-users-count',
        freeUsers: '#free-users-count',
        macroMetrics: '#macro-metrics-count',
        industryMetrics: '#industry-metrics-count',
        totalMetricData: '#total-metricdata-count',
        totalIndustries: '#total-industries-count',
        totalPayments: '#total-payments-count'
    };
    Object.entries(mapping).forEach(([key, selector]) => {
        const el = document.querySelector(selector);
        if (el && info[key] !== undefined) {
            if (key === 'totalPayments') {
                el.textContent = info[key] ? `₹${formatNumber(info[key])}` : '₹0';
            } else {
                el.textContent = formatNumber(info[key]);
            }
        }
    });
}

function setupEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Dashboard cards
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach(card => {
        card.addEventListener('click', handleCardClick);
    });
    
    // Mobile menu toggle (if needed)
    setupMobileMenu();
}

function handleNavigation(e) {
    e.preventDefault();
    
    const clickedLink = e.currentTarget;
    const section = clickedLink.getAttribute('data-section');
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    clickedLink.classList.add('active');
    
    // Handle navigation based on section
    navigateToSection(section);
}

function handleCardClick(e) {
    const card = e.currentTarget;
    const section = card.getAttribute('data-section');
    
    // Add click animation
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
        card.style.transform = '';
    }, 150);
    
    // Navigate to the corresponding section
    navigateToSection(section);
    
    // Also update sidebar navigation
    setActiveNavigation(section);
}

function navigateToSection(section) {
    console.log(`Navigating to section: ${section}`);
    
    // Here you would typically:
    // 1. Load the appropriate content for the section
    // 2. Update the main content area
    // 3. Fetch section-specific data
    
    switch (section) {
        case 'dashboard':
            showDashboard();
            break;
        case 'user-management':
            showUserManagement();
            break;
        case 'metric-management':
            showMetricManagement();
            break;
        case 'metric-data-management':
            showMetricDataManagement();
            break;
        case 'industry-management':
            showIndustryManagement();
            break;
        case 'payment-management':
            showPaymentManagement();
            break;
        default:
            console.log('Unknown section:', section);
    }
}

function setActiveNavigation(section) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to the corresponding nav link
    const targetLink = document.querySelector(`[data-section="${section}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

// Section display functions (placeholder implementations)
function showDashboard() {
    updatePageTitle('Dashboard');
    // Show dashboard cards, hide other content
    console.log('Showing dashboard');
}

function showUserManagement() {
    window.location.href = "../user-management/user-management.html"
    // Here you would load user management interface
}

function showMetricManagement() {
    window.location.href = "../metric-management/metric-management.html"
}

function showMetricDataManagement() {
    window.location.href = "../metric-data-management/metric-data-management.html"
}

function showIndustryManagement() {
    window.location.href = "../industry-management/industry-management.html"
}

function showPaymentManagement() {
    window.location.href = "../payment-management/payment-management.html"
}

function updatePageTitle(title) {
    const headerTitle = document.querySelector('.dashboard-header h1');
    if (headerTitle) {
        headerTitle.textContent = title;
    }
    
    // Update browser title
    document.title = `DataViz - ${title}`;
}

function setupMobileMenu() {
    // Add mobile menu functionality if needed
    // This would handle sidebar toggle on mobile devices
    
    const sidebar = document.querySelector('.sidebar');
    
    // You can add a mobile menu button and toggle functionality here
    // For now, we'll just handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('open');
        }
    });
}

// Utility functions
function showNotification(message, type = 'info') {
    // You can implement a notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Dashboard error:', e.error);
    showNotification('An error occurred. Please refresh the page.', 'error');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Page became visible, you might want to refresh data
        console.log('Page became visible, checking auth status...');
        checkAuthStatus();
    }
});