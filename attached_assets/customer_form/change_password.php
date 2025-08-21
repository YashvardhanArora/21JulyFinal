<?php
session_start();
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $user_id = $_SESSION['user_id'];
    $current_password = $_POST['current_password'];
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];

    if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/', $new_password)) {
        $error = "Password must be at least 8 characters with letters and numbers.";
    } elseif ($new_password !== $confirm_password) {
        $error = "New password and confirm password do not match.";
    } else {
        $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->bind_result($hashedPassword);
        $stmt->fetch();
        $stmt->close();

        if (!password_verify($current_password, $hashedPassword)) {
            $error = "Current password is incorrect.";
        } else {
            $newHashedPassword = password_hash($new_password, PASSWORD_DEFAULT);
            $update = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $update->bind_param("si", $newHashedPassword, $user_id);
            if ($update->execute()) {
                $success = "Password changed successfully.";
            } else {
                $error = "Something went wrong. Please try again.";
            }
            $update->close();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Change Password</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #121212;
      --card-dark: #1e1e1e;
      --input-bg: #2a2a2a;
      --text: #e0e0e0;
      --accent: #007BFF;
      --accent-hover: #0056b3;
      --error: #ff4d4d;
      --success: #28a745;
      --border: #444;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 40px 16px;
      font-family: 'Poppins', sans-serif;
      background-color: var(--bg-dark);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .container {
      background-color: var(--card-dark);
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
      width: 100%;
      max-width: 500px;
    }

    h2 {
      text-align: center;
      margin-bottom: 24px;
      color: #ffffff;
    }

    .message {
      text-align: center;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .success { color: var(--success); }
    .error { color: var(--error); }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    input[type="password"] {
      background-color: var(--input-bg);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-size: 15px;
    }

    input[type="password"]::placeholder {
      color: #aaa;
    }

    button {
      padding: 12px;
      background-color: var(--accent);
      color: white;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: var(--accent-hover);
    }

    @media (max-width: 480px) {
      .container {
        padding: 25px 20px;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <h2>Change Password</h2>

  <?php if ($success): ?>
    <div class="message success"><?= htmlspecialchars($success) ?></div>
  <?php elseif ($error): ?>
    <div class="message error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>

  <form method="post">
    <input type="password" name="current_password" placeholder="Current Password" required>
    <input type="password" name="new_password" placeholder="New Password" 
      pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
      title="At least 8 characters with letters and numbers" required>
    <input type="password" name="confirm_password" placeholder="Confirm New Password" required>
    <button type="submit">Update Password</button>
  </form>
</div>

</body>
</html>
