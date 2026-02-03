// ============ MERCHANT FUNCTIONALITY ============

/**
 * Setup merchant payment form
 */
function setupMerchantPaymentForm() {
    document.getElementById('submitMerchantPaymentBtn')?.addEventListener('click', submitMerchantPayment);
    document.getElementById('resetMerchantPaymentBtn')?.addEventListener('click', () => {
        document.getElementById('merchantCustomerId').value = '';
        document.getElementById('merchantCustomerName').value = '';
        document.getElementById('merchantAmount').value = '';
        document.getElementById('merchantDescription').value = '';
        document.getElementById('merchantInvoiceId').value = '';
        document.getElementById('merchantPaymentError').textContent = '';
        document.getElementById('merchantPaymentError').classList.remove('show');
    });
}

/**
 * Submit merchant payment
 */
function submitMerchantPayment() {
    const customerId = document.getElementById('merchantCustomerId').value.trim();
    const customerName = document.getElementById('merchantCustomerName').value.trim();
    const amount = document.getElementById('merchantAmount').value;
    const description = document.getElementById('merchantDescription').value.trim();
    const errorDiv = document.getElementById('merchantPaymentError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (!customerId || !customerName || !amount || !description) {
        showError('All fields are required', errorDiv);
        return;
    }

    if (amount < 0.01) {
        showError('Amount must be greater than $0', errorDiv);
        return;
    }

    // Create merchant transaction
    const requestId = `REQ-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
    state.transactions.unshift({
        id: requestId,
        customerId: customerId,
        merchantId: state.currentUser.id,
        amount: amount,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        description: description
    });

    showAlert(`Payment request ${requestId} created successfully!`, 'success');
    
    // Reset form
    document.getElementById('merchantCustomerId').value = '';
    document.getElementById('merchantCustomerName').value = '';
    document.getElementById('merchantAmount').value = '';
    document.getElementById('merchantDescription').value = '';
    document.getElementById('merchantInvoiceId').value = '';
}

/**
 * Setup merchant transaction table
 */
function setupMerchantTransactions() {
    document.getElementById('merchantFilterStatus')?.addEventListener('change', updateMerchantTransactionTable);
    document.getElementById('merchantSearchId')?.addEventListener('input', updateMerchantTransactionTable);
    document.getElementById('merchantResetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('merchantFilterStatus').value = '';
        document.getElementById('merchantSearchId').value = '';
        updateMerchantTransactionTable();
    });
}

/**
 * Update merchant transaction table
 */
function updateMerchantTransactionTable() {
    const tbody = document.getElementById('merchantTransTableBody');
    const noMsg = document.getElementById('noMerchantTransMsg');
    const statusFilter = document.getElementById('merchantFilterStatus')?.value || '';
    const searchId = document.getElementById('merchantSearchId')?.value || '';

    let filtered = state.transactions.filter(t => 
        t.merchantId === state.currentUser.id &&
        (!statusFilter || t.status === statusFilter) &&
        (!searchId || t.id.includes(searchId))
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
            <td>$${parseFloat(trans.amount).toFixed(2)}</td>
            <td><span class="status-badge ${trans.status}">${trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}</span></td>
            <td>${trans.date}</td>
        `;
        tbody.appendChild(row);
    });
}
