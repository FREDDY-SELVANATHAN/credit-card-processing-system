// ============ AUTHENTICATION FUNCTIONS ============

/**
 * Register new user
 */
async function registerUser(fullName, username, email, password, role) {
    if (!db) {
        console.error('Firebase not initialized');
        return { success: false, message: 'Database not available' };
    }

    try {
        // Check if username exists
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
            return { success: false, message: 'Username already exists' };
        }

        // Check if email exists
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return { success: false, message: 'Email already registered' };
        }

        // Generate user ID
        const userId = `${role}_${Date.now()}`;
        
        // Create user object
        const userData = {
            id: userId,
            username: username,
            email: email,
            password: password, // In production, use hash!
            name: fullName,
            role: role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Save to Firebase
        await db.ref(`users/${userId}`).set(userData);
        
        console.log('User registered:', userId);
        return { success: true, message: 'Registration successful!', userId: userId, userData: userData };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

/**
 * Handle user login
 */
async function handleLogin() {
    const usernameOrEmail = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = state.currentRole;
    const errorDiv = document.getElementById('loginError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (!role) {
        showError('Please select a role', errorDiv);
        return;
    }

    if (!usernameOrEmail || !password) {
        showError('Please enter username/email and password', errorDiv);
        return;
    }

    try {
        // Check demo users first (for demo purposes)
        const demoUser = demoUsers[role];
        if (usernameOrEmail === demoUser.username && password === demoUser.password) {
            state.currentUser = { ...demoUser, role };
            
            // Save login to Firebase
            saveUser(demoUser.id, {
                ...demoUser,
                role,
                lastLogin: new Date().toISOString()
            });
            
            // Clear form
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            
            // Navigate to appropriate dashboard
            loginSuccess(demoUser.name, role);
            return;
        }

        // Check Firebase for registered users
        if (db) {
            let foundUser = null;
            let userId = null;

            // First try to find by username
            try {
                const usernameSnapshot = await db.ref('users').orderByChild('username').equalTo(usernameOrEmail).get();
                
                if (usernameSnapshot.exists()) {
                    usernameSnapshot.forEach(child => {
                        foundUser = child.val();
                        userId = child.key;
                    });
                }
            } catch (error) {
                console.warn('Error checking username:', error);
            }

            // If not found by username, try to find by email
            if (!foundUser) {
                try {
                    const allUsersSnapshot = await db.ref('users').get();
                    
                    if (allUsersSnapshot.exists()) {
                        allUsersSnapshot.forEach(child => {
                            const user = child.val();
                            if (user.email && user.email.toLowerCase() === usernameOrEmail.toLowerCase()) {
                                foundUser = user;
                                userId = child.key;
                            }
                        });
                    }
                } catch (error) {
                    console.warn('Error checking email:', error);
                }
            }

            if (foundUser) {
                // Check if role matches first
                if (foundUser.role !== role) {
                    showError(`This account is registered as a ${foundUser.role}. Please select the correct role to login.`, errorDiv);
                    return;
                }

                // Verify password matches
                if (foundUser.password === password) {
                    state.currentUser = { ...foundUser, id: userId };
                    state.currentRole = role;
                    
                    // Update last login in Firebase
                    await db.ref(`users/${userId}`).update({
                        lastLogin: new Date().toISOString()
                    });

                    // Load user's credit card information
                    try {
                        const cardSnapshot = await db.ref(`cards/${userId}`).get();
                        if (cardSnapshot.exists()) {
                            state.currentCard = cardSnapshot.val();
                            console.log('Card loaded for user:', userId);
                        }
                    } catch (error) {
                        console.warn('Error loading card:', error);
                    }
                    
                    // Clear form
                    document.getElementById('username').value = '';
                    document.getElementById('password').value = '';
                    
                    console.log('User logged in successfully:', usernameOrEmail);
                    
                    // Navigate to appropriate dashboard
                    loginSuccess(foundUser.name, role);
                    return;
                } else {
                    // Password is wrong
                    showError('❌ Incorrect password. Please try again.', errorDiv);
                    return;
                }
            } else {
                // User not found - suggest registration
                const errorMessage = `<div>❌ Username or email "<strong>${usernameOrEmail}</strong>" not found.</div><div style="margin-top: 10px; font-size: 0.9em;">Don't have an account? <strong>Click "Register"</strong> tab to create one.</div>`;
                errorDiv.innerHTML = errorMessage;
                errorDiv.classList.add('show');
                return;
            }
        } else {
            showError('Database connection failed', errorDiv);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed: ' + error.message, errorDiv);
    }
}

/**
 * Handle user registration with credit card
 */
async function handleRegistration() {
    const fullName = document.getElementById('registerFullName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    
    // Credit card fields
    const cardNumber = document.getElementById('regCardNumber').value.replace(/\s/g, '');
    const cardholderName = document.getElementById('regCardholderName').value.trim();
    const expiryDate = document.getElementById('regExpiryDate').value.trim();
    const cvv = document.getElementById('regCVV').value.trim();
    
    const role = state.currentRole;
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');

    // Clear previous messages
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    successDiv.textContent = '';
    successDiv.classList.remove('show');

    // Validations
    if (!role) {
        showError('Please select a role', errorDiv);
        return;
    }

    if (!fullName) {
        showError('Please enter your full name', errorDiv);
        return;
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        showError(usernameValidation.message, errorDiv);
        return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showError(emailValidation.message, errorDiv);
        return;
    }

    // ============ CREDIT CARD VALIDATION ============
    clearValidationMessages();
    let isCardValid = true;

    if (!validateCardNumber(cardNumber)) {
        showValidationError('regCardNumberMsg', 'Invalid card number (Luhn validation)');
        isCardValid = false;
    }

    // Auto-fill cardholder name with full name if empty
    const finalCardholderName = cardholderName.trim() || fullName;
    if (!finalCardholderName) {
        showValidationError('regCardholderMsg', 'Cardholder name is required');
        isCardValid = false;
    }

    if (!validateExpiryDate(expiryDate)) {
        showValidationError('regExpiryMsg', 'Card is expired or invalid format (MM/YY)');
        isCardValid = false;
    }

    if (!validateCVV(cvv)) {
        showValidationError('regCVVMsg', 'Invalid CVV (3-4 digits)');
        isCardValid = false;
    }

    if (!isCardValid) {
        showError('Please correct the credit card information', errorDiv);
        return;
    }

    // Check if username already exists
    if (db) {
        try {
            const snapshot = await db.ref('users').orderByChild('username').equalTo(username).get();
            if (snapshot.exists()) {
                const errorMessage = `<div>❌ Username "<strong>${username}</strong>" already exists.</div><div style="margin-top: 10px; font-size: 0.9em;">Already have an account? <strong>Click "Login"</strong> tab to sign in.</div>`;
                errorDiv.innerHTML = errorMessage;
                errorDiv.classList.add('show');
                return;
            }
        } catch (error) {
            console.warn('Error checking username:', error);
        }
    }

    // Check if email already exists
    if (db) {
        try {
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).get();
            if (snapshot.exists()) {
                const errorMessage = `<div>❌ Email "<strong>${email}</strong>" is already registered.</div><div style="margin-top: 10px; font-size: 0.9em;">Already have an account? <strong>Click "Login"</strong> tab to sign in.</div>`;
                errorDiv.innerHTML = errorMessage;
                errorDiv.classList.add('show');
                return;
            }
        } catch (error) {
            console.warn('Error checking email:', error);
        }
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showError(passwordValidation.errors.join(', '), errorDiv);
        return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
        showError('Passwords do not match', errorDiv);
        return;
    }

    try {
        // Create new user object with card reference
        const userId = `${role}_${Date.now()}`;
        const cardId = cardNumber.slice(-4); // Last 4 digits for easy identification
        
        const newUser = {
            id: userId,
            username: username,
            email: email,
            password: password, // Note: In production, use bcrypt or similar for hashing
            name: fullName,
            role: role,
            authMethod: 'email',
            cardId: cardId, // Link to card
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Create card object
        const cardData = {
            cardId: cardId,
            cardNumber: cardNumber,
            cardholderName: finalCardholderName,
            expiryDate: expiryDate,
            cvv: cvv,
            userId: userId,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        // Save to Firebase
        if (db) {
            // Save user
            await db.ref(`users/${userId}`).set(newUser);
            
            // Save card linked to user
            await db.ref(`cards/${userId}`).set(cardData);
            
            console.log('User and card registered successfully:', userId);

            // Show success message
            successDiv.textContent = 'Account created successfully! Logging in...';
            successDiv.classList.add('show');

            // Clear form
            document.getElementById('registerFullName').value = '';
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirmPassword').value = '';
            document.getElementById('regCardNumber').value = '';
            document.getElementById('regCardholderName').value = '';
            document.getElementById('regExpiryDate').value = '';
            document.getElementById('regCVV').value = '';

            // Update password requirements display
            updatePasswordRequirements('');

            // Auto-login the user
            setTimeout(() => {
                state.currentUser = { ...newUser };
                state.currentRole = role;
                state.currentCard = cardData;
                
                // Navigate to dashboard
                loginSuccess(fullName, role);
            }, 1500);
        } else {
            showError('Database connection failed', errorDiv);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Registration failed: ' + error.message, errorDiv);
    }
}

/**
 * Handle successful login
 */
function loginSuccess(userName, role) {
    if (role === 'customer') {
        document.getElementById('welcomeName').textContent = userName;
        document.getElementById('customerName').textContent = userName;
        
        // Load customer's transactions
        updateTransactionTable();
        
        // Load customer's card details
        updateCardDetails();
        
        showScreen('customerDashboard');
    } else if (role === 'merchant') {
        document.getElementById('merchantWelcomeName').textContent = userName;
        document.getElementById('merchantName').textContent = userName;
        
        // Load merchant's transactions
        updateMerchantTransactionTable();
        
        showScreen('merchantDashboard');
    } else if (role === 'admin') {
        document.getElementById('adminName').textContent = userName;
        
        // Load admin data
        updateAdminDashboard();
        
        showScreen('adminDashboard');
    }
}

/**
 * Handle user logout
 */
function logout() {
    state.currentUser = null;
    state.currentRole = null;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.register-role').forEach(b => b.classList.remove('active'));
    
    // Sign out from Firebase
    if (auth) {
        auth.signOut().then(() => {
            console.log('User signed out from Firebase');
            
            // Clear Firebase UI and reinitialize
            if (firebaseUI) {
                try {
                    firebaseUI.reset();
                    console.log('FirebaseUI reset');
                } catch (error) {
                    console.warn('Error resetting FirebaseUI:', error);
                }
            }
            
            // Reinitialize Google Sign-In
            setTimeout(() => {
                initializeGoogleSignIn();
            }, 500);
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    }
    
    showScreen('loginScreen');
    showAlert('Logged out successfully', 'success');
}

/**
 * Initialize Google Sign-In with Firebase UI for both Login and Register
 */
function initializeGoogleSignIn() {
    if (!auth) {
        console.error('Firebase not initialized');
        setTimeout(initializeGoogleSignIn, 1000);
        return;
    }

    try {
        // Check if firebaseui exists
        if (typeof firebaseui === 'undefined') {
            console.warn('FirebaseUI library not loaded yet');
            setTimeout(initializeGoogleSignIn, 1000);
            return;
        }

        // Create only ONE instance
        if (!firebaseUI) {
            firebaseUI = new firebaseui.auth.AuthUI(auth);
        }

        const uiConfig = {
            signInSuccessUrl: '#',
            signInOptions: [
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                firebase.auth.EmailAuthProvider.PROVIDER_ID
            ],
            callbacks: {
                signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                    const user = authResult.user;
                    console.log('Sign-in successful:', user.email);
                    handleAuthResult(user, authResult.additionalUserInfo?.isNewUser);
                    return false;
                },
                uiShown: function() {
                    console.log('FirebaseUI is shown');
                }
            },
            signInFlow: 'popup'
        };

        // Initialize on Login page
        const loginContainer = document.getElementById('firebaseUIContainerLogin');
        if (loginContainer) {
            firebaseUI.start('#firebaseUIContainerLogin', uiConfig);
            console.log('FirebaseUI initialized on Login page');
        }

        // Initialize on Register page
        const registerContainer = document.getElementById('firebaseUIContainerRegister');
        if (registerContainer) {
            // Render in register container too (same instance)
            firebaseUI.start('#firebaseUIContainerRegister', uiConfig);
            console.log('FirebaseUI initialized on Register page');
        }

    } catch (error) {
        console.error('Error initializing FirebaseUI:', error);
        // Only retry if it's a timing issue, not if instance already exists
        if (error.message && error.message.includes('already exists')) {
            console.log('FirebaseUI instance already exists, skipping retry');
            return;
        }
        setTimeout(initializeGoogleSignIn, 2000);
    }
}

/**
 * Handle authentication result - checks if user exists or is new
 */
async function handleAuthResult(user, isNewUser) {
    try {
        // Check if user already exists in database
        const userSnapshot = await db.ref(`users/${user.uid}`).get();
        const userExists = userSnapshot.exists();

        if (userExists) {
            // User already registered - ask for password to verify
            const existingUser = userSnapshot.val();
            console.log('User already registered, asking for password:', user.email);
            promptForGooglePassword(user.uid, existingUser.name, user.email, 'existing');
        } else {
            // New user - prompt to create password first
            console.log('New user, prompting for password:', user.email);
            promptForGooglePassword(user.uid, user.displayName || user.email.split('@')[0], user.email, 'new');
        }
    } catch (error) {
        console.error('Error checking user:', error);
        showError('Error processing sign-in: ' + error.message, document.getElementById('loginError'));
    }
}

/**
 * Prompt user to create password for Google account (NO credit card here)
 */
function promptForGooglePassword(userID, userName, userEmail, userType = 'new') {
    // Escape special characters for safe HTML insertion
    const escapedUserName = (userName || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapedEmail = (userEmail || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    const modal = document.createElement('div');
    modal.className = 'role-selection-modal';
    modal.id = 'googleAuthModal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 500px;">
                <h3>${userType === 'existing' ? 'Sign In to Your Account' : 'Create App Account'}</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    ${userType === 'existing' 
                        ? `Welcome back, <strong>${escapedUserName}</strong>!<br><br>Enter your app password to continue.` 
                        : `Create your account details<br><strong>${escapedEmail}</strong>`}
                </p>
                
                ${userType === 'new' ? `
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="googleUsername">Username</label>
                    <input type="text" id="googleUsername" placeholder="Choose a username (3+ characters)" required autofocus style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                    <div id="usernameError" style="color: #dc3545; font-size: 0.9em; margin-top: 10px; display: none;"></div>
                </div>
                ` : ''}
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="googlePassword">${userType === 'existing' ? 'Password' : 'Create Password'}</label>
                    <div style="position: relative;">
                        <input type="password" id="googlePassword" placeholder="${userType === 'existing' ? 'Enter your app password' : 'Min 8 chars, 1 number, 1 special char'}" required ${userType === 'new' ? '' : 'autofocus'} style="padding: 10px 40px 10px 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                        <i class="fas fa-eye" onclick="toggleGooglePasswordVisibility('googlePassword')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;"></i>
                    </div>
                    <div id="passwordError" style="color: #dc3545; font-size: 0.9em; margin-top: 10px; display: none;"></div>
                </div>
                
                ${userType === 'new' ? `
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="googleConfirmPassword">Confirm Password</label>
                    <div style="position: relative;">
                        <input type="password" id="googleConfirmPassword" placeholder="Re-enter your password" required style="padding: 10px 40px 10px 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                        <i class="fas fa-eye" onclick="toggleGooglePasswordVisibility('googleConfirmPassword')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;"></i>
                    </div>
                    <div id="confirmError" style="color: #dc3545; font-size: 0.9em; margin-top: 10px; display: none;"></div>
                </div>
                <div class="password-requirements" style="margin-bottom: 20px; font-size: 0.9em;">
                    <div class="req-item" id="req-length-google">✗ At least 8 characters</div>
                    <div class="req-item" id="req-number-google">✗ At least one number (0-9)</div>
                    <div class="req-item" id="req-special-google">✗ At least one special character (!@#$%^&*)</div>
                </div>
                ` : ''}
                
                <button id="continueBtn" class="btn btn-primary btn-block" style="padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 20px;">
                    ${userType === 'existing' ? 'Sign In' : 'Continue'}
                </button>
                <button id="cancelBtn" class="btn" style="padding: 10px; margin-top: 10px; background: #f8f9fa; color: #666; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 600;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners instead of inline onclick (safer and more reliable)
    document.getElementById('continueBtn').addEventListener('click', () => {
        continueGoogleAuth(userID, userName, userEmail, userType);
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
        const modalEl = document.getElementById('googleAuthModal');
        if (modalEl) modalEl.remove();
    });

    // Add validation listeners for new users
    if (userType === 'new') {
        document.getElementById('googlePassword').addEventListener('input', (e) => {
            updateGooglePasswordRequirements(e.target.value);
        });
    }
}

/**
 * Toggle Google password visibility
 */
function toggleGooglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = event.target;
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/**
 * Update password requirements display for Google signup
 */
function updateGooglePasswordRequirements(password) {
    const validation = validatePassword(password);
    
    const lengthReq = document.getElementById('req-length-google');
    const numberReq = document.getElementById('req-number-google');
    const specialReq = document.getElementById('req-special-google');

    if (lengthReq) {
        if (validation.length) {
            lengthReq.classList.add('met');
        } else {
            lengthReq.classList.remove('met');
        }
    }

    if (numberReq) {
        if (validation.number) {
            numberReq.classList.add('met');
        } else {
            numberReq.classList.remove('met');
        }
    }

    if (specialReq) {
        if (validation.special) {
            specialReq.classList.add('met');
        } else {
            specialReq.classList.remove('met');
        }
    }
}

/**
 * Continue Google auth after password validation
 */
async function continueGoogleAuth(userID, userName, userEmail, userType = 'new') {
    const passwordInput = document.getElementById('googlePassword');
    const password = passwordInput?.value || '';
    const passwordError = document.getElementById('passwordError');
    const confirmError = document.getElementById('confirmError');
    const usernameError = document.getElementById('usernameError');
    
    // Clear errors
    if (passwordError) passwordError.style.display = 'none';
    if (confirmError) confirmError.style.display = 'none';
    if (usernameError) usernameError.style.display = 'none';

    // Validate password
    if (!password) {
        if (passwordError) {
            passwordError.textContent = userType === 'existing' ? 'Please enter your password' : 'Please enter a password';
            passwordError.style.display = 'block';
        }
        return;
    }

    if (userType === 'new') {
        // Get username
        const usernameInput = document.getElementById('googleUsername');
        const username = usernameInput?.value?.trim() || '';
        
        // Validate username
        if (!username) {
            if (usernameError) {
                usernameError.textContent = 'Please enter a username';
                usernameError.style.display = 'block';
            }
            return;
        }

        // Validate username format
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            if (usernameError) {
                usernameError.textContent = usernameValidation.message;
                usernameError.style.display = 'block';
            }
            return;
        }

        // Check if username already exists
        try {
            const snapshot = await db.ref('users').orderByChild('username').equalTo(username).get();
            if (snapshot.exists()) {
                if (usernameError) {
                    usernameError.textContent = `Username "${username}" already exists. Please choose another.`;
                    usernameError.style.display = 'block';
                }
                return;
            }
        } catch (error) {
            console.warn('Error checking username:', error);
        }

        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.valid) {
            if (passwordError) {
                passwordError.textContent = validation.errors.join(', ');
                passwordError.style.display = 'block';
            }
            return;
        }

        // Check confirm password
        const confirmPassword = document.getElementById('googleConfirmPassword')?.value || '';
        if (password !== confirmPassword) {
            if (confirmError) {
                confirmError.textContent = 'Passwords do not match';
                confirmError.style.display = 'block';
            }
            return;
        }

        // Validation passed - proceed to role selection
        try {
            const modal = document.getElementById('googleAuthModal');
            if (modal) modal.remove();
            
            // Store credentials and proceed to role selection (without card data yet)
            promptForGoogleRoleSelection(userID, userName, userEmail, password, username);
        } catch (error) {
            console.error('Error continuing Google signup:', error);
            if (passwordError) {
                passwordError.textContent = 'Error: ' + error.message;
                passwordError.style.display = 'block';
            }
        }
    } else {
        // Existing user - verify password
        try {
            const userSnapshot = await db.ref(`users/${userID}`).get();
            if (userSnapshot.exists()) {
                const existingUser = userSnapshot.val();
                
                if (existingUser.password === password) {
                    // Password matches - login
                    state.currentUser = existingUser;
                    state.currentRole = existingUser.role;
                    
                    // Load card if customer
                    if (existingUser.role === 'customer') {
                        try {
                            const cardSnapshot = await db.ref(`cards/${userID}`).get();
                            if (cardSnapshot.exists()) {
                                state.currentCard = cardSnapshot.val();
                            }
                        } catch (error) {
                            console.warn('Error loading card:', error);
                        }
                    }
                    
                    // Update last login
                    await db.ref(`users/${userID}`).update({
                        lastLogin: new Date().toISOString()
                    });
                    
                    const modal = document.getElementById('googleAuthModal');
                    if (modal) modal.remove();
                    
                    loginSuccess(existingUser.name, existingUser.role);
                } else {
                    // Wrong password
                    if (passwordError) {
                        passwordError.textContent = 'Incorrect password. Please try again.';
                        passwordError.style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.error('Error verifying password:', error);
            if (passwordError) {
                passwordError.textContent = 'Error: ' + error.message;
                passwordError.style.display = 'block';
            }
        }
    }
}

/**
 * Prompt for role selection (Google signup)
 */
function promptForGoogleRoleSelection(userID, userName, userEmail, password, username) {
    window.googleAuthData = {
        userID: userID,
        userName: userName,
        userEmail: userEmail,
        password: password,
        username: username
    };
    
    const roleModal = document.createElement('div');
    roleModal.className = 'role-selection-modal';
    roleModal.id = 'googleRoleModal';
    roleModal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>Select Your Role</h3>
                <p>Choose your role in the Credit Card Processing System</p>
                <div class="role-selection" style="margin-bottom: 20px;">
                    <button class="role-btn role-customer-btn">
                        <span class="role-icon">👤</span>
                        <span class="role-name">Customer</span>
                    </button>
                    <button class="role-btn role-merchant-btn">
                        <span class="role-icon">🏪</span>
                        <span class="role-name">Merchant</span>
                    </button>
                    <button class="role-btn role-admin-btn">
                        <span class="role-icon">🏦</span>
                        <span class="role-name">Admin</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(roleModal);
    
    // Add event listeners
    document.querySelector('.role-customer-btn').addEventListener('click', () => proceedGoogleSignup('customer'));
    document.querySelector('.role-merchant-btn').addEventListener('click', () => proceedGoogleSignup('merchant'));
    document.querySelector('.role-admin-btn').addEventListener('click', () => proceedGoogleSignup('admin'));
}

/**
 * Proceed with Google signup (show credit card form ONLY for customers)
 */
function proceedGoogleSignup(role) {
    const data = window.googleAuthData;
    
    const modal = document.getElementById('googleRoleModal');
    if (modal) modal.remove();
    
    // Only show credit card modal for customers
    if (role === 'customer') {
        promptForGoogleCreditCard(data.userID, data.userName, data.userEmail, data.password, data.username, role);
    } else {
        // For merchant/admin, complete signup directly
        completeGoogleSignup(data.userID, data.userName, data.userEmail, data.password, data.username, role, null);
    }
}

/**
 * Prompt for credit card (ONLY for customers)
 */
function promptForGoogleCreditCard(userID, userName, userEmail, password, username, role) {
    // Store card form data globally for access in event handlers
    window.googleCardData = {
        userID: userID,
        userName: userName,
        userEmail: userEmail,
        password: password,
        username: username,
        role: role
    };
    
    const cardModal = document.createElement('div');
    cardModal.className = 'role-selection-modal';
    cardModal.id = 'googleCardModal';
    cardModal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 500px;">
                <h3>Add Credit Card</h3>
                <p style="color: #666; margin-bottom: 20px;">As a customer, please add your credit card for transactions</p>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="googleCardNumber">Card Number</label>
                    <input type="text" id="googleCardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                    <div id="googleCardError" style="color: #dc3545; font-size: 0.9em; margin-top: 5px; display: none;"></div>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="googleCardholderName">Cardholder Name</label>
                    <input type="text" id="googleCardholderName" placeholder="Full name as on card" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                    <div id="googleCardholderError" style="color: #dc3545; font-size: 0.9em; margin-top: 5px; display: none;"></div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label for="googleExpiryDate">Expiry Date (MM/YY)</label>
                        <input type="text" id="googleExpiryDate" placeholder="MM/YY" maxlength="5" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                        <div id="googleExpiryError" style="color: #dc3545; font-size: 0.9em; margin-top: 5px; display: none;"></div>
                    </div>
                    <div class="form-group">
                        <label for="googleCVV">CVV</label>
                        <div style="position: relative;">
                            <input type="password" id="googleCVV" placeholder="***" maxlength="4" required style="padding: 10px 40px 10px 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                            <i class="fas fa-eye" onclick="toggleGooglePasswordVisibility('googleCVV')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;"></i>
                        </div>
                        <div id="googleCVVError" style="color: #dc3545; font-size: 0.9em; margin-top: 5px; display: none;"></div>
                    </div>
                </div>
                
                <button id="completeSignupBtn" class="btn btn-primary btn-block" style="padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 20px;">Complete Signup</button>
                <button id="backToRoleBtn" class="btn" style="padding: 10px; margin-top: 10px; background: #f8f9fa; color: #666; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 600;">Back</button>
            </div>
        </div>
    `;
    document.body.appendChild(cardModal);

    // Setup card number formatting
    document.getElementById('googleCardNumber').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
    });

    // Setup expiry date formatting
    document.getElementById('googleExpiryDate').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // Setup CVV to only accept numbers
    document.getElementById('googleCVV').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    
    // Add event listeners for buttons
    document.getElementById('completeSignupBtn').addEventListener('click', () => {
        const data = window.googleCardData;
        completeGoogleWithCard(data.userID, data.userName, data.userEmail, data.password, data.username, data.role);
    });
    
    document.getElementById('backToRoleBtn').addEventListener('click', () => {
        const modal = document.getElementById('googleCardModal');
        if (modal) modal.remove();
        
        const data = window.googleCardData;
        promptForGoogleRoleSelection(data.userID, data.userName, data.userEmail, data.password, data.username);
    });
}

/**
 * Complete Google signup with credit card
 */
async function completeGoogleWithCard(userID, userName, userEmail, password, username, role) {
    const cardNumber = document.getElementById('googleCardNumber')?.value.replace(/\s/g, '') || '';
    const cardholderName = document.getElementById('googleCardholderName')?.value.trim() || '';
    const expiryDate = document.getElementById('googleExpiryDate')?.value.trim() || '';
    const cvv = document.getElementById('googleCVV')?.value.trim() || '';

    const googleCardError = document.getElementById('googleCardError');
    const googleCardholderError = document.getElementById('googleCardholderError');
    const googleExpiryError = document.getElementById('googleExpiryError');
    const googleCVVError = document.getElementById('googleCVVError');

    // Clear errors first
    if (googleCardError) googleCardError.style.display = 'none';
    if (googleCardholderError) googleCardholderError.style.display = 'none';
    if (googleExpiryError) googleExpiryError.style.display = 'none';
    if (googleCVVError) googleCVVError.style.display = 'none';

    let isCardValid = true;

    if (!validateCardNumber(cardNumber)) {
        if (googleCardError) {
            googleCardError.textContent = 'Invalid card number (Luhn validation)';
            googleCardError.style.display = 'block';
        }
        isCardValid = false;
    }

    // Auto-fill cardholder name with user's name if empty
    const finalCardholderName = cardholderName || userName;
    if (!finalCardholderName) {
        if (googleCardholderError) {
            googleCardholderError.textContent = 'Cardholder name is required';
            googleCardholderError.style.display = 'block';
        }
        isCardValid = false;
    }

    if (!validateExpiryDate(expiryDate)) {
        if (googleExpiryError) {
            googleExpiryError.textContent = 'Invalid expiry date (MM/YY)';
            googleExpiryError.style.display = 'block';
        }
        isCardValid = false;
    }

    if (!validateCVV(cvv)) {
        if (googleCVVError) {
            googleCVVError.textContent = 'Invalid CVV (3-4 digits)';
            googleCVVError.style.display = 'block';
        }
        isCardValid = false;
    }

    if (!isCardValid) {
        return;
    }

    // Credit card data
    const cardData = {
        cardId: cardNumber.slice(-4),
        cardNumber: cardNumber,
        cardholderName: finalCardholderName,
        expiryDate: expiryDate,
        cvv: cvv,
        userId: userID,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    completeGoogleSignup(userID, userName, userEmail, password, username, role, cardData);
}

/**
 * Complete Google signup (save to Firebase)
 */
async function completeGoogleSignup(userID, userName, userEmail, password, username, role, cardData) {
    const newUser = {
        id: userID,
        email: userEmail,
        username: username,
        name: userName,
        password: password,
        role: role,
        authMethod: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    if (role === 'customer' && cardData) {
        newUser.cardId = cardData.cardId;
    }

    try {
        // Save user
        await db.ref(`users/${userID}`).set(newUser);
        console.log('User saved:', {userID, username, role});

        // Save card if customer
        if (role === 'customer' && cardData) {
            await db.ref(`cards/${userID}`).set(cardData);
            console.log('Card saved for customer:', userID);
            state.currentCard = cardData;
            // Update card display
            if (typeof updateCardDetails === 'function') {
                updateCardDetails();
            }
        }
    } catch (error) {
        console.error('Error saving user:', error);
    }

    state.currentUser = newUser;
    state.currentRole = role;

    // Remove modal
    const modal = document.getElementById('googleCardModal') || document.getElementById('googleRoleModal');
    if (modal) modal.remove();

    delete window.googleAuthData;

    loginSuccess(userName, role);
}

/**
 * Complete Google Login after role selection
 */
async function completeGoogleLogin(role) {
    // Get data from global storage
    const data = window.googleAuthData;
    if (!data) {
        console.error('No auth data found');
        return;
    }

    const { userID, userName, userEmail, password, username, cardData } = data;
    
    // Save user info to Firebase
    const userData = {
        id: userID,
        email: userEmail,
        name: userName,
        role: role,
        authMethod: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    // Add password if it was provided (from Google password creation)
    if (password) {
        userData.password = password;
    }

    // Add username if it was provided (from Google password creation)
    if (username) {
        userData.username = username;
    }

    // Add card ID for customers only (admin & merchant don't need credit card)
    if (role === 'customer' && cardData) {
        userData.cardId = cardData.cardId;
    }

    try {
        // Save user profile
        await db.ref(`users/${userID}`).set(userData);
        console.log('User profile saved to Firebase:', {userID, username, role});

        // Save credit card for customers only
        if (role === 'customer' && cardData) {
            await db.ref(`cards/${userID}`).set(cardData);
            console.log('Credit card saved for customer:', userID);
        }
    } catch (error) {
        console.warn('Could not save user/card to database:', error);
    }

    // Set current user
    state.currentUser = userData;
    state.currentRole = role;

    // Load card for customers
    if (role === 'customer' && cardData) {
        state.currentCard = cardData;
    }

    // Remove role selection modal
    const modal = document.getElementById('roleSelectionModal');
    if (modal) modal.remove();

    // Clear global data
    delete window.googleAuthData;

    // Navigate to appropriate dashboard
    loginSuccess(userName, role);
}

/**
 * Update password requirements display
 */
function updatePasswordRequirements(password) {
    const validation = validatePassword(password);
    
    const lengthReq = document.getElementById('req-length');
    const numberReq = document.getElementById('req-number');
    const specialReq = document.getElementById('req-special');

    if (validation.length) {
        lengthReq.classList.add('met');
    } else {
        lengthReq.classList.remove('met');
    }

    if (validation.number) {
        numberReq.classList.add('met');
    } else {
        numberReq.classList.remove('met');
    }

    if (validation.special) {
        specialReq.classList.add('met');
    } else {
        specialReq.classList.remove('met');
    }
}

/**
 * Update username validation display
 */
function updateUsernameValidation(username) {
    const usernameMsg = document.getElementById('usernameMsg');
    
    if (!username) {
        usernameMsg.textContent = '';
        usernameMsg.classList.remove('error', 'success');
        return;
    }

    const validation = validateUsername(username);
    usernameMsg.textContent = validation.message;
    usernameMsg.classList.remove('error', 'success');
    usernameMsg.classList.add(validation.valid ? 'success' : 'error');
}
