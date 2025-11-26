// js/auth.js

const API_BASE_URL = 'http://localhost:5000/api'; // BASE URL for backend calls

// Utility function to get the stored JWT token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Utility function to generate headers for authenticated requests
function getAuthHeaders() {
    const token = getAuthToken();
    if (token) {
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token
        };
    } else {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return {};
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Session Check
    if (!window.location.pathname.includes('index.html') && !getAuthToken()) {
        window.location.href = 'index.html';
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Welcome Message
    if (!window.location.pathname.includes('index.html')) {
        const username = localStorage.getItem('username') || 'Admin';
        const welcomeEl = document.getElementById('welcome-message');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome, ${username}!`;
        }
    }
    
    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    const wrapper = document.getElementById('wrapper');
    if (sidebarToggle && wrapper) {
        sidebarToggle.addEventListener('click', () => {
            wrapper.classList.toggle('toggled');
        });
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('login-message');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username); 
            window.location.href = 'dashboard.html';
        } else {
            messageEl.textContent = data.msg || data.message || 'Invalid credentials. Please try again.';
            messageEl.classList.remove('d-none');
        }
    } catch (error) {
        messageEl.textContent = 'Server connection failed.';
        messageEl.classList.remove('d-none');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}