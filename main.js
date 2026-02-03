// ============ APPLICATION INITIALIZATION & MAIN ENTRY POINT ============

/**
 * Initialize application when DOM is ready
 */
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
 * Load initial mock data
 */
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
 * Initialize all payment and transaction features
 */
setupPaymentForm();
setupMerchantPaymentForm();
setupTransactionHistory();
setupMerchantTransactions();
setupAdminTransactions();
setupCardManagement();
setupReports();
setupAlerts();
