<?php
session_start();
require 'db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username         = trim($_POST['username']);
    $name             = trim($_POST['name']);
    $email            = trim($_POST['email']);
    $phone            = trim($_POST['phone']);
    $password         = $_POST['password'];
    $confirmPassword  = $_POST['confirm_password'];
    $role             = 'user';

    if ($password !== $confirmPassword) {
        $error = "Passwords do not match.";
    } elseif (!preg_match('/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/', $password)) {
        $error = "Password must include letters, numbers, special characters, and be at least 8 characters long.";
    } else {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $error = "Username is already taken.";
        } else {
            $stmt = $conn->prepare("INSERT INTO users (username, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssss", $username, $name, $email, $phone, $hashedPassword, $role);
            if ($stmt->execute()) {
                header("Location: login.php");
                exit;
            } else {
                $error = "Registration failed. Please try again.";
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>User Registration - CCMS</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-image: linear-gradient(to right, rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8)), url('bg3.webp');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }

    .container {
      background: white;
      padding: 30px 25px;
      border-radius: 12px;
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 430px;
      text-align: center;
      position: relative;
    }

    h2 {
      margin-bottom: 20px;
      color: #333;
    }

    form {
      position: relative;
    }

    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="password"] {
      width: 100%;
      padding: 12px 44px 12px 12px; /* right padding for eye icon */
      margin-bottom: 15px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 15px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    input[type="text"]:focus,
    input[type="email"]:focus,
    input[type="tel"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #007BFF;
      box-shadow: 0 0 5px rgba(0, 123, 255, 0.7);
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      width: 20px;
      height: 20px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007BFF;
      transition: color 0.3s ease;
      user-select: none;
    }
    .toggle-password:hover {
      color: #0056b3;
    }
    .toggle-password svg {
      width: 20px;
      height: 20px;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    button[type="submit"] {
      width: 100%;
      padding: 12px;
      background-color: #007BFF;
      border: none;
      color: white;
      font-size: 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    button[type="submit"]:hover {
      background-color: #0056b3;
    }

    .error {
      color: red;
      margin-bottom: 15px;
      font-size: 14px;
    }

    .check-msg {
      font-size: 13px;
      margin-top: -10px;
      margin-bottom: 12px;
      text-align: left;
      color: red;
    }

    .check-msg.valid {
      color: green;
    }

    .footer {
      margin-top: 12px;
      font-size: 14px;
      text-align: center;
    }

    .footer a {
      color: #007BFF;
      text-decoration: none;
    }

    @media (max-width: 480px) {
      .container {
        padding: 20px;
      }
      h2 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <h2>User Registration</h2>

  <?php if (!empty($error)) echo "<div class='error'>$error</div>"; ?>

  <form method="post" id="registerForm" novalidate>
    <input type="text" name="username" id="username" placeholder="Username" required oninput="checkUsername()" autocomplete="username" />
    <div id="username-status" class="check-msg"></div>

    <input type="text" name="name" id="name" placeholder="Full Name" required autocomplete="name" />

    <input type="email" name="email" id="email" placeholder="Email" required oninput="validateEmail()" autocomplete="email" />
    <div id="email-msg" class="check-msg"></div>

    <input type="tel" name="phone" id="phone" placeholder="Contact Number" required oninput="validatePhone()" autocomplete="tel" />
    <div id="phone-msg" class="check-msg"></div>

    <div style="position: relative;">
      <input type="password" name="password" id="password" placeholder="Password" required autocomplete="new-password" />
      <button type="button" class="toggle-password" aria-label="Toggle password visibility" onclick="togglePassword('password', 'eyeOpen1', 'eyeClosed1')" tabindex="-1">
        <!-- Eye Open -->
        <svg id="eyeOpen1" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <!-- Eye Closed -->
        <svg id="eyeClosed1" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none;">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.11 18.11 0 0 1 5-6"/>
          <path d="M1 1l22 22"/>
          <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/>
        </svg>
      </button>
    </div>

    <div style="position: relative;">
      <input type="password" name="confirm_password" id="confirm_password" placeholder="Confirm Password" required autocomplete="new-password" />
      <button type="button" class="toggle-password" aria-label="Toggle password visibility" onclick="togglePassword('confirm_password', 'eyeOpen2', 'eyeClosed2')" tabindex="-1">
        <!-- Eye Open -->
        <svg id="eyeOpen2" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <!-- Eye Closed -->
        <svg id="eyeClosed2" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none;">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.11 18.11 0 0 1 5-6"/>
          <path d="M1 1l22 22"/>
          <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/>
        </svg>
      </button>
    </div>

    <button type="submit">Register</button>
  </form>

  <div class="footer">
    Already registered? <a href="login.php">Login here</a>
  </div>
</div>

<script>
function validateEmail() {
  const email = document.getElementById('email').value.trim();
  const emailMsg = document.getElementById('email-msg');
  const pattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  if (email === '') {
    emailMsg.textContent = '';
    return;
  }
  emailMsg.textContent = pattern.test(email) ? 'Valid email.' : 'Invalid email format.';
  emailMsg.className = pattern.test(email) ? 'check-msg valid' : 'check-msg';
}

function validatePhone() {
  const phone = document.getElementById('phone').value.trim();
  const phoneMsg = document.getElementById('phone-msg');
  if (phone === '') {
    phoneMsg.textContent = '';
    return;
  }
  const isValid = /^[0-9]{10}$/.test(phone);
  phoneMsg.textContent = isValid ? 'Valid phone number.' : 'Phone must be 10 digits.';
  phoneMsg.className = isValid ? 'check-msg valid' : 'check-msg';
}

function checkUsername() {
  const username = document.getElementById('username').value.trim();
  const status = document.getElementById('username-status');

  if (username.length < 4) {
    status.textContent = "Username too short.";
    status.className = 'check-msg';
    return;
  }

  fetch('check_username.php?username=' + encodeURIComponent(username))
    .then(res => res.text())
    .then(data => {
      status.textContent = data;
      status.className = data.toLowerCase().includes('available') ? 'check-msg valid' : 'check-msg';
    })
    .catch(() => {
      status.textContent = "Error checking username.";
      status.className = 'check-msg';
    });
}

function togglePassword(fieldId, eyeOpenId, eyeClosedId) {
  const pwd = document.getElementById(fieldId);
  const eyeOpen = document.getElementById(eyeOpenId);
  const eyeClosed = document.getElementById(eyeClosedId);

  if (pwd.type === 'password') {
    pwd.type = 'text';
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  } else {
    pwd.type = 'password';
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  }
  pwd.focus(); // Keeps focus to preserve styling
}
</script>

</body>
</html>
