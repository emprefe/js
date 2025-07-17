<?php
// common/mysql/db_config.php
// Enhanced database configuration with improved security AND EMOJI SUPPORT

// Ensure secure access
if (!defined('SECURE_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit('Direct access not allowed.');
}
if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
    unset($conn);
}

/**
 * Database Configuration Class
 * Encapsulates database connection handling and utility functions
 */
class DatabaseConfig {
    // Connection instance
    private static $instance = null;
    
    // Flag to track if connection is closed
    private static $connectionClosed = false;
    
    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {}
    
    /**
     * Get singleton database connection
     * 
     * @return mysqli Database connection
     * @throws Exception If connection fails
     */
    public static function getConnection() {
        // Return existing connection if available
        if (self::$instance !== null && !self::$connectionClosed) {
            return self::$instance;
        }
        
        try {
            // Create new connection using settings from DatabaseSettings
            $conn = new mysqli(
                DatabaseSettings::getHost(), 
                DatabaseSettings::getUsername(), 
                DatabaseSettings::getPassword(), 
                DatabaseSettings::getDbName()
            );
            
            // Check for connection errors
            if ($conn->connect_error) {
                // Log the error securely (don't expose details)
                error_log("Database connection failed: " . $conn->connect_error);
                throw new Exception("Database connection error.");
            }
            
            // EMOJI SUPPORT: Set charset to utf8mb4 FIRST
            if (!$conn->set_charset('utf8mb4')) {
                error_log("Error setting charset to utf8mb4: " . $conn->error);
                // Fallback to regular utf8 if utf8mb4 fails
                if (!$conn->set_charset(DatabaseSettings::getCharset())) {
                    error_log("Error setting fallback charset: " . $conn->error);
                }
            }
            
            // Configure connection for security
            self::configureSecureConnection($conn);
            
            // Save instance
            self::$instance = $conn;
            self::$connectionClosed = false;
            
            return $conn;
        } catch (Exception $e) {
            // Log error securely
            error_log("Database error: " . $e->getMessage());
            
            // Throw generic error (don't expose details to users)
            throw new Exception("Database error. Please try again later or contact support.");
        }
    }
    
    /**
     * Configure secure connection settings
     * 
     * @param mysqli $conn Database connection
     */
    private static function configureSecureConnection($conn) {
        // EMOJI SUPPORT: Ensure utf8mb4 is used for everything
        try {
            $conn->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (Exception $e) {
            error_log("Unable to set utf8mb4 names: " . $e->getMessage());
        }
        
        // Enable strict mode for better security
        try {
            $conn->query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        } catch (Exception $e) {
            error_log("Unable to set SQL mode: " . $e->getMessage());
        }
        
        // Set timeouts
        $conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 10);
        $conn->options(MYSQLI_OPT_READ_TIMEOUT, 30);
    }
    
    /**
     * Close the database connection
     */
    public static function closeConnection() {
        if (self::$instance !== null && !self::$connectionClosed) {
            try {
                // Only attempt to ping/close if the connection is still open
                if (self::$instance->ping()) {
                    self::$instance->close();
                    self::$connectionClosed = true;
                }
            } catch (Exception $e) {
                // Just log the error and mark as closed anyway
                error_log("Error checking or closing database connection: " . $e->getMessage());
                self::$connectionClosed = true;
            }
        }
    }
    
    /**
     * Prevent cloning of the instance
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization of the instance
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Connect to database (legacy function for backward compatibility)
 * 
 * @return mysqli Database connection
 */
function connectDB() {
    return DatabaseConfig::getConnection();
}

// Get database connection
try {
    $conn = connectDB();
} catch (Exception $e) {
    // Handle connection error (die with generic message)
    die("Database connection error. Please try again later or contact support.");
}

/**
 * Sanitize data for safe database usage
 * 
 * @param string|array $data Data to sanitize
 * @return string|array Sanitized data
 */
function sanitize($data) {
    global $conn;
    
    if (is_array($data)) {
        // Recursively sanitize arrays
        return array_map('sanitize', $data);
    }
    
    if (is_string($data)) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        if ($conn && method_exists($conn, 'real_escape_string')) {
            $data = $conn->real_escape_string($data);
        }
    }
    
    return $data;
}

/**
 * Function to initialize database with default admin user
 * (Used during first-time setup)
 */
function initializeDatabase() {
    global $conn;
    
    // Only run if there are no users in the database
    $checkQuery = "SELECT COUNT(*) as count FROM users";
    $checkResult = $conn->query($checkQuery);
    
    if ($checkResult && $checkResult->fetch_assoc()['count'] === 0) {
        // Create default admin user
        $username = 'admin';
        $email = 'admin@example.com';
        $password = password_hash('Admin123!', PASSWORD_DEFAULT);
        $firstName = 'System';
        $lastName = 'Administrator';
        $status = 'active';
        $isAdmin = 1;
        
        $insertQuery = "INSERT INTO users (username, email, password, first_name, last_name, status, is_admin, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bind_param('ssssssi', $username, $email, $password, $firstName, $lastName, $status, $isAdmin);
        
        if ($insertStmt->execute()) {
            error_log("Default admin user created successfully.");
        } else {
            error_log("Failed to create default admin user: " . $insertStmt->error);
        }
    }
}

/**
 * Function to check database connectivity
 * 
 * @return bool True if connection is active
 */
function isDatabaseConnected() {
    global $conn;
    try {
        return ($conn && $conn->ping());
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Function to run a structured query with error handling
 * 
 * @param string $query SQL query
 * @param string $types Parameter types (i=int, s=string, d=double, b=blob)
 * @param array $params Query parameters
 * @return array|bool Query result or false on error
 */
function safeQuery($query, $types = '', $params = []) {
    global $conn;
    
    try {
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Query preparation failed: " . $conn->error);
        }
        
        // Bind parameters if provided
        if (!empty($types) && !empty($params)) {
            // Convert indexed arrays to references (required for bind_param)
            $bindParams = [];
            $bindParams[] = $types;
            
            foreach ($params as $key => $value) {
                $bindParams[] = &$params[$key];
            }
            
            call_user_func_array([$stmt, 'bind_param'], $bindParams);
        }
        
        // Execute the query
        if (!$stmt->execute()) {
            throw new Exception("Query execution failed: " . $stmt->error);
        }
        
        // Get result if applicable
        $result = $stmt->get_result();
        
        // Handle different result types
        if ($result) {
            // SELECT or similar
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            $stmt->close();
            return $data;
        } else {
            // INSERT, UPDATE, or DELETE
            $affectedRows = $stmt->affected_rows;
            $insertId = $stmt->insert_id;
            $stmt->close();
            
            return [
                'affected_rows' => $affectedRows,
                'insert_id' => $insertId
            ];
        }
    } catch (Exception $e) {
        // Log the error
        error_log("Database error: " . $e->getMessage());
        
        return false;
    }
}
?>