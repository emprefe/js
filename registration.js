/**
 * user_manager/js/registration.js
 * Complete version with username and email validation, password strength meter
 */

function initRegistrationForm() {
    // Get form and input elements
    const form = document.getElementById('registration-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const captchaImage = document.getElementById('captcha-image');
    const refreshCaptchaBtn = document.getElementById('refresh-captcha');
    const termsCheckbox = document.getElementById('terms');
    const registerBtn = document.getElementById('register-button');
    
    // Username availability check with debounce
    let usernameTimer;
    usernameInput.addEventListener('input', function() {
        clearTimeout(usernameTimer);
        
        const usernameStatus = document.getElementById('username-status');
        const username = this.value.trim();
        
        // Clear status if empty
        if (username.length === 0) {
            usernameStatus.innerHTML = '';
            validateAndUpdateButton();
            return;
        }
        
        // Basic validation first
        if (username.length < 5) {
            usernameStatus.innerHTML = '<span style="color: var(--special_accent);">Must be at least 5 characters</span>';
            validateAndUpdateButton();
            return;
        }
        
        // Show checking message
        usernameStatus.innerHTML = '<span style="color: var(--special_secondary);">Checking availability...</span>';
        
        // Debounce the AJAX request
        usernameTimer = setTimeout(function() {
            // Use AJAX to check username availability
            fetch('cpu_index.php?request=check_username&username=' + encodeURIComponent(username))
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        usernameStatus.innerHTML = '<span style="color: var(--special_success);">Available</span>';
                    } else {
                        usernameStatus.innerHTML = '<span style="color: var(--special_accent);">Already taken</span>';
                    }
                    validateAndUpdateButton();
                })
                .catch(error => {
                    console.error('Error checking username:', error);
                    usernameStatus.innerHTML = '<span style="color: var(--special_accent);">Error checking availability</span>';
                    validateAndUpdateButton();
                });
        }, 500);
    });
    
    // Email availability check with debounce
    let emailTimer;
    emailInput.addEventListener('input', function() {
        clearTimeout(emailTimer);
        
        const emailStatus = document.getElementById('email-status');
        const email = this.value.trim();
        
        // Clear status if empty
        if (email.length === 0) {
            emailStatus.innerHTML = '';
            validateAndUpdateButton();
            return;
        }
        
        // Basic validation first
        if (!isValidEmail(email)) {
            emailStatus.innerHTML = '<span style="color: var(--special_accent);">Invalid email format</span>';
            validateAndUpdateButton();
            return;
        }
        
        // Show checking message
        emailStatus.innerHTML = '<span style="color: var(--special_secondary);">Checking availability...</span>';
        
        // Debounce the AJAX request
        emailTimer = setTimeout(function() {
            fetch('cpu_index.php?request=check_email&email=' + encodeURIComponent(email))
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        emailStatus.innerHTML = '<span style="color: var(--special_success);">Available</span>';
                    } else {
                        emailStatus.innerHTML = '<span style="color: var(--special_accent);">Already in use - <a href="index.php?page=login">Login here</a></span>';
                    }
                    validateAndUpdateButton();
                })
                .catch(error => {
                    console.error('Error checking email:', error);
                    emailStatus.innerHTML = '<span style="color: var(--special_accent);">Error checking availability</span>';
                    validateAndUpdateButton();
                });
        }, 500);
    });
    
    // Password strength validation
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        updatePasswordStrength(password);
        validateAndUpdateButton();
    });
    
    // Password match validation
    confirmPasswordInput.addEventListener('input', validateAndUpdateButton);
      
    // Terms checkbox
    termsCheckbox.addEventListener('change', validateAndUpdateButton);
    
    // Refresh CAPTCHA
    refreshCaptchaBtn.addEventListener('click', function() {
        captchaImage.src = 'user_manager/security/captcha.php?' + new Date().getTime();
    });
    
    /**
     * Update password strength visual indicator
     */
    function updatePasswordStrength(password) {
        const strengthBar = document.querySelector('#password-strength .progress_bar');
        
        if (!strengthBar) {
            console.error('Password strength bar not found - check HTML structure');
            return;
        }
        
        // Check requirements
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        
        // Calculate strength score (0-5)
        let strength = 0;
        if (hasLength) strength++;
        if (hasUppercase) strength++;
        if (hasLowercase) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;
        
        // Update strength bar
        const percentage = (strength / 5) * 100;
        strengthBar.style.width = percentage + '%';
        
        // Set bar color and class based on strength using CSS variables
        strengthBar.className = 'progress_bar'; // Reset classes
        
        if (percentage < 40) {
            strengthBar.classList.add('weak');
        } else if (percentage < 80) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }
    }
    
    /**
     * Validate form and update button text/state
     */
    function validateAndUpdateButton() {
        // Get all form values
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const captcha = document.getElementById('captcha').value.trim();
        const termsAccepted = termsCheckbox.checked;
        
        // Get status elements
        const usernameStatus = document.getElementById('username-status');
        const emailStatus = document.getElementById('email-status');
        
        // Build validation message
        let validationMessage = "Complete Registration";
        let isValid = true;
        
        // Check username
        if (!username) {
            validationMessage = "Enter Username";
            isValid = false;
        } else if (username.length < 5) {
            validationMessage = "Username Too Short";
            isValid = false;
        } else if (usernameStatus.innerHTML && usernameStatus.innerHTML.includes('taken')) {
            validationMessage = "Username Taken";
            isValid = false;
        } else if (usernameStatus.innerHTML && usernameStatus.innerHTML.includes('Checking')) {
            validationMessage = "Checking Username...";
            isValid = false;
        }
        
        // Check email if username is valid
        else if (!email) {
            validationMessage = "Enter Email";
            isValid = false;
        } else if (!isValidEmail(email)) {
            validationMessage = "Invalid Email Format";
            isValid = false;
        } else if (emailStatus.innerHTML && emailStatus.innerHTML.includes('Already in use')) {
            validationMessage = "Email Already Used";
            isValid = false;
            // Add login link for existing users
            emailStatus.innerHTML = '<span style="color: var(--special_accent);">Already in use - <a class="link" href="index.php?page=login">Login here</a></span>';
        } else if (emailStatus.innerHTML && emailStatus.innerHTML.includes('Checking')) {
            validationMessage = "Checking Email...";
            isValid = false;
        }
        
        // Check password requirements
        else if (!password) {
            validationMessage = "Enter Password";
            isValid = false;
        } else if (password.length < 8) {
            validationMessage = "Password Too Short";
            isValid = false;
        } else if (!/[A-Z]/.test(password)) {
            validationMessage = "Add Uppercase Letter";
            isValid = false;
        } else if (!/[a-z]/.test(password)) {
            validationMessage = "Add Lowercase Letter";
            isValid = false;
        } else if (!/[0-9]/.test(password)) {
            validationMessage = "Add Number";
            isValid = false;
        } else if (!/[^A-Za-z0-9]/.test(password)) {
            validationMessage = "Add Special Character";
            isValid = false;
        }
        
        // Check password confirmation
        else if (!confirmPassword) {
            validationMessage = "Confirm Password";
            isValid = false;
        } else if (confirmPassword !== password) {
            validationMessage = "Passwords Don't Match";
            isValid = false;
        }
        
        // Check CAPTCHA
        if (isValid && !captcha) {
            validationMessage = "Enter CAPTCHA";
            isValid = false;
        }
        
        // Check terms
        if (isValid && !termsAccepted) {
            validationMessage = "Accept Terms";
            isValid = false;
        }
        
        // Update button
        registerBtn.textContent = validationMessage;
        registerBtn.disabled = !isValid;
    }
    
    /**
     * Better email validation function
     * More permissive but still catches obvious errors
     */
    function isValidEmail(email) {
        // Basic format check
        if (!email || typeof email !== 'string') return false;
        
        // Must have @ and at least one dot after @
        const atIndex = email.indexOf('@');
        if (atIndex <= 0) return false; // @ not found or at beginning
        
        const afterAt = email.substring(atIndex + 1);
        if (!afterAt.includes('.')) return false; // No dot after @
        
        // Can't end with dot
        if (email.endsWith('.')) return false;
        
        // Can't have consecutive dots
        if (email.includes('..')) return false;
        
        // Basic length check
        if (email.length < 5 || email.length > 254) return false;
        
        // More comprehensive regex as fallback
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        return emailRegex.test(email);
    }
}
