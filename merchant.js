// ============ MERCHANT FUNCTIONALITY ============

/**
 * Setup merchant payment form
 */
function setupMerchantPaymentForm() {
    document.getElementById('submitMerchantPaymentBtn')?.addEventListener('click', submitMerchantPayment);
    document.getElementById('resetMerchantPaymentBtn')?.addEventListener('click', resetMerchantPaymentForm);
}

/**
 * Reset merchant payment form
 */
function resetMerchantPaymentForm() {
    document.getElementById('merchantCustomerId').value = '';
    document.getElementById('merchantCustomerName').value = '';
    document.getElementById('merchantAmount').value = '';
    document.getElementById('merchantDescription').value = '';
    document.getElementById('merchantInvoiceId').value = '';
    document.getElementById('merchantPaymentError').textContent = '';
    document.getElementById('merchantPaymentError').classList.remove('show');
    clearValidationMessages();
}

/**
 * Submit merchant payment
 */
function submitMerchantPayment() {
    const customerId = document.getElementById('merchantCustomerId').value.trim();
    const customerName = document.getElementById('merchantCustomerName').value.trim();
    const amount = document.getElementById('merchantAmount').value;
    const description = document.getElementById('merchantDescription').value.trim();
    const invoiceId = document.getElementById('merchantInvoiceId').value.trim();
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
    const transaction = {
        id: requestId,
        customerId: customerId,
        customerName: customerName,
        merchantId: state.currentUser.id,
        merchantName: state.currentUser.name,
        amount: parseFloat(amount),
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        description: description,
        invoiceId: invoiceId || null,
        createdAt: new Date().toISOString()
    };
    
    // Add to local state
    state.transactions.unshift(transaction);
    
    // IMPORTANT: Save to Firebase so customer can see it
    console.log('💾 Saving merchant payment request:', requestId);
    console.log('   - Merchant:', state.currentUser.id);
    console.log('   - Customer:', customerId);
    console.log('   - Amount:', amount);
    saveTransaction(transaction).then(success => {
        if (success) {
            console.log('✓ Payment request saved to Firebase:', requestId);
        } else {
            console.warn('⚠ Failed to save to Firebase, but saved locally');
        }
    });

    showAlert(`Payment request ${requestId} created successfully!`, 'success');
    
    // Immediately refresh merchant's transaction list
    updateMerchantTransactionTable();
    
    // Reset form
    resetMerchantPaymentForm();
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
    if (!state.currentUser) {
        console.warn('No current user set for merchant');
        return;
    }
    
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
