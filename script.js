// ============ FIREBASE CONFIGURATION ============
// Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU0bh5ZSHtwKdM62wjSywikcD-JXVl4Rg",
  authDomain: "ccps-4277f.firebaseapp.com",
  projectId: "ccps-4277f",
  storageBucket: "ccps-4277f.firebasestorage.app",
  messagingSenderId: "187400720437",
  appId: "1:187400720437:web:1750d9dc8000bb5c7fa17c",
  measurementId: "G-NY0GL5XN4W"
};

// Initialize Firebase
let db;
let auth;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase initialization skipped or failed:', error);
}

// ============ STATE MANAGEMENT ============
const state = {
    currentRole: null,
    currentUser: null,
    transactions: [],
    cards: [],
    merchants: [],
    currentScreen: 'loginScreen'
};

// Demo data
const demoUsers = {
    customer: { username: 'customer1', password: 'demo123', name: 'Freddy', id: 'cust_001' },
    merchant: { username: 'merchant1', password: 'demo123', name: 'ABC Store', id: 'merch_001' },
    admin: { username: 'admin1', password: 'demo123', name: 'Bank Admin', id: 'admin_001' }
};

// Generate mock transactions
function generateMockTransactions() {
    const statuses = ['success', 'failed', 'pending'];
    const failures = ['Insufficient funds', 'Expired card', 'Invalid CVV', 'Card blocked'];
    const transactions = [];
    
    for (let i = 0; i < 20; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        transactions.push({
            id: `TXN-${String(i + 1).padStart(6, '0')}`,
            customerId: 'cust_001',
            merchantId: i % 2 === 0 ? 'merch_001' : 'merch_002',
            amount: (Math.random() * 500 + 10).toFixed(2),
            status: status,
            date: new Date(2026, 0, Math.random() * 31 + 1).toISOString().split('T')[0],
            description: ['Online Purchase', 'Store Purchase', 'Bill Payment', 'Subscription'][Math.floor(Math.random() * 4)],
            failureReason: status === 'failed' ? failures[Math.floor(Math.random() * failures.length)] : null
        });
    }
    return transactions;
}

// Generate mock cards
function generateMockCards() {
    return [
        { customerId: 'cust_001', cardNumber: '4532123456789012', holder: 'Freddy', status: 'active', limit: 5000, balance: 500, expiry: '12/25' },
        { customerId: 'cust_002', cardNumber: '5425233010103010', holder: 'Jane Smith', status: 'active', limit: 10000, balance: 2300, expiry: '08/26' },
        { customerId: 'cust_003', cardNumber: '3714123456789012', holder: 'Bob Johnson', status: 'blocked', limit: 3000, balance: 1500, expiry: '05/27' }
    ];
}

state.transactions = generateMockTransactions();
state.cards = generateMockCards();

// ============ FIREBASE DATABASE FUNCTIONS ============

/**
 * Save a transaction to Firebase
 */
async function saveTransaction(transaction) {
    if (!db) {
        console.error('Firebase not initialized');
        return false;
    }
    try {
        const transactionId = transaction.id || `TXN-${Date.now()}`;
        await db.ref(`transactions/${transactionId}`).set({
            ...transaction,
            timestamp: new Date().toISOString()
        });
        console.log('Transaction saved:', transactionId);
        return true;
    } catch (error) {
        console.error('Error saving transaction:', error);
        return false;
    }
}

/**
 * Update a card in Firebase
 */
async function updateCard(cardNumber, cardData) {
    if (!db) {
        console.error('Firebase not initialized');
        return false;
    }
    try {
        const cardId = cardNumber.replace(/\s+/g, '');
        await db.ref(`cards/${cardId}`).update({
            ...cardData,
            lastUpdated: new Date().toISOString()
        });
        console.log('Card updated:', cardId);
        return true;
    } catch (error) {
        console.error('Error updating card:', error);
        return false;
    }
}

/**
 * Add a new card to Firebase
 */
async function addCard(cardData) {
    if (!db) {
        console.error('Firebase not initialized');
        return false;
    }
    try {
        const cardId = cardData.cardNumber.replace(/\s+/g, '');
        await db.ref(`cards/${cardId}`).set({
            ...cardData,
            createdAt: new Date().toISOString()
        });
        console.log('Card added:', cardId);
        return true;
    } catch (error) {
        console.error('Error adding card:', error);
        return false;
    }
}

/**
 * Fetch all transactions from Firebase
 */
async function fetchTransactions() {
    if (!db) {
        console.error('Firebase not initialized');
        return [];
    }
    try {
        const snapshot = await db.ref('transactions').get();
        if (snapshot.exists()) {
            const transactions = [];
            snapshot.forEach(child => {
                transactions.push(child.val());
            });
            console.log('Transactions fetched:', transactions.length);
            return transactions;
        }
        return [];
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

/**
 * Fetch all cards from Firebase
 */
async function fetchCards() {
    if (!db) {
        console.error('Firebase not initialized');
        return [];
    }
    try {
        const snapshot = await db.ref('cards').get();
        if (snapshot.exists()) {
            const cards = [];
            snapshot.forEach(child => {
                cards.push(child.val());
            });
            console.log('Cards fetched:', cards.length);
            return cards;
        }
        return [];
    } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
    }
}

/**
 * Save user data to Firebase
 */
async function saveUser(userId, userData) {
    if (!db) {
        console.error('Firebase not initialized');
        return false;
    }
    try {
        await db.ref(`users/${userId}`).set({
            ...userData,
            lastLogin: new Date().toISOString()
        });
        console.log('User saved:', userId);
        return true;
    } catch (error) {
        console.error('Error saving user:', error);
        return false;
    }
}

/**
 * Fetch user data from Firebase
 */
async function fetchUser(userId) {
    if (!db) {
        console.error('Firebase not initialized');
        return null;
    }
    try {
        const snapshot = await db.ref(`users/${userId}`).get();
        if (snapshot.exists()) {
            console.log('User fetched:', userId);
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Listen to real-time transaction updates
 */
function listenToTransactions(callback) {
    if (!db) {
        console.error('Firebase not initialized');
        return;
    }
    db.ref('transactions').on('value', (snapshot) => {
        const transactions = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                transactions.push(child.val());
            });
        }
        callback(transactions);
    });
}

/**
 * Delete a transaction from Firebase
 */
async function deleteTransaction(transactionId) {
    if (!db) {
        console.error('Firebase not initialized');
        return false;
    }
    try {
        await db.ref(`transactions/${transactionId}`).remove();
        console.log('Transaction deleted:', transactionId);
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return false;
    }
}

// ============ SCREEN NAVIGATION ============
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        state.currentScreen = screenId;
    }
}

// ============ LOGIN FUNCTIONALITY ============
// ============ VALIDATION FUNCTIONS ============

/**
 * Username validation rules - customizable
 */
const usernameRules = {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/, // alphanumeric, underscore, hyphen
    customMessage: 'Username must be 3-20 characters, using only letters, numbers, underscores, and hyphens'
};

/**
 * Password validation rules
 */
const passwordRules = {
    minLength: 8,
    requireNumber: true,
    requireSpecial: true,
    specialCharacters: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

/**
 * Validate username
 */
function validateUsername(username) {
    if (username.length < usernameRules.minLength || username.length > usernameRules.maxLength) {
        return {
            valid: false,
            message: `Username must be ${usernameRules.minLength}-${usernameRules.maxLength} characters`
        };
    }
    
    if (!usernameRules.pattern.test(username)) {
        return {
            valid: false,
            message: usernameRules.customMessage
        };
    }
    
    return { valid: true, message: 'Username is valid ✓' };
}

/**
 * Validate password strength
 */
function validatePassword(password) {
    const result = {
        valid: true,
        errors: [],
        length: false,
        number: false,
        special: false
    };

    // Check length
    if (password.length < passwordRules.minLength) {
        result.errors.push(`Password must be at least ${passwordRules.minLength} characters`);
        result.valid = false;
    } else {
        result.length = true;
    }

    // Check for number
    if (passwordRules.requireNumber && !/\d/.test(password)) {
        result.errors.push('Password must contain at least one number');
        result.valid = false;
    } else if (passwordRules.requireNumber) {
        result.number = true;
    }

    // Check for special character
    if (passwordRules.requireSpecial && !passwordRules.specialCharacters.test(password)) {
        result.errors.push('Password must contain at least one special character (!@#$%^&*)');
        result.valid = false;
    } else if (passwordRules.requireSpecial) {
        result.special = true;
    }

    return result;
}

/**
 * Check if username already exists in Firebase
 */
async function checkUsernameExists(username) {
    if (!db) {
        return false;
    }
    try {
        const snapshot = await db.ref('users').orderByChild('username').equalTo(username).get();
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

/**
 * Register new user
 */
async function registerUser(fullName, username, password, role) {
    if (!db) {
        console.error('Firebase not initialized');
        return { success: false, message: 'Database not available' };
    }

    try {
        // Check if username exists
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
            return { success: false, message: 'Username already exists' };
        }

        // Generate user ID
        const userId = `${role}_${Date.now()}`;
        
        // Create user object
        const userData = {
            id: userId,
            username: username,
            password: password, // In production, use hash!
            name: fullName,
            role: role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Save to Firebase
        await db.ref(`users/${userId}`).set(userData);
        
        console.log('User registered:', userId);
        return { success: true, message: 'Registration successful!', userId: userId, userData: userData };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadMockData();
    initializeGoogleSignIn();
    // Monitor auth state
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.email);
            } else {
                console.log('User not authenticated');
            }
        });
    }
});

/**
 * Initialize Google Sign-In with Firebase UI
 */
function initializeGoogleSignIn() {
    if (!auth) {
        console.error('Firebase not initialized');
        setTimeout(initializeGoogleSignIn, 1000);
        return;
    }

    try {
        // Check if firebaseui exists
        if (typeof firebaseui === 'undefined') {
            console.warn('FirebaseUI not loaded yet');
            setTimeout(initializeGoogleSignIn, 1000);
            return;
        }

        // Create or get FirebaseUI instance
        let ui;
        if (firebaseui.auth.AuthUI.getInstance()) {
            ui = firebaseui.auth.AuthUI.getInstance();
        } else {
            ui = new firebaseui.auth.AuthUI(auth);
        }

        const uiConfig = {
            signInSuccessUrl: '#',
            signInOptions: [
                firebase.auth.GoogleAuthProvider.PROVIDER_ID
            ],
            callbacks: {
                signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                    const user = authResult.user;
                    const isNewUser = authResult.additionalUserInfo.isNewUser;
                    
                    console.log('Sign-in successful:', user.email);
                    console.log('Is new user:', isNewUser);
                    
                    // Auto-register if new user
                    if (isNewUser) {
                        promptForRole(user.uid, user.displayName || user.email.split('@')[0], user.email);
                    } else {
                        // Existing user - fetch their role from database
                        fetchUserRole(user.uid);
                    }
                    return false;
                },
                uiShown: function() {
                    console.log('FirebaseUI is shown');
                }
            },
            signInFlow: 'popup',
            credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO
        };

        // Start the UI
        const container = document.getElementById('firebaseUIContainer');
        if (container) {
            ui.start('#firebaseUIContainer', uiConfig);
        }
    } catch (error) {
        console.error('Error initializing FirebaseUI:', error);
        setTimeout(initializeGoogleSignIn, 2000);
    }
}

/**
 * Fetch user role from database
 */
async function fetchUserRole(userID) {
    if (!db) {
        console.error('Firebase not initialized');
        loginSuccess(userID, 'customer');
        return;
    }

    try {
        const snapshot = await db.ref(`users/${userID}`).get();
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log('User found:', userData);
            loginSuccess(userData.name, userData.role);
        } else {
            // Shouldn't happen, but fallback to default
            loginSuccess(userID, 'customer');
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
        loginSuccess(userID, 'customer');
    }
}

/**
 * Prompt user to select role
 */
function promptForRole(userID, userName, userEmail) {
    const roleSelection = document.createElement('div');
    roleSelection.className = 'role-selection-modal';
    roleSelection.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>Select Your Role</h3>
                <p>Choose your role in the Credit Card Processing System</p>
                <div class="role-selection" style="margin-bottom: 20px;">
                    <button class="role-btn" onclick="completeGoogleLogin('${userID}', '${userName}', '${userEmail}', 'customer')">
                        <span class="role-icon">👤</span>
                        <span class="role-name">Customer</span>
                    </button>
                    <button class="role-btn" onclick="completeGoogleLogin('${userID}', '${userName}', '${userEmail}', 'merchant')">
                        <span class="role-icon">🏪</span>
                        <span class="role-name">Merchant</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(roleSelection);
}

/**
 * Complete Google Login after role selection
 */
async function completeGoogleLogin(userID, userName, userEmail, role) {
    // Save user info to Firebase
    const userData = {
        id: userID,
        email: userEmail,
        name: userName,
        role: role,
        authMethod: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    try {
        await db.ref(`users/${userID}`).set(userData);
        console.log('User profile saved:', userID);
    } catch (error) {
        console.warn('Could not save user to database:', error);
    }

    // Set current user
    state.currentUser = userData;
    state.currentRole = role;

    // Remove role selection modal
    const modal = document.querySelector('.role-selection-modal');
    if (modal) modal.remove();

    // Navigate to appropriate dashboard
    loginSuccess(userName, role);
}

function setupEventListeners() {
    // Login tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.login-tab-content').forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Login role selection
    document.querySelectorAll('.role-btn:not(.register-role)').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.role-btn:not(.register-role)').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentRole = btn.dataset.role;
        });
    });

    // Register role selection
    document.querySelectorAll('.register-role').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.register-role').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentRole = btn.dataset.role;
        });
    });

    // Login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);

    // Registration
    document.getElementById('registerBtn')?.addEventListener('click', handleRegistration);

    // Password validation on input
    document.getElementById('registerPassword')?.addEventListener('input', (e) => {
        updatePasswordRequirements(e.target.value);
    });

    // Username validation on input
    document.getElementById('registerUsername')?.addEventListener('input', (e) => {
        updateUsernameValidation(e.target.value);
    });

    // Dashboard navigation
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.dataset.screen;
            if (screenId) showScreen(screenId);
        });
    });

    // Back buttons
    document.getElementById('backBtn')?.addEventListener('click', () => {
        showScreen('customerDashboard');
    });
    document.getElementById('historyBackBtn')?.addEventListener('click', () => {
        showScreen('customerDashboard');
    });
    document.getElementById('cardDetailsBackBtn')?.addEventListener('click', () => {
        showScreen('customerDashboard');
    });
    document.getElementById('merchantInitiateBackBtn')?.addEventListener('click', () => {
        showScreen('merchantDashboard');
    });
    document.getElementById('merchantTransBackBtn')?.addEventListener('click', () => {
        showScreen('merchantDashboard');
    });
    document.getElementById('adminTransBackBtn')?.addEventListener('click', () => {
        showScreen('adminDashboard');
    });
    document.getElementById('cardMgmtBackBtn')?.addEventListener('click', () => {
        showScreen('adminDashboard');
    });
    document.getElementById('reportsBackBtn')?.addEventListener('click', () => {
        showScreen('adminDashboard');
    });

    // Logout buttons
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('merchantLogoutBtn')?.addEventListener('click', logout);
    document.getElementById('adminLogoutBtn')?.addEventListener('click', logout);

    // Payment form
    setupPaymentForm();

    // Merchant payment form
    setupMerchantPaymentForm();

    // Transaction history
    setupTransactionHistory();

    // Merchant transactions
    setupMerchantTransactions();

    // Admin transactions
    setupAdminTransactions();

    // Card management
    setupCardManagement();

    // Reports
    setupReports();

    // Alerts
    setupAlerts();
}

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = state.currentRole;
    const errorDiv = document.getElementById('loginError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (!role) {
        showError('Please select a role', errorDiv);
        return;
    }

    if (!username || !password) {
        showError('Please enter username and password', errorDiv);
        return;
    }

    // Check demo users first
    const demoUser = demoUsers[role];
    if (username === demoUser.username && password === demoUser.password) {
        state.currentUser = { ...demoUser, role };
        
        // Save login to Firebase
        saveUser(demoUser.id, {
            ...demoUser,
            role,
            lastLogin: new Date().toISOString()
        });
        
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Navigate to appropriate dashboard
        loginSuccess(demoUser.name, role);
        return;
    }

    // Check Firebase for registered users
    if (db) {
        try {
            const snapshot = await db.ref('users').orderByChild('username').equalTo(username).get();
            if (snapshot.exists()) {
                let user = null;
                snapshot.forEach(child => {
                    user = child.val();
                });

                // Verify password and role match
                if (user && user.password === password && user.role === role) {
                    state.currentUser = user;
                    
                    // Update last login
                    saveUser(user.id, {
                        ...user,
                        lastLogin: new Date().toISOString()
                    });
                    
                    // Clear form
                    document.getElementById('username').value = '';
                    document.getElementById('password').value = '';
                    
                    // Navigate to appropriate dashboard
                    loginSuccess(user.name, role);
                    return;
                }
            }
        } catch (error) {
            console.warn('Firebase login check failed:', error);
        }
    }

    // If we get here, login failed
    showError('Invalid username or password', errorDiv);
}

/**
 * Handle successful login
 */
function loginSuccess(userName, role) {
    if (role === 'customer') {
        document.getElementById('welcomeName').textContent = userName;
        document.getElementById('customerName').textContent = userName;
        showScreen('customerDashboard');
    } else if (role === 'merchant') {
        document.getElementById('merchantWelcomeName').textContent = userName;
        document.getElementById('merchantName').textContent = userName;
        showScreen('merchantDashboard');
    } else if (role === 'admin') {
        document.getElementById('adminName').textContent = userName;
        updateAdminDashboard();
        showScreen('adminDashboard');
    }
}

/**
 * Handle user registration
 */
async function handleRegistration() {
    const fullName = document.getElementById('registerFullName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    const role = state.currentRole;
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');

    // Clear previous messages
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    successDiv.textContent = '';
    successDiv.classList.remove('show');

    // Validations
    if (!role) {
        showError('Please select a role', errorDiv);
        return;
    }

    if (!fullName) {
        showError('Please enter your full name', errorDiv);
        return;
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        showError(usernameValidation.message, errorDiv);
        return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showError(passwordValidation.errors.join(', '), errorDiv);
        return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
        showError('Passwords do not match', errorDiv);
        return;
    }

    // Register user
    const result = await registerUser(fullName, username, password, role);
    
    if (result.success) {
        // Show success message
        successDiv.textContent = result.message;
        successDiv.classList.add('show');

        // Clear form
        document.getElementById('registerFullName').value = '';
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';

        // Update password requirements display
        updatePasswordRequirements('');

        // Auto-login the user
        setTimeout(() => {
            state.currentUser = { 
                ...result.userData,
                id: result.userId
            };
            
            // Navigate to dashboard
            if (role === 'customer') {
                document.getElementById('welcomeName').textContent = fullName;
                document.getElementById('customerName').textContent = fullName;
                showScreen('customerDashboard');
            } else if (role === 'merchant') {
                document.getElementById('merchantWelcomeName').textContent = fullName;
                document.getElementById('merchantName').textContent = fullName;
                showScreen('merchantDashboard');
            }
        }, 1500);
    } else {
        showError(result.message, errorDiv);
    }
}

/**
 * Update password requirements display
 */
function updatePasswordRequirements(password) {
    const validation = validatePassword(password);
    
    const lengthReq = document.getElementById('req-length');
    const numberReq = document.getElementById('req-number');
    const specialReq = document.getElementById('req-special');

    if (validation.length) {
        lengthReq.classList.add('met');
    } else {
        lengthReq.classList.remove('met');
    }

    if (validation.number) {
        numberReq.classList.add('met');
    } else {
        numberReq.classList.remove('met');
    }

    if (validation.special) {
        specialReq.classList.add('met');
    } else {
        specialReq.classList.remove('met');
    }
}

/**
 * Update username validation display
 */
function updateUsernameValidation(username) {
    const usernameMsg = document.getElementById('usernameMsg');
    
    if (!username) {
        usernameMsg.textContent = '';
        usernameMsg.classList.remove('error', 'success');
        return;
    }

    const validation = validateUsername(username);
    usernameMsg.textContent = validation.message;
    usernameMsg.classList.remove('error', 'success');
    usernameMsg.classList.add(validation.valid ? 'success' : 'error');
}

function logout() {
    state.currentUser = null;
    state.currentRole = null;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.register-role').forEach(b => b.classList.remove('active'));
    
    // Sign out from Firebase
    if (auth) {
        auth.signOut().then(() => {
            console.log('User signed out from Firebase');
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    }
    
    showScreen('loginScreen');
    showAlert('Logged out successfully', 'success');
}

// ============ PAYMENT FORM ============
function setupPaymentForm() {
    // Card number formatting
    document.getElementById('cardNumber')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
    });

    // Expiry date formatting
    document.getElementById('expiryDate')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // CVV only numbers
    document.getElementById('cvv')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('submitPaymentBtn')?.addEventListener('click', submitPayment);
    document.getElementById('resetPaymentBtn')?.addEventListener('click', () => {
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardholderName').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        clearValidationMessages();
    });
}

function submitPayment() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardholderName = document.getElementById('cardholderName').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const amount = document.getElementById('amount').value;
    const errorDiv = document.getElementById('paymentError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    clearValidationMessages();

    let isValid = true;

    // Validation
    if (!validateCardNumber(cardNumber)) {
        showValidationError('cardNumberMsg', 'Invalid card number');
        isValid = false;
    }

    if (!cardholderName.trim()) {
        showValidationError('cardholderMsg', 'Cardholder name is required');
        isValid = false;
    }

    if (!validateExpiryDate(expiryDate)) {
        showValidationError('expiryMsg', 'Card is expired or invalid format');
        isValid = false;
    }

    if (!validateCVV(cvv)) {
        showValidationError('cvvMsg', 'Invalid CVV (3-4 digits)');
        isValid = false;
    }

    if (!amount || amount < 0.01) {
        showValidationError('amountMsg', 'Amount must be greater than $0');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Process payment
    processPayment(cardNumber, cardholderName, expiryDate, cvv, amount);
}

function processPayment(cardNumber, cardholderName, expiryDate, cvv, amount) {
    showScreen('processingScreen');
    
    // Simulate processing
    setTimeout(() => {
        const transactionId = `TXN-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
        const isSuccess = Math.random() > 0.2; // 80% success rate
        const reasons = ['Insufficient funds', 'Expired card', 'Card blocked', 'Invalid CVV'];
        
        showTransactionResult(isSuccess, transactionId, amount, isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)]);
        
        // Create transaction object
        const transaction = {
            id: transactionId,
            customerId: state.currentUser.id,
            amount: amount,
            status: isSuccess ? 'success' : 'failed',
            date: new Date().toISOString().split('T')[0],
            description: document.getElementById('description').value || 'Payment',
            failureReason: isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)],
            cardNumber: cardNumber,
            cardholderName: cardholderName
        };
        
        // Add to transaction history
        state.transactions.unshift(transaction);
        
        // Save transaction to Firebase
        saveTransaction(transaction);
        
        // Update card balance in Firebase
        updateCard(cardNumber, {
            balance: (Math.random() * 5000).toFixed(2),
            lastTransaction: new Date().toISOString()
        });
    }, 2000);
}

function showTransactionResult(isSuccess, transactionId, amount, reason) {
    const resultContent = document.getElementById('resultContent');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const processingIndicator = document.getElementById('processingIndicator');

    processingIndicator.classList.add('hidden');
    
    if (isSuccess) {
        resultIcon.className = 'result-icon success';
        resultTitle.textContent = 'Payment Approved ✓';
        resultMessage.textContent = `Your transaction of $${parseFloat(amount).toFixed(2)} has been successfully processed.`;
        resultIcon.innerHTML = '✓';
        resultIcon.style.color = 'var(--color-success)';
    } else {
        resultIcon.className = 'result-icon failed';
        resultTitle.textContent = 'Payment Declined ✗';
        resultMessage.textContent = `Your transaction of $${parseFloat(amount).toFixed(2)} could not be processed.`;
        resultIcon.innerHTML = '✗';
        resultIcon.style.color = 'var(--color-danger)';
        
        const declineReasonRow = document.getElementById('declineReasonRow');
        const declineReasonValue = document.getElementById('declineReason');
        declineReasonRow.classList.remove('hidden');
        declineReasonValue.textContent = reason;
    }

    document.getElementById('transactionId').textContent = transactionId;
    document.getElementById('transactionDateTime').textContent = new Date().toLocaleString();
    document.getElementById('resultAmount').textContent = `$${parseFloat(amount).toFixed(2)}`;
    
    resultContent.classList.remove('hidden');
    
    document.getElementById('returnDashboardBtn').addEventListener('click', () => {
        showScreen('customerDashboard');
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardholderName').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('amount').value = '';
        resultContent.classList.add('hidden');
        processingIndicator.classList.remove('hidden');
    });
}

// ============ TRANSACTION HISTORY ============
function setupTransactionHistory() {
    document.getElementById('filterStatus')?.addEventListener('change', updateTransactionTable);
    document.getElementById('filterDate')?.addEventListener('change', updateTransactionTable);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterDate').value = '';
        updateTransactionTable();
    });

    // Load history when screen shows
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'transactionHistory' && mutation.target.classList.contains('active')) {
                updateTransactionTable();
            }
        });
    });

    observer.observe(document.getElementById('transactionHistory'), { attributes: true });
}

function updateTransactionTable() {
    const tbody = document.getElementById('transactionTableBody');
    const noMsg = document.getElementById('noTransactionsMsg');
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFilter = document.getElementById('filterDate')?.value || '';

    let filtered = state.transactions.filter(t => 
        t.customerId === state.currentUser.id &&
        (!statusFilter || t.status === statusFilter) &&
        (!dateFilter || t.date === dateFilter)
    );

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    filtered.forEach(trans => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trans.id}</td>
            <td>${trans.date}</td>
            <td>$${parseFloat(trans.amount).toFixed(2)}</td>
            <td><span class="status-badge ${trans.status}">${trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}</span></td>
            <td><button class="btn btn-primary action-btn" onclick="viewTransactionDetail('${trans.id}')">View</button></td>
        `;
        tbody.appendChild(row);
    });
}

function viewTransactionDetail(transactionId) {
    const trans = state.transactions.find(t => t.id === transactionId);
    if (trans) {
        showAlert(`Transaction ${trans.id} - Amount: $${trans.amount} - Status: ${trans.status}`, 'info');
    }
}

// ============ CARD DETAILS ============
document.addEventListener('DOMContentLoaded', () => {
    const cardDetailsBtn = document.querySelector('[data-screen="cardDetails"]');
    if (cardDetailsBtn) {
        cardDetailsBtn.addEventListener('click', () => {
            updateCardDetails();
        });
    }
});

function updateCardDetails() {
    const card = state.cards[0]; // Demo: show first card
    document.getElementById('displayCardNumber').textContent = maskCardNumber(card.cardNumber);
    document.getElementById('displayCardHolder').textContent = card.holder.toUpperCase();
    document.getElementById('displayExpiry').textContent = card.expiry;
    document.getElementById('creditLimit').textContent = `$${card.limit.toFixed(2)}`;
    document.getElementById('availableCredit').textContent = `$${(card.limit - card.balance).toFixed(2)}`;
    document.getElementById('currentBalance').textContent = `$${card.balance.toFixed(2)}`;
}

// ============ MERCHANT PAYMENT FORM ============
function setupMerchantPaymentForm() {
    document.getElementById('submitMerchantPaymentBtn')?.addEventListener('click', submitMerchantPayment);
    document.getElementById('resetMerchantPaymentBtn')?.addEventListener('click', () => {
        document.getElementById('merchantCustomerId').value = '';
        document.getElementById('merchantCustomerName').value = '';
        document.getElementById('merchantAmount').value = '';
        document.getElementById('merchantDescription').value = '';
        document.getElementById('merchantInvoiceId').value = '';
        document.getElementById('merchantPaymentError').textContent = '';
        document.getElementById('merchantPaymentError').classList.remove('show');
    });
}

function submitMerchantPayment() {
    const customerId = document.getElementById('merchantCustomerId').value.trim();
    const customerName = document.getElementById('merchantCustomerName').value.trim();
    const amount = document.getElementById('merchantAmount').value;
    const description = document.getElementById('merchantDescription').value.trim();
    const errorDiv = document.getElementById('merchantPaymentError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (!customerId || !customerName || !amount || !description) {
        showError('All fields are required', errorDiv);
        return;
    }

    if (amount < 0.01) {
        showError('Amount must be greater than $0', errorDiv);
        return;
    }

    // Create merchant transaction
    const requestId = `REQ-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
    state.transactions.unshift({
        id: requestId,
        customerId: customerId,
        merchantId: state.currentUser.id,
        amount: amount,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        description: description
    });

    showAlert(`Payment request ${requestId} created successfully!`, 'success');
    
    // Reset form
    document.getElementById('merchantCustomerId').value = '';
    document.getElementById('merchantCustomerName').value = '';
    document.getElementById('merchantAmount').value = '';
    document.getElementById('merchantDescription').value = '';
    document.getElementById('merchantInvoiceId').value = '';
}

// ============ MERCHANT TRANSACTIONS ============
function setupMerchantTransactions() {
    document.getElementById('merchantFilterStatus')?.addEventListener('change', updateMerchantTransactionTable);
    document.getElementById('merchantSearchId')?.addEventListener('input', updateMerchantTransactionTable);
    document.getElementById('merchantResetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('merchantFilterStatus').value = '';
        document.getElementById('merchantSearchId').value = '';
        updateMerchantTransactionTable();
    });
}

function updateMerchantTransactionTable() {
    const tbody = document.getElementById('merchantTransTableBody');
    const noMsg = document.getElementById('noMerchantTransMsg');
    const statusFilter = document.getElementById('merchantFilterStatus')?.value || '';
    const searchId = document.getElementById('merchantSearchId')?.value || '';

    let filtered = state.transactions.filter(t => 
        t.merchantId === state.currentUser.id &&
        (!statusFilter || t.status === statusFilter) &&
        (!searchId || t.id.includes(searchId))
    );

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    filtered.forEach(trans => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trans.id}</td>
            <td>${trans.customerId}</td>
            <td>$${parseFloat(trans.amount).toFixed(2)}</td>
            <td><span class="status-badge ${trans.status}">${trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}</span></td>
            <td>${trans.date}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============ ADMIN DASHBOARD ============
function updateAdminDashboard() {
    const stats = {
        total: state.transactions.length,
        success: state.transactions.filter(t => t.status === 'success').length,
        failed: state.transactions.filter(t => t.status === 'failed').length,
        pending: state.transactions.filter(t => t.status === 'pending').length
    };

    document.getElementById('totalTransCount').textContent = stats.total.toLocaleString();
    document.getElementById('successTransCount').textContent = stats.success.toLocaleString();
    document.getElementById('failedTransCount').textContent = stats.failed.toLocaleString();
    document.getElementById('pendingTransCount').textContent = stats.pending.toLocaleString();
}

// ============ ADMIN TRANSACTIONS ============
function setupAdminTransactions() {
    document.getElementById('adminFilterStatus')?.addEventListener('change', updateAdminTransactionTable);
    document.getElementById('adminFilterDate')?.addEventListener('change', updateAdminTransactionTable);
    document.getElementById('adminResetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('adminFilterStatus').value = '';
        document.getElementById('adminFilterDate').value = '';
        updateAdminTransactionTable();
    });
}

function updateAdminTransactionTable() {
    const tbody = document.getElementById('adminTransTableBody');
    const noMsg = document.getElementById('noAdminTransMsg');
    const statusFilter = document.getElementById('adminFilterStatus')?.value || '';
    const dateFilter = document.getElementById('adminFilterDate')?.value || '';

    let filtered = state.transactions.filter(t => 
        (!statusFilter || t.status === statusFilter) &&
        (!dateFilter || t.date === dateFilter)
    );

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    filtered.forEach(trans => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trans.id}</td>
            <td>${trans.customerId}</td>
            <td>${trans.merchantId || 'N/A'}</td>
            <td>$${parseFloat(trans.amount).toFixed(2)}</td>
            <td><span class="status-badge ${trans.status}">${trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}</span></td>
            <td>${trans.date}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============ CARD MANAGEMENT ============
function setupCardManagement() {
    document.getElementById('cardFilterStatus')?.addEventListener('change', updateCardTable);
    document.getElementById('cardSearchCustomer')?.addEventListener('input', updateCardTable);
    document.getElementById('cardResetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('cardFilterStatus').value = '';
        document.getElementById('cardSearchCustomer').value = '';
        updateCardTable();
    });

    document.getElementById('closeCardActionModal')?.addEventListener('click', closeCardActionModal);
    document.getElementById('blockCardBtn')?.addEventListener('click', blockCard);
    document.getElementById('unblockCardBtn')?.addEventListener('click', unblockCard);
    document.getElementById('updateLimitBtn')?.addEventListener('click', showUpdateLimitForm);
    document.getElementById('confirmLimitUpdateBtn')?.addEventListener('click', confirmLimitUpdate);
    document.getElementById('cancelLimitUpdateBtn')?.addEventListener('click', hideUpdateLimitForm);
}

function updateCardTable() {
    const tbody = document.getElementById('cardsTableBody');
    const noMsg = document.getElementById('noCardsMsg');
    const statusFilter = document.getElementById('cardFilterStatus')?.value || '';
    const customerSearch = document.getElementById('cardSearchCustomer')?.value || '';

    let filtered = state.cards.filter(c =>
        (!statusFilter || c.status === statusFilter) &&
        (!customerSearch || c.customerId.includes(customerSearch))
    );

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    filtered.forEach(card => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${card.customerId}</td>
            <td>${maskCardNumber(card.cardNumber)}</td>
            <td>${card.holder}</td>
            <td><span class="status-badge ${card.status}">${card.status.charAt(0).toUpperCase() + card.status.slice(1)}</span></td>
            <td>$${card.limit.toFixed(2)}</td>
            <td><button class="btn btn-primary action-btn" onclick="openCardActionModal('${card.customerId}', '${card.cardNumber}', '${card.status}')">Manage</button></td>
        `;
        tbody.appendChild(row);
    });
}

let selectedCard = null;

function openCardActionModal(customerId, cardNumber, status) {
    selectedCard = { customerId, cardNumber, status };
    document.getElementById('modalCustomerId').textContent = customerId;
    document.getElementById('modalCardNumber').textContent = maskCardNumber(cardNumber);
    document.getElementById('modalCardStatus').textContent = status.charAt(0).toUpperCase() + status.slice(1);
    
    if (status === 'active') {
        document.getElementById('blockCardBtn').classList.remove('hidden');
        document.getElementById('unblockCardBtn').classList.add('hidden');
    } else {
        document.getElementById('blockCardBtn').classList.add('hidden');
        document.getElementById('unblockCardBtn').classList.remove('hidden');
    }
    
    document.getElementById('updateLimitForm').classList.add('hidden');
    document.getElementById('cardActionMessage').classList.add('hidden');
    document.getElementById('cardActionModal').classList.remove('hidden');
}

function closeCardActionModal() {
    document.getElementById('cardActionModal').classList.add('hidden');
    selectedCard = null;
}

function blockCard() {
    if (selectedCard) {
        confirmAction('Block Card', 'Are you sure you want to block this card?', () => {
            const card = state.cards.find(c => c.customerId === selectedCard.customerId);
            if (card) {
                card.status = 'blocked';
                document.getElementById('blockCardBtn').classList.add('hidden');
                document.getElementById('unblockCardBtn').classList.remove('hidden');
                document.getElementById('modalCardStatus').textContent = 'Blocked';
                showCardActionMessage('Card has been blocked successfully.');
                updateCardTable();
            }
        });
    }
}

function unblockCard() {
    if (selectedCard) {
        confirmAction('Unblock Card', 'Are you sure you want to unblock this card?', () => {
            const card = state.cards.find(c => c.customerId === selectedCard.customerId);
            if (card) {
                card.status = 'active';
                document.getElementById('blockCardBtn').classList.remove('hidden');
                document.getElementById('unblockCardBtn').classList.add('hidden');
                document.getElementById('modalCardStatus').textContent = 'Active';
                showCardActionMessage('Card has been unblocked successfully.');
                updateCardTable();
            }
        });
    }
}

function showUpdateLimitForm() {
    document.getElementById('updateLimitForm').classList.remove('hidden');
}

function hideUpdateLimitForm() {
    document.getElementById('updateLimitForm').classList.add('hidden');
    document.getElementById('newCreditLimit').value = '';
}

function confirmLimitUpdate() {
    const newLimit = document.getElementById('newCreditLimit').value;
    if (!newLimit || newLimit < 100) {
        alert('Please enter a valid credit limit (minimum $100)');
        return;
    }

    confirmAction('Update Credit Limit', `Are you sure you want to update the credit limit to $${newLimit}?`, () => {
        const card = state.cards.find(c => c.customerId === selectedCard.customerId);
        if (card) {
            card.limit = parseFloat(newLimit);
            showCardActionMessage(`Credit limit has been updated to $${card.limit.toFixed(2)}`);
            hideUpdateLimitForm();
            updateCardTable();
        }
    });
}

function showCardActionMessage(message) {
    const msgEl = document.getElementById('cardActionMessage');
    msgEl.textContent = message;
    msgEl.classList.remove('hidden');
}

// ============ REPORTS ============
function setupReports() {
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
    document.getElementById('downloadReportBtn')?.addEventListener('click', downloadReport);
    
    // Load failed logs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'reportsScreen' && mutation.target.classList.contains('active')) {
                updateFailedLogsTable();
            }
        });
    });
    observer.observe(document.getElementById('reportsScreen'), { attributes: true });
}

function generateReport() {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    updateFailedLogsTable();
    showAlert(`Report generated for ${startDate} to ${endDate}`, 'success');
}

function downloadReport() {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;

    if (!startDate || !endDate) {
        alert('Please generate a report first');
        return;
    }

    let filtered = state.transactions.filter(t => t.date >= startDate && t.date <= endDate);

    let csv = 'Transaction ID,Customer,Amount,Status,Date,Description\n';
    filtered.forEach(t => {
        csv += `${t.id},${t.customerId},${t.amount},${t.status},${t.date},${t.description || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${startDate}_to_${endDate}.csv`;
    a.click();
    showAlert('Report downloaded successfully', 'success');
}

function updateFailedLogsTable() {
    const tbody = document.getElementById('failedLogsTableBody');
    const noMsg = document.getElementById('noFailedLogsMsg');

    const failedTransactions = state.transactions.filter(t => t.status === 'failed');

    tbody.innerHTML = '';

    if (failedTransactions.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    failedTransactions.forEach(trans => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trans.id}</td>
            <td>${trans.customerId}</td>
            <td>$${parseFloat(trans.amount).toFixed(2)}</td>
            <td>${trans.failureReason || 'Unknown'}</td>
            <td>${trans.date}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============ VALIDATION FUNCTIONS ============
function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
}

function validateExpiryDate(expiryDate) {
    const regex = /^\d{2}\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;

    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    return expiry > today;
}

function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

function showValidationError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('error');
    }
}

function clearValidationMessages() {
    document.querySelectorAll('.validation-msg').forEach(el => {
        el.textContent = '';
        el.classList.remove('error');
    });
}

// ============ UTILITY FUNCTIONS ============
function maskCardNumber(cardNumber) {
    return `**** **** **** ${cardNumber.slice(-4)}`;
}

function showError(message, element) {
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function showAlert(message, type = 'info') {
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    
    alertMessage.textContent = message;
    alertBox.className = `alert-box ${type}`;
    alertBox.classList.remove('hidden');
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 3000);
}

document.getElementById('closeAlertBtn')?.addEventListener('click', () => {
    document.getElementById('alertBox').classList.add('hidden');
});

function setupAlerts() {
    // Alert setup already handled above
}

function confirmAction(title, message, callback) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('hidden');
    
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    const confirm = () => {
        callback();
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', confirm);
        cancelBtn.removeEventListener('click', cancel);
    };
    
    const cancel = () => {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', confirm);
        cancelBtn.removeEventListener('click', cancel);
    };
    
    confirmBtn.addEventListener('click', confirm);
    cancelBtn.addEventListener('click', cancel);
}

function loadMockData() {
    // Initialize with mock data
    state.merchants = [
        { id: 'merch_001', name: 'ABC Store' },
        { id: 'merch_002', name: 'XYZ Retail' }
    ];

    // Sync initial mock data with Firebase (only after rules are updated)
    // Uncomment the line below after fixing Firebase rules
    // syncMockDataWithFirebase();
    console.log('Mock data loaded locally. Firebase sync disabled until permissions are fixed.');
}

/**
 * Sync initial mock data with Firebase database
 */
async function syncMockDataWithFirebase() {
    if (!db) {
        console.log('Firebase not connected. Using local data only.');
        return;
    }

    try {
        // Sync transactions
        for (const transaction of state.transactions) {
            await saveTransaction(transaction);
        }

        // Sync cards
        for (const card of state.cards) {
            await addCard(card);
        }

        // Sync demo users
        for (const [role, userData] of Object.entries(demoUsers)) {
            await saveUser(userData.id, userData);
        }

        console.log('Mock data synced with Firebase');
    } catch (error) {
        console.error('Error syncing mock data with Firebase:', error);
        console.log('Make sure your Firebase Database Rules allow write operations.');
    }
}
