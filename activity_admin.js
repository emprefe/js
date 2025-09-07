/**
 * user_manager/admin/js/activity_admin.js
 * Minimal JavaScript needed for the activity log
 */

/**
 * Execute the selected maintenance action
 */
function executeMaintenanceAction() {
    const maintenanceForm = document.getElementById('maintenance-form');
    const action = document.getElementById('maintenance_action').value;
    const date = document.getElementById('maintenance_date').value;
    
    // Validate date for archive and delete actions
    if ((action === 'archive' || action === 'delete') && !date) {
        showNotification('Date is required for this action', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData(maintenanceForm);
    
    // Show "working" notification
    showNotification(`Processing ${action} operation...`, 'info');
    
    // Submit form via fetch
    fetch('cpu_admin.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            // Handle success
            showNotification(data.message, 'success');
            
            // For export action, trigger download
            if (action === 'export' && data.csv && data.filename) {
                downloadCSV(data.csv, data.filename);
            }
            
            // For delete or archive action, reload the page
            if (action === 'delete' || action === 'archive') {
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } else {
            // Handle error
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error performing maintenance action:', error);
        showNotification('An error occurred during the maintenance operation. Please check server logs.', 'error');
    });
}

/**
 * Download CSV file
 * @param {string} csv - CSV content
 * @param {string} filename - Filename for download
 */
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create download link
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        // Other browsers
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}
