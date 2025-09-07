/**
 * user_manager/js/roles_manager.js
 * Handles client-side functionality for role management with toggle_obj
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add Role Button
    document.getElementById('add-role-btn').addEventListener('click', function() {
        // Reset form
        document.getElementById('role-form').reset();
        document.getElementById('role-modal-title').textContent = 'Add Role';
        document.getElementById('role-request').value = 'roles_add';
        document.getElementById('role-id').value = '';
        
        // Show modal
        toggle_obj('role-modal|menu-closer', 'block', 'none');
    });
    
    // Edit Role Buttons
    document.querySelectorAll('.edit-role-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const roleId = this.getAttribute('data-role-id');
            const roleName = this.getAttribute('data-role-name');
            const roleDesc = this.getAttribute('data-role-desc');
            
            // Set form values
            document.getElementById('role-modal-title').textContent = 'Edit Role';
            document.getElementById('role-request').value = 'roles_edit';
            document.getElementById('role-id').value = roleId;
            document.getElementById('role-name').value = roleName;
            document.getElementById('role-description').value = roleDesc;
            
            // Show modal
            toggle_obj('role-modal|menu-closer', 'block', 'none');
        });
    });
    
    // Delete Role Buttons
    document.querySelectorAll('.delete-role-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const roleId = this.getAttribute('data-role-id');
            const roleName = this.getAttribute('data-role-name');
            
            // Set confirmation modal content
            document.getElementById('delete-role-id').value = roleId;
            document.getElementById('delete-role-name').textContent = roleName;
            
            // Show confirmation modal
            toggle_obj('delete-modal|menu-closer', 'block', 'none');
        });
    });
    
    // Modal Close Buttons
    document.getElementById('role-modal-close').addEventListener('click', function() {
        toggle_obj('role-modal|menu-closer', 'none', 'block');
    });
    
    document.getElementById('delete-modal-close').addEventListener('click', function() {
        toggle_obj('delete-modal|menu-closer', 'none', 'block');
    });
    
    // Role Form Submit
    document.getElementById('role-submit-btn').addEventListener('click', function() {
        const form = document.getElementById('role-form');
        const roleName = document.getElementById('role-name').value.trim();
        
        if (!roleName) {
            showNotification('Role name is required', 'error');
            return;
        }
        
        // Submit form using ajax_post.js
        submitForm(
            'role-form',
            'cpu_admin.php',
            '0', // Don't clear form
            '0', // No CAPTCHA to refresh
            'refresh' // Refresh page on success
        );
    });
    
    // Delete Form Submit
    document.getElementById('delete-submit-btn').addEventListener('click', function() {
        // Submit form using ajax_post.js
        submitForm(
            'delete-form',
            'cpu_admin.php',
            '0', // Don't clear form
            '0', // No CAPTCHA to refresh
            'refresh' // Refresh page on success
        );
    });
});
