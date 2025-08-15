<?php
session_start();
header('Content-Type: application/json');

// Check user logged in
if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'user') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require 'db.php'; // Your DB connection file

$username = $_SESSION['username'];

// Fetch user ID (adjust table/column names accordingly)
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}
$user = $result->fetch_assoc();
$user_id = $user['id'];

// Fetch notifications for this user
// Example notifications table columns: id, user_id, message, date, read (boolean)
$stmt = $conn->prepare("SELECT message, date, `read` FROM notifications WHERE user_id = ? ORDER BY date DESC LIMIT 10");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$notifications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Count unread notifications
$stmtUnread = $conn->prepare("SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND `read` = 0");
$stmtUnread->bind_param("i", $user_id);
$stmtUnread->execute();
$unreadCountResult = $stmtUnread->get_result()->fetch_assoc();
$unread_count = $unreadCountResult['unread_count'] ?? 0;

// Return JSON response
echo json_encode([
    'notifications' => $notifications,
    'unread_count' => (int)$unread_count,
]);
exit;
