// ============ APPLICATION INITIALIZATION & MAIN ENTRY POINT ============

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ App initializing...');
    setupEventListeners();
    loadMockData();
    initializeGoogleSignIn();
    
    // Initialize all payment and transaction features
    setupPaymentForm();
    setupMerchantPaymentForm();
    setupTransactionHistory();
    setupMerchantTransactions();
    setupAdminTransactions();
    setupUserManagement();
    setupCardManagement();
    setupReports();
    setupAlerts();
    
    // Start listening to Firebase in real-time
    console.log('✓ Starting real-time sync listeners...');
    startRealTimeSyncListeners();
    
    // Wait a moment for listeners to initialize
    setTimeout(() => {
        console.log('✓ App ready. Transactions loaded:', state.transactions.length);
    }, 500);
    
    // Monitor auth state
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✓ User authenticated:', user.email);
            } else {
                console.log('User not authenticated');
            }
        });
    }
});

/**
 * Load initial mock data
 */
function loadMockData() {
    // Initialize with mock data
    state.merchants = [
        { id: 'merch_001', name: 'ABC Store' },
        { id: 'merch_002', name: 'XYZ Retail' },
        { id: 'merchant1', name: 'Tech Mart' }  // Add demo merchant
    ];

    // Sync initial mock data with Firebase (only after rules are updated)
    // Uncomment the line below after fixing Firebase rules
    // syncMockDataWithFirebase();
    console.log('Mock data loaded locally. Firebase sync disabled until permissions are fixed.');
}

/**
 * Start real-time data synchronization listeners
 */
function startRealTimeSyncListeners() {
    // Listen to transaction updates
    listenToTransactions((transactions) => {
        state.transactions = transactions;
        if (document.getElementById('transactionTableBody')) {
            updateTransactionTable();
        }
        if (document.getElementById('adminTransTableBody')) {
            updateAdminTransactionTable();
        }
        if (document.getElementById('merchantTransTableBody')) {
            updateMerchantTransactionTable();
        }
        if (document.getElementById('pendingRequestsBody')) {
            updatePendingPaymentsTable();
        }
    });
    
    // Listen to card updates
    listenToCards((cards) => {
        state.cards = cards;
        if (document.getElementById('cardsTableBody')) {
            updateCardTable();
        }
    });
    
    // Listen to user updates
    listenToUsers((users) => {
        state.users = users;
        if (document.getElementById('userTableBody')) {
            updateUserTable();
        }
    });
}
