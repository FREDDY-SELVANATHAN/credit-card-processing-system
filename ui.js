// ============ SCREEN NAVIGATION & UI MANAGEMENT ============

/**
 * Show a specific screen and hide all others
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        state.currentScreen = screenId;
        
        // Load saved card details when payment screen is shown
        if (screenId === 'paymentScreen' && state.currentCard) {
            loadSavedCardDetails();
        }
        
        // Refresh admin dashboard data when returning
        if (screenId === 'adminDashboard') {
            updateAdminDashboard();
        }
        
        // Refresh merchant transaction table when returning
        if (screenId === 'merchantDashboard') {
            updateMerchantTransactionTable();
        }
        
        // Update card details when showing card details screen
        if (screenId === 'cardDetails') {
            updateCardDetails();
        }
        
        // Update transaction history when showing transaction screen
        if (screenId === 'transactionHistory') {
            updateTransactionTable();
        }
        
        // Update pending payments when showing pending screen
        if (screenId === 'pendingPayments') {
            updatePendingPaymentsTable();
        }
    }
}

/**
 * Setup credit card field formatting for registration form
 */
function setupRegistrationCardFields() {
    // Card number formatting
    document.getElementById('regCardNumber')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
    });

    // Expiry date formatting
    document.getElementById('regExpiryDate')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // CVV only numbers
    document.getElementById('regCVV')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

/**
 * Setup all UI event listeners
 */
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

    // Register credit card field setup
    setupRegistrationCardFields();

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

    // Alert
    document.getElementById('closeAlertBtn')?.addEventListener('click', () => {
        document.getElementById('alertBox').classList.add('hidden');
    });
}

/**
 * Show error message
 */
function showError(message, element) {
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

/**
 * Show alert notification
 */
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

/**
 * Show confirmation modal
 */
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

/**
 * Setup alerts
 */
function setupAlerts() {
    // Alert setup already handled above
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const toggleIcon = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}
