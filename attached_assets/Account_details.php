<?php
session_start();
require 'db.php';

$username = $_SESSION['username'] ?? null;
if (!$username) {
    header('Location: login.php');
    exit;
}

// Fetch user details using username (not user_id)
$query = $conn->prepare("SELECT name, email, phone FROM users WHERE username = ?");
$query->bind_param("s", $username); // Corrected to string bind
$query->execute();
$query->bind_result($name, $email, $phone);
$query->fetch();
$query->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My Profile - CCMS</title>
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
      --radius: 12px;
      --font: 'Poppins', sans-serif;
      --transition: 0.3s ease;
    }

    html, body {
      margin: 0; padding: 0;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden; /* prevent horizontal scroll */
    }

    body {
      padding: 2rem 1rem;
      font-family: var(--font);
      background-color: var(--bg-dark);
      color: var(--text-light);
      display: flex;
      justify-content: center;
      align-items: flex-start; /* top aligned for better fit */
      min-height: 100vh;
      transition: background var(--transition), color var(--transition);
      overflow-y: auto; /* allow vertical scroll only if content requires */
    }

    body.light-mode {
      background-color: var(--bg-light);
      color: var(--text-dark);
    }

    .profile-card {
      background-color: var(--card-dark);
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      animation: fadeIn 0.5s ease-in-out;
      transition: background-color var(--transition);
      box-sizing: border-box;
      word-wrap: break-word;
    }

    body.light-mode .profile-card {
      background-color: var(--card-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      font-size: 26px;
      margin-bottom: 1.5rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      margin: 1rem 0;
      font-size: 1rem;
      color: var(--muted-light);
      transition: color var(--transition);
      word-break: break-word;
    }

    body.light-mode .detail-row {
      color: var(--muted-dark);
    }

    .detail-row i {
      font-size: 1.2rem;
      width: 30px;
      color: #3498db;
      flex-shrink: 0;
    }

    .detail-row span {
      margin-left: 10px;
      color: inherit;
      word-break: break-word;
      flex-grow: 1;
    }

    .detail-row strong {
      display: inline-block;
      width: 100px;
      font-weight: 600;
      color: var(--text-light);
      flex-shrink: 0;
    }

    body.light-mode .detail-row strong {
      color: var(--text-dark);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      .detail-row strong {
        width: 80px;
      }
    }
  </style>
</head>
<body>
  <div class="profile-card" id="profileCard">
    <h2><i class="fas fa-user-circle"></i> My Profile</h2>

    <div class="detail-row">
      <i class="fas fa-user"></i>
      <strong>Name:</strong>
      <span><?= htmlspecialchars($name) ?></span>
    </div>

    <div class="detail-row">
      <i class="fas fa-envelope"></i>
      <strong>Email:</strong>
      <span><?= htmlspecialchars($email) ?></span>
    </div>

    <div class="detail-row">
      <i class="fas fa-phone"></i>
      <strong>Phone:</strong>
      <span><?= htmlspecialchars($phone ?: 'Not provided') ?></span>
    </div>
  </div>

  <script>
    // Sync light/dark mode with parent dashboard, with debounce for better perf
    function syncThemeFromParent() {
      try {
        const isLight = window.parent.document.body.classList.contains('light-mode');
        document.body.classList.toggle('light-mode', isLight);
      } catch (e) {
        // silently fail on cross-origin
      }
    }

    // Debounce function
    function debounce(func, wait = 100) {
      let timeout;
      return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
      };
    }

    // Initial sync
    syncThemeFromParent();

    // Watch for theme changes in parent
    const observer = new MutationObserver(debounce(syncThemeFromParent));
    try {
      const target = window.parent.document.body;
      observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {
      // silently fail
    }

    // Dynamic iframe resizing with debounce
    let lastHeight = 0;
    function sendHeight() {
      const height = document.body.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        window.parent.postMessage({ type: 'setHeight', height: height }, '*');
      }
    }

    const debouncedSendHeight = debounce(sendHeight, 150);

    // Send height on load and resize
    window.addEventListener('load', debouncedSendHeight);
    window.addEventListener('resize', debouncedSendHeight);

    // Observe DOM changes that might affect height, debounce updates
    const mutationObserver = new MutationObserver(debouncedSendHeight);
    mutationObserver.observe(document.body, { attributes: true, childList: true, subtree: true });
  </script>
</body>
</html>
