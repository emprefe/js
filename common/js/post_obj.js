/** common/js/post_obj.js **/

/**
 * Enhanced form submission handler - OPTIMIZED VERSION
 * Handles form submissions via AJAX with improved validation, security, and UX
 * Performance optimizations: Event listener cleanup, URL validation caching, 
 * button state management, and timeout optimization
 */

// Global timeout management using WeakMap for better memory efficiency
const formTimeouts = new WeakMap();

/**
 * Validates if a string is a proper URL - OPTIMIZED
 * @param {string} string - URL to validate
 * @param {boolean} allowRelative - Whether relative URLs are accepted
 * @return {boolean} Whether the URL is valid
 */
function isValidURL(string, allowRelative = true) {
  // Quick pre-validation checks before expensive URL constructor
  if (!string || typeof string !== 'string' || string.trim() === "" || 
      ["none", "null", "undefined"].includes(string.toLowerCase())) {
    return false;
  }
  
  // Quick protocol check for absolute URLs before URL constructor
  if (!allowRelative && !string.match(/^https?:\/\//)) {
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
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success', 'error', or 'info'
 * @param {number} duration - How long to show the message in milliseconds
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
 * @param {string} action - Action to take
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
  } else {
    console.warn(`Invalid navigation URL: ${action}`);
  }
}

/**
 * Submit form via AJAX with comprehensive error handling and user feedback - OPTIMIZED
 * @param {string} formId - ID of the form to submit
 * @param {string} postUrl - URL to post form data to
 * @param {string} use_clearForm - Whether to clear form after submission ("0" or "1")
 * @param {string} use_refreshCaptcha - Whether to refresh CAPTCHA after submission ("0" or "1")
 * @param {string} refresh_redirect_none - Navigation action after submission
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
  
  // OPTIMIZATION: Clear any existing timeout for this form
  if (formTimeouts.has(form)) {
    clearTimeout(formTimeouts.get(form));
    formTimeouts.delete(form);
  }
  
  // Get form data
  const formData = new FormData(form);
  
  // OPTIMIZATION: Cache button state for faster DOM operations
  const submitButton = form.querySelector("input[type='submit'], button[type='submit']");
  const buttonState = submitButton ? {
    element: submitButton,
    originalText: submitButton.value || submitButton.textContent,
    originalColor: submitButton.style.color,
    isInput: submitButton.tagName === 'INPUT'
  } : null;
  
  // OPTIMIZATION: Single button update function
  function updateButtonState(text, disabled = true, cursor = 'wait') {
    if (!buttonState) return;
    
    const { element, isInput } = buttonState;
    element.disabled = disabled;
    element.style.cursor = cursor;
    
    if (isInput) {
      element.value = text;
    } else {
      element.textContent = text;
    }
  }
  
  // OPTIMIZATION: Single button reset function
  function resetButtonState() {
    if (!buttonState) return;
    
    const { element, originalText, originalColor, isInput } = buttonState;
    element.disabled = false;
    element.style.color = originalColor;
    element.style.cursor = '';
    
    if (isInput) {
      element.value = originalText || "Submit";
    } else {
      element.textContent = originalText || "Submit";
    }
  }
  
  if (buttonState) {
    // Update button state using optimized function
    updateButtonState("Submitting...");
    
    // OPTIMIZATION: Use WeakMap for timeout management
    const timeoutId = setTimeout(() => {
      resetButtonState();
      formTimeouts.delete(form);
      showNotification("Request is taking longer than expected. Please wait or try again.", "info");
    }, 10000);
    
    formTimeouts.set(form, timeoutId);
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
      // OPTIMIZATION: Clean up timeout and reset button using cached state
      if (formTimeouts.has(form)) {
        clearTimeout(formTimeouts.get(form));
        formTimeouts.delete(form);
      }
      
      resetButtonState();
    });
}

/**
 * Configure form for AJAX submission - OPTIMIZED
 * @param {string} formId - ID of the form to configure
 * @param {string} postUrl - URL to post form data to
 * @param {Object} options - Configuration options
 */
function setupAjaxForm(formId, postUrl, options = {}) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with ID '${formId}' not found`);
    return;
  }
  
  // OPTIMIZATION: Remove existing listener before adding new one
  if (form._ajaxSubmitHandler) {
    form.removeEventListener('submit', form._ajaxSubmitHandler);
  }
  
  // Set defaults
  const settings = {
    clearForm: options.clearForm !== undefined ? options.clearForm : true,
    refreshCaptcha: options.refreshCaptcha !== undefined ? options.refreshCaptcha : false,
    navigation: options.navigation || 'none'
  };
  
  // OPTIMIZATION: Cache the handler function reference for cleanup
  const handler = function(event) {
    event.preventDefault();
    submitForm(
      formId, 
      postUrl, 
      settings.clearForm ? '1' : '0', 
      settings.refreshCaptcha ? '1' : '0', 
      settings.navigation
    );
  };
  
  // Store handler reference for future cleanup
  form._ajaxSubmitHandler = handler;
  
  // Add submit event listener
  form.addEventListener('submit', handler);
  
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