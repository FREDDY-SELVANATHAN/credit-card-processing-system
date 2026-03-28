// ============ CUSTOMER PAYMENT FORM ============

/**
 * Setup payment form functionality
 */
function setupPaymentForm() {
    // Load saved card details when payment screen is shown
    document.addEventListener('showPaymentScreen', loadSavedCardDetails);
    
    // Card number formatting
    document.getElementById('cardNumber')?.addEventListener('input', (e) => {
        if (!e.target.readOnly) {
            let value = e.target.value.replace(/\s/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        }
    });

    // Expiry date formatting
    document.getElementById('expiryDate')?.addEventListener('input', (e) => {
        if (!e.target.readOnly) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        }
    });

    // CVV only numbers
    document.getElementById('cvv')?.addEventListener('input', (e) => {
        if (!e.target.readOnly) {
            e.target.value = e.target.value.replace(/\D/g, '');
        }
    });

    document.getElementById('submitPaymentBtn')?.addEventListener('click', submitPayment);
    document.getElementById('resetPaymentBtn')?.addEventListener('click', resetPaymentForm);
    
    // Setup return to dashboard button - ONLY ONCE
    setupReturnDashboardBtn();
    
    // Setup pending payments
    setupPendingPayments();
}

/**
 * Setup return to dashboard button
 */
function setupReturnDashboardBtn() {
    const btn = document.getElementById('returnDashboardBtn');
    if (!btn) return;
    
    // Remove any previous listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Add listener only once
    document.getElementById('returnDashboardBtn')?.addEventListener('click', () => {
        console.log('Return to Dashboard clicked');
        
        try {
            // Reset payment form - receiver card fields
            const receiverNameInput = document.getElementById('receiverName');
            const receiverCardInput = document.getElementById('receiverCardNumber');
            const receiverExpiryInput = document.getElementById('receiverExpiryDate');
            const receiverCVVInput = document.getElementById('receiverCVV');
            const amountInput = document.getElementById('amount');
            const descInput = document.getElementById('description');
            
            if (receiverNameInput) receiverNameInput.value = '';
            if (receiverCardInput) receiverCardInput.value = '';
            if (receiverExpiryInput) receiverExpiryInput.value = '';
            if (receiverCVVInput) receiverCVVInput.value = '';
            if (amountInput) amountInput.value = '';
            if (descInput) descInput.value = '';
            
            // Clear validation messages
            clearValidationMessages();
            
            // Hide result, show processing indicator
            const resultContent = document.getElementById('resultContent');
            const processingIndicator = document.getElementById('processingIndicator');
            if (resultContent) resultContent.classList.add('hidden');
            if (processingIndicator) processingIndicator.classList.remove('hidden');
            
            // Clear decline reason display
            const declineReasonRow = document.getElementById('declineReasonRow');
            if (declineReasonRow) declineReasonRow.classList.add('hidden');
            
            console.log('Payment form reset, navigating to dashboard');
        } catch (error) {
            console.warn('Error resetting form:', error);
        }
        
        // Navigate to dashboard
        showScreen('customerDashboard');
    });
}
    });
}

/**
 * Reset payment form
 */
function resetPaymentForm() {
    document.getElementById('receiverName').value = '';
    document.getElementById('receiverCardNumber').value = '';
    document.getElementById('receiverExpiryDate').value = '';
    document.getElementById('receiverCVV').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    
    clearValidationMessages();
}

/**
 * Load saved credit card details to display as sender's card
 */
function loadSavedCardDetails() {
    if (state.currentCard) {
        // Display sender's card information
        const maskedCard = `**** **** **** ${state.currentCard.cardNumber.slice(-4)}`;
        document.getElementById('senderCardNumber').textContent = maskedCard;
        document.getElementById('senderCardHolder').textContent = state.currentCard.cardholderName || state.currentUser?.name || 'Your Card';
        document.getElementById('senderCardExpiry').textContent = state.currentCard.expiryDate || '--/--';
        console.log('Sender card details loaded');
    } else if (state.currentUser?.name) {
        // If no saved card, display user name
        document.getElementById('senderCardHolder').textContent = state.currentUser.name;
        document.getElementById('senderCardNumber').textContent = 'No card registered';
        document.getElementById('senderCardExpiry').textContent = '--/--';
        console.log('No saved card, displaying user info');
    }
}

/**
 * Submit payment using sender's saved card to send to receiver
 */
function submitPayment() {
    const amount = document.getElementById('amount').value;
    const errorDiv = document.getElementById('paymentError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    clearValidationMessages();

    let isValid = true;

    // Check if sender has a saved card
    if (!state.currentCard) {
        showError('Please add a credit card to your account first', errorDiv);
        return;
    }

    // Get receiver's card details from form
    const receiverName = document.getElementById('receiverName').value.trim();
    const receiverCardNumber = document.getElementById('receiverCardNumber').value.replace(/\s/g, '');
    const receiverExpiryDate = document.getElementById('receiverExpiryDate').value;
    const receiverCVV = document.getElementById('receiverCVV').value;

    // Validation for receiver card entry
    if (!receiverName) {
        showValidationError('receiverNameMsg', 'Receiver name is required');
        isValid = false;
    }

    if (!validateCardNumber(receiverCardNumber)) {
        showValidationError('receiverCardNumberMsg', 'Invalid card number');
        isValid = false;
    }

    if (!validateExpiryDate(receiverExpiryDate)) {
        showValidationError('receiverExpiryMsg', 'Card is expired or invalid format');
        isValid = false;
    }

    if (!validateCVV(receiverCVV)) {
        showValidationError('receiverCVVMsg', 'Invalid CVV (3-4 digits)');
        isValid = false;
    }

    if (!amount || amount < 0.01) {
        showValidationError('amountMsg', 'Amount must be greater than $0');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Process payment using sender's card to transfer to receiver
    processPayment(
        state.currentCard.cardNumber,
        state.currentCard.cardholderName,
        state.currentCard.expiryDate,
        state.currentCard.cvv,
        amount,
        receiverName,
        receiverCardNumber,
        receiverExpiryDate,
        receiverCVV
    );
}

/**
 * Process payment transaction with sender and receiver card details
 */
function processPayment(senderCardNumber, senderCardholderName, senderExpiryDate, senderCVV, amount, receiverName, receiverCardNumber, receiverExpiryDate, receiverCVV) {
    showScreen('processingScreen');
    
    // Simulate processing
    setTimeout(() => {
        const transactionId = `TXN-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
        const isSuccess = Math.random() > 0.2; // 80% success rate
        const reasons = ['Insufficient funds', 'Expired card', 'Card blocked', 'Invalid CVV'];
        const declineReason = isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)];
        
        showTransactionResult(isSuccess, transactionId, amount, declineReason);
        
        // Create transaction object with sender and receiver details
        const transaction = {
            id: transactionId,
            customerId: state.currentUser.id,
            userId: state.currentUser.id,
            senderCardId: state.currentCard?.cardId || senderCardNumber.slice(-4),
            senderCardNumber: senderCardNumber,
            senderCardholderName: senderCardholderName,
            senderExpiryDate: senderExpiryDate,
            receiverName: receiverName,
            receiverCardNumber: receiverCardNumber,
            receiverExpiryDate: receiverExpiryDate,
            receiverCardId: receiverCardNumber.slice(-4),
            amount: parseFloat(amount),
            status: isSuccess ? 'success' : 'failed',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            description: document.getElementById('description').value || 'Payment',
            failureReason: declineReason
        };
        
        // Add to transaction history
        state.transactions.unshift(transaction);
        
        // Save transaction to Firebase with full details
        saveTransaction(transaction);
        
        // Update card last used timestamp
        if (state.currentCard) {
            updateCard(state.currentCard.userId, {
                lastTransaction: new Date().toISOString(),
                lastAmount: amount,
                lastStatus: isSuccess ? 'success' : 'failed'
            });
        }
        
        console.log('Transaction created and saved:', transactionId);
    }, 2000);
}

/**
 * Show transaction result screen
 */
function showTransactionResult(isSuccess, transactionId, amount, reason) {
    const resultContent = document.getElementById('resultContent');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const processingIndicator = document.getElementById('processingIndicator');

    processingIndicator.classList.add('hidden');
    
    if (isSuccess) {
        resultIcon.className = 'result-icon success';
        resultTitle.textContent = 'Payment Approved ✓';
        resultMessage.textContent = `Your transaction of $${parseFloat(amount).toFixed(2)} has been successfully processed.`;
        resultIcon.innerHTML = '✓';
        resultIcon.style.color = 'var(--color-success)';
    } else {
        resultIcon.className = 'result-icon failed';
        resultTitle.textContent = 'Payment Declined ✗';
        resultMessage.textContent = `Your transaction of $${parseFloat(amount).toFixed(2)} could not be processed.`;
        resultIcon.innerHTML = '✗';
        resultIcon.style.color = 'var(--color-danger)';
        
        const declineReasonRow = document.getElementById('declineReasonRow');
        const declineReasonValue = document.getElementById('declineReason');
        declineReasonRow.classList.remove('hidden');
        declineReasonValue.textContent = reason;
    }

    document.getElementById('transactionId').textContent = transactionId;
    document.getElementById('transactionDateTime').textContent = new Date().toLocaleString();
    document.getElementById('resultAmount').textContent = `$${parseFloat(amount).toFixed(2)}`;
    
    resultContent.classList.remove('hidden');
}

/**
 * Mask card number for display
 */
function maskCardNumber(cardNumber) {
    return `**** **** **** ${cardNumber.slice(-4)}`;
}

/**
 * Update card details display with current user and card info
 */
function updateCardDetails() {
    if (!state.currentCard) {
        // If no saved card yet, use user info
        if (state.currentUser?.name && document.getElementById('displayCardHolder')) {
            document.getElementById('displayCardHolder').textContent = state.currentUser.name.toUpperCase();
        }
        return;
    }
    
    const card = state.currentCard;
    const cardholderName = card.cardholderName || state.currentUser?.name || 'CARDHOLDER';
    
    // Update card details with null checks
    const displayCardNumber = document.getElementById('displayCardNumber');
    const displayCardHolder = document.getElementById('displayCardHolder');
    const displayExpiry = document.getElementById('displayExpiry');
    const creditLimit = document.getElementById('creditLimit');
    const availableCredit = document.getElementById('availableCredit');
    const currentBalance = document.getElementById('currentBalance');
    
    if (displayCardNumber) displayCardNumber.textContent = maskCardNumber(card.cardNumber);
    if (displayCardHolder) displayCardHolder.textContent = cardholderName.toUpperCase();
    if (displayExpiry) displayExpiry.textContent = card.expiryDate || '00/00';
    if (creditLimit) creditLimit.textContent = `$${card.limit ? card.limit.toFixed(2) : '0.00'}`;
    if (availableCredit) availableCredit.textContent = `$${card.availableCredit ? card.availableCredit.toFixed(2) : '0.00'}`;
    if (currentBalance) currentBalance.textContent = `$${card.balance ? card.balance.toFixed(2) : '0.00'}`;
    
    console.log('Card details updated with cardholder:', cardholderName);
}

// Initialize card details update when screen is shown
document.addEventListener('DOMContentLoaded', () => {
    const cardDetailsBtn = document.querySelector('[data-screen="cardDetails"]');
    if (cardDetailsBtn) {
        cardDetailsBtn.addEventListener('click', () => {
            updateCardDetails();
        });
    }
});

// ============ PENDING PAYMENT REQUESTS ============

/**
 * Setup pending payments functionality
 */
function setupPendingPayments() {
    document.getElementById('pendingPaymentsBackBtn')?.addEventListener('click', () => {
        showScreen('customerDashboard');
    });
}

/**
 * Display pending payment requests for customer
 */
function updatePendingPaymentsTable() {
    const tbody = document.getElementById('pendingRequestsBody');
    const noMsg = document.getElementById('noPendingMsg');

    if (!state.currentUser) {
        console.warn('No current user for pending payments');
        noMsg.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }

    console.log('Looking for pending requests for customer:', state.currentUser.id);
    console.log('Total transactions in state:', state.transactions.length);

    // Get all pending requests for this customer
    let pendingRequests = state.transactions.filter(t => {
        const isForThisCustomer = t.customerId === state.currentUser.id;
        const isPending = t.status === 'pending';
        const hasMerchant = !!t.merchantId;
        
        if (isForThisCustomer && isPending && hasMerchant) {
            console.log(`✓ Found: ${t.id} - ${t.description} ($${t.amount})`);
        }
        return isForThisCustomer && isPending && hasMerchant;
    });

    console.log('Pending requests found:', pendingRequests.length);

    tbody.innerHTML = '';

    if (pendingRequests.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    pendingRequests.forEach(request => {
        // Find merchant name from state or use stored merchant name
        const merchant = state.merchants.find(m => m.id === request.merchantId);
        const merchantName = request.merchantName || merchant?.name || request.merchantId || 'Unknown Merchant';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${merchantName}</td>
            <td>$${parseFloat(request.amount).toFixed(2)}</td>
            <td>${request.description || 'N/A'}</td>
            <td>${request.date}</td>
            <td><button class="btn btn-primary action-btn" onclick="payPendingRequest('${request.id}')">Pay Now</button></td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Pay a pending payment request
 */
function payPendingRequest(requestId) {
    const request = state.transactions.find(t => t.id === requestId);
    if (!request) {
        showAlert('Payment request not found', 'error');
        return;
    }

    // Show confirmation
    confirmAction(
        'Confirm Payment',
        `Pay $${parseFloat(request.amount).toFixed(2)} to ${request.description || 'Merchant'}?`,
        () => {
            // Process the payment with stored card
            processPendingPayment(requestId, request);
        }
    );
}

/**
 * Process pending payment request
 */
function processPendingPayment(requestId, request) {
    // Use stored card or require card entry
    if (!state.currentCard) {
        showAlert('Please add a credit card to your account first', 'error');
        showScreen('paymentScreen');
        return;
    }

    showScreen('processingScreen');
    
    // Simulate processing
    setTimeout(() => {
        const transactionId = `TXN-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
        const isSuccess = Math.random() > 0.2; // 80% success rate
        const reasons = ['Insufficient funds', 'Expired card', 'Card blocked', 'Invalid CVV'];
        const declineReason = isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)];
        
        // Update the merchant request status
        const requestIndex = state.transactions.findIndex(t => t.id === requestId);
        if (requestIndex >= 0) {
            if (isSuccess) {
                state.transactions[requestIndex].status = 'success';
                state.transactions[requestIndex].paidDate = new Date().toISOString().split('T')[0];
                state.transactions[requestIndex].paymentId = transactionId;
            } else {
                state.transactions[requestIndex].status = 'failed';
                state.transactions[requestIndex].failureReason = declineReason;
            }
        }

        // Save updated transaction
        saveTransaction(state.transactions[requestIndex]);

        // Show result
        showTransactionResult(isSuccess, transactionId, request.amount, declineReason);

        console.log('Pending payment processed:', requestId, 'Status:', isSuccess ? 'success' : 'failed');
    }, 2000);
}
