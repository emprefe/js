/**
 * common/js/ajax_post.js
 * - Enhanced form submission handler
 * Handles form submissions via AJAX with improved validation, security, and UX
 */

/**
 * Validates if a string is a proper URL
 * @param {string} string - URL to validate
 * @param {boolean} allowRelative - Whether relative URLs are accepted
 * @return {boolean} Whether the URL is valid
 */
function isValidURL(string, allowRelative = true) {
  // Check for null, empty, or invalid values
  if (!string || typeof string !== 'string' || string.trim() === "" || 
      ["none", "null", "undefined"].includes(string.toLowerCase())) {
    return false;
  }
  
  try {
    // For relative URLs, prepend origin
    const url = new URL(string, allowRelative ? window.location.origin : undefined);
    // Additional security: Only allow http/https protocols
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

/**
 * Clear form fields and optionally hide elements with a specific class
 * @param {string} formId - ID of the form to clear
 * @param {string} hideClass - Class name of elements to hide
 */
function clearForm(formId, hideClass) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  // Reset form
  form.reset();
  
  // Hide elements with specified class
  if (hideClass) {
    const elementsToHide = form.getElementsByClassName(hideClass);
    Array.from(elementsToHide).forEach(el => {
      el.style.display = 'none';
    });
  }
}

/**
 * Refresh CAPTCHA element (implementation depends on CAPTCHA system)
 */
function refreshCaptcha() {
  // Find captcha element (implementation depends on your CAPTCHA system)
  const captchaImg = document.querySelector('.captcha-image');
  if (captchaImg) {
    // Add timestamp to prevent caching
    captchaImg.src = captchaImg.src.split('?')[0] + '?t=' + new Date().getTime();
  }
}

/**
 * Display notification to user
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 * @param {number} duration - How long to show the message (ms)
 */
function showNotification(message, type = 'info', duration = 5000) {
  const notificationDiv = document.getElementById('notification');
  if (!notificationDiv) return;
  
  // Add message with appropriate class
  notificationDiv.innerHTML = `<p class="${type}">${message}</p>`;
  notificationDiv.style.display = 'block';
  
  // Hide after duration
  setTimeout(() => {
    notificationDiv.style.display = 'none';
    notificationDiv.innerHTML = '';
  }, duration);
}

/**
 * Handle navigation after form submission
 * @param {string} action - Action to take ('refresh', URL, or none)
 * @param {number} delay - Delay before action in milliseconds
 */
function handleNavigation(action, delay = 3000) {
  if (!action || action === 'none') return;
  
  if (action === 'refresh') {
    console.log(`Refreshing page in ${delay/1000} seconds...`);
    setTimeout(() => location.reload(), delay);
    return;
  }
  
  // Check if action is a valid URL
  if (isValidURL(action)) {
    console.log(`Redirecting to ${action} in ${delay/1000} seconds...`);
    setTimeout(() => {
      window.location.href = action;
    }, delay);
  }
}

/**
 * Submit form via AJAX
 * @param {string} formId - ID of the form to submit
 * @param {string} postUrl - URL to post form data to
 * @param {string} use_clearForm - Whether to clear form after submission ("0" or "1")
 * @param {string} use_refreshCaptcha - Whether to refresh CAPTCHA after submission ("0" or "1")
 * @param {string} refresh_redirect_none - Navigation action after submission ("refresh", URL, or none)
 */
function submitForm(formId, postUrl, use_clearForm, use_refreshCaptcha, refresh_redirect_none) {
  // Validate parameters
  if (!formId || !postUrl) {
    console.error("Missing required parameters");
    return;
  }
  
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with ID '${formId}' not found`);
    return;
  }
  
  // Validate postUrl
  if (!isValidURL(postUrl)) {
    console.error(`Invalid post URL: ${postUrl}`);
    return;
  }
  
  // Get form data
  const formData = new FormData(form);
  
  // Find and update submit button
  const submitButton = form.querySelector("input[type='submit'], button[type='submit']");
  let buttonTimeout;
  
  if (submitButton) {
    // Store original button text/value
    const originalText = submitButton.value || submitButton.textContent;
    const originalColor = submitButton.style.color;
    
    // Update button state
    submitButton.disabled = true;
    if (submitButton.tagName === 'INPUT') {
      submitButton.value = "Submitting...";
    } else {
      submitButton.textContent = "Submitting...";
    }
    submitButton.style.cursor = 'wait';
    
    // Reset button after timeout
    const resetButton = () => {
      submitButton.disabled = false;
      if (submitButton.tagName === 'INPUT') {
        submitButton.value = originalText;
      } else {
        submitButton.textContent = originalText;
      }
      submitButton.style.color = originalColor;
      submitButton.style.cursor = '';
    };
    
    // Set up a timeout to re-enable the button if fetch takes too long
    buttonTimeout = setTimeout(resetButton, 10000);
  }
  
  // Prepare fetch options with CSRF protection if available
  const fetchOptions = {
    method: "POST",
    body: formData,
    credentials: 'same-origin',
    headers: {
      "Accept": "application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8"
    }
  };
  
  // Add CSRF token if present
  const csrfToken = document.querySelector('meta[name="csrf-token"]');
  if (csrfToken) {
    fetchOptions.headers['X-CSRF-Token'] = csrfToken.content;
  }
  
  // Send the request
  fetch(postUrl, fetchOptions)
    .then(response => {
      // Check for HTTP errors
      if (!response.ok) {
        // Try to parse error response
        return response.json().catch(() => {
          // If not JSON, throw generic error with status
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }).then(errorData => {
          // If JSON parsed but still error status, throw with message
          throw new Error(errorData.message || `Server error: ${response.status}`);
        });
      }
      
      // Parse successful response
      return response.json();
    })
    .then(data => {
      // Handle successful submission
      const messageType = data.status === 'success' ? 'success' : 'error';
      showNotification(data.message, messageType);
      
      if (data.status === 'success') {
        // Clear form if needed
        if (use_clearForm === "1") {
          clearForm(formId, 'hideme');
        }
        
        // Refresh CAPTCHA if needed
        if (use_refreshCaptcha === "1") {
          refreshCaptcha();
        }
        
        // Handle navigation
        handleNavigation(refresh_redirect_none);
      }
      
      return data;
    })
    .catch(error => {
      console.error("Error details:", error);
      showNotification(`Error: ${error.message}`, 'error');
    })
    .finally(() => {
      // Reset button if it exists and timeout hasn't fired
      if (submitButton && buttonTimeout) {
        clearTimeout(buttonTimeout);
        submitButton.disabled = false;
        
        if (submitButton.tagName === 'INPUT') {
          submitButton.value = "Submit";
        } else {
          submitButton.textContent = "Submit";
        }
        submitButton.style.cursor = '';
      }
    });
}

// Export functions for use in other modules if using a module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidURL,
    clearForm,
    refreshCaptcha,
    showNotification,
    handleNavigation,
    submitForm
  };
}/**
 * ajax_post.js - Enhanced form submission handler
 * 
 * A comprehensive library for handling form submissions via AJAX with improved
 * validation, security, and user experience features.
 * 
 * @author [Your Name]
 * @version 1.1.0
 * @license MIT
 * 
 * USAGE EXAMPLES:
 * 
 * Basic form submission:
 * submitForm('contact-form', 'process.php', '1', '0', 'none');
 * 
 * Form with CAPTCHA that redirects after success:
 * submitForm('signup-form', 'register.php', '1', '1', 'dashboard.php');
 * 
 * Form that refreshes the page after submission:
 * submitForm('comment-form', 'post-comment.php', '1', '0', 'refresh');
 */

/**
 * Validates if a string is a proper URL
 * 
 * @param {string} string - URL to validate
 * @param {boolean} allowRelative - Whether relative URLs are accepted
 * @return {boolean} Whether the URL is valid
 * 
 * @example
 * // Returns true
 * isValidURL('https://example.com');
 * 
 * @example
 * // Returns true for relative URLs when allowRelative is true
 * isValidURL('/dashboard', true);
 * 
 * @example
 * // Returns false
 * isValidURL('javascript:alert("XSS")');
 */
function isValidURL(string, allowRelative = true) {
  // Check for null, empty, or invalid values
  if (!string || typeof string !== 'string' || string.trim() === "" || 
      ["none", "null", "undefined"].includes(string.toLowerCase())) {
    return false;
  }
  
  try {
    // For relative URLs, prepend origin
    const url = new URL(string, allowRelative ? window.location.origin : undefined);
    // Additional security: Only allow http/https protocols
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

/**
 * Clear form fields and optionally hide elements with a specific class
 * 
 * @param {string} formId - ID of the form to clear
 * @param {string} hideClass - Class name of elements to hide
 * 
 * @example
 * // Clear form with ID 'contact-form' and hide elements with class 'hideme'
 * clearForm('contact-form', 'hideme');
 * 
 * @example
 * // Just clear the form without hiding any elements
 * clearForm('newsletter-signup');
 */
function clearForm(formId, hideClass) {
  const form = document.getElementById(formId);
  if (!form) {
    console.warn(`Form with ID '${formId}' not found`);
    return;
  }
  
  // Reset form
  form.reset();
  
  // Hide elements with specified class
  if (hideClass) {
    const elementsToHide = form.getElementsByClassName(hideClass);
    Array.from(elementsToHide).forEach(el => {
      el.style.display = 'none';
    });
  }
}

/**
 * Refresh CAPTCHA element to get a new challenge
 * 
 * This function looks for an image with class 'captcha-image' and
 * refreshes it by adding a timestamp parameter to prevent caching.
 * Customize this function based on your specific CAPTCHA implementation.
 * 
 * @example
 * // Refresh the CAPTCHA after a failed attempt
 * refreshCaptcha();
 */
function refreshCaptcha() {
  // Find captcha element (implementation depends on your CAPTCHA system)
  const captchaImg = document.querySelector('.captcha-image');
  if (captchaImg) {
    // Add timestamp to prevent caching
    captchaImg.src = captchaImg.src.split('?')[0] + '?t=' + new Date().getTime();
  } else {
    console.warn('CAPTCHA image element not found. Add class "captcha-image" to your CAPTCHA image.');
  }
}

/**
 * Display notification message to user
 * 
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success', 'error', or 'info'
 * @param {number} duration - How long to show the message in milliseconds
 * 
 * @example
 * // Show success message for 3 seconds
 * showNotification('Your message has been sent!', 'success', 3000);
 * 
 * @example
 * // Show error message with default duration (5 seconds)
 * showNotification('Please check your input and try again', 'error');
 */
function showNotification(message, type = 'info', duration = 5000) {
  const notificationDiv = document.getElementById('notification');
  if (!notificationDiv) {
    console.error('Notification div not found. Add <div id="notification"></div> to your HTML.');
    return;
  }
  
  // Add message with appropriate class
  notificationDiv.innerHTML = `<p class="${type}">${message}</p>`;
  notificationDiv.style.display = 'block';
  
  // Hide after duration
  setTimeout(() => {
    notificationDiv.style.display = 'none';
    notificationDiv.innerHTML = '';
  }, duration);
}

/**
 * Handle navigation after form submission
 * 
 * @param {string} action - Action to take:
 *   - 'refresh': Reload the current page
 *   - URL: Redirect to the specified URL
 *   - 'none' or empty: Do nothing
 * @param {number} delay - Delay before action in milliseconds
 * 
 * @example
 * // Refresh the page after 2 seconds
 * handleNavigation('refresh', 2000);
 * 
 * @example
 * // Redirect to dashboard.php after 3 seconds
 * handleNavigation('dashboard.php', 3000);
 */
function handleNavigation(action, delay = 3000) {
  if (!action || action === 'none') return;
  
  if (action === 'refresh') {
    console.log(`Refreshing page in ${delay/1000} seconds...`);
    setTimeout(() => location.reload(), delay);
    return;
  }
  
  // Check if action is a valid URL
  if (isValidURL(action)) {
    console.log(`Redirecting to ${action} in ${delay/1000} seconds...`);
    setTimeout(() => {
      window.location.href = action;
    }, delay);
  } else {
    console.warn(`Invalid navigation URL: ${action}`);
  }
}

/**
 * Submit form via AJAX with comprehensive error handling and user feedback
 * 
 * @param {string} formId - ID of the form to submit
 * @param {string} postUrl - URL to post form data to
 * @param {string} use_clearForm - Whether to clear form after submission ("0" or "1")
 * @param {string} use_refreshCaptcha - Whether to refresh CAPTCHA after submission ("0" or "1")
 * @param {string} refresh_redirect_none - Navigation action after submission:
 *   - "refresh": Reload the current page
 *   - URL: Redirect to this URL
 *   - "none" or empty: No navigation action
 * 
 * @example
 * // Basic contact form that clears after submission
 * submitForm('contact-form', 'process.php', '1', '0', 'none');
 * 
 * @example
 * // Login form with CAPTCHA that redirects to dashboard
 * submitForm('login-form', 'login.php', '0', '1', 'dashboard.php');
 * 
 * @example
 * // Comment form that refreshes the page after submission
 * submitForm('comment-form', 'submit-comment.php', '1', '0', 'refresh');
 */
function submitForm(formId, postUrl, use_clearForm, use_refreshCaptcha, refresh_redirect_none) {
  // Validate parameters
  if (!formId || !postUrl) {
    console.error("Missing required parameters for submitForm");
    showNotification("Form submission failed: Missing required parameters", "error");
    return;
  }
  
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with ID '${formId}' not found`);
    showNotification("Form submission failed: Form not found", "error");
    return;
  }
  
  // Validate postUrl
  if (!isValidURL(postUrl)) {
    console.error(`Invalid post URL: ${postUrl}`);
    showNotification("Form submission failed: Invalid destination URL", "error");
    return;
  }
  
  // Get form data
  const formData = new FormData(form);
  
  // Find and update submit button
  const submitButton = form.querySelector("input[type='submit'], button[type='submit']");
  let buttonTimeout;
  let originalText, originalColor;
  
  if (submitButton) {
    // Store original button text/value
    originalText = submitButton.value || submitButton.textContent;
    originalColor = submitButton.style.color;
    
    // Update button state
    submitButton.disabled = true;
    if (submitButton.tagName === 'INPUT') {
      submitButton.value = "Submitting...";
    } else {
      submitButton.textContent = "Submitting...";
    }
    submitButton.style.cursor = 'wait';
    
    // Set up a timeout to re-enable the button if fetch takes too long
    buttonTimeout = setTimeout(() => {
      submitButton.disabled = false;
      if (submitButton.tagName === 'INPUT') {
        submitButton.value = originalText;
      } else {
        submitButton.textContent = originalText;
      }
      submitButton.style.color = originalColor;
      submitButton.style.cursor = '';
      
      showNotification("Request is taking longer than expected. Please wait or try again.", "info");
    }, 10000);
  }
  
  // Prepare fetch options with CSRF protection if available
  const fetchOptions = {
    method: "POST",
    body: formData,
    credentials: 'same-origin',
    headers: {
      "Accept": "application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8"
    }
  };
  
  // Add CSRF token if present
  const csrfToken = document.querySelector('meta[name="csrf-token"]');
  if (csrfToken) {
    fetchOptions.headers['X-CSRF-Token'] = csrfToken.content;
  }
  
  // Show loading indicator
  showNotification("Processing your request...", "info");
  
  // Send the request
  fetch(postUrl, fetchOptions)
    .then(response => {
      // Check for HTTP errors
      if (!response.ok) {
        // Try to parse error response
        return response.json().catch(() => {
          // If not JSON, throw generic error with status
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }).then(errorData => {
          // If JSON parsed but still error status, throw with message
          throw new Error(errorData.message || `Server error: ${response.status}`);
        });
      }
      
      // Try to parse response as JSON
      return response.json().catch(error => {
        // If parsing fails, check if response is empty
        if (response.status === 204) {
          return { status: 'success', message: 'Operation completed successfully' };
        }
        // Otherwise re-throw
        throw new Error('Invalid response format from server');
      });
    })
    .then(data => {
      // Handle successful submission
      const messageType = data.status === 'success' ? 'success' : 'error';
      showNotification(data.message || 'Operation completed', messageType);
      
      if (data.status === 'success') {
        // Clear form if needed
        if (use_clearForm === "1") {
          clearForm(formId, 'hideme');
        }
        
        // Refresh CAPTCHA if needed
        if (use_refreshCaptcha === "1") {
          refreshCaptcha();
        }
        
        // Handle navigation
        handleNavigation(refresh_redirect_none);
      }
      
      return data;
    })
    .catch(error => {
      console.error("Error details:", error);
      showNotification(`Error: ${error.message}`, 'error');
    })
    .finally(() => {
      // Reset button if it exists and timeout hasn't fired
      if (submitButton && buttonTimeout) {
        clearTimeout(buttonTimeout);
        submitButton.disabled = false;
        
        if (submitButton.tagName === 'INPUT') {
          submitButton.value = originalText || "Submit";
        } else {
          submitButton.textContent = originalText || "Submit";
        }
        submitButton.style.color = originalColor;
        submitButton.style.cursor = '';
      }
    });
}

/**
 * Configure form for AJAX submission
 * 
 * This is a convenience function to set up a form for AJAX submission.
 * It adds an event listener to the form's submit event.
 * 
 * @param {string} formId - ID of the form to configure
 * @param {string} postUrl - URL to post form data to
 * @param {Object} options - Configuration options
 * @param {boolean} options.clearForm - Whether to clear form after submission
 * @param {boolean} options.refreshCaptcha - Whether to refresh CAPTCHA after submission
 * @param {string} options.navigation - Navigation action after submission
 * 
 * @example
 * // Set up a contact form
 * setupAjaxForm('contact-form', 'process.php', {
 *   clearForm: true,
 *   refreshCaptcha: false,
 *   navigation: 'none'
 * });
 */
function setupAjaxForm(formId, postUrl, options = {}) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with ID '${formId}' not found`);
    return;
  }
  
  // Set defaults
  const settings = {
    clearForm: options.clearForm !== undefined ? options.clearForm : true,
    refreshCaptcha: options.refreshCaptcha !== undefined ? options.refreshCaptcha : false,
    navigation: options.navigation || 'none'
  };
  
  // Add submit event listener
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    submitForm(
      formId, 
      postUrl, 
      settings.clearForm ? '1' : '0', 
      settings.refreshCaptcha ? '1' : '0', 
      settings.navigation
    );
  });
  
  console.log(`AJAX form '${formId}' configured successfully`);
}

// Export functions for use in other modules if using a module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidURL,
    clearForm,
    refreshCaptcha,
    showNotification,
    handleNavigation,
    submitForm,
    setupAjaxForm
  };
}

/**
 * CSS Example for Notification Styling
 * 
 * Add these styles to your CSS file to make notifications look good:
 * 
 * #notification {
 *   position: fixed;
 *   top: 20px;
 *   right: 20px;
 *   z-index: 1000;
 *   max-width: 400px;
 *   display: none;
 *   animation: fade-in 0.3s ease-out;
 * }
 * 
 * #notification p {
 *   margin: 0;
 *   padding: 15px;
 *   border-radius: 4px;
 *   box-shadow: 0 2px 5px rgba(0,0,0,0.2);
 * }
 * 
 * #notification p.success {
 *   background-color: #dff0d8;
 *   color: #3c763d;
 *   border: 1px solid #d6e9c6;
 * }
 * 
 * #notification p.error {
 *   background-color: #f2dede;
 *   color: #a94442;
 *   border: 1px solid #ebccd1;
 * }
 * 
 * #notification p.info {
 *   background-color: #d9edf7;
 *   color: #31708f;
 *   border: 1px solid #bce8f1;
 * }
 * 
 * @keyframes fade-in {
 *   from { opacity: 0; transform: translateY(-20px); }
 *   to { opacity: 1; transform: translateY(0); }
 * }
 */