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
