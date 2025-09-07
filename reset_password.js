/** user_manager/js/reset_password.js **/
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const resetButton = document.getElementById('reset-button');
    
    // Password strength checker
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            validatePasswords();
        });
    }
    
    // Confirm password matcher
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswords);
    }
    
    // Reset button handler
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            if (validateForm()) {
                submitForm(
                    'reset-password-form',
                    'cpu_index.php',
                    '0', // Don't clear form
                    '0', // No CAPTCHA
                    'index.php?page=login' // Redirect to login on success
                );
            }
        });
    }
    
    /**
     * Update password strength meter
     */
    function updatePasswordStrength(password) {
        const strengthBar = document.querySelector('#password-strength .progress-bar');
        if (!strengthBar) return;
        
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
        
        // Set bar color based on strength
        if (percentage < 40) {
            strengthBar.style.backgroundColor = '#d9534f'; // Red
        } else if (percentage < 80) {
            strengthBar.style.backgroundColor = '#f0ad4e'; // Yellow/Orange
        } else {
            strengthBar.style.backgroundColor = '#5cb85c'; // Green
        }
    }
    
    /**
     * Validate that passwords match
     */
    function validatePasswords() {
        if (!passwordInput || !confirmPasswordInput) return;
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity("Passwords don't match");
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    }
    
    /**
     * Validate the entire form
     */
    function validateForm() {
        if (!passwordInput || !confirmPasswordInput) return false;
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Check if password is valid
        if (!password) {
            showNotification('Password is required', 'error');
            return false;
        }
        
        if (password.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return false;
        }
        
        if (!/[A-Z]/.test(password)) {
            showNotification('Password must contain an uppercase letter', 'error');
            return false;
        }
        
        if (!/[a-z]/.test(password)) {
            showNotification('Password must contain a lowercase letter', 'error');
            return false;
        }
        
        if (!/[0-9]/.test(password)) {
            showNotification('Password must contain a number', 'error');
            return false;
        }
        
        if (!/[^A-Za-z0-9]/.test(password)) {
            showNotification('Password must contain a special character', 'error');
            return false;
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return false;
        }
        
        return true;
    }
});
