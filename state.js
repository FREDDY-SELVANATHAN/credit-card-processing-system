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
