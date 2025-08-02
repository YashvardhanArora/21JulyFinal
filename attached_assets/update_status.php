<?php
session_start();
require 'db.php';
if ($_SESSION['role'] !== 'admin') die("Access denied");
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id = $_POST['id'];
    $status = $_POST['status'];
    $resolved_by = $_SESSION['user_id'];
    $stmt = $conn->prepare("UPDATE complaints SET status = ?, resolved_by = ? WHERE id = ?");
    $stmt->bind_param("sii", $status, $resolved_by, $id);
    $stmt->execute();
    header("Location: admin_dashboard.php");
}