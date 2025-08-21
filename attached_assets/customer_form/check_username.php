<?php
require 'db.php';

if (isset($_GET['username'])) {
    $username = trim($_GET['username']);
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    echo $stmt->num_rows > 0 ? "Username is already taken." : "Username is available.";
}
