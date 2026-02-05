// ============ ADMIN CARD MANAGEMENT & REPORTS ============

/**
 * Load all admin data from Firebase
 */
async function loadAdminData() {
    try {
        // Load all users
        if (db) {
            const usersSnapshot = await db.ref('users').get();
            if (usersSnapshot.exists()) {
                state.merchants = [];
                usersSnapshot.forEach(child => {
                    const user = child.val();
                    if (user.role === 'merchant') {
                        state.merchants.push({
                            id: child.key,
                            ...user
                        });
                    }
                });
            }

            // Load all cards
            const cardsSnapshot = await db.ref('cards').get();
            if (cardsSnapshot.exists()) {
                state.cards = [];
                cardsSnapshot.forEach(child => {
                    state.cards.push({
                        id: child.key,
                        ...child.val()
                    });
                });
            }

            // Load all transactions
            const transactionsSnapshot = await db.ref('transactions').get();
            if (transactionsSnapshot.exists()) {
                state.transactions = [];
                transactionsSnapshot.forEach(child => {
                    state.transactions.push({
                        id: child.key,
                        ...child.val()
                    });
                });
            }

            console.log('Admin data loaded from database');
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

/**
 * Setup card management
 */
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

/**
 * Update card management table
 */
function updateCardTable() {
    const tbody = document.getElementById('cardsTableBody');
    const noMsg = document.getElementById('noCardsMsg');
    const statusFilter = document.getElementById('cardFilterStatus')?.value || '';
    const customerSearch = document.getElementById('cardSearchCustomer')?.value || '';

    let filtered = state.cards.filter(c =>
        (!statusFilter || c.status === statusFilter) &&
        (!customerSearch || (c.customerId && c.customerId.includes(customerSearch)))
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
            <td>${card.customerId || 'N/A'}</td>
            <td>${maskCardNumber(card.cardNumber)}</td>
            <td>${card.holder || 'N/A'}</td>
            <td><span class="status-badge ${card.status}">${card.status.charAt(0).toUpperCase() + card.status.slice(1)}</span></td>
            <td>$${card.limit ? card.limit.toFixed(2) : '0.00'}</td>
            <td><button class="btn btn-primary action-btn" onclick="openCardActionModal('${card.id}')">Manage</button></td>
        `;
        tbody.appendChild(row);
    });
}

let selectedCard = null;

/**
 * Open card action modal
 */
function openCardActionModal(cardId) {
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;
    
    selectedCard = { cardId, cardNumber: card.cardNumber, status: card.status };
    document.getElementById('modalCustomerId').textContent = card.customerId || 'N/A';
    document.getElementById('modalCardNumber').textContent = maskCardNumber(card.cardNumber);
    document.getElementById('modalCardStatus').textContent = card.status.charAt(0).toUpperCase() + card.status.slice(1);
    
    if (card.status === 'active') {
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

/**
 * Close card action modal
 */
function closeCardActionModal() {
    document.getElementById('cardActionModal').classList.add('hidden');
    selectedCard = null;
}

/**
 * Block a card
 */
function blockCard() {
    if (selectedCard) {
        confirmAction('Block Card', 'Are you sure you want to block this card?', async () => {
            const card = state.cards.find(c => c.id === selectedCard.cardId);
            if (card) {
                card.status = 'blocked';
                
                // Update in Firebase
                if (db) {
                    try {
                        await db.ref(`cards/${selectedCard.cardId}`).update({
                            status: 'blocked'
                        });
                    } catch (error) {
                        console.error('Error updating card status:', error);
                    }
                }
                
                document.getElementById('blockCardBtn').classList.add('hidden');
                document.getElementById('unblockCardBtn').classList.remove('hidden');
                document.getElementById('modalCardStatus').textContent = 'Blocked';
                showCardActionMessage('Card has been blocked successfully.');
                updateCardTable();
            }
        });
    }
}

/**
 * Unblock a card
 */
function unblockCard() {
    if (selectedCard) {
        confirmAction('Unblock Card', 'Are you sure you want to unblock this card?', async () => {
            const card = state.cards.find(c => c.id === selectedCard.cardId);
            if (card) {
                card.status = 'active';
                
                // Update in Firebase
                if (db) {
                    try {
                        await db.ref(`cards/${selectedCard.cardId}`).update({
                            status: 'active'
                        });
                    } catch (error) {
                        console.error('Error updating card status:', error);
                    }
                }
                
                document.getElementById('blockCardBtn').classList.remove('hidden');
                document.getElementById('unblockCardBtn').classList.add('hidden');
                document.getElementById('modalCardStatus').textContent = 'Active';
                showCardActionMessage('Card has been unblocked successfully.');
                updateCardTable();
            }
        });
    }
}

/**
 * Show update credit limit form
 */
function showUpdateLimitForm() {
    document.getElementById('updateLimitForm').classList.remove('hidden');
}

/**
 * Hide update credit limit form
 */
function hideUpdateLimitForm() {
    document.getElementById('updateLimitForm').classList.add('hidden');
    document.getElementById('newCreditLimit').value = '';
}

/**
 * Confirm credit limit update
 */
function confirmLimitUpdate() {
    const newLimit = document.getElementById('newCreditLimit').value;
    if (!newLimit || newLimit < 100) {
        alert('Please enter a valid credit limit (minimum $100)');
        return;
    }

    confirmAction('Update Credit Limit', `Are you sure you want to update the credit limit to $${newLimit}?`, async () => {
        const card = state.cards.find(c => c.id === selectedCard.cardId);
        if (card) {
            card.limit = parseFloat(newLimit);
            
            // Update in Firebase
            if (db) {
                try {
                    await db.ref(`cards/${selectedCard.cardId}`).update({
                        limit: parseFloat(newLimit)
                    });
                } catch (error) {
                    console.error('Error updating credit limit:', error);
                }
            }
            
            showCardActionMessage(`Credit limit has been updated to $${card.limit.toFixed(2)}`);
            hideUpdateLimitForm();
            updateCardTable();
        }
    });
}

/**
 * Show card action message
 */
function showCardActionMessage(message) {
    const msgEl = document.getElementById('cardActionMessage');
    msgEl.textContent = message;
    msgEl.classList.remove('hidden');
}

/**
 * Setup reports functionality
 */
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

/**
 * Generate report
 */
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

/**
 * Download report as CSV
 */
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

/**
 * Update failed logs table
 */
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
