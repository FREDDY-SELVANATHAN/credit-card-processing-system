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
    }
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
