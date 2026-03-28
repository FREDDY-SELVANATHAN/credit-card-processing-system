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
}

/**
 * Reset payment form
 */
function resetPaymentForm() {
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardholderName').value = '';
    document.getElementById('expiryDate').value = '';
    document.getElementById('cvv').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    
    // Reset readonly state
    document.getElementById('cardNumber').readOnly = false;
    document.getElementById('cardholderName').readOnly = false;
    document.getElementById('expiryDate').readOnly = false;
    document.getElementById('cvv').readOnly = false;
    
    clearValidationMessages();
}

/**
 * Load saved credit card details into payment form
 */
function loadSavedCardDetails() {
    if (state.currentCard) {
        // Mask the card number for display (show only last 4 digits)
        const maskedCard = `**** **** **** ${state.currentCard.cardNumber.slice(-4)}`;
        
        // Populate form with saved card details
        document.getElementById('cardNumber').value = maskedCard;
        document.getElementById('cardholderName').value = state.currentCard.cardholderName || state.currentUser?.name || '';
        document.getElementById('expiryDate').value = state.currentCard.expiryDate;
        document.getElementById('cvv').value = '***'; // For security, don't display actual CVV
        
        // Make card field read-only since it's from registered account
        document.getElementById('cardNumber').readOnly = true;
        document.getElementById('cardholderName').readOnly = true;
        document.getElementById('expiryDate').readOnly = true;
        document.getElementById('cvv').readOnly = true;
        
        console.log('Saved card details loaded with name:', document.getElementById('cardholderName').value);
    } else if (state.currentUser?.name) {
        // Auto-fill cardholder name with user's name if no saved card
        document.getElementById('cardholderName').value = state.currentUser.name;
        document.getElementById('cardholderName').readOnly = false;
        document.getElementById('cardNumber').readOnly = false;
        document.getElementById('expiryDate').readOnly = false;
        document.getElementById('cvv').readOnly = false;
        console.log('Pre-filled cardholder name with user name:', state.currentUser.name);
    }
}

/**
 * Submit payment using saved card or new card
 */
function submitPayment() {
    let cardNumber, cardholderName, expiryDate, cvv;
    const amount = document.getElementById('amount').value;
    const errorDiv = document.getElementById('paymentError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    clearValidationMessages();

    let isValid = true;

    // Use saved card if available
    if (state.currentCard) {
        cardNumber = state.currentCard.cardNumber;
        cardholderName = state.currentCard.cardholderName;
        expiryDate = state.currentCard.expiryDate;
        cvv = state.currentCard.cvv;
    } else {
        // Get from form if no saved card
        cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        cardholderName = document.getElementById('cardholderName').value;
        expiryDate = document.getElementById('expiryDate').value;
        cvv = document.getElementById('cvv').value;

        // Validation for new card entry
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
    }

    if (!amount || amount < 0.01) {
        showValidationError('amountMsg', 'Amount must be greater than $0');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Process payment with saved/entered card
    processPayment(cardNumber, cardholderName, expiryDate, cvv, amount);
}

/**
 * Process payment transaction and link to card & account
 */
function processPayment(cardNumber, cardholderName, expiryDate, cvv, amount) {
    showScreen('processingScreen');
    
    // Simulate processing
    setTimeout(() => {
        const transactionId = `TXN-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
        const isSuccess = Math.random() > 0.2; // 80% success rate
        const reasons = ['Insufficient funds', 'Expired card', 'Card blocked', 'Invalid CVV'];
        const declineReason = isSuccess ? null : reasons[Math.floor(Math.random() * reasons.length)];
        
        showTransactionResult(isSuccess, transactionId, amount, declineReason);
        
        // Create transaction object linked to user and card
        const transaction = {
            id: transactionId,
            customerId: state.currentUser.id,
            userId: state.currentUser.id,
            cardId: state.currentCard?.cardId || cardNumber.slice(-4),
            cardNumber: cardNumber,
            cardholderName: cardholderName,
            amount: parseFloat(amount),
            status: isSuccess ? 'success' : 'failed',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            description: document.getElementById('description').value || 'Payment',
            failureReason: declineReason,
            expiryDate: expiryDate
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
    
    document.getElementById('returnDashboardBtn').addEventListener('click', () => {
        // Reset payment form
        document.getElementById('paymentForm').reset?.() || document.querySelectorAll('#paymentScreen input, #paymentScreen textarea').forEach(el => el.value = '');
        
        // Reset UI state
        document.getElementById('cardNumber').readOnly = false;
        document.getElementById('cardholderName').readOnly = false;
        document.getElementById('expiryDate').readOnly = false;
        document.getElementById('cvv').readOnly = false;
        resultContent.classList.add('hidden');
        processingIndicator.classList.remove('hidden');
        
        // Clear decline reason display
        document.getElementById('declineReasonRow').classList.add('hidden');
        
        showScreen('customerDashboard');
    });
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
        if (state.currentUser?.name) {
            document.getElementById('displayCardHolder').textContent = state.currentUser.name.toUpperCase();
        }
        return;
    }
    
    const card = state.currentCard;
    const cardholderName = card.cardholderName || state.currentUser?.name || 'CARDHOLDER';
    
    document.getElementById('displayCardNumber').textContent = maskCardNumber(card.cardNumber);
    document.getElementById('displayCardHolder').textContent = cardholderName.toUpperCase();
    document.getElementById('displayExpiry').textContent = card.expiryDate || '00/00';
    document.getElementById('creditLimit').textContent = `$${card.limit ? card.limit.toFixed(2) : '0.00'}`;
    document.getElementById('availableCredit').textContent = `$${card.availableCredit ? card.availableCredit.toFixed(2) : '0.00'}`;
    document.getElementById('currentBalance').textContent = `$${card.balance ? card.balance.toFixed(2) : '0.00'}`;
    
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
