/**
 * user_manager/js/user_manager.js
 * Complete revision with proper event listeners, console logging removed
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add User Button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            // Reset form
            const addUserForm = document.getElementById('add-user-form');
            if (addUserForm) {
                addUserForm.reset();
            }
            
            // Clear username status
            const addUsernameStatus = document.getElementById('add-username-status');
            if (addUsernameStatus) {
                addUsernameStatus.innerHTML = '';
            }
            
            // Clear role checkboxes except User role
            const roleCheckboxes = document.querySelectorAll('.add-role-checkbox');
            roleCheckboxes.forEach(function(checkbox) {
                if (!checkbox.disabled) {
                    checkbox.checked = false;
                }
            });
            
            // Show add modal
            toggle_obj('add-user-modal|menu-closer', 'block', 'none');
        });
    }
    
    // User Row Click Handler - Show User Details
    const userRows = document.querySelectorAll('.user-row');
    
    userRows.forEach(function(row) {
        row.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            
            // Get user data from the clicked row
            const username = this.cells[0].textContent;
            const email = this.cells[1].textContent;
            const statusCell = this.cells[2].querySelector('.badge');
            const status = statusCell ? statusCell.textContent.trim() : '';
            
            // Set user details in the modal
            const detailUsername = document.getElementById('detail-username');
            const detailEmail = document.getElementById('detail-email');
            const detailStatus = document.getElementById('detail-status');
            const detailName = document.getElementById('detail-name');
            const detailCreated = document.getElementById('detail-created');
            const detailRoles = document.getElementById('detail-roles');
            const detailNotes = document.getElementById('detail-notes');
            
            // Set values only if elements exist
            if (detailUsername) detailUsername.textContent = username;
            if (detailEmail) detailEmail.textContent = email;
            if (detailStatus) detailStatus.textContent = status;
            
            // Get additional data from hidden fields
            const hiddenData = this.cells[3];
            if (hiddenData) {
                // Extract roles
                const rolesSpan = hiddenData.querySelector('[data-roles]');
                if (rolesSpan && detailRoles) {
                    try {
                        const rolesData = rolesSpan.getAttribute('data-roles');
                        const parsedRoles = JSON.parse(rolesData);
                        const roleNames = parsedRoles.map(role => role.name);
                        detailRoles.textContent = roleNames.join(', ') || 'None';
                    } catch (e) {
                        detailRoles.textContent = 'Not available';
                    }
                }
                
                // Extract name components
                const firstName = hiddenData.querySelector('[data-first-name]')?.getAttribute('data-first-name') || '';
                const middleName = hiddenData.querySelector('[data-middle-name]')?.getAttribute('data-middle-name') || '';
                const lastName = hiddenData.querySelector('[data-last-name]')?.getAttribute('data-last-name') || '';
                
                const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
                if (detailName) detailName.textContent = fullName || 'Not provided';
                
                // Extract created date
                const created = hiddenData.querySelector('[data-created]')?.getAttribute('data-created') || '';
                if (detailCreated) detailCreated.textContent = created || 'Not available';
                
                // Extract notes
                const notes = hiddenData.querySelector('[data-notes]')?.getAttribute('data-notes') || '';
                if (detailNotes) detailNotes.textContent = notes || 'No notes available';
            }
            
            // Set up the buttons with user data
            const editBtn = document.getElementById('detail-edit-btn');
            const deleteBtn = document.getElementById('detail-delete-btn');
            
            if (editBtn) {
                editBtn.setAttribute('data-user-id', userId);
                editBtn.setAttribute('data-username', username);
                editBtn.setAttribute('data-email', email);
            }
            
            if (deleteBtn) {
                deleteBtn.setAttribute('data-user-id', userId);
                deleteBtn.setAttribute('data-username', username);
            }
            
            // Show the details modal
            toggle_obj('user-details-modal|menu-closer', 'block', 'none');
        });
    });
    
    // User Details Edit Button
    const detailEditBtn = document.getElementById('detail-edit-btn');
    if (detailEditBtn) {
        detailEditBtn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const username = this.getAttribute('data-username');
            const email = this.getAttribute('data-email');
            
            // Close the details modal
            toggle_obj('user-details-modal|menu-closer', 'none', 'block');
            
            // Set form fields
            const editUserIdField = document.getElementById('edit-user-id');
            const editUsernameField = document.getElementById('edit-username');
            const editEmailField = document.getElementById('edit-email');
            
            if (editUserIdField) editUserIdField.value = userId;
            if (editUsernameField) editUsernameField.value = username;
            if (editEmailField) editEmailField.value = email;
            
            // Clear password fields
            const editPasswordField = document.getElementById('edit-password');
            const editConfirmPasswordField = document.getElementById('edit-confirm-password');
            
            if (editPasswordField) editPasswordField.value = '';
            if (editConfirmPasswordField) editConfirmPasswordField.value = '';
            
            // Get name fields from hidden data
            const row = document.querySelector(`.user-row[data-user-id="${userId}"]`);
            if (row && row.cells[3]) {
                const hiddenData = row.cells[3];
                
                // Extract and set name components
                const firstName = hiddenData.querySelector('[data-first-name]')?.getAttribute('data-first-name') || '';
                const middleName = hiddenData.querySelector('[data-middle-name]')?.getAttribute('data-middle-name') || '';
                const lastName = hiddenData.querySelector('[data-last-name]')?.getAttribute('data-last-name') || '';
                const notes = hiddenData.querySelector('[data-notes]')?.getAttribute('data-notes') || '';
                
                const firstNameField = document.getElementById('edit-first-name');
                const middleNameField = document.getElementById('edit-middle-name');
                const lastNameField = document.getElementById('edit-last-name');
                const notesField = document.getElementById('edit-notes');
                
                if (firstNameField) firstNameField.value = firstName;
                if (middleNameField) middleNameField.value = middleName;
                if (lastNameField) lastNameField.value = lastName;
                if (notesField) notesField.value = notes;
            }
            
            // Clear any existing username status
            const editUsernameStatus = document.getElementById('edit-username-status');
            if (editUsernameStatus) editUsernameStatus.innerHTML = '';
            
            // Uncheck all role checkboxes first (except User role)
            const roleCheckboxes = document.querySelectorAll('.edit-role-checkbox');
            roleCheckboxes.forEach(function(checkbox) {
                if (!checkbox.disabled) {
                    checkbox.checked = false;
                }
            });
            
            // Fetch user's roles and check the appropriate checkboxes
            fetch('cpu_admin.php?request=users_get_roles&user_id=' + userId)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success' && data.role_ids) {
                        // Check role checkboxes based on user's roles
                        data.role_ids.forEach(function(roleId) {
                            const checkbox = document.getElementById('edit-role-' + roleId);
                            if (checkbox && !checkbox.disabled) {
                                checkbox.checked = true;
                            }
                        });
                    }
                })
                .catch(error => {
                    showNotification('Error loading user roles', 'error');
                });
            
            // Show edit modal
            toggle_obj('edit-user-modal|menu-closer', 'block', 'none');
        });
    }
    
    // User Details Delete Button
    const detailDeleteBtn = document.getElementById('detail-delete-btn');
    if (detailDeleteBtn) {
        detailDeleteBtn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const username = this.getAttribute('data-username');
            
            // Close the details modal and menu-closer
            toggle_obj('user-details-modal|menu-closer', 'none', 'block');
            
            // Set confirmation modal content
            const deleteUserIdField = document.getElementById('delete-user-id');
            const deleteUserNameSpan = document.getElementById('delete-user-name');
            
            if (deleteUserIdField) deleteUserIdField.value = userId;
            if (deleteUserNameSpan) deleteUserNameSpan.textContent = username;
            
            // Show confirmation modal with menu-closer
            toggle_obj('delete-modal|menu-closer', 'block', 'none');
        });
    }
    
    // Modal Close Buttons
    const userDetailsClose = document.getElementById('user-details-close');
    if (userDetailsClose) {
        userDetailsClose.addEventListener('click', function() {
            toggle_obj('user-details-modal|menu-closer', 'none', 'block');
        });
    }
    
    const addUserModalClose = document.getElementById('add-user-modal-close');
    if (addUserModalClose) {
        addUserModalClose.addEventListener('click', function() {
            toggle_obj('add-user-modal|menu-closer', 'none', 'block');
        });
    }
    
    const editUserModalClose = document.getElementById('edit-user-modal-close');
    if (editUserModalClose) {
        editUserModalClose.addEventListener('click', function() {
            toggle_obj('edit-user-modal|menu-closer', 'none', 'block');
        });
    }
    
    const deleteModalClose = document.getElementById('delete-modal-close');
    if (deleteModalClose) {
        deleteModalClose.addEventListener('click', function() {
            toggle_obj('delete-modal|menu-closer', 'none', 'block');
        });
    }
    
    // Username availability check for Add User - with debounce
    let addUsernameTimer;
    const addUsername = document.getElementById('add-username');
    if (addUsername) {
        addUsername.addEventListener('input', function() {
            clearTimeout(addUsernameTimer);
            
            const usernameStatus = document.getElementById('add-username-status');
            if (!usernameStatus) return;
            
            const username = this.value.trim();
            
            // Clear status if empty
            if (username.length === 0) {
                usernameStatus.innerHTML = '';
                return;
            }
            
            // Basic validation first
            if (username.length < 3) {
                usernameStatus.innerHTML = '<span style="color: #FF6F00;">Username must be at least 3 characters</span>';
                return;
            }
            
            // Show checking message
            usernameStatus.innerHTML = '<span style="color: #1976D2;">Checking availability...</span>';
            
            // Debounce the AJAX request
            addUsernameTimer = setTimeout(function() {
                // Use AJAX to check username availability
                fetch('cpu_admin.php?request=check_username&username=' + encodeURIComponent(username))
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            usernameStatus.innerHTML = '<span style="color: #388E3C;">Username is available</span>';
                        } else {
                            usernameStatus.innerHTML = '<span style="color: #D81B60;">Username is already taken</span>';
                        }
                    })
                    .catch(error => {
                        usernameStatus.innerHTML = '<span style="color: #D81B60;">Error checking availability</span>';
                    });
            }, 500);
        });
    }
    
    // Username availability check for Edit User - with debounce
    let editUsernameTimer;
    const editUsername = document.getElementById('edit-username');
    if (editUsername) {
        editUsername.addEventListener('input', function() {
            clearTimeout(editUsernameTimer);
            
            const usernameStatus = document.getElementById('edit-username-status');
            if (!usernameStatus) return;
            
            const username = this.value.trim();
            const userId = document.getElementById('edit-user-id')?.value || '';
            
            // Clear status if empty
            if (username.length === 0) {
                usernameStatus.innerHTML = '';
                return;
            }
            
            // Basic validation first
            if (username.length < 3) {
                usernameStatus.innerHTML = '<span style="color: #FF6F00;">Username must be at least 3 characters</span>';
                return;
            }
            
            // Show checking message
            usernameStatus.innerHTML = '<span style="color: #1976D2;">Checking availability...</span>';
            
            // Debounce the AJAX request
            editUsernameTimer = setTimeout(function() {
                // Use AJAX to check username availability
                fetch('cpu_admin.php?request=check_username&username=' + encodeURIComponent(username) + '&exclude_id=' + userId)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            usernameStatus.innerHTML = '<span style="color: #388E3C;">Username is available</span>';
                        } else {
                            usernameStatus.innerHTML = '<span style="color: #D81B60;">Username is already taken</span>';
                        }
                    })
                    .catch(error => {
                        usernameStatus.innerHTML = '<span style="color: #D81B60;">Error checking availability</span>';
                    });
            }, 500);
        });
    }
    
    // Add User Form Submit
    const addUserSubmitBtn = document.getElementById('add-user-submit-btn');
    if (addUserSubmitBtn) {
        addUserSubmitBtn.addEventListener('click', function() {
            const form = document.getElementById('add-user-form');
            if (!form) return;
            
            const username = document.getElementById('add-username')?.value.trim() || '';
            const email = document.getElementById('add-email')?.value.trim() || '';
            const password = document.getElementById('add-password')?.value || '';
            const confirmPassword = document.getElementById('add-confirm-password')?.value || '';
            
            // Validate form
            if (!username) {
                showNotification('Username is required', 'error');
                return;
            }
            
            if (!email) {
                showNotification('Email is required', 'error');
                return;
            }
            
            if (!password) {
                showNotification('Password is required', 'error');
                return;
            }
            
            if (password.length < 8) {
                showNotification('Password must be at least 8 characters', 'error');
                return;
            }
            
            if (!/[A-Z]/.test(password)) {
                showNotification('Password must contain an uppercase letter', 'error');
                return;
            }
            
            if (!/[a-z]/.test(password)) {
                showNotification('Password must contain a lowercase letter', 'error');
                return;
            }
            
            if (!/[0-9]/.test(password)) {
                showNotification('Password must contain a number', 'error');
                return;
            }
            
            if (!/[^A-Za-z0-9]/.test(password)) {
                showNotification('Password must contain a special character', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // Submit form using ajax_post.js
            submitForm(
                'add-user-form',
                'cpu_admin.php',
                '0', // Don't clear form
                '0', // No CAPTCHA to refresh
                'refresh' // Refresh page on success
            );
        });
    }
    
    // Edit User Form Submit
    const editUserSubmitBtn = document.getElementById('edit-user-submit-btn');
    if (editUserSubmitBtn) {
        editUserSubmitBtn.addEventListener('click', function() {
            const form = document.getElementById('edit-user-form');
            if (!form) return;
            
            const username = document.getElementById('edit-username')?.value.trim() || '';
            const email = document.getElementById('edit-email')?.value.trim() || '';
            const password = document.getElementById('edit-password')?.value || '';
            const confirmPassword = document.getElementById('edit-confirm-password')?.value || '';
            
            // Validate form
            if (!username) {
                showNotification('Username is required', 'error');
                return;
            }
            
            if (!email) {
                showNotification('Email is required', 'error');
                return;
            }
            
            // Password validation only if a new password is provided
            if (password) {
                if (password.length < 8) {
                    showNotification('Password must be at least 8 characters', 'error');
                    return;
                }
                
                if (!/[A-Z]/.test(password)) {
                    showNotification('Password must contain an uppercase letter', 'error');
                    return;
                }
                
                if (!/[a-z]/.test(password)) {
                    showNotification('Password must contain a lowercase letter', 'error');
                    return;
                }
                
                if (!/[0-9]/.test(password)) {
                    showNotification('Password must contain a number', 'error');
                    return;
                }
                
                if (!/[^A-Za-z0-9]/.test(password)) {
                    showNotification('Password must contain a special character', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showNotification('Passwords do not match', 'error');
                    return;
                }
            }
            
            // Submit form using ajax_post.js
            submitForm(
                'edit-user-form',
                'cpu_admin.php',
                '0', // Don't clear form
                '0', // No CAPTCHA to refresh
                'refresh' // Refresh page on success
            );
        });
    }
    
    // Delete Form Submit
    const deleteSubmitBtn = document.getElementById('delete-submit-btn');
    if (deleteSubmitBtn) {
        deleteSubmitBtn.addEventListener('click', function() {
            // Submit form using ajax_post.js
            submitForm(
                'delete-form',
                'cpu_admin.php',
                '0', // Don't clear form
                '0', // No CAPTCHA to refresh
                'refresh' // Refresh page on success
            );
        });
    }
});
