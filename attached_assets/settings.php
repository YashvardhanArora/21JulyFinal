<?php
session_start();
require 'db.php';

$username = $_SESSION['username'] ?? null;
if (!$username) {
    header("Location: login.php");
    exit;
}

$errors = [];
$success = '';

// Fetch current email and phone
$query = $conn->prepare("SELECT email, phone FROM users WHERE username = ?");
$query->bind_param("s", $username);
$query->execute();
$query->bind_result($email, $phone);
$query->fetch();
$query->close();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $new_email = trim($_POST['email'] ?? '');
    $new_phone = trim($_POST['phone'] ?? '');
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if (!filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format.";
    }

    if ($new_phone !== '' && !preg_match('/^\+?[\d\s-]{7,15}$/', $new_phone)) {
        $errors[] = "Invalid phone number format.";
    }

    $change_password = false;
    if ($current_password !== '' || $new_password !== '' || $confirm_password !== '') {
        $change_password = true;

        if (strlen($new_password) < 6) {
            $errors[] = "New password must be at least 6 characters.";
        }
        if ($new_password !== $confirm_password) {
            $errors[] = "New password and confirmation do not match.";
        }

        // Verify current password
        $stmt = $conn->prepare("SELECT password FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->bind_result($hashed_password);
        $stmt->fetch();
        $stmt->close();

        if (!password_verify($current_password, $hashed_password)) {
            $errors[] = "Current password is incorrect.";
        }
    }

    if (empty($errors)) {
        $stmt = $conn->prepare("UPDATE users SET email = ?, phone = ? WHERE username = ?");
        $stmt->bind_param("sss", $new_email, $new_phone, $username);
        $stmt->execute();
        $stmt->close();

        if ($change_password) {
            $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
            $stmt->bind_param("ss", $new_hash, $username);
            $stmt->execute();
            $stmt->close();
        }

        $success = "Settings updated successfully.";
        $email = $new_email;
        $phone = $new_phone;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Settings - CCMS</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    :root {
      --bg-dark: #121212;
      --bg-light: #f4f4f4;
      --card-dark: #1e1e1e;
      --card-light: #ffffff;
      --text-light: #e0e0e0;
      --text-dark: #1a1a1a;
      --muted-light: #aaaaaa;
      --muted-dark: #555555;
      --red: #e74c3c;
      --green: #27ae60;
      --radius: 12px;
      --font: 'Poppins', sans-serif;
      --transition: 0.3s ease;
    }

    html, body {
      margin: 0; padding: 0;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    body {
      padding: 2rem 1rem;
      font-family: var(--font);
      background-color: var(--bg-dark);
      color: var(--text-light);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      transition: background var(--transition), color var(--transition);
      overflow-y: auto;
    }

    body.light-mode {
      background-color: var(--bg-light);
      color: var(--text-dark);
    }

    .settings-card {
      background-color: var(--card-dark);
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      animation: fadeIn 0.5s ease-in-out;
      transition: background-color var(--transition);
      box-sizing: border-box;
    }

    body.light-mode .settings-card {
      background-color: var(--card-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      font-size: 26px;
      margin-bottom: 1.5rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      font-weight: 600;
      margin-bottom: 0.25rem;
      display: block;
    }

    input[type="email"],
    input[type="tel"],
    input[type="password"] {
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius);
      border: 1px solid var(--muted-light);
      background-color: var(--card-dark);
      color: var(--text-light);
      font-size: 1rem;
      transition: border-color var(--transition), background-color var(--transition), color var(--transition);
      box-sizing: border-box;
    }

    body.light-mode input[type="email"],
    body.light-mode input[type="tel"],
    body.light-mode input[type="password"] {
      background-color: var(--card-light);
      color: var(--text-dark);
      border: 1px solid var(--muted-dark);
    }

    input[type="email"]:focus,
    input[type="tel"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 8px #3498dbaa;
    }

    .button {
      background-color: #3498db;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: var(--radius);
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease;
      font-size: 1rem;
    }

    .button:hover {
      background-color: #2980b9;
      transform: translateY(-2px);
    }

    .messages {
      margin-bottom: 1rem;
    }

    .error {
      color: var(--red);
      font-weight: 600;
    }

    .success {
      color: var(--green);
      font-weight: 600;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="settings-card" id="settingsCard">
    <h2><i class="fas fa-cogs"></i> Settings</h2>

    <div class="messages">
      <?php if ($errors): ?>
        <div class="error"><?= implode('<br>', array_map('htmlspecialchars', $errors)) ?></div>
      <?php elseif ($success): ?>
        <div class="success"><?= htmlspecialchars($success) ?></div>
      <?php endif; ?>
    </div>

    <form method="post" novalidate>
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required value="<?= htmlspecialchars($email) ?>" />

      <label for="phone">Phone (optional)</label>
      <input type="tel" id="phone" name="phone" value="<?= htmlspecialchars($phone) ?>" />

      <hr style="margin: 1.5rem 0; border-color: #555;" />

      <label for="current_password">Current Password</label>
      <input type="password" id="current_password" name="current_password" placeholder="Enter current password to change" />

      <label for="new_password">New Password</label>
      <input type="password" id="new_password" name="new_password" placeholder="New password (min 6 chars)" />

      <label for="confirm_password">Confirm New Password</label>
      <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirm new password" />

      <button type="submit" class="button">Save Changes</button>
    </form>
  </div>

  <script>
    function debounce(func, wait = 100) {
      let timeout;
      return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
      };
    }

    function syncThemeFromParent() {
      try {
        const isLight = window.parent.document.body.classList.contains('light-mode');
        document.body.classList.toggle('light-mode', isLight);
      } catch (e) {}
    }

    const debouncedSyncTheme = debounce(syncThemeFromParent);
    syncThemeFromParent();

    try {
      const target = window.parent.document.body;
      const observer = new MutationObserver(debouncedSyncTheme);
      observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}

    let lastHeight = 0;
    function sendHeight() {
      const height = document.body.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        window.parent.postMessage({ type: 'setHeight', height: height }, '*');
      }
    }

    const debouncedSendHeight = debounce(sendHeight, 150);
    window.addEventListener('load', debouncedSendHeight);
    window.addEventListener('resize', debouncedSendHeight);

    const mutationObserver = new MutationObserver(debouncedSendHeight);
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
  </script>
</body>
</html>
