/** common/js/toggle_obj.js **/

/**
 * Toggle visibility of DOM elements with optional animations
 * @param {string} whichLayers - Element IDs separated by |
 * @param {string} display1 - First display state (e.g., "block")
 * @param {string} display2 - Second display state (typically "none")
 * @param {Object} options - Animation configuration options
 * @returns {Promise} - Resolves when animations complete
 *
 * display1 and display2 can be any combination of display options. Most common being block, flex, and none
 * block, none will toggle between block and none
 * none, block will toggle between none and block
 * block, flex will toggle between block and flex
 * flex, none will toggle between flex and none
 * none, none is always none
 * block, block is always block
 * flex, flex is always flex
 *
 */
function toggle_obj(whichLayers, display1, display2, options = {}) {
  // Default options
  const settings = {
    useFade: false,
    useSlide: false,
    useRotate: false,
    useBounce: false,
    slideDirection: "right",
    duration: 500,
    easing: "ease",
    onComplete: null, // Callback function when complete
    a11yLabel: "", // Accessibility label for screen readers
    ...options
  };
  
  // Validate inputs
  if (!whichLayers || typeof whichLayers !== 'string') {
    console.error("toggle_obj: Invalid element selector");
    return Promise.reject(new Error("Invalid element selector"));
  }
  
  // Split multiple elements and filter out empty strings
  const elementIds = whichLayers.split('|').map(id => id.trim()).filter(id => id);
  
  if (elementIds.length === 0) {
    console.error("toggle_obj: No valid element IDs provided");
    return Promise.reject(new Error("No valid element IDs provided"));
  }
  
  // Get easing function based on options
  const getEasingFunction = () => {
    if (settings.useBounce) {
      return "cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    }
    return settings.easing;
  };
  
  // Generate transform string based on settings and direction
  const getTransform = (isHiding, useInitial = false) => {
    const transforms = [];
    const moveDistance = (settings.slideDirection === "right" || settings.slideDirection === "left") ? "100px" : "50px";
    
    // Slide effect
    if (settings.useSlide) {
      const direction = settings.slideDirection;
      const isInitial = useInitial;
      
      switch(direction) {
        case "right":
          transforms.push(`translateX(${isHiding !== isInitial ? moveDistance : `-${moveDistance}`})`);
          break;
        case "left":
          transforms.push(`translateX(${isHiding !== isInitial ? `-${moveDistance}` : moveDistance})`);
          break;
        case "up":
          transforms.push(`translateY(${isHiding !== isInitial ? `-${moveDistance}` : moveDistance})`);
          break;
        case "down":
          transforms.push(`translateY(${isHiding !== isInitial ? moveDistance : `-${moveDistance}`})`);
          break;
      }
    }
    
    // Bounce effect
    if (settings.useBounce && !settings.useSlide) {
      transforms.push(`translateY(${isHiding !== isInitial ? '20px' : '-20px'})`);
    }
    
    // Rotation effect
    if (settings.useRotate) {
      transforms.push(`rotate(${isHiding !== isInitial ? '90deg' : '-90deg'})`);
    }
    
    // Scale effect (part of fade)
    if (settings.useFade && !settings.useSlide && !settings.useBounce) {
      transforms.push(isHiding !== isInitial ? 'scale(0.8)' : 'scale(0.8)');
    }
    
    return transforms.length > 0 ? transforms.join(" ") : "";
  };
  
  // Process each element and collect promises
  const promises = elementIds.map(elementId => {
    return new Promise((resolve) => {
      // Get element
      const elem = document.getElementById(elementId);
      if (!elem) {
        console.warn("Element not found:", elementId);
        resolve();
        return;
      }
      
      // Handle accessibility
      if (settings.a11yLabel) {
        elem.setAttribute('aria-label', settings.a11yLabel);
      }
      
      // Check current state
      const currentDisplay = window.getComputedStyle(elem).display;
      const newDisplay = (currentDisplay === display2) ? display1 : display2;
      const isHiding = newDisplay === "none";
      
      // If no animation is selected, just toggle immediately
      if (!settings.useFade && !settings.useSlide && !settings.useRotate && !settings.useBounce) {
        elem.style.display = newDisplay;
        
        // Update ARIA attributes for accessibility
        elem.setAttribute('aria-hidden', isHiding ? 'true' : 'false');
        
        resolve();
        return;
      }
      
      // Setup animation completion handler
      const animationComplete = () => {
        // Cleanup event listeners
        elem.removeEventListener('transitionend', animationComplete);
        
        if (isHiding) {
          // Reset transform after animation completes
          elem.style.transform = "";
        }
        
        resolve();
      };
      
      // Listen for transition end
      elem.addEventListener('transitionend', animationComplete);
      
      // Set timeout as a fallback in case transitionend doesn't fire
      const timeoutId = setTimeout(() => {
        elem.removeEventListener('transitionend', animationComplete);
        animationComplete();
      }, settings.duration + 50);
      
      // Configure transition
      const easingFunction = getEasingFunction();
      
      if (isHiding) {
        // --- HIDING ELEMENT ---
        // Set transition
        elem.style.transition = `all ${settings.duration}ms ${easingFunction}`;
        
        // Apply transform effects
        const transform = getTransform(isHiding);
        if (transform) {
          elem.style.transform = transform;
        }
        
        // Apply fade
        if (settings.useFade) {
          elem.style.opacity = "0";
        }
        
        // Update ARIA attributes
        elem.setAttribute('aria-hidden', 'true');
        
        // After animation completes, change display property
        setTimeout(() => {
          elem.style.display = newDisplay;
          clearTimeout(timeoutId);
        }, settings.duration);
        
      } else {
        // --- SHOWING ELEMENT ---
        // Update ARIA attributes
        elem.setAttribute('aria-hidden', 'false');
        
        // Set initial state before showing
        if (settings.useFade) {
          elem.style.opacity = "0";
        }
        
        // Apply initial transforms
        const initialTransform = getTransform(isHiding, true);
        if (initialTransform) {
          elem.style.transform = initialTransform;
        }
        
        // Reset transition temporarily
        elem.style.transition = "none";
        
        // Show element
        elem.style.display = newDisplay;
        
        // Force browser to recognize the change before animating
        void elem.offsetWidth;
        
        // Set transition for animation
        elem.style.transition = `all ${settings.duration}ms ${easingFunction}`;
        
        // Animate to final state
        if (settings.useFade) {
          elem.style.opacity = "1";
        }
        elem.style.transform = "";
      }
    });
  });
  
  // Return a promise that resolves when all animations complete
  return Promise.all(promises).then(() => {
    // Execute callback if provided
    if (typeof settings.onComplete === 'function') {
      settings.onComplete();
    }
  });
}