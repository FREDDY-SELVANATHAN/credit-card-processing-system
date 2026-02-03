// ============ AUTHENTICATION FUNCTIONS ============

/**
 * Register new user
 */
async function registerUser(fullName, username, password, role) {
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

        // Generate user ID
        const userId = `${role}_${Date.now()}`;
        
        // Create user object
        const userData = {
            id: userId,
            username: username,
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
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = state.currentRole;
    const errorDiv = document.getElementById('loginError');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (!role) {
        showError('Please select a role', errorDiv);
        return;
    }

    if (!username || !password) {
        showError('Please enter username and password', errorDiv);
        return;
    }

    try {
        // Check demo users first (for demo purposes)
        const demoUser = demoUsers[role];
        if (username === demoUser.username && password === demoUser.password) {
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
            // Query by username
            const usersRef = db.ref('users');
            const snapshot = await usersRef.orderByChild('username').equalTo(username).get();
            
            if (snapshot.exists()) {
                let foundUser = null;
                let userId = null;

                snapshot.forEach(child => {
                    foundUser = child.val();
                    userId = child.key;
                });

                // Check if role matches first
                if (foundUser && foundUser.role !== role) {
                    showError(`This account is registered as a ${foundUser.role}. Please select the correct role to login.`, errorDiv);
                    return;
                }

                // Verify password matches
                if (foundUser && foundUser.password === password) {
                    state.currentUser = { ...foundUser, id: userId };
                    state.currentRole = role;
                    
                    // Update last login in Firebase
                    await db.ref(`users/${userId}`).update({
                        lastLogin: new Date().toISOString()
                    });
                    
                    // Clear form
                    document.getElementById('username').value = '';
                    document.getElementById('password').value = '';
                    
                    console.log('User logged in successfully:', username);
                    
                    // Navigate to appropriate dashboard
                    loginSuccess(foundUser.name, role);
                    return;
                } else {
                    // Username exists but password is wrong
                    showError('❌ Incorrect password. Please try again.', errorDiv);
                    return;
                }
            } else {
                // Username doesn't exist - suggest registration
                const errorMessage = `<div>❌ Username "<strong>${username}</strong>" not found.</div><div style="margin-top: 10px; font-size: 0.9em;">Don't have an account? <strong>Click "Register"</strong> tab to create one.</div>`;
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
 * Handle user registration
 */
async function handleRegistration() {
    const fullName = document.getElementById('registerFullName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
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
        // Create new user object
        const userId = `${role}_${Date.now()}`;
        const newUser = {
            id: userId,
            username: username,
            password: password, // Note: In production, use bcrypt or similar for hashing
            name: fullName,
            role: role,
            authMethod: 'email',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Save to Firebase
        if (db) {
            await db.ref(`users/${userId}`).set(newUser);
            console.log('User registered successfully:', userId);

            // Show success message
            successDiv.textContent = 'Account created successfully! Logging in...';
            successDiv.classList.add('show');

            // Clear form
            document.getElementById('registerFullName').value = '';
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirmPassword').value = '';

            // Update password requirements display
            updatePasswordRequirements('');

            // Auto-login the user
            setTimeout(() => {
                state.currentUser = newUser;
                state.currentRole = role;
                
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
        showScreen('customerDashboard');
    } else if (role === 'merchant') {
        document.getElementById('merchantWelcomeName').textContent = userName;
        document.getElementById('merchantName').textContent = userName;
        showScreen('merchantDashboard');
    } else if (role === 'admin') {
        document.getElementById('adminName').textContent = userName;
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
        const loginContainer = document.getElementById('firebaseUIContainer');
        if (loginContainer) {
            firebaseUI.start('#firebaseUIContainer', uiConfig);
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
 * Prompt user to create password for Google account
 */
function promptForGooglePassword(userID, userName, userEmail, userType = 'new') {
    const modal = document.createElement('div');
    modal.className = 'role-selection-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 500px;">
                <h3>${userType === 'existing' ? 'Sign In to Your Account' : 'Create App Account'}</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    ${userType === 'existing' 
                        ? `Welcome back, <strong>${userName}</strong>!<br><br>Enter your app password to continue.` 
                        : `Create your account details<br><strong>${userEmail}</strong>`}
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
                    <input type="password" id="googlePassword" placeholder="${userType === 'existing' ? 'Enter your app password' : 'Min 8 chars, 1 number, 1 special char'}" required ${userType === 'new' ? '' : 'autofocus'} style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                    <div id="passwordError" style="color: #dc3545; font-size: 0.9em; margin-top: 10px; display: none;"></div>
                </div>
                ${userType === 'new' ? `
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="googleConfirmPassword">Confirm Password</label>
                    <input type="password" id="googleConfirmPassword" placeholder="Re-enter your password" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 1rem;">
                    <div id="confirmError" style="color: #dc3545; font-size: 0.9em; margin-top: 10px; display: none;"></div>
                </div>
                <div class="password-requirements" style="margin-bottom: 20px; font-size: 0.9em;">
                    <div class="req-item" id="req-length-google">✗ At least 8 characters</div>
                    <div class="req-item" id="req-number-google">✗ At least one number (0-9)</div>
                    <div class="req-item" id="req-special-google">✗ At least one special character (!@#$%^&*)</div>
                </div>
                ` : ''}
                <button onclick="completeGoogleAuthWithPassword('${userID}', '${userName}', '${userEmail}', '${userType}')" class="btn btn-primary btn-block" style="padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    ${userType === 'existing' ? 'Sign In' : 'Continue'}
                </button>
                <button onclick="document.querySelector('.role-selection-modal').remove()" class="btn" style="padding: 10px; margin-top: 10px; background: #f8f9fa; color: #666; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 600;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add validation listeners for new users
    if (userType === 'new') {
        document.getElementById('googlePassword').addEventListener('input', (e) => {
            updateGooglePasswordRequirements(e.target.value);
        });
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
 * Complete Google authentication with password
 */
async function completeGoogleAuthWithPassword(userID, userName, userEmail, userType) {
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

        // Save new Google user with password and username
        const newUser = {
            id: userID,
            email: userEmail,
            username: username,
            name: userName,
            password: password,
            authMethod: 'google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        try {
            // First prompt for role
            const modal = document.querySelector('.role-selection-modal');
            if (modal) modal.remove();
            promptForRole(userID, userName, userEmail, password, newUser);
        } catch (error) {
            console.error('Error completing Google signup:', error);
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
                    
                    // Update last login
                    await db.ref(`users/${userID}`).update({
                        lastLogin: new Date().toISOString()
                    });
                    
                    const modal = document.querySelector('.role-selection-modal');
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
 * Prompt user to select role
 */
function promptForRole(userID, userName, userEmail, password = null, userData = null) {
    const username = userData?.username || '';
    
    // Store the data globally so we can access it safely
    window.googleAuthData = {
        userID: userID,
        userName: userName,
        userEmail: userEmail,
        password: password,
        username: username
    };
    
    const roleSelection = document.createElement('div');
    roleSelection.className = 'role-selection-modal';
    roleSelection.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>Select Your Role</h3>
                <p>Choose your role in the Credit Card Processing System</p>
                <div class="role-selection" style="margin-bottom: 20px;">
                    <button class="role-btn" onclick="completeGoogleLogin('customer')">
                        <span class="role-icon">👤</span>
                        <span class="role-name">Customer</span>
                    </button>
                    <button class="role-btn" onclick="completeGoogleLogin('merchant')">
                        <span class="role-icon">🏪</span>
                        <span class="role-name">Merchant</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(roleSelection);
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

    const { userID, userName, userEmail, password, username } = data;
    
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
        console.log('Saved password for Google user');
    }

    // Add username if it was provided (from Google password creation)
    if (username) {
        userData.username = username;
        console.log('Saved username for Google user:', username);
    }

    try {
        await db.ref(`users/${userID}`).set(userData);
        console.log('User profile saved to Firebase:', {userID, username, role});
    } catch (error) {
        console.warn('Could not save user to database:', error);
    }

    // Set current user
    state.currentUser = userData;
    state.currentRole = role;

    // Remove role selection modal
    const modal = document.querySelector('.role-selection-modal');
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
