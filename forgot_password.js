/** user_manager/js/forgot_password.js **/
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for the forgot button
    const forgotButton = document.getElementById('forgot-button');
    const emailInput = document.getElementById('email');
    const originalButtonText = 'Send Reset Link';
    let cooldownTimer = null;
    const cooldownMinutes = 5; // 5-minute cooldown
    
    if (emailInput) {
        // Update button text on input
        emailInput.addEventListener('input', function() {
            validateEmailAndUpdateButton();
        });
        
        // Trigger validation on initial load
        validateEmailAndUpdateButton();
    }
    
    if (forgotButton) {
        forgotButton.addEventListener('click', function() {
            // Don't proceed if button is disabled
            if (forgotButton.disabled) {
                return;
            }
            
            // Only proceed if button text indicates form is valid
            if (forgotButton.textContent === originalButtonText) {
                // Start cooldown
                startCooldown();
                
                // Submit form using the ajax_post.js utility
                submitForm(
                    'forgot-form',
                    'cpu_index.php',
                    '0', // Don't clear form
                    '0', // No CAPTCHA
                    'none' // No redirect
                );
            }
        });
    }
    
    /**
     * Validate email and update button text accordingly
     */
    function validateEmailAndUpdateButton() {
        if (!emailInput || !forgotButton) return;
        
        const email = emailInput.value.trim();
        
        // Reset button if it's not in cooldown
        if (!forgotButton.disabled) {
            if (!email) {
                forgotButton.textContent = 'Enter Email Address';
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                forgotButton.textContent = 'Invalid Email Format';
                return;
            }
            
            // Email is valid
            forgotButton.textContent = originalButtonText;
        }
    }
    
    /**
     * Start cooldown timer on the button
     */
    function startCooldown() {
        if (!forgotButton) return;
        
        const totalSeconds = cooldownMinutes * 60;
        let secondsLeft = totalSeconds;
        
        // Disable button and update text
        forgotButton.disabled = true;
        forgotButton.textContent = `Please wait ${formatTime(secondsLeft)} to retry`;
        
        // Clear any existing timer
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
        }
        
        // Start countdown
        cooldownTimer = setInterval(function() {
            secondsLeft--;
            
            if (secondsLeft <= 0) {
                // Reset button when timer completes
                clearInterval(cooldownTimer);
                forgotButton.disabled = false;
                forgotButton.textContent = 'Resend Reset Link';
                
                // Revalidate email
                validateEmailAndUpdateButton();
            } else {
                // Update countdown text
                forgotButton.textContent = `Please wait ${formatTime(secondsLeft)} to retry`;
            }
        }, 1000);
    }
    
    /**
     * Format seconds to MM:SS
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
});
