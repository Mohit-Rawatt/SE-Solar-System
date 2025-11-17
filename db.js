// Database configuration
const DB_NAME = 'solarSystemDB';

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('users')) {
                const store = db.createObjectStore('users', { keyPath: 'username' });
                store.createIndex('email', 'email', { unique: true });
            }
        };
    });
}

// Database operations
const dbOperations = {
    async addUser(userData) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            // Hash the password (in a real app, use proper password hashing)
            userData.password = btoa(userData.password);
            
            const request = store.add(userData);
            
            request.onsuccess = () => resolve({ success: true });
            request.onerror = () => reject(request.error);
        });
    },

    async getUser(username) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(username);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getUserByEmail(email) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async updateUserPassword(username, newPassword) {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const getRequest = store.get(username);
            getRequest.onsuccess = () => {
                const userData = getRequest.result;
                if (userData) {
                    userData.password = btoa(newPassword);
                    const updateRequest = store.put(userData);
                    updateRequest.onsuccess = () => resolve({ success: true });
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('User not found'));
                }
            };
        });
    }
};

// Authentication functions
async function registerUser(username, email, password) {
    try {
        const userData = { username, email, password, createdAt: new Date().toISOString() };
        await dbOperations.addUser(userData);
        return { success: true, message: 'Registration successful!' };
    } catch (error) {
        return { success: false, message: 'Username or email already exists' };
    }
}

async function loginUser(username, password) {
    try {
        const user = await dbOperations.getUser(username);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Compare passwords (in a real app, use proper password comparison)
        if (user.password !== btoa(password)) {
            return { success: false, message: 'Invalid password' };
        }
        
        return { success: true, message: 'Login successful!', user };
    } catch (error) {
        return { success: false, message: 'Login failed' };
    }
}

async function resetPassword(email) {
    try {
        const user = await dbOperations.getUserByEmail(email);
        if (!user) {
            return { success: false, message: 'Email not found' };
        }
        
        // Generate temporary password (in a real app, send this via email)
        const tempPassword = Math.random().toString(36).slice(-8);
        await dbOperations.updateUserPassword(user.username, tempPassword);
        
        return { 
            success: true, 
            message: 'Password reset successful!',
            tempPassword // In a real app, this would be sent via email
        };
    } catch (error) {
        return { success: false, message: 'Password reset failed' };
    }
}