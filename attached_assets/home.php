<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CCMS - Home</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Poppins', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: linear-gradient(to right, rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8)), url('bg.webp');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      background: rgba(255, 255, 255, 0.95);
      padding: 40px 30px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 400px;
      text-align: center;
      backdrop-filter: blur(5px);
    }

    .logo {
      width: 100px;
      margin: 0 auto 20px;
      display: block;
    }

    .gradient-text {
      font-size: 28px;
      font-weight: 600;
      background: linear-gradient(to right, #007BFF, #e74c3c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 25px;
    }

    a.button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px;
      margin: 10px 0;
      font-size: 16px;
      font-weight: 600;
      background-color: #007BFF;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      transition: background-color 0.3s ease, transform 0.2s;
      box-shadow: 0 6px 15px rgba(0, 123, 255, 0.3);
    }

    a.button:hover {
      background-color: #0056b3;
      transform: translateY(-1px);
    }

    .footer {
      margin-top: 20px;
      font-size: 13px;
      color: #666;
    }

    .footer a {
      color: #007BFF;
      font-weight: 500;
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .container {
        padding: 25px 15px;
        border-radius: 12px;
      }

      .gradient-text {
        font-size: 22px;
      }

      .logo {
        width: 80px;
        margin-bottom: 16px;
      }

      a.button {
        font-size: 15px;
        padding: 12px;
      }

      .footer {
        font-size: 12px;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <img src="Logo.png" alt="BN Group Logo" class="logo" />
  <h1 class="gradient-text">BN Support Desk</h1>

  <a href="login.php" class="button"><i class="fas fa-sign-in-alt"></i> Login</a>
  <a href="register.php" class="button"><i class="fas fa-user-plus"></i> Register</a>

  <div class="footer">
    Admin? <a href="login.php?role=admin">Go to Admin Panel</a>
  </div>
</div>

</body>
</html>
