/**
 * common/js/drag_obj.js
 * Makes elements draggable with followers, ensuring the handle never goes off-screen
 * @param {string} handleId - ID of the element that initiates dragging (drag handle/button)
 * @param {string} containerId - ID of the container to be dragged
 * @param {string} followerIds - Pipe-delimited string of follower element IDs
 * 
 * @example
 * // Make drag_button drag the drag_menu, with drag_content as follower
 * drag_obj('drag_button', 'drag_menu', 'drag_content');
 */
function drag_obj(handleId, containerId, followerIds) {
  // Get the handle element
  const handle = document.getElementById(handleId);
  if (!handle) {
    console.error("Handle element not found:", handleId);
    return;
  }
  
  // Skip if already initialized
  if (handle.getAttribute('data-drag-initialized') === 'true') {
    console.log('Drag already initialized for handle:', handleId);
    return;
  }
  
  // Get the container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error("Container element not found:", containerId);
    return;
  }
  
  // Parse follower IDs
  const followers = [];
  if (followerIds) {
    const followerIdArray = followerIds.split('|');
    for (let i = 0; i < followerIdArray.length; i++) {
      const elemId = followerIdArray[i].trim();
      const elem = document.getElementById(elemId);
      
      if (elem) {
        followers.push(elem);
      } else {
        console.error("Follower element not found:", elemId);
      }
    }
  }
  
  // Ensure proper positioning for all elements
  ensureProperPositioning(container, followers);
  
  // Set cursor on handle to indicate draggability
  handle.style.cursor = 'move';
  
  // Add ARIA attributes for accessibility
  enhanceAccessibility(handle);
  
  // Variables for tracking dragging
  let isDragging = false;
  let startMouseX, startMouseY;
  let startContainerX, startContainerY;
  let startFollowerPositions = [];
  
  // The minimum amount of handle that must remain visible on screen
  const MIN_VISIBLE = 5;
  
  // Add event listeners
  handle.addEventListener('mousedown', handleMouseDown);
  handle.addEventListener('touchstart', handleTouchStart, { passive: false });
  handle.addEventListener('keydown', handleKeyNavigation);
  
  // Mark as initialized
  handle.setAttribute('data-drag-initialized', 'true');
  
  console.log('Drag initialized for handle:', handleId, 'controlling container:', containerId);
  
  /**
   * Ensure elements have proper positioning style
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement[]} followers - Array of follower elements
   */
  function ensureProperPositioning(container, followers) {
    if (window.getComputedStyle(container).position === 'static') {
      container.style.position = 'fixed';
    }
    
    followers.forEach(follower => {
      if (window.getComputedStyle(follower).position === 'static') {
        follower.style.position = 'fixed';
      }
    });
  }
  
  /**
   * Add accessibility attributes to the handle
   * @param {HTMLElement} handle - The drag handle element
   */
  function enhanceAccessibility(handle) {
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', 'Drag to move');
    handle.setAttribute('aria-grabbed', 'false');
  }
  
  /**
   * Get the initial positions of all elements
   */
  function captureInitialPositions() {
    // Store starting container position
    const containerStyle = window.getComputedStyle(container);
    startContainerX = parseInt(containerStyle.left) || 0;
    startContainerY = parseInt(containerStyle.top) || 0;
    
    // Store starting follower positions
    startFollowerPositions = [];
    followers.forEach(follower => {
      const style = window.getComputedStyle(follower);
      startFollowerPositions.push({
        element: follower,
        left: parseInt(style.left) || 0,
        top: parseInt(style.top) || 0
      });
    });
  }
  
  /**
   * Apply new positions to all elements during dragging
   * @param {number} newContainerX - New X position for container
   * @param {number} newContainerY - New Y position for container
   */
  function applyPositions(newContainerX, newContainerY) {
    // Apply to container
    container.style.left = newContainerX + 'px';
    container.style.top = newContainerY + 'px';
    
    // Calculate actual movement delta
    const effectiveDeltaX = newContainerX - startContainerX;
    const effectiveDeltaY = newContainerY - startContainerY;
    
    // Apply to followers
    startFollowerPositions.forEach(pos => {
      pos.element.style.left = (pos.left + effectiveDeltaX) + 'px';
      pos.element.style.top = (pos.top + effectiveDeltaY) + 'px';
    });
  }
  
  /**
   * Check if handle would go offscreen and adjust if needed
   * @param {number} proposedContainerX - Proposed X position for container
   * @param {number} proposedContainerY - Proposed Y position for container
   * @returns {Object} - Adjusted position and hit edge status
   */
  function preventHandleOffscreen(proposedContainerX, proposedContainerY) {
    // Get handle position relative to container
    const containerRect = container.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const offsetX = handleRect.left - containerRect.left;
    const offsetY = handleRect.top - containerRect.top;
    
    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate proposed absolute position of handle
    const proposedHandleLeft = proposedContainerX + offsetX;
    const proposedHandleTop = proposedContainerY + offsetY;
    const proposedHandleRight = proposedHandleLeft + handleRect.width;
    const proposedHandleBottom = proposedHandleTop + handleRect.height;
    
    // Adjusted container position
    let adjustedContainerX = proposedContainerX;
    let adjustedContainerY = proposedContainerY;
    let hitEdge = false;
    
    // Check left edge - ensure handle stays visible
    if (proposedHandleLeft < MIN_VISIBLE) {
      adjustedContainerX = MIN_VISIBLE - offsetX;
      hitEdge = true;
    }
    
    // Check right edge - ensure handle stays visible
    if (proposedHandleRight > windowWidth - MIN_VISIBLE) {
      adjustedContainerX = windowWidth - MIN_VISIBLE - handleRect.width - offsetX;
      hitEdge = true;
    }
    
    // Check top edge - ensure handle stays visible
    if (proposedHandleTop < MIN_VISIBLE) {
      adjustedContainerY = MIN_VISIBLE - offsetY;
      hitEdge = true;
    }
    
    // Check bottom edge - ensure handle stays visible
    if (proposedHandleBottom > windowHeight - MIN_VISIBLE) {
      adjustedContainerY = windowHeight - MIN_VISIBLE - handleRect.height - offsetY;
      hitEdge = true;
    }
    
    return {
      x: adjustedContainerX,
      y: adjustedContainerY,
      hitEdge: hitEdge
    };
  }
  
  /**
   * Apply visual effect when hitting screen edge
   */
  function applyEdgeEffect() {
    // Skip if already showing effect
    if (handle.hasAttribute('data-edge-hit')) return;
    
    handle.setAttribute('data-edge-hit', 'true');
    handle.style.transition = 'box-shadow 0.3s ease';
    handle.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.3)';
    
    // Clear effect after delay
    setTimeout(() => {
      handle.removeAttribute('data-edge-hit');
      handle.style.boxShadow = '';
    }, 300);
  }
  
  /**
   * Mouse down event handler
   * @param {MouseEvent} e - Mouse event
   */
  function handleMouseDown(e) {
    // Only process left mouse button
    if (e.button !== 0) {
      return;
    }
    
    isDragging = true;
    handle.setAttribute('aria-grabbed', 'true');
    
    // Store starting mouse position
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    
    // Capture initial positions of all elements
    captureInitialPositions();
    
    // Add document-level event handlers
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent default behavior
    e.preventDefault();
  }
  
  /**
   * Mouse move event handler
   * @param {MouseEvent} e - Mouse event
   */
  function handleMouseMove(e) {
    if (!isDragging) return;
    
    // Calculate movement delta
    const deltaX = e.clientX - startMouseX;
    const deltaY = e.clientY - startMouseY;
    
    // Calculate proposed new container position
    const proposedContainerX = startContainerX + deltaX;
    const proposedContainerY = startContainerY + deltaY;
    
    // Check and adjust for screen edges
    const adjusted = preventHandleOffscreen(proposedContainerX, proposedContainerY);
    
    // Apply adjusted positions
    applyPositions(adjusted.x, adjusted.y);
    
    // Visual feedback if hit edge
    if (adjusted.hitEdge) {
      applyEdgeEffect();
    }
    
    e.preventDefault();
  }
  
  /**
   * Mouse up event handler
   */
  function handleMouseUp() {
    if (!isDragging) return;
    
    isDragging = false;
    handle.setAttribute('aria-grabbed', 'false');
    
    // Remove document-level event handlers
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  /**
   * Touch start event handler
   * @param {TouchEvent} e - Touch event
   */
  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    
    isDragging = true;
    handle.setAttribute('aria-grabbed', 'true');
    
    // Store starting touch position
    const touch = e.touches[0];
    startMouseX = touch.clientX;
    startMouseY = touch.clientY;
    
    // Capture initial positions of all elements
    captureInitialPositions();
    
    // Add document-level event handlers
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Prevent default to avoid scrolling
    e.preventDefault();
  }
  
  /**
   * Touch move event handler
   * @param {TouchEvent} e - Touch event
   */
  function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    
    // Calculate movement delta
    const deltaX = touch.clientX - startMouseX;
    const deltaY = touch.clientY - startMouseY;
    
    // Calculate proposed new container position
    const proposedContainerX = startContainerX + deltaX;
    const proposedContainerY = startContainerY + deltaY;
    
    // Check and adjust for screen edges
    const adjusted = preventHandleOffscreen(proposedContainerX, proposedContainerY);
    
    // Apply adjusted positions
    applyPositions(adjusted.x, adjusted.y);
    
    // Visual feedback if hit edge
    if (adjusted.hitEdge) {
      applyEdgeEffect();
    }
    
    // Prevent default to avoid scrolling
    e.preventDefault();
  }
  
  /**
   * Touch end event handler
   */
  function handleTouchEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    handle.setAttribute('aria-grabbed', 'false');
    
    // Remove document-level event handlers
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }
  
  /**
   * Keyboard navigation handler for accessibility
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyNavigation(e) {
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }
    
    // Calculate move amount (more with shift key)
    const moveAmount = e.shiftKey ? 10 : 1;
    
    // Capture current positions
    captureInitialPositions();
    
    // Calculate new position based on key
    let newX = startContainerX;
    let newY = startContainerY;
    
    switch (e.key) {
      case 'ArrowLeft':
        newX -= moveAmount;
        break;
      case 'ArrowRight':
        newX += moveAmount;
        break;
      case 'ArrowUp':
        newY -= moveAmount;
        break;
      case 'ArrowDown':
        newY += moveAmount;
        break;
    }
    
    // Check and adjust for screen edges
    const adjusted = preventHandleOffscreen(newX, newY);
    
    // Apply positions
    applyPositions(adjusted.x, adjusted.y);
    
    // Visual feedback if hit edge
    if (adjusted.hitEdge) {
      applyEdgeEffect();
    }
    
    // Prevent default to avoid scrolling
    e.preventDefault();
  }
}