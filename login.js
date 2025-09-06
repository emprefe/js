/** user_manager/js/login.js **/
document.addEventListener('DOMContentLoaded', function() {
    // Simple validation
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    
    // Enable form submission with Enter key
    loginForm.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (document.getElementById('username').value && 
                document.getElementById('password').value) {
                submitLoginForm();
            }
        }
    });
    
    // Button click handler
    loginButton.addEventListener('click', function() {
        submitLoginForm();
    });
    
    // Form submission function
    function submitLoginForm() {
        if (!document.getElementById('username').value || 
            !document.getElementById('password').value) {
            showNotification('Please enter both username and password', 'error');
            return;
        }
        
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
        
        // Use a modified version of ajax_post.js utility to handle form reset on error
        fetch('cpu_index.php', {
            method: 'POST',
            body: new FormData(loginForm),
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification(data.message, 'success');
                
                // Redirect on success
                setTimeout(() => {
                    window.location.href = 'index.php?page=dashboard';
                }, 1000);
            } else {
                // Show error and reset button
                showNotification(data.message, 'error');
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred during login', 'error');
            
            // Always reset button on error
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        });
    }
});
