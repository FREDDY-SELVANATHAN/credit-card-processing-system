// ============ VALIDATION FUNCTIONS ============

/**
 * Username validation rules - customizable
 */
const usernameRules = {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/, // alphanumeric, underscore, hyphen
    customMessage: 'Username must be 3-20 characters, using only letters, numbers, underscores, and hyphens'
};

/**
 * Password validation rules
 */
const passwordRules = {
    minLength: 8,
    requireNumber: true,
    requireSpecial: true,
    specialCharacters: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

/**
 * Validate username
 */
function validateUsername(username) {
    if (username.length < usernameRules.minLength || username.length > usernameRules.maxLength) {
        return {
            valid: false,
            message: `Username must be ${usernameRules.minLength}-${usernameRules.maxLength} characters`
        };
    }
    
    if (!usernameRules.pattern.test(username)) {
        return {
            valid: false,
            message: usernameRules.customMessage
        };
    }
    
    return { valid: true, message: 'Username is valid ✓' };
}

/**
 * Validate password strength
 */
function validatePassword(password) {
    const result = {
        valid: true,
        errors: [],
        length: false,
        number: false,
        special: false
    };

    // Check length
    if (password.length < passwordRules.minLength) {
        result.errors.push(`Password must be at least ${passwordRules.minLength} characters`);
        result.valid = false;
    } else {
        result.length = true;
    }

    // Check for number
    if (passwordRules.requireNumber && !/\d/.test(password)) {
        result.errors.push('Password must contain at least one number');
        result.valid = false;
    } else if (passwordRules.requireNumber) {
        result.number = true;
    }

    // Check for special character
    if (passwordRules.requireSpecial && !passwordRules.specialCharacters.test(password)) {
        result.errors.push('Password must contain at least one special character (!@#$%^&*)');
        result.valid = false;
    } else if (passwordRules.requireSpecial) {
        result.special = true;
    }

    return result;
}

/**
 * Check if username already exists in Firebase
 */
async function checkUsernameExists(username) {
    if (!db) {
        return false;
    }
    try {
        const snapshot = await db.ref('users').orderByChild('username').equalTo(username).get();
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

/**
 * Validate email
 */
function validateEmail(email) {
    // Email validation pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        return {
            valid: false,
            message: 'Email is required'
        };
    }
    
    if (!emailPattern.test(email)) {
        return {
            valid: false,
            message: 'Please enter a valid email address'
        };
    }
    
    return { valid: true, message: 'Email is valid ✓' };
}

/**
 * Check if email already exists in Firebase
 */
async function checkEmailExists(email) {
    if (!db) {
        return false;
    }
    try {
        const snapshot = await db.ref('users').orderByChild('email').equalTo(email).get();
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

/**
 * Validate card number
 */
function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
}

/**
 * Validate expiry date
 */
function validateExpiryDate(expiryDate) {
    const regex = /^\d{2}\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;

    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    return expiry > today;
}

/**
 * Validate CVV
 */
function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

/**
 * Show validation error message
 */
function showValidationError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('error');
    }
}

/**
 * Clear all validation messages
 */
function clearValidationMessages() {
    document.querySelectorAll('.validation-msg').forEach(el => {
        el.textContent = '';
        el.classList.remove('error');
    });
}
