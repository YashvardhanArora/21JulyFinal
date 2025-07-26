<?php
session_start();
require 'db.php';

if (!isset($_SESSION['username'])) {
    die('Unauthorized');
}

$username = $_SESSION['username'];
$targetDir = "profile/";
$targetFile = $targetDir . basename($_FILES["pfp"]["name"]);

if (move_uploaded_file($_FILES["pfp"]["tmp_name"], $targetFile)) {
    // Save path to DB
    $stmt = $conn->prepare("UPDATE users SET profile_picture = ? WHERE username = ?");
    $stmt->bind_param("ss", $targetFile, $username);
    $stmt->execute();

    echo "Profile picture updated successfully.";
} else {
    echo "Failed to upload profile picture.";
}
?>
