<?php
session_start();
require 'db.php';

$role = 'user'; // Fixed role for user login

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $identifier = trim($_POST['identifier']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT username, name, password, role FROM users WHERE (email = ? OR username = ?) AND role = ?");
    $stmt->bind_param("sss", $identifier, $identifier, $role);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 1) {
        $stmt->bind_result($username, $name, $hash, $db_role);
        $stmt->fetch();
        if (password_verify($password, $hash)) {
            $_SESSION['username'] = $username;
            $_SESSION['name'] = $name;
            $_SESSION['role'] = $db_role;
            header("Location: user_dashboard.php");
            exit;
        } else {
            $error = "Incorrect password.";
        }
    } else {
        $error = "No account found with this email or username.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>User Login - CCMS</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(to right, rgba(79, 172, 254, 0.85), rgba(0, 242, 254, 0.85)), url('bg3.webp') no-repeat center center / cover;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      background: #fff;
      padding: 30px 25px;
      border-radius: 12px;
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    h2 {
      margin-bottom: 20px;
      color: #333;
    }

    form {
      width: 100%;
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 12px;
      margin-bottom: 15px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 15px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #007BFF;
      box-shadow: 0 0 5px rgba(0, 123, 255, 0.7);
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007BFF;
    }

    .toggle-password svg {
      width: 20px;
      height: 20px;
    }

    button[type="submit"] {
      width: 100%;
      padding: 12px;
      background-color: #007BFF;
      color: white;
      font-size: 16px;
      border: none;
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

    .links,
    .signup {
      margin-top: 15px;
      font-size: 14px;
    }

    .links a,
    .signup a {
      color: #007BFF;
      text-decoration: none;
      font-weight: 500;
    }

    .links a:hover,
    .signup a:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .container {
        padding: 20px;
      }

      h2 {
        font-size: 20px;
      }

      input,
      button {
        font-size: 15px;
      }

      .toggle-password svg {
        width: 18px;
        height: 18px;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <h2>User Login</h2>

  <?php if (!empty($error)) echo "<div class='error'>$error</div>"; ?>

  <form method="post" novalidate>
    <input type="text" name="identifier" placeholder="Username or Email" required autocomplete="username" />

    <div class="password-wrapper">
      <input type="password" id="passwordInput" name="password" placeholder="Password" required autocomplete="current-password" />
      <button type="button" class="toggle-password" onclick="togglePassword()" aria-label="Toggle password visibility">
        <!-- Eye Open -->
        <svg id="eyeOpen" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <!-- Eye Closed -->
        <svg id="eyeClosed" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:none;">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.11 18.11 0 0 1 5-6"/>
          <path d="M1 1l22 22"/>
          <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/>
        </svg>
      </button>
    </div>

    <button type="submit">Login</button>

    <div class="links">
      <a href="forgot_password.php">Forgot Password?</a>
    </div>

    <div class="signup">
      Don't have an account? <a href="register.php">Sign Up</a>
    </div>
  </form>
</div>

<script>
  function togglePassword() {
    const pwd = document.getElementById('passwordInput');
    const eyeOpen = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');

    if (pwd.type === 'password') {
      pwd.type = 'text';
      eyeOpen.style.display = 'none';
      eyeClosed.style.display = 'block';
    } else {
      pwd.type = 'password';
      eyeOpen.style.display = 'block';
      eyeClosed.style.display = 'none';
    }
    pwd.focus();
  }
</script>

</body>
</html>
