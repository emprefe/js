/**
 * user_manager/js/download_sessions.js
 * Handles downloading session information
 */

document.addEventListener('DOMContentLoaded', function() {
    var downloadLink = document.getElementById('download-link');
    if (!downloadLink) return;
    
    downloadLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        try {
            // Get data from the hidden data element
            var dataElement = document.getElementById('sessions-data');
            if (!dataElement) return;
            
            var data = JSON.parse(dataElement.getAttribute('data-info'));
            
            // Create text content
            var content = 'SESSION DATA\n';
            content += 'Username: ' + data.username + '\n';
            content += 'Date: ' + data.date + '\n\n';
            
            if (data.sessions && data.sessions.length > 0) {
                content += 'ACTIVE SESSIONS (' + data.sessions.length + '):\n\n';
                
                data.sessions.forEach(function(session, i) {
                    content += 'Session #' + (i+1) + ':\n';
                    content += '- Created: ' + new Date(session.created_at).toLocaleString() + '\n';
                    content += '- Expires: ' + new Date(session.expires).toLocaleString() + '\n';
                    content += '- IP: ' + session.ip_address + '\n\n';
                });
            } else {
                content += 'No active sessions found.\n\n';
            }
            
            content += 'PRIVACY NOTICE: This is your session data.\n';
            
            // Create download
            var blob = new Blob([content], {type: 'text/plain'});
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'sessions_' + data.date + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (err) {
            console.error('Error downloading sessions:', err);
        }
    });
});
