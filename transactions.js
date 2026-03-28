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
    
    // Gracefully handle missing elements
    if (!tbody || !noMsg) {
        console.warn('Transaction table elements not found');
        return;
    }
    
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFilter = document.getElementById('filterDate')?.value || '';

    let filtered = state.transactions.filter(t => 
        t.customerId === state.currentUser?.id &&
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
        // Show receiver card for regular payments, sender card for merchant requests
        let displayCard = 'N/A';
        let displayName = trans.description || 'N/A';
        
        if (trans.receiverCardNumber) {
            displayCard = `**** **** **** ${trans.receiverCardNumber.slice(-4)}`;
            displayName = trans.receiverName || 'Unknown Receiver';
        } else if (trans.cardNumber) {
            displayCard = `**** **** **** ${trans.cardNumber.slice(-4)}`;
            displayName = trans.cardholderName || 'N/A';
        }
        
        row.innerHTML = `
            <td>${trans.id}</td>
            <td>${trans.date}</td>
            <td>$${parseFloat(trans.amount).toFixed(2)}</td>
            <td>${displayCard}</td>
            <td><span class="status-badge ${trans.status}">${trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}</span></td>
            <td><button class="btn btn-primary action-btn" onclick="viewTransactionDetail('${trans.id}')">View</button></td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * View transaction details with sender and receiver card information
 */
function viewTransactionDetail(transactionId) {
    const trans = state.transactions.find(t => t.id === transactionId);
    if (trans) {
        let detailsHTML = `
            <div style="text-align: left; margin: 15px 0;">
                <p><strong>Transaction ID:</strong> ${trans.id}</p>
                <p><strong>Date:</strong> ${trans.date}</p>
                <p><strong>Amount:</strong> $${parseFloat(trans.amount).toFixed(2)}</p>
                <p><strong>Status:</strong> ${trans.status.toUpperCase()}</p>
                <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>`;
        
        // Show sender card details if available
        if (trans.senderCardNumber) {
            const senderMaskedCard = `**** **** **** ${trans.senderCardNumber.slice(-4)}`;
            detailsHTML += `
                <hr style="margin: 10px 0;">
                <p><strong>Sender Card:</strong> ${senderMaskedCard}</p>
                <p><strong>Sender Name:</strong> ${trans.senderCardholderName || 'N/A'}</p>`;
        }
        
        // Show receiver card details if available
        if (trans.receiverCardNumber) {
            const receiverMaskedCard = `**** **** **** ${trans.receiverCardNumber.slice(-4)}`;
            detailsHTML += `
                <hr style="margin: 10px 0;">
                <p><strong>Receiver Card:</strong> ${receiverMaskedCard}</p>
                <p><strong>Receiver Name:</strong> ${trans.receiverName || 'N/A'}</p>`;
        }
        
        // Show failure reason if applicable
        if (trans.failureReason) {
            detailsHTML += `<p><strong style="color: red;">Failure Reason:</strong> ${trans.failureReason}</p>`;
        }
        
        detailsHTML += `</div>`;
        showAlert(detailsHTML, 'info');
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
