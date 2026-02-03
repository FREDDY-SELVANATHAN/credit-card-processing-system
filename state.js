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
