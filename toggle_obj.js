/** common/js/toggle_obj.js **/

/**
 * Toggle visibility of DOM elements with optional animations
 * @param {string} whichLayers - Element IDs separated by |
 * @param {string} display1 - First display states separated by | (e.g., "block|flex|block")
 * @param {string} display2 - Second display states separated by | (typically "none|none|none")
 * @param {string|Object} options - Animation configuration options separated by | or global options object
 * @returns {Promise} - Resolves when animations complete
 *
 * NEW: Per-element configuration support
 * Examples:
 * toggle_obj("menu|sidebar", "block|flex", "none|none", "fade:300|slide:left:500")
 * toggle_obj("popup|alert", "block|block", "none|none", "{useFade:true,duration:300}|bounce:400")
 * toggle_obj("nav", "flex", "none", {useFade: true, duration: 500}) // backward compatible
 */
function toggle_obj(whichLayers, display1, display2, options = {}) {
  // Parse options string into individual option objects
  function parseOptionsString(optionsStr, elementCount) {
    if (typeof optionsStr === 'object' && !Array.isArray(optionsStr)) {
      // Backward compatibility: single options object for all elements
      return Array(elementCount).fill(optionsStr);
    }
    
    if (typeof optionsStr !== 'string') {
      return Array(elementCount).fill({});
    }
    
    const optionParts = optionsStr.split('|').map(part => part.trim());
    const parsedOptions = [];
    
    for (let i = 0; i < elementCount; i++) {
      const optionStr = optionParts[i] || '';
      parsedOptions.push(parseOptionString(optionStr));
    }
    
    return parsedOptions;
  }
  
  // Parse individual option string (JSON or shorthand)
  function parseOptionString(optionStr) {
    if (!optionStr || optionStr === 'none' || optionStr === '') {
      return {};
    }
    
    // Try JSON parsing first
    if (optionStr.startsWith('{')) {
      try {
        // Handle escaped quotes in HTML attributes
        let cleanJson = optionStr
          .replace(/\\"/g, '"')  // Handle escaped quotes from HTML
          .replace(/'/g, '"');   // Replace single quotes with double quotes
        
        // If keys aren't quoted, add quotes
        if (!/"\w+":/g.test(cleanJson)) {
          cleanJson = cleanJson.replace(/(\w+):/g, '"$1":');
        }
        
        // Quote unquoted string values (like slideDirection:left -> slideDirection:"left")
        cleanJson = cleanJson.replace(/:([a-zA-Z][a-zA-Z0-9]*)/g, ':"$1"');
        
        console.log("Parsing JSON:", cleanJson); // Debug log
        const parsed = JSON.parse(cleanJson);
        console.log("Parsed result:", parsed); // Debug log
        return parsed;
      } catch (e) {
        console.warn("toggle_obj: Failed to parse JSON options:", optionStr, "Error:", e.message);
        // Fall through to shorthand parsing
      }
    }
    
    // Parse shorthand syntax
    return parseShorthand(optionStr);
  }
  
  // Parse shorthand like "fade:300", "slide:left:500", etc.
  function parseShorthand(shorthand) {
    const parts = shorthand.split(':').map(p => p.trim());
    const animType = parts[0].toLowerCase();
    const options = {};
    
    switch (animType) {
      case 'fade':
        options.useFade = true;
        if (parts[1]) options.duration = parseInt(parts[1]) || 500;
        if (parts[2]) options.easing = parts[2];
        break;
        
      case 'slide':
        options.useSlide = true;
        if (parts[1]) options.slideDirection = parts[1];
        if (parts[2]) options.duration = parseInt(parts[2]) || 500;
        if (parts[3]) options.easing = parts[3];
        break;
        
      case 'rotate':
        options.useRotate = true;
        if (parts[1]) options.duration = parseInt(parts[1]) || 500;
        if (parts[2]) options.easing = parts[2];
        break;
        
      case 'bounce':
        options.useBounce = true;
        if (parts[1]) options.duration = parseInt(parts[1]) || 500;
        if (parts[2]) options.easing = parts[2];
        break;
        
      default:
        console.warn("toggle_obj: Unknown animation shorthand:", animType);
        break;
    }
    
    return options;
  }
  
  // Parse display states
  function parseDisplayStates(displayStr, elementCount) {
    if (typeof displayStr !== 'string') {
      return Array(elementCount).fill(displayStr || 'block');
    }
    
    const displayParts = displayStr.split('|').map(part => part.trim());
    const displays = [];
    
    for (let i = 0; i < elementCount; i++) {
      displays.push(displayParts[i] || displayParts[0] || 'block');
    }
    
    return displays;
  }
  
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
  
  // Parse display states and options for each element
  const display1States = parseDisplayStates(display1, elementIds.length);
  const display2States = parseDisplayStates(display2, elementIds.length);
  const elementOptions = parseOptionsString(options, elementIds.length);
  
  // Get easing function based on options
  const getEasingFunction = (settings) => {
    if (settings.useBounce) {
      return "cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    }
    return settings.easing || "ease";
  };
  
  // Generate transform string based on settings and direction
  const getTransform = (settings, isHiding, useInitial = false) => {
    const transforms = [];
    const moveDistance = (settings.slideDirection === "right" || settings.slideDirection === "left") ? "100px" : "50px";
    
    // Slide effect
    if (settings.useSlide) {
      const direction = settings.slideDirection || "right";
      const isInitial = useInitial;
      
      switch(direction) {
        case "left":
          transforms.push(`translateX(${isHiding !== isInitial ? moveDistance : `-${moveDistance}`})`);
          break;
        case "right":
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
  
  // Process each element with its individual settings
  const promises = elementIds.map((elementId, index) => {
    return new Promise((resolve) => {
      // Get element
      const elem = document.getElementById(elementId);
      if (!elem) {
        console.warn("Element not found:", elementId);
        resolve();
        return;
      }
      
      // Merge element-specific options with defaults
      const settings = {
        useFade: false,
        useSlide: false,
        useRotate: false,
        useBounce: false,
        slideDirection: "right",
        duration: 500,
        easing: "ease",
        onComplete: null,
        a11yLabel: "",
        ...elementOptions[index]
      };
      
      // Handle accessibility
      if (settings.a11yLabel) {
        elem.setAttribute('aria-label', settings.a11yLabel);
      }
      
      // Get display states for this element
      const elemDisplay1 = display1States[index];
      const elemDisplay2 = display2States[index];
      
      // Check current state
      const currentDisplay = window.getComputedStyle(elem).display;
      const newDisplay = (currentDisplay === elemDisplay2) ? elemDisplay1 : elemDisplay2;
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
      const easingFunction = getEasingFunction(settings);
      
      if (isHiding) {
        // --- HIDING ELEMENT ---
        // Set transition
        elem.style.transition = `all ${settings.duration}ms ${easingFunction}`;
        
        // Apply transform effects
        const transform = getTransform(settings, isHiding);
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
        const initialTransform = getTransform(settings, isHiding, true);
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
    // Execute callback if provided (only execute once, using first element's callback)
    const firstElementSettings = elementOptions[0] || {};
    if (typeof firstElementSettings.onComplete === 'function') {
      firstElementSettings.onComplete();
    }
  });
}
