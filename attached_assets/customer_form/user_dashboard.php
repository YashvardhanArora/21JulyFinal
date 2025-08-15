<?php
session_start();
require 'db.php';

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'user') {
    header("Location: login.php");
    exit;
}

$username = $_SESSION['username'];

// Fetch user's name and profile picture
$stmt = $conn->prepare("SELECT name, profile_picture FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->bind_result($name, $profile_picture);
$stmt->fetch();
$stmt->close();

// Use default profile picture if none is uploaded
$profile_picture_url = $profile_picture ? 'profile/' . $profile_picture : 'profile/default.jpg';

// Escape output
$userName = htmlspecialchars($name ?? 'User');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Dashboard | CCMS</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

  <!-- Prevent theme flash -->
  <script>
    const theme = localStorage.getItem('ccms_theme') || 'light';
  if (theme === 'light') {
    document.documentElement.classList.add('light-mode');
    }
  </script>

  <style>
    /* your CSS unchanged (omitted here for brevity; copy your entire style block from your code) */
   :root {
      --transition: .3s;
      --radius: 12px;
      --font: 'Poppins', sans-serif;
      --z-top: 2000;
      --bg-dark: #121212; --bg-light: #f4f4f4;
      --sidebar-dark: #1c1c1c; --sidebar-light: #fff;
      --content-dark: #181818; --content-light: #fefefe;
      --text-dark: #1a1a1a; --text-light: #e0e0e0;
      --accent: #fff; --accent-hover: #ddd;
      --notif-red: #e74c3c;
      --shadow: rgba(0,0,0,0.1);
    }

    body {
      margin: 0; padding: 0;
      font-family: var(--font);
      background: var(--bg-dark);
      color: var(--text-light);
      transition: background var(--transition), color var(--transition);
      height: 100vh; overflow: hidden;
    }
    body.light-mode {
      background: var(--bg-light); color: var(--text-dark);
    }

    header.topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 64px;
      background: var(--sidebar-dark);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      z-index: var(--z-top);
      transition: background var(--transition);
      box-sizing: border-box;
      gap: 1rem;
    }
    body.light-mode header.topbar { background: var(--sidebar-light); }

    .topbar .left, .topbar .right {
      display: flex; align-items: center;
      gap: 1rem;
    }

    .topbar button {
      background: none; border: none;
      cursor: pointer; font-size: 1.4rem;
      color: inherit;
      padding: 8px;
      border-radius: var(--radius);
      transition: background var(--transition);
    }
    .topbar button:hover {
      background: var(--accent-hover);
      color: var(--sidebar-dark);
    }

    .topbar .badge {
      position: absolute; top: 4px; right: 4px;
      width: 16px; height: 16px;
      font-size: .6rem;
      background: var(--notif-red); color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    nav.sidebar {
      position: fixed;
      top: 64px;
      left: 0;
      height: calc(100vh - 64px);
      width: 280px;
      background: var(--sidebar-dark);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 1.25rem 1rem 1.25rem;
      overflow-y: auto;
      transition: width var(--transition);
      box-sizing: border-box;
      z-index: calc(var(--z-top) - 10);
    }
    nav.sidebar.collapsed {
      width: 80px;
      padding-left: 0;
    }

    nav.sidebar .logo {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
      position: absolute;
      top: 12px;
      left: 0;
      right: 0;
      height: 40px;
      pointer-events: none;
      user-select: none;
      transition: all var(--transition);
    }
    nav.sidebar .logo img {
      max-width: 160px;
      height: auto;
      transition: max-width var(--transition);
    }
    nav.sidebar.collapsed .logo img {
      max-width: 40px;
    }

    nav.sidebar a {
      display: flex;
      width: 100%;
      padding: 1rem 1.25rem;
      color: inherit;
      text-decoration: none;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      align-items: center;
      gap: 1rem;
      font-weight: 500;
      font-size: 1.05rem;
      transition: background var(--transition), color var(--transition);
      box-sizing: border-box;
      white-space: nowrap;
    }
    nav.sidebar.collapsed a span {
      display: none;
    }
    nav.sidebar a i {
      min-width: 24px;
      text-align: center;
      font-size: 1.3rem;
    }
    nav.sidebar a:hover,
    nav.sidebar a.active {
      background: var(--accent-hover);
      color: var(--sidebar-dark);
    }

    main.content {
      margin-left: 280px;
      padding-top: 64px;
      background: var(--content-dark);
      height: 100vh;
      overflow: auto;
      transition: margin-left var(--transition), background var(--transition);
      box-sizing: border-box;
    }
    nav.sidebar.collapsed ~ main.content {
      margin-left: 80px;
    }
    body.light-mode nav.sidebar { background: var(--sidebar-light); }
    body.light-mode main.content { background: var(--content-light); }

    .iframe-container {
      position: relative;
      height: 100%;
    }

    .iframe-container iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: var(--radius);
      background: var(--content-dark);
      background-clip: padding-box;
      overflow: hidden;
      background-color: transparent;
    }

    body.light-mode .iframe-container iframe {
      background: var(--content-light);
    }

    .spinner {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      border: 4px solid var(--accent-hover);
      border-top: 4px solid var(--accent);
      border-radius: 50%;
      width: 40px; height: 40px;
      animation: spin .8s linear infinite;
      display: none;
      z-index: 1001;
      pointer-events: none;
      background: transparent;
    }

    @keyframes spin {
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .toast-container {
      position: fixed;
      bottom: 1rem; right: 1rem;
      z-index: var(--z-top);
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }

    .toast {
      background: var(--accent-hover);
      color: var(--sidebar-dark);
      padding: .75rem 1rem;
      border-radius: var(--radius);
      box-shadow: 0 4px 8px var(--shadow);
      min-width: 200px;
      opacity: 0;
      transform: translateY(20px);
      animation: toast-in .5s forwards;
    }

    @keyframes toast-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .profile {
      position: relative;
      display: flex;
      align-items: center;
      cursor: pointer;
      gap: 0.75rem;
      font-weight: 600;
      font-size: 1rem;
      user-select: none;
    }
    .profile img {
      width: 38px; height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid transparent;
      transition: border-color var(--transition);
    }
    .profile:hover img {
      border-color: var(--accent-hover);
    }
    .dropdown {
      position: absolute;
      top: 54px;
      right: 0;
      background: var(--sidebar-dark);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: 0 4px 8px var(--shadow);
      display: none;
      flex-direction: column;
      min-width: 180px;
      z-index: var(--z-top);
      user-select: none;
    }
    body.light-mode .dropdown { background: var(--sidebar-light); }
    .dropdown a {
      padding: .75rem 1rem;
      white-space: nowrap;
      text-decoration: none;
      color: inherit;
      transition: background var(--transition);
      font-weight: 500;
      font-size: 0.95rem;
    }
    .dropdown a:hover {
      background: var(--accent-hover);
    }

    #chatbot-toggle {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      background-color: var(--accent-hover);
      color: var(--sidebar-dark);
      border-radius: 50%;
      padding: 0.8rem;
      box-shadow: 0 4px 8px var(--shadow);
      cursor: pointer;
      z-index: var(--z-top);
      transition: background 0.3s;
    }
    #chatbot-toggle:hover {
      background-color: var(--accent);
    }

    #chatbot-box {
      position: fixed;
      bottom: 6rem;
      right: 1.5rem;
      width: 300px;
      max-height: 400px;
      background-color: var(--content-dark);
      color: var(--text-light);
      border-radius: var(--radius);
      box-shadow: 0 4px 12px var(--shadow);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: var(--z-top);
    }
    body.light-mode #chatbot-box {
      background-color: var(--content-light);
      color: var(--text-dark);
    }

    .chat-header {
      background-color: var(--accent-hover);
      color: var(--sidebar-dark);
      padding: 0.75rem 1rem;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-body {
      flex-grow: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .bot-msg, .user-msg {
      background: var(--accent-hover);
      color: var(--sidebar-dark);
      padding: 0.6rem 0.9rem;
      border-radius: var(--radius);
      max-width: 80%;
    }
    .user-msg {
      align-self: flex-end;
      background: var(--accent);
    }

    .chat-input {
      display: flex;
      border-top: 1px solid var(--accent-hover);
    }
    .chat-input input {
      flex: 1;
      border: none;
      padding: 0.75rem;
      outline: none;
      font-family: inherit;
      font-size: 0.95rem;
    }
    .chat-input button {
      background: none;
      border: none;
      font-size: 1.2rem;
      padding: 0 1rem;
      cursor: pointer;
      color: var(--sidebar-dark);
    }
    .notif-dropdown {
  position: absolute;
  top: 40px;
  right: 0;
  background: var(--sidebar-dark);
  color: var(--text-light);
  min-width: 280px;
  max-height: 320px;
  border-radius: var(--radius);
  box-shadow: 0 4px 12px var(--shadow);
  overflow-y: auto;
  z-index: calc(var(--z-top) + 10);
  box-sizing: border-box;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
}

body.light-mode .notif-dropdown {
  background: var(--sidebar-light);
  color: var(--text-dark);
}

.notif-dropdown li {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--accent-hover);
  cursor: pointer;
  user-select: none;
}

.notif-dropdown li:last-child {
  border-bottom: none;
}

.notif-dropdown li:hover {
  background: var(--accent-hover);
  color: var(--sidebar-dark);
}
    /* Add small fix for notif badge pulse animation toggling */
    .pulse {
      animation: pulse 1s infinite;
    }
    @media (max-width: 768px) {
  nav.sidebar {
    width: 220px;
    transform: translateX(-100%);
    transition: transform var(--transition);
    position: fixed;
    z-index: var(--z-top);
  }

  nav.sidebar.show {
    transform: translateX(0);
  }

  nav.sidebar.collapsed {
    width: 60px;
    transform: translateX(0);
  }

  main.content {
    margin-left: 0 !important;
  }

  header.topbar {
    flex-wrap: wrap;
    height: auto;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .topbar .left,
  .topbar .right {
    width: 100%;
    justify-content: space-between;
  }

  .iframe-container {
    height: calc(100vh - 64px);
  }

  .chatbot-box {
    right: 0.75rem;
    bottom: 5rem;
    width: 90vw;
    max-width: 320px;
    height: 60vh;
  }

  .toast-container {
    right: 0.5rem;
    bottom: 0.5rem;
    width: calc(100% - 1rem);
    align-items: center;
  }

  .toast {
    min-width: auto;
    max-width: 90vw;
    text-align: center;
  }

  .notif-dropdown {
    right: 0;
    left: 0;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .topbar button {
    font-size: 1.2rem;
    padding: 6px;
  }

  nav.sidebar .logo img {
    max-width: 120px;
  }

  .profile span {
    display: none;
  }

  .chatbot-box {
    bottom: 6rem;
    width: 95vw;
    height: 65vh;
  }

  .chat-input input {
    font-size: 0.85rem;
  }

  .chat-input button {
    font-size: 1rem;
  }

  .dropdown a {
    font-size: 0.9rem;
  }
}
/* Modal overlay */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: calc(var(--z-top) + 100);
}

/* Modal content box */
.modal-content {
  background: var(--content-dark);
  color: var(--text-light);
  padding: 1.5rem 2rem;
  border-radius: var(--radius);
  max-width: 320px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  text-align: center;
}

body.light-mode .modal-content {
  background: var(--content-light);
  color: var(--text-dark);
}

/* Modal buttons container */
.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-secondary {
  background: var(--accent-hover);
  color: var(--sidebar-dark);
}
.btn-secondary:hover {
  background: var(--accent);
  color: var(--sidebar-dark);
}

.btn-danger {
  background: var(--notif-red);
  color: #fff;
}
.btn-danger:hover {
  background: #c0392b;
  color: #fff;
}

/* Hide modal when hidden attribute present */
.modal[hidden] {
  display: none;
}

  </style>
</head>
<body>
  <header class="topbar">
    <div class="left">
      <button id="toggleSidebar" aria-label="Toggle sidebar"><i class="fas fa-bars"></i></button>
      <button id="toggleTheme" aria-label="Toggle theme"><i id="themeIcon" class="fas fa-moon"></i></button>
    </div>
    <div class="right">
      <button id="notifBtn" aria-label="Notifications" style="position:relative;" aria-haspopup="true" aria-expanded="false">
        <i class="fas fa-bell"></i>
        <div class="badge" id="notifCount" style="display:none;">0</div>
      </button>
      <div id="notifDropdown" class="notif-dropdown" aria-live="polite" aria-atomic="true" hidden>
        <ul id="notifList" role="list" style="list-style:none; margin:0; padding:0; max-height:300px; overflow-y:auto;">
          <!-- notifications will be appended here -->
        </ul>
        <div id="notifEmpty" style="padding:1rem; text-align:center; color:gray; display:none;">No notifications</div>
      </div>

      <div class="profile" id="profileBtn" tabindex="0" aria-haspopup="true" aria-expanded="false">
        <img src="pfp.png" alt="Avatar" />
        <span><?= $userName ?></span>
        <div class="dropdown" id="profileMenu" role="menu" aria-label="Profile menu">
  <a href="account_details.php" target="contentFrame" role="menuitem">My Profile</a>
  <a href="settings.php" target="contentFrame" role="menuitem">Settings</a>
  <a href="update_pfp.php" target="contentFrame" role="menuitem">Update Profile Picture</a> <!-- New Option -->
  <a href="logout.php" id="confirmLogout" role="menuitem">Logout</a>
</div>

        </div>
      </div>
      <!-- Logout Confirmation Modal -->
<div id="logoutModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="logoutModalLabel" aria-describedby="logoutModalDesc" hidden>
  <div class="modal-content">
    <h2 id="logoutModalLabel">Confirm Logout</h2>
    <p id="logoutModalDesc">Are you sure you want to logout?</p>
    <div class="modal-actions">
      <button id="logoutCancelBtn" class="btn btn-secondary">Cancel</button>
      <a href="logout.php" id="logoutConfirmBtn" class="btn btn-danger">Logout</a>
    </div>
  </div>
</div>

    </div>
  </header>

  <nav class="sidebar" id="sidebar" role="navigation" aria-label="Main sidebar">
    <div class="logo"><img src="Logo.png" alt="Logo" /></div>
    <a href="new_complaint1.php" target="contentFrame"><i class="fas fa-plus-circle"></i><span>Raise Complaint</span></a>
    <a href="track_complaint.php" target="contentFrame"><i class="fas fa-search"></i><span>Track Complaint</span></a>
    <a href="feedback.php" target="contentFrame"><i class="fas fa-comment"></i><span>Feedback</span></a>
  </nav>

  <main class="content">
    <div class="iframe-container">
      <div class="spinner" id="spinner"></div>
      <iframe
        id="contentFrame"
        name="contentFrame"
        src="new_complaint1.php"
        sandbox="allow-scripts allow-same-origin allow-forms"
        aria-label="Content frame"
      ></iframe>
    </div>
  </main>

  <div class="toast-container" id="toasts" aria-live="polite" aria-atomic="true"></div>

  <!-- Chatbot Toggle Button -->
  <div id="chatbot-toggle" aria-label="Chat with Support">
    <i class="fas fa-comment-dots"></i>
  </div>

  <!-- Chatbot Window -->
  <div id="chatbot-box">
    <div class="chat-header">Support Chat
      <button id="chat-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="chat-body" id="chat-body">
      <div class="bot-msg">Hello! How can I help you today?</div>
    </div>
    <div class="chat-input">
      <input type="text" id="chat-input" placeholder="Type a message..." />
      <button id="chat-send"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>

  <script>
    (() => {
      const sidebar = document.getElementById('sidebar');
      const toggleSB = document.getElementById('toggleSidebar');
      const themeBtn = document.getElementById('toggleTheme');
      const themeIcon = document.getElementById('themeIcon');
      const spinner = document.getElementById('spinner');
      const frame = document.getElementById('contentFrame');
      const notifCount = document.getElementById('notifCount');
      const notifBtn = document.getElementById('notifBtn');
      const notifDropdown = document.getElementById('notifDropdown');
      const notifList = document.getElementById('notifList');
      const notifEmpty = document.getElementById('notifEmpty');
      const profileBtn = document.getElementById('profileBtn');
      const profileMenu = document.getElementById('profileMenu');
      const confirmLogout = document.getElementById('confirmLogout');
      const toasts = document.getElementById('toasts');
      const links = sidebar.querySelectorAll('a');

      // Sidebar toggle
      if (localStorage.getItem('ccms_sidebar') === 'collapsed') {
        sidebar.classList.add('collapsed');
      }
      toggleSB.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('ccms_sidebar', collapsed ? 'collapsed' : 'open');
      });

      // Theme toggle
      const applyTheme = (mode) => {
        document.body.classList.toggle('light-mode', mode === 'light');
        themeIcon.classList.toggle('fa-sun', mode === 'light');
        themeIcon.classList.toggle('fa-moon', mode === 'dark');
        localStorage.setItem('ccms_theme', mode);
        sendThemeToIframe();
      };
      const sendThemeToIframe = () => {
        const mode = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        frame.contentWindow.postMessage({ type: 'theme', mode }, '*');
      };
      applyTheme(localStorage.getItem('ccms_theme') || 'light');
      themeBtn.addEventListener('click', () => {
        const mode = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        applyTheme(mode === 'dark' ? 'light' : 'dark');
      });

      // Spinner on link click and disable iframe interaction while loading
      links.forEach((link) => {
        link.addEventListener('click', () => {
          spinner.style.display = 'block';
          frame.style.pointerEvents = 'none';
        });
      });

      // Highlight active link based on iframe current URL pathname
      function highlightActive() {
        let currentPath;
        try {
          currentPath = frame.contentWindow.location.pathname;
        } catch {
          currentPath = new URL(frame.src, location).pathname;
        }
        links.forEach((a) => {
          const linkPath = new URL(a.href, location).pathname;
          a.classList.toggle('active', linkPath === currentPath);
        });
      }

      // On iframe load: hide spinner, re-enable iframe, highlight sidebar link, send theme
      frame.addEventListener('load', () => {
        spinner.style.display = 'none';
        frame.style.pointerEvents = 'auto';
        highlightActive();
        sendThemeToIframe();
      });

      // Profile dropdown toggle
      profileBtn.addEventListener('click', () => {
        const shown = profileMenu.style.display === 'flex';
        profileMenu.style.display = shown ? 'none' : 'flex';
        profileBtn.setAttribute('aria-expanded', !shown);
      });
      // Close dropdown on click outside
      document.addEventListener('click', e => {
        if (!profileBtn.contains(e.target)) {
          profileMenu.style.display = 'none';
          profileBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Notifications logic
      let notifData = []; // store notifications array

      // Update notifications UI list
      function updateNotifUI() {
        notifList.innerHTML = '';
        if (notifData.length === 0) {
          notifEmpty.style.display = 'block';
          notifList.style.display = 'none';
        } else {
          notifEmpty.style.display = 'none';
          notifList.style.display = 'block';
          notifData.forEach((notif) => {
            const li = document.createElement('li');
            li.textContent = notif.message || 'Notification';
            li.title = notif.date || '';
            // Bold unread notifications
            if (notif.status === 'unread') {
              li.style.fontWeight = '600';
            }
            notifList.appendChild(li);
          });
        }
      }

      // Fetch notifications on dropdown open
      notifBtn.addEventListener('click', async () => {
        const isHidden = notifDropdown.hasAttribute('hidden');
        if (isHidden) {
          // Show dropdown
          notifDropdown.removeAttribute('hidden');
          notifBtn.setAttribute('aria-expanded', 'true');

          try {
            const resp = await fetch('notifications.php');
            if (!resp.ok) throw new Error('Network error');
            const data = await resp.json();

            notifData = data.notifications || [];
            const unreadCount = data.unread_count || 0;

            // Update badge
            if (unreadCount > 0) {
              notifCount.textContent = unreadCount;
              notifCount.style.display = 'flex';
              notifCount.classList.add('pulse');
            } else {
              notifCount.style.display = 'none';
              notifCount.classList.remove('pulse');
            }

            updateNotifUI();
          } catch (err) {
            notifList.innerHTML = '<li style="color:red; padding: 1rem;">Failed to load notifications</li>';
            notifEmpty.style.display = 'none';
            notifCount.style.display = 'none';
            notifCount.classList.remove('pulse');
            console.error('Notification fetch error:', err);
          }
        } else {
          // Hide dropdown
          notifDropdown.setAttribute('hidden', '');
          notifBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close dropdown if clicking outside
      document.addEventListener('click', e => {
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
          notifDropdown.setAttribute('hidden', '');
          notifBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toast notifications
      function showToast(message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toasts.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 500);
        }, duration);
      }

      // Iframe height adjustment via postMessage from iframe (if implemented)
      window.addEventListener('message', e => {
        if (!e.data || typeof e.data !== 'object') return;
        if (e.data.type === 'setHeight' && typeof e.data.height === 'number') {
          frame.style.height = e.data.height + 'px';
        }
      });

      // Chatbot UI
      const chatbotToggle = document.getElementById('chatbot-toggle');
      const chatbotBox = document.getElementById('chatbot-box');
      const chatCloseBtn = document.getElementById('chat-close');
      const chatBody = document.getElementById('chat-body');
      const chatInput = document.getElementById('chat-input');
      const chatSendBtn = document.getElementById('chat-send');

      chatbotToggle.addEventListener('click', () => {
        chatbotBox.style.display = chatbotBox.style.display === 'flex' ? 'none' : 'flex';
        if (chatbotBox.style.display === 'flex') {
          chatInput.focus();
        }
      });
      chatCloseBtn.addEventListener('click', () => {
        chatbotBox.style.display = 'none';
      });

      function appendMessage(text, sender = 'bot') {
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'bot' ? 'bot-msg' : 'user-msg';
        msgDiv.textContent = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
      }

      async function chatbotRespond(input) {
        // Simple canned response demo. Replace with your API call if needed.
        input = input.toLowerCase();
        let reply = "Sorry, I don't understand. Can you rephrase?";
        if (input.includes('hello') || input.includes('hi')) {
          reply = 'Hello! How can I help you today?';
        } else if (input.includes('complaint')) {
          reply = 'You can raise a complaint by clicking "Raise Complaint" on the sidebar.';
        } else if (input.includes('thank')) {
          reply = "You're welcome! Let me know if you need anything else.";
        }
        return reply;
      }

      chatSendBtn.addEventListener('click', sendChat);
      chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendChat();
      });

      async function sendChat() {
        const val = chatInput.value.trim();
        if (!val) return;
        appendMessage(val, 'user');
        chatInput.value = '';
        const reply = await chatbotRespond(val);
        appendMessage(reply, 'bot');
      }
    })();
    window.addEventListener('message', (event) => {
  if (event.data?.type === 'resize' && event.data.height) {
    const iframe = document.querySelector('iframe#contentFrame');

    if (iframe) iframe.style.height = `${event.data.height}px`;
  }
});

  </script>
  <script>
    const logoutModal = document.getElementById('logoutModal');
const logoutCancelBtn = document.getElementById('logoutCancelBtn');
const confirmLogout = document.getElementById('confirmLogout');

confirmLogout.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent immediate logout
  logoutModal.removeAttribute('hidden');
  logoutCancelBtn.focus();
});

// Cancel button hides modal
logoutCancelBtn.addEventListener('click', () => {
  logoutModal.setAttribute('hidden', '');
  confirmLogout.focus();
});

// Also hide modal if user clicks outside modal content
logoutModal.addEventListener('click', (e) => {
  if (e.target === logoutModal) {
    logoutModal.setAttribute('hidden', '');
    confirmLogout.focus();
  }
});

// Handle ESC key to close modal
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !logoutModal.hasAttribute('hidden')) {
    logoutModal.setAttribute('hidden', '');
    confirmLogout.focus();
  }
});

  </script>
</body>
</html> 