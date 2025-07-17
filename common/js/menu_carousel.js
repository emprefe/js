/**
 * layout_manager/js/menu/menu_carousel.js
 * Optimized Menu Carousel - A circular carousel for menu buttons
 * 
 * Features:
 * - Circular navigation (buttons wrap around)
 * - Touch/swipe support
 * - Responsive design
 * - Navigation buttons auto-hide when all content fits
 * - CSS-based centering when no scrolling needed
 * - Click-to-center functionality
 * 
 * @param {string} menuId - The ID of the container element with your buttons
 * @param {Object} userSettings - Optional custom settings to override defaults
 * @returns {Object} - API for controlling the carousel
 * 
 * Example Usage:
 * ```javascript
 * // Basic usage with default settings
 * const carousel = menu_carousel('my-menu');
 * 
 * // Advanced usage with custom settings
 * const customCarousel = menu_carousel('demo-menu', {
 *   carouselContainer: {
 *     display: "flex",
 *     alignItems: "center",
 *     justifyContent: "space-between",
 *     width: "100%",
 *     height: "50px",
 *     backgroundColor: "#2E7D32",
 *     borderRadius: "8px",
 *     padding: "0 15px",
 *     boxSizing: "border-box",
 *     boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
 *     margin: "20px 0"
 *   },
 *   viewport: {
 *     overflow: "hidden",
 *     flex: "1",
 *     height: "100%",
 *     display: "flex",
 *     alignItems: "center",
 *     justifyContent: "center",
 *     margin: "0 10px"
 *   },
 *   buttonsStrip: {
 *     display: "flex",
 *     position: "relative",
 *     transition: "all 0.4s ease",
 *     height: "40px",
 *     alignItems: "center",
 *     justifyContent: "center",
 *     whiteSpace: "nowrap",
 *     flexWrap: "nowrap",
 *     margin: "0",
 *     border: "none",
 *     gap: "15px"
 *   },
 *   leftButton: {
 *     icon: "←",
 *     tooltip: "Scroll Left",
 *     margin: "0 10px 0 0",
 *     width: "35px",
 *     height: "35px",
 *     backgroundColor: "#1B5E20",
 *     hoverBackgroundColor: "#4CAF50",
 *     fontSize: "20px",
 *     borderRadius: "8px",
 *     boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
 *   },
 *   rightButton: {
 *     icon: "→",
 *     tooltip: "Scroll Right",
 *     margin: "0 0 0 10px",
 *     width: "35px",
 *     height: "35px",
 *     backgroundColor: "#1B5E20",
 *     hoverBackgroundColor: "#4CAF50",
 *     fontSize: "20px",
 *     borderRadius: "8px",
 *     boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
 *   },
 *   animation: {
 *     duration: 400,
 *     swipeThreshold: 0.3
 *   }
 * });
 * 
 * // Example HTML structure:
 * // <div id="demo-menu">
 * //   <button class="menu-button">Home</button>
 * //   <button class="menu-button active">About</button>
 * //   <button class="menu-button">Services</button>
 * //   <button class="menu-button">Portfolio</button>
 * //   <button class="menu-button">Contact</button>
 * //   <button class="menu-button">Blog</button>
 * //   <button class="menu-button">Team</button>
 * //   <button class="menu-button">Careers</button>
 * // </div>
 * 
 * // Using the API:
 * // customCarousel.moveLeft();                     // Programmatically scroll left
 * // customCarousel.moveRight();                    // Programmatically scroll right
 * // customCarousel.centerButtonById('button-id');  // Center specific button by ID
 * // customCarousel.centerButtonByElement(element); // Center specific button element
 * // customCarousel.refreshNavigationVisibility();  // Recalculate if nav buttons needed
 * ```
 */
function menu_carousel(menuId, userSettings = {}) {
  // Default settings with cleaner structure
  const defaultSettings = {
    carouselContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      height: "40px",
      backgroundColor: "#5E35B1",
      borderRadius: "0px",
      padding: "0 10px",
      boxSizing: "border-box",
    },
    viewport: {
      overflow: "hidden",
      flex: "1",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    buttonsStrip: {
      display: "flex",
      position: "relative",
      transition: "transform 0.3s ease",
      height: "40px",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      flexWrap: "nowrap",
      margin: "0",
      border: "none",
      gap: "10px"
    },
    navButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#4527A0",
      color: "white",
      width: "40px",
      height: "40px",
      padding: "0",
      border: "none",
      borderRadius: "50%",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      cursor: "pointer",
      fontSize: "18px",
      zIndex: "5",
      flexShrink: "0",
      hoverBackgroundColor: "#673AB7"
    },
    leftButton: {
      icon: "«",
      tooltip: "Previous",
      margin: "0 5px 0 0"
    },
    rightButton: {
      icon: "»",
      tooltip: "Next",
      margin: "0 0 0 5px"
    },
    animation: {
      duration: 300,
      swipeThreshold: 0.5
    }
  };

  // Merge settings more efficiently
  const settings = {
    ...defaultSettings,
    ...userSettings,
    leftButton: { ...defaultSettings.navButton, ...defaultSettings.leftButton, ...userSettings.leftButton },
    rightButton: { ...defaultSettings.navButton, ...defaultSettings.rightButton, ...userSettings.rightButton }
  };

  const menuContainer = document.getElementById(menuId);
  if (!menuContainer) {
    console.error("Menu container not found:", menuId);
    return null;
  }

  // State management
  let state = {
    currentPosition: 0,
    isAnimating: false,
    touchStartX: 0,
    touchStartY: 0,
    isTouch: false,
    canScroll: false // Track if scrolling is needed
  };

  // Cache DOM references
  const elements = {
    buttonElements: [],
    leftNavButton: null,
    rightNavButton: null,
    viewport: null,
    buttonsStrip: null
  };

  // Initialize carousel structure
  initializeCarousel();

  // Helper functions
  function createElement(tag, className, styles = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    applyStyles(element, styles);
    return element;
  }

  function applyStyles(element, styles) {
    if (!element || !styles) return;
    
    const { hoverBackgroundColor, icon, tooltip, ...regularStyles } = styles;
    
    Object.assign(element.style, regularStyles);
    
    if (hoverBackgroundColor && styles.backgroundColor) {
      element.addEventListener('mouseenter', () => {
        element.style.backgroundColor = hoverBackgroundColor;
      });
      element.addEventListener('mouseleave', () => {
        element.style.backgroundColor = styles.backgroundColor;
      });
    }
  }

  function initializeCarousel() {
    const originalButtons = Array.from(menuContainer.children);
    menuContainer.innerHTML = '';

    // Create carousel structure
    const carouselContainer = createElement('div', 'carousel-container', settings.carouselContainer);
    
    elements.leftNavButton = createElement('button', 'carousel-nav-button left', settings.leftButton);
    elements.leftNavButton.innerHTML = settings.leftButton.icon;
    elements.leftNavButton.title = settings.leftButton.tooltip;
    
    elements.viewport = createElement('div', 'carousel-viewport', settings.viewport);
    elements.buttonsStrip = createElement('div', 'carousel-buttons-strip', settings.buttonsStrip);
    
    elements.rightNavButton = createElement('button', 'carousel-nav-button right', settings.rightButton);
    elements.rightNavButton.innerHTML = settings.rightButton.icon;
    elements.rightNavButton.title = settings.rightButton.tooltip;

    // Add original buttons to strip
    originalButtons.forEach(button => elements.buttonsStrip.appendChild(button));
    elements.buttonElements = Array.from(elements.buttonsStrip.children);

    // Don't set any transform initially - let CSS handle positioning
    state.currentPosition = 0;

    // Assemble carousel
    elements.viewport.appendChild(elements.buttonsStrip);
    carouselContainer.appendChild(elements.leftNavButton);
    carouselContainer.appendChild(elements.viewport);
    carouselContainer.appendChild(elements.rightNavButton);
    menuContainer.appendChild(carouselContainer);

    // Setup event listeners
    setupEventListeners();
    
    // Wait for browser to fully render
    setTimeout(() => {
      // Check if navigation is needed
      state.canScroll = checkNavigationNeeded();
      
      // Only apply transforms if scrolling is needed
      if (state.canScroll) {
        // Set transform to 0 for consistent starting position when scrolling
        elements.buttonsStrip.style.transform = 'translateX(0px)';
        // Don't center anything on initialization - only on click
      } else {
        // Remove any transform to let CSS handle positioning
        elements.buttonsStrip.style.transform = '';
      }
    }, 100);
  }

  function setupEventListeners() {
    // Navigation buttons
    elements.leftNavButton.addEventListener('click', () => moveRight(true));
    elements.rightNavButton.addEventListener('click', () => moveLeft(true));

    // Button click handlers
    elements.buttonElements.forEach(button => {
      const originalClickHandler = button.onclick;
      button.onclick = function(e) {
        // Always center when button is clicked (whether scrolling is possible or not)
        centerButton(button);
        if (originalClickHandler) {
          setTimeout(() => originalClickHandler.call(this, e), 400);
        }
      };
    });

    // Touch events
    elements.viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    elements.viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.viewport.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Resize handler with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        clearMeasurementCache();
        state.canScroll = checkNavigationNeeded();
        
        // Don't auto-center on resize - only apply/remove transforms as needed
        if (state.canScroll) {
          // Keep current position or reset to 0 if transform was removed
          if (!elements.buttonsStrip.style.transform) {
            state.currentPosition = 0;
            elements.buttonsStrip.style.transform = 'translateX(0px)';
          }
        } else {
          // Remove transform to let CSS handle positioning
          elements.buttonsStrip.style.transform = '';
          state.currentPosition = 0;
        }
      }, 150);
    });
  }

  // Optimized measurement functions
  const measurementCache = new Map();
  
  function getButtonEffectiveWidth(button) {
    if (!button) return 0;
    
    // Use cached value if available and element hasn't changed
    const cacheKey = button.id || button.className;
    if (measurementCache.has(cacheKey)) {
      return measurementCache.get(cacheKey);
    }
    
    const style = window.getComputedStyle(button);
    const width = button.offsetWidth + 
                  parseInt(style.marginLeft || 0) + 
                  parseInt(style.marginRight || 0) +
                  parseInt(window.getComputedStyle(elements.buttonsStrip).gap || settings.buttonsStrip.gap || '0px');
    
    measurementCache.set(cacheKey, width);
    return width;
  }

  function getTotalButtonsWidth() {
    return elements.buttonElements.reduce((total, button, index) => {
      return total + getButtonEffectiveWidth(button) - 
             (index === elements.buttonElements.length - 1 ? 
              parseInt(window.getComputedStyle(elements.buttonsStrip).gap || settings.buttonsStrip.gap || '0px') : 0);
    }, 0);
  }

  function checkNavigationNeeded() {
    if (!elements.viewport || elements.buttonElements.length === 0) return false;
    
    // Ensure viewport has dimensions
    if (elements.viewport.offsetWidth === 0) {
      // Viewport not ready yet, try again
      requestAnimationFrame(() => checkNavigationNeeded());
      return false;
    }
    
    const totalWidth = getTotalButtonsWidth();
    const viewportWidth = elements.viewport.offsetWidth;
    const needsScroll = totalWidth > viewportWidth;
    
    elements.leftNavButton.style.display = needsScroll ? settings.navButton.display : 'none';
    elements.rightNavButton.style.display = needsScroll ? settings.navButton.display : 'none';
    
    return needsScroll;
  }

  // Clear cache on window resize or when dimensions might change
  function clearMeasurementCache() {
    measurementCache.clear();
  }

  // Optimized movement functions
  function moveLeft(animate = true) {
    if (elements.buttonElements.length <= 1) return;
    
    const buttonToMove = elements.buttonElements[0];
    const buttonWidth = getButtonEffectiveWidth(buttonToMove);
    if (buttonWidth === 0) return;

    if (!animate) {
      elements.buttonsStrip.style.transition = 'none';
    } else {
      elements.buttonsStrip.style.transition = `transform ${settings.animation.duration}ms ease`;
    }

    state.currentPosition -= buttonWidth;
    elements.buttonsStrip.style.transform = `translateX(${state.currentPosition}px)`;

    setTimeout(() => {
      const firstButton = elements.buttonElements.shift();
      elements.buttonsStrip.appendChild(firstButton);
      elements.buttonElements.push(firstButton);

      state.currentPosition += buttonWidth;
      elements.buttonsStrip.style.transition = 'none';
      elements.buttonsStrip.style.transform = `translateX(${state.currentPosition}px)`;
      
      // Force reflow
      void elements.buttonsStrip.offsetHeight;

      if (animate) {
        elements.buttonsStrip.style.transition = `transform ${settings.animation.duration}ms ease`;
      }
    }, animate ? settings.animation.duration - 10 : 0);
  }

  function moveRight(animate = true) {
    if (elements.buttonElements.length <= 1) return;
    
    const buttonToMove = elements.buttonElements[elements.buttonElements.length - 1];
    const buttonWidth = getButtonEffectiveWidth(buttonToMove);
    if (buttonWidth === 0) return;

    const lastButton = elements.buttonElements.pop();
    elements.buttonsStrip.insertBefore(lastButton, elements.buttonsStrip.firstChild);
    elements.buttonElements.unshift(lastButton);

    state.currentPosition -= buttonWidth;
    elements.buttonsStrip.style.transition = 'none';
    elements.buttonsStrip.style.transform = `translateX(${state.currentPosition}px)`;
    
    // Force reflow
    void elements.buttonsStrip.offsetHeight;

    requestAnimationFrame(() => {
      if (animate) {
        elements.buttonsStrip.style.transition = `transform ${settings.animation.duration}ms ease`;
      }
      state.currentPosition += buttonWidth;
      elements.buttonsStrip.style.transform = `translateX(${state.currentPosition}px)`;
    });
  }

  function centerButton(button) {
    if (!button || !elements.viewport) return;
    
    const index = elements.buttonElements.indexOf(button);
    if (index === -1) return;

    // Calculate the number of visible buttons (approximate)
    const viewportWidth = elements.viewport.offsetWidth;
    const avgButtonWidth = elements.buttonElements.length > 0 ? 
                          getTotalButtonsWidth() / elements.buttonElements.length : 
                          getButtonEffectiveWidth(elements.buttonElements[0] || null);
    const visibleButtons = avgButtonWidth > 0 ? Math.floor(viewportWidth / avgButtonWidth) : 1;
    const targetCenterIndexInView = Math.floor(visibleButtons / 2);

    // Move to center position
    const desiredLogicalIndex = Math.floor(elements.buttonElements.length / 2);
    let currentIndex = elements.buttonElements.indexOf(button);
    let moves = currentIndex - desiredLogicalIndex;

    // Perform moves without animation for speed
    if (moves > 0) {
      for (let i = 0; i < moves; i++) {
        if (elements.buttonElements.indexOf(button) === 0) break;
        moveLeft(false);
      }
    } else if (moves < 0) {
      for (let i = 0; i < Math.abs(moves); i++) {
        if (elements.buttonElements.indexOf(button) === elements.buttonElements.length - 1) break;
        moveRight(false);
      }
    }
    
    // After logical moves, perform fine-tuning based on pixel positions
    setTimeout(() => {
      if (!elements.viewport || !button.isConnected) return;

      const viewportRect = elements.viewport.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      // Check if buttonRect is valid
      if (buttonRect.width === 0 && buttonRect.height === 0) {
        console.warn("Button for centering has no dimensions, might be hidden.");
        return;
      }

      const viewportCenter = viewportRect.left + viewportRect.width / 2;
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const offset = viewportCenter - buttonCenter;

      state.currentPosition += offset;
      elements.buttonsStrip.style.transition = 'transform 0.2s ease';
      elements.buttonsStrip.style.transform = `translateX(${state.currentPosition}px)`;
    }, 50);
  }

  // Touch handling
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      state.isTouch = true;
      state.touchStartX = e.touches[0].clientX;
      state.touchStartY = e.touches[0].clientY;
      elements.buttonsStrip.style.transition = 'none';
    }
  }

  function handleTouchMove(e) {
    if (!state.isTouch || e.touches.length !== 1) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - state.touchStartX;
    const deltaY = touchY - state.touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      elements.buttonsStrip.style.transform = `translateX(${state.currentPosition + deltaX}px)`;
    } else {
      state.isTouch = false;
    }
  }

  function handleTouchEnd(e) {
    if (!state.isTouch) return;
    state.isTouch = false;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - state.touchStartX;
    const avgButtonWidth = elements.buttonElements.length > 0 ? 
                          getButtonEffectiveWidth(elements.buttonElements[0]) : 50;
    const swipeThreshold = avgButtonWidth * settings.animation.swipeThreshold;

    elements.buttonsStrip.style.transition = `transform ${settings.animation.duration}ms ease`;

    if (Math.abs(deltaX) >= swipeThreshold) {
      const buttonsToMove = Math.round(Math.abs(deltaX) / avgButtonWidth);
      const moveFunction = deltaX > 0 ? moveRight : moveLeft;
      
      for (let i = 0; i < buttonsToMove; i++) {
        moveFunction(true);
      }
    } else {
      elements.buttonsStrip.style.transform = `translateX(${state.currentPosition}px)`;
    }
  }

  // Utility functions
  function findAndCenterActiveButton() {
    const activeButton = elements.buttonElements.find(button => button.classList.contains('active'));
    if (activeButton) {
      centerButton(activeButton);
      return true;
    }
    return false;
  }

  function centerClosestButton() {
    if (!elements.viewport || elements.buttonElements.length === 0) return;
    
    // Ensure viewport has dimensions
    if (elements.viewport.offsetWidth === 0) {
      // Viewport not ready yet, try again
      requestAnimationFrame(() => centerClosestButton());
      return;
    }
    
    const viewportRect = elements.viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    
    let closestButton = null;
    let minDistance = Infinity;

    elements.buttonElements.forEach(button => {
      if (!button.isConnected) return;
      
      const buttonRect = button.getBoundingClientRect();
      if (buttonRect.width === 0) return;
      
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const distance = Math.abs(viewportCenter - buttonCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestButton = button;
      }
    });
    
    if (closestButton) {
      centerButton(closestButton);
    } else if (elements.buttonElements.length > 0) {
      // If no specific closest button (all offscreen), just center first button
      centerButton(elements.buttonElements[0]);
    }
  }

  // Public API
  return {
    moveLeft: () => moveLeft(true),
    moveRight: () => moveRight(true),
    centerButtonById: (buttonId) => {
      const button = document.getElementById(buttonId);
      if (button && elements.buttonElements.includes(button)) {
        centerButton(button);
      } else {
        console.warn("Button with ID not found in carousel:", buttonId);
      }
    },
    centerButtonByElement: (buttonElement) => {
      if (buttonElement && elements.buttonElements.includes(buttonElement)) {
        centerButton(buttonElement);
      } else {
        console.warn("Provided button element not found in carousel:", buttonElement);
      }
    },
    refreshNavigationVisibility: () => {
      clearMeasurementCache();
      state.canScroll = checkNavigationNeeded();
    }
  };
}