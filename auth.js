// User data storage
class UserStorage {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    registerUser(username, email, password) {
        if (this.users[username]) {
            return { success: false, message: 'Username already exists' };
        }
        if (Object.values(this.users).some(user => user.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        this.users[username] = {
            email,
            password: this.hashPassword(password), // In a real app, use proper password hashing
            createdAt: new Date().toISOString()
        };
        
        this.saveUsers();
        return { success: true, message: 'Registration successful' };
    }

    loginUser(username, password) {
        const user = this.users[username];
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Invalid password' };
        }

        return { success: true, message: 'Login successful', user };
    }

    resetPassword(email, newPassword) {
        const user = Object.entries(this.users).find(([_, userData]) => userData.email === email);
        if (!user) {
            return { success: false, message: 'Email not found' };
        }

        this.users[user[0]].password = this.hashPassword(newPassword);
        this.saveUsers();
        return { success: true, message: 'Password reset successful' };
    }

    // Simple password hashing (NOT for production use)
    hashPassword(password) {
        return btoa(password); // In a real app, use proper password hashing
    }
}

const userStorage = new UserStorage();

// Form handling
function showForm(formId) {
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(formId).classList.add('active');
}

function showMessage(formId, type, message) {
    const form = document.getElementById(formId);
    if (!form) {
        // Fallback: if form isn't present on this page, show an alert
        alert(message);
        return;
    }
    const errorElement = form.querySelector('.error-message');
    const successElement = form.querySelector('.success-message');

    if (!errorElement && !successElement) {
        // No inline message containers - use alert as fallback
        alert(message);
        return;
    }

    if (type === 'error') {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        if (successElement) successElement.style.display = 'none';
    } else {
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }
        if (errorElement) errorElement.style.display = 'none';
    }
}

// Event handlers
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const result = userStorage.loginUser(username, password);
    if (result.success) {
        showMessage('loginForm', 'success', result.message);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', username);
        // If this is a dedicated login page, redirect to main app
        setTimeout(() => {
            if (window.location.pathname.toLowerCase().includes('login.html')) {
                window.location.href = 'index1.html';
                return;
            }
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('ui').style.display = 'block';
            showProfile();
        }, 600);
    } else {
        showMessage('loginForm', 'error', result.message);
    }
}

function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showMessage('registerForm', 'error', 'Passwords do not match');
        return;
    }

    const result = userStorage.registerUser(username, email, password);
    if (result.success) {
        showMessage('registerForm', 'success', result.message);
        setTimeout(() => showForm('loginForm'), 2000);
    } else {
        showMessage('registerForm', 'error', result.message);
    }
}

function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const newPassword = Math.random().toString(36).slice(-8); // Generate random password

    const result = userStorage.resetPassword(email, newPassword);
    if (result.success) {
        showMessage('forgotPasswordForm', 'success', `Your new password is: ${newPassword}`);
    } else {
        showMessage('forgotPasswordForm', 'error', result.message);
    }
}

// Check login status on page load
window.addEventListener('DOMContentLoaded', () => {
    // For development - bypass login (remove in production)
    // sessionStorage.setItem('isLoggedIn', 'true');
    
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const authContainer = document.getElementById('authContainer');
        const ui = document.getElementById('ui');
        if (authContainer) authContainer.style.display = 'none';
        if (ui) ui.style.display = 'block';
        showProfile();
    } else {
        const authContainer = document.getElementById('authContainer');
        const ui = document.getElementById('ui');
        if (authContainer) authContainer.style.display = 'flex';
        if (ui) ui.style.display = 'none';
        // If there's a login form on this page, show it
        if (document.getElementById('loginForm')) showForm('loginForm');
    }
});

// Show profile name and enable logout button
function showProfile(){
    const username = sessionStorage.getItem('currentUser');
    const profileEl = document.getElementById('profile');
    const profileName = document.getElementById('profileName');
    const logoutBtn = document.getElementById('logoutBtn');
    const signinBtn = document.getElementById('signinBtn');
    if(profileEl && profileName && logoutBtn && username){
        profileName.textContent = username;
        profileEl.style.display = 'flex';
        logoutBtn.style.display = 'inline-block';
        if(signinBtn) signinBtn.style.display = 'none';
    }
}

// Logout helper
function logout(){
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser');
    // If on login page, just ensure UI reflects logged-out state
    if (window.location.pathname.toLowerCase().includes('login.html')) {
        // already on login page — show login form if present
        if (document.getElementById('loginForm')) showForm('loginForm');
    } else {
        const authContainer = document.getElementById('authContainer');
        const ui = document.getElementById('ui');
        if (authContainer) {
            authContainer.style.display = 'flex';
            if (ui) ui.style.display = 'none';
            if (document.getElementById('loginForm')) showForm('loginForm');
        } else {
            // No inline auth present (we're using separate login page) — redirect there
            window.location.href = 'login.html';
            return;
        }
    }
    const profileEl = document.getElementById('profile');
    const logoutBtn = document.getElementById('logoutBtn');
    const signinBtn = document.getElementById('signinBtn');
    if(profileEl) profileEl.style.display = 'none';
    if(logoutBtn) logoutBtn.style.display = 'none';
    if(signinBtn) signinBtn.style.display = 'inline-block';
}