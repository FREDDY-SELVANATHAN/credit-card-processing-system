// ============ CUSTOMER PAYMENT FORM ============

/**
 * Setup payment form functionality
 */
function setupPaymentForm() {
    // Card number formatting
    document.getElementById('cardNumber')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
    });

    // Expiry date formatting
    document.getElementById('expiryDate')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // CVV only numbers
    document.getElementById('cvv')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('submitPaymentBtn')?.addEventListener('click', submitPayment);
    document.getElementById('resetPaymentBtn')?.addEventListener('click', () => {
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardholderName').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        clearValidationMessages();
    });
}

/**
 * Submit payment
 */
function submitPayment() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardholderName = document.getElementById('cardholderName').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const amount = document.getElementById('amount').value;
    const errorDiv = document.getElementById('paymentError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    clearValidationMessages();

    let isValid = true;

    // Validation
    if (!validateCardNumber(cardNumber)) {
        showValidationError('cardNumberMsg', 'Invalid card number');
        isValid = false;
    }

    if (!cardholderName.trim()) {
        showValidationError('cardholderMsg', 'Cardholder name is required');
        isValid = false;
    }

    if (!validateExpiryDate(expiryDate)) {
        showValidationError('expiryMsg', 'Card is expired or invalid format');
        isValid = false;
    }

    if (!validateCVV(cvv)) {
        showValidationError('cvvMsg', 'Invalid CVV (3-4 digits)');
        isValid = false;
    }

    if (!amount || amount < 0.01) {
        showValidationError('amountMsg', 'Amount must be greater than $0');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Process payment
    processPayment(cardNumber, cardholderName, expiryDate, cvv, amount);
}

/**
 * Process payment transaction
 */
function processPayment(cardNumber, cardholderName, expiryDate, cvv, amount) {
    showScreen('processingScreen');
    
    // Simulate processing
    setTimeout(() => {
        const transactionId = `TXN-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
        const isSuccess = Math.random() > 0.2; // 80% success rate
        const reasons = ['Insufficient funds', 'Expired card', 'Card blocked', 'Invalid CVV'];
        
        showTransactionResult(isSuccess, transactionId, amount, isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)]);
        
        // Create transaction object
        const transaction = {
            id: transactionId,
            customerId: state.currentUser.id,
            amount: amount,
            status: isSuccess ? 'success' : 'failed',
            date: new Date().toISOString().split('T')[0],
            description: document.getElementById('description').value || 'Payment',
            failureReason: isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)],
            cardNumber: cardNumber,
            cardholderName: cardholderName
        };
        
        // Add to transaction history
        state.transactions.unshift(transaction);
        
        // Save transaction to Firebase
        saveTransaction(transaction);
        
        // Update card balance in Firebase
        updateCard(cardNumber, {
            balance: (Math.random() * 5000).toFixed(2),
            lastTransaction: new Date().toISOString()
        });
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
    
    document.getElementById('returnDashboardBtn').addEventListener('click', () => {
        showScreen('customerDashboard');
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardholderName').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('amount').value = '';
        resultContent.classList.add('hidden');
        processingIndicator.classList.remove('hidden');
    });
}

/**
 * Mask card number for display
 */
function maskCardNumber(cardNumber) {
    return `**** **** **** ${cardNumber.slice(-4)}`;
}

/**
 * Update card details display
 */
function updateCardDetails() {
    const card = state.cards[0]; // Demo: show first card
    document.getElementById('displayCardNumber').textContent = maskCardNumber(card.cardNumber);
    document.getElementById('displayCardHolder').textContent = card.holder.toUpperCase();
    document.getElementById('displayExpiry').textContent = card.expiry;
    document.getElementById('creditLimit').textContent = `$${card.limit.toFixed(2)}`;
    document.getElementById('availableCredit').textContent = `$${(card.limit - card.balance).toFixed(2)}`;
    document.getElementById('currentBalance').textContent = `$${card.balance.toFixed(2)}`;
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
