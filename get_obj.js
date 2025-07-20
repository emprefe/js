/**
 * common/js/get_obj.js
 * - Dynamic content loader
 * @author [Your Name]
 * @version 2.0.0
 * @description A utility for dynamically loading HTML content into DOM elements with
 * support for animations, auto-refresh, throttling, and error handling.
 * @license MIT
 */

/**
 * Dynamically load content into a target element with advanced features
 * 
 * This function fetches content from a specified URL and inserts it into a DOM element,
 * with optional effects like fade-in animation, automatic refresh, and request throttling.
 * 
 * @param {HTMLElement|string} element - Target element or its ID
 * @param {string} sourceUrl - URL to fetch content from
 * @param {Object} options - Configuration options
 * @param {number} [options.fadeInDuration=0] - Duration of fade-in effect in ms (0 to disable)
 * @param {number} [options.refreshTimer=0] - Auto-refresh interval in seconds (0 to disable)
 * @param {number} [options.cooldown=0] - Cooldown between requests in seconds (0 to disable)
 * @param {boolean} [options.showLoader=false] - Show loading indicator during fetch
 * @param {string} [options.loaderHTML] - Custom HTML for the loader (default is a simple spinner)
 * @param {string} [options.errorClass='error'] - CSS class for error messages
 * @param {Function} [options.onSuccess=null] - Callback function after successful content load
 * @param {Function} [options.onError=null] - Callback function after error
 * @param {Object} [options.fetchOptions={}] - Additional fetch API options
 * @param {string} [options.cache='default'] - Cache control ('default', 'no-cache', 'reload', etc.)
 * @param {boolean} [options.preserveScroll=true] - Whether to maintain scroll position after content update
 * @returns {Promise} - Promise that resolves when content is loaded or rejects on error
 * 
 * @example
 * // Basic usage - load content into element with ID 'content'
 * get_obj('content', '/api/data.html');
 * 
 * @example
 * // With fade-in animation and auto-refresh
 * get_obj('dashboard', '/api/dashboard.html', {
 *   fadeInDuration: 500,
 *   refreshTimer: 30
 * });
 * 
 * @example
 * // With all options and callbacks
 * get_obj(document.querySelector('.content-area'), '/api/content.html', {
 *   fadeInDuration: 300,
 *   refreshTimer: 60,
 *   cooldown: 5,
 *   showLoader: true,
 *   loaderHTML: '<div class="custom-spinner">Loading...</div>',
 *   errorClass: 'content-error',
 *   onSuccess: (content, el) => { 
 *     console.log('Content updated!');
 *     initializeWidgets();
 *   },
 *   onError: (err, el) => {
 *     console.error('Failed to load content:', err);
 *     notifyAdministrator(err);
 *   },
 *   fetchOptions: {
 *     headers: { 'X-Requested-With': 'XMLHttpRequest' }
 *   },
 *   cache: 'no-cache'
 * });
 */
function get_obj(element, sourceUrl, options = {}) {
  // Default options
  const config = {
    fadeInDuration: 0,
    refreshTimer: 0,
    cooldown: 0,
    showLoader: false,
    loaderHTML: '<span class="spinner"></span> Loading...',
    errorClass: 'error',
    onSuccess: null,
    onError: null,
    fetchOptions: {},
    cache: 'default',
    preserveScroll: true,
    ...options
  };
  
  // Get the target element
  const targetElement = typeof element === 'string' ? 
    document.getElementById(element) : element;
  
  // Validate input parameters
  if (!targetElement) {
    console.error('Target element not found');
    return Promise.reject(new Error('Target element not found'));
  }
  
  if (!sourceUrl) {
    console.error('Source URL is required');
    return Promise.reject(new Error('Source URL is required'));
  }
  
  // Create a unique data attribute key for this element/URL combination
  const requestKey = `data-last-request-${sourceUrl.replace(/[^a-z0-9]/gi, '')}`;
  
  // Store last request time in the element's data attribute
  if (!targetElement.getAttribute(requestKey)) {
    targetElement.setAttribute(requestKey, '0');
  }
  
  // Check cooldown
  const lastRequest = parseInt(targetElement.getAttribute(requestKey));
  const currentTime = Math.floor(Date.now() / 1000);
  
  if (config.cooldown > 0 && (currentTime - lastRequest) < config.cooldown) {
    const remainingTime = config.cooldown - (currentTime - lastRequest);
    console.log(`Request cooldown active. Try again in ${remainingTime} seconds.`);
    return Promise.reject(new Error(`Cooldown active. ${remainingTime}s remaining`));
  }
  
  // Update last request time
  targetElement.setAttribute(requestKey, currentTime.toString());
  
  // Show loading indicator if enabled
  let loader;
  if (config.showLoader) {
    loader = document.createElement('div');
    loader.className = 'get-obj-loader';
    loader.innerHTML = config.loaderHTML;
    loader.style.cssText = 'padding: 10px; text-align: center; font-style: italic;';
    targetElement.innerHTML = '';
    targetElement.appendChild(loader);
  }
  
  // Store original content if fade effect will be used
  const originalContent = config.fadeInDuration > 0 ? targetElement.innerHTML : null;
  
  // Save current scroll position if necessary
  const scrollPosition = config.preserveScroll ? targetElement.scrollTop : 0;
  
  // Prepare fetch options with cache control
  const fetchParams = {
    credentials: 'same-origin',
    cache: config.cache,
    ...config.fetchOptions
  };
  
  // Perform the GET request
  return fetch(sourceUrl, fetchParams)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(content => {
      // Remove loader if present
      if (loader) {
        targetElement.removeChild(loader);
      }
      
      // Handle fade-in effect
      if (config.fadeInDuration > 0) {
        // Save current transition to restore later
        const originalTransition = targetElement.style.transition;
        
        targetElement.style.opacity = '0';
        targetElement.innerHTML = content;
        
        // Force reflow to ensure the fade-in animation works
        void targetElement.offsetWidth;
        
        targetElement.style.transition = `opacity ${config.fadeInDuration}ms ease-in-out`;
        targetElement.style.opacity = '1';
        
        // Reset transition after animation completes
        setTimeout(() => {
          targetElement.style.transition = originalTransition;
        }, config.fadeInDuration);
      } else {
        targetElement.innerHTML = content;
      }
      
      // Restore scroll position if needed
      if (config.preserveScroll && scrollPosition > 0) {
        targetElement.scrollTop = scrollPosition;
      }
      
      // Call success callback if provided
      if (typeof config.onSuccess === 'function') {
        config.onSuccess(content, targetElement);
      }
      
      // Dispatch a custom event
      targetElement.dispatchEvent(new CustomEvent('contentLoaded', {
        detail: { url: sourceUrl, content }
      }));
      
      // Set up auto-refresh if needed
      if (config.refreshTimer > 0) {
        // Clear any existing timer
        if (targetElement._refreshTimerId) {
          clearTimeout(targetElement._refreshTimerId);
        }
        
        // Set new timer
        targetElement._refreshTimerId = setTimeout(() => {
          get_obj(targetElement, sourceUrl, options);
        }, config.refreshTimer * 1000);
      }
      
      return content;
    })
    .catch(error => {
      console.error('Error fetching content:', error);
      
      // Remove loader if present
      if (loader) {
        targetElement.removeChild(loader);
      }
      
      // Display error message
      const errorMessage = `<div class="${config.errorClass}">Failed to load content: ${error.message}</div>`;
      
      // Apply fade effect to error message if needed
      if (config.fadeInDuration > 0) {
        targetElement.style.opacity = '0';
        targetElement.innerHTML = errorMessage;
        
        void targetElement.offsetWidth;
        
        targetElement.style.transition = `opacity ${config.fadeInDuration}ms`;
        targetElement.style.opacity = '1';
      } else {
        targetElement.innerHTML = errorMessage;
      }
      
      // Call error callback if provided
      if (typeof config.onError === 'function') {
        config.onError(error, targetElement);
      }
      
      // Dispatch a custom event
      targetElement.dispatchEvent(new CustomEvent('contentError', {
        detail: { url: sourceUrl, error }
      }));
      
      throw error;
    });
}

/**
 * Helper function for backward compatibility with the original get_obj signature
 * 
 * @param {HTMLElement|string} element - Target element or its ID
 * @param {string} sourceUrl - URL to fetch content from
 * @param {number} fadeInDuration - Duration of fade-in effect in ms (0 to disable)
 * @param {number} refreshTimer - Auto-refresh interval in seconds (0 to disable)
 * @param {number} GETCooldown - Cooldown between requests in seconds (0 to disable)
 * @returns {Promise} - Promise that resolves when content is loaded
 * 
 * @example
 * // Legacy call style maintained for backward compatibility
 * get_obj_legacy('content', '/api/data.html', 500, 30, 5);
 */
function get_obj_legacy(element, sourceUrl, fadeInDuration = 0, refreshTimer = 0, GETCooldown = 0) {
  return get_obj(element, sourceUrl, {
    fadeInDuration,
    refreshTimer,
    cooldown: GETCooldown
  });
}

/**
 * ---------------------------------
 * USAGE EXAMPLES
 * ---------------------------------
 * The following examples demonstrate common use cases for the get_obj function.
 * These examples are for documentation purposes and are not executed.
 */

/**
 * Example 1: Basic usage
 * Loads content from '/api/news.html' into an element with ID 'news-container'
 * 
 * HTML:
 * <div id="news-container"></div>
 * 
 * JavaScript:
 * get_obj('news-container', '/api/news.html');
 */

/**
 * Example 2: With fade effect
 * Loads content with a smooth 500ms fade-in animation
 * 
 * HTML:
 * <div id="dashboard-panel"></div>
 * 
 * JavaScript:
 * get_obj('dashboard-panel', '/api/dashboard.html', {
 *   fadeInDuration: 500
 * });
 */

/**
 * Example 3: Auto-refreshing content
 * Updates a live data display every 10 seconds
 * 
 * HTML:
 * <div id="live-stats"></div>
 * 
 * JavaScript:
 * get_obj('live-stats', '/api/stats.html', {
 *   refreshTimer: 10,
 *   showLoader: true
 * });
 */

/**
 * Example 4: Rate limiting requests
 * Prevents rapid repeated requests with a 5-second cooldown
 * 
 * HTML:
 * <div id="search-results"></div>
 * <button id="refresh-btn">Refresh Results</button>
 * 
 * JavaScript:
 * document.getElementById('refresh-btn').addEventListener('click', function() {
 *   get_obj('search-results', '/api/search.html?q=test', {
 *     cooldown: 5,
 *     showLoader: true
 *   }).catch(error => {
 *     if (error.message.includes('Cooldown active')) {
 *       alert('Please wait before refreshing again');
 *     }
 *   });
 * });
 */

/**
 * Example 5: Event handling
 * Responding to content load events
 * 
 * HTML:
 * <div id="dynamic-content"></div>
 * 
 * JavaScript:
 * const container = document.getElementById('dynamic-content');
 * 
 * // Listen for content loaded event
 * container.addEventListener('contentLoaded', function(event) {
 *   console.log('Content loaded from:', event.detail.url);
 *   // Initialize any JS components in the new content
 *   initializeComponents();
 * });
 * 
 * // Listen for content error event
 * container.addEventListener('contentError', function(event) {
 *   console.error('Failed to load content:', event.detail.error);
 * });
 * 
 * // Load the content
 * get_obj(container, '/api/content.html');
 */

/**
 * Example 6: Using callbacks
 * Processing content after loading
 * 
 * HTML:
 * <div id="user-profile"></div>
 * 
 * JavaScript:
 * get_obj('user-profile', '/api/profile/123.html', {
 *   fadeInDuration: 300,
 *   showLoader: true,
 *   onSuccess: function(content, element) {
 *     console.log('Profile loaded successfully');
 *     // Update page title with user name from content
 *     const userName = element.querySelector('.user-name').textContent;
 *     document.title = userName + ' - User Profile';
 *   },
 *   onError: function(error, element) {
 *     console.error('Error loading profile:', error);
 *     // Redirect to error page after delay
 *     setTimeout(() => {
 *       window.location.href = '/error.html';
 *     }, 3000);
 *   }
 * });
 */

/**
 * Example 7: Advanced configuration with fetch options
 * Sending headers and configuring cache behavior
 * 
 * HTML:
 * <div id="protected-content"></div>
 * 
 * JavaScript:
 * get_obj('protected-content', '/api/protected-data.html', {
 *   fetchOptions: {
 *     headers: {
 *       'Authorization': 'Bearer ' + userToken,
 *       'X-Requested-With': 'XMLHttpRequest'
 *     },
 *     mode: 'cors'
 *   },
 *   cache: 'no-cache',
 *   showLoader: true,
 *   errorClass: 'auth-error'
 * });
 */

/**
 * Example 8: Using with forms
 * Loading form results without page refresh
 * 
 * HTML:
 * <form id="search-form">
 *   <input type="text" name="query" placeholder="Search...">
 *   <button type="submit">Search</button>
 * </form>
 * <div id="search-results"></div>
 * 
 * JavaScript:
 * document.getElementById('search-form').addEventListener('submit', function(e) {
 *   e.preventDefault();
 *   const query = this.querySelector('[name="query"]').value;
 *   get_obj('search-results', `/api/search.html?q=${encodeURIComponent(query)}`, {
 *     fadeInDuration: 300,
 *     showLoader: true
 *   });
 * });
 */

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { get_obj, get_obj_legacy };
}