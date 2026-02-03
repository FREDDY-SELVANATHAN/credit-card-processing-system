// ============ TRANSACTION HISTORY FUNCTIONALITY ============

/**
 * Setup customer transaction history
 */
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

/**
 * Update customer transaction table
 */
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

/**
 * View transaction details
 */
function viewTransactionDetail(transactionId) {
    const trans = state.transactions.find(t => t.id === transactionId);
    if (trans) {
        showAlert(`Transaction ${trans.id} - Amount: $${trans.amount} - Status: ${trans.status}`, 'info');
    }
}

/**
 * Setup admin transactions
 */
function setupAdminTransactions() {
    document.getElementById('adminFilterStatus')?.addEventListener('change', updateAdminTransactionTable);
    document.getElementById('adminFilterDate')?.addEventListener('change', updateAdminTransactionTable);
    document.getElementById('adminResetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('adminFilterStatus').value = '';
        document.getElementById('adminFilterDate').value = '';
        updateAdminTransactionTable();
    });
}

/**
 * Update admin transaction table
 */
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
