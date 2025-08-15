<?php
session_start();
require 'db.php';

if (!isset($_SESSION['username'])) {
    die("Unauthorized access.");
}

$username = $_SESSION['username'];

// Check if file is uploaded
if (isset($_FILES['pfp']) && $_FILES['pfp']['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $mimeType = mime_content_type($_FILES['pfp']['tmp_name']);
    $fileSize = $_FILES['pfp']['size'];

    if (!in_array($mimeType, $allowedTypes)) {
        die("❌ Only JPG, PNG, and GIF images are allowed.");
    }

    if ($fileSize > 2 * 1024 * 1024) {
        die("❌ File size must be under 2MB.");
    }

    // Prepare upload
    $ext = pathinfo($_FILES['pfp']['name'], PATHINFO_EXTENSION);
    $newFilename = uniqid('pfp_', true) . '.' . $ext;
    $uploadDir = 'profile/';
    $uploadPath = $uploadDir . $newFilename;

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (move_uploaded_file($_FILES['pfp']['tmp_name'], $uploadPath)) {
        // Save to database
        $stmt = $conn->prepare("UPDATE users SET profile_picture = ? WHERE username = ?");
        $stmt->bind_param("ss", $newFilename, $username);

        if ($stmt->execute()) {
            echo "<script>alert('✅ Profile picture updated successfully!'); window.location.href='profile.php';</script>";
        } else {
            echo "❌ Failed to update database.";
        }
        $stmt->close();
    } else {
        echo "❌ Failed to upload the image.";
    }
} else {
    echo "❌ No file uploaded or an error occurred.";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Update Profile Picture - CCMS</title>
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
      --accent: #3498db;
      --muted-light: #aaaaaa;
      --muted-dark: #555555;
      --radius: 12px;
      --font: 'Poppins', sans-serif;
      --transition: 0.3s ease;
    }

    body {
      margin: 0;
      font-family: var(--font);
      background-color: var(--bg-dark);
      color: var(--text-light);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem 1rem;
      min-height: 100vh;
      transition: background var(--transition), color var(--transition);
    }

    body.light-mode {
      background-color: var(--bg-light);
      color: var(--text-dark);
    }

    .upload-card {
      background-color: var(--card-dark);
      padding: 2rem;
      border-radius: var(--radius);
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
    }

    body.light-mode .upload-card {
      background-color: var(--card-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 24px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .file-drop-area {
      position: relative;
      padding: 24px;
      border: 2px dashed var(--muted-light);
      border-radius: var(--radius);
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-light);
      text-align: center;
      cursor: pointer;
      transition: background 0.3s ease, border-color 0.3s ease;
    }

    body.light-mode .file-drop-area {
      background-color: #fdfdfd;
      border-color: #ccc;
      color: var(--text-dark);
    }

    .file-drop-area input[type="file"] {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .file-drop-area.dragover {
      background-color: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .file-preview {
      margin-top: 1rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .file-preview img {
      max-height: 60px;
      max-width: 60px;
      border-radius: 8px;
      object-fit: contain;
      border: 1px solid var(--muted-light);
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius);
      background-color: var(--accent);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    button:hover {
      background-color: #2c80b4;
    }

    .info {
      text-align: center;
      font-size: 0.9rem;
      color: var(--muted-light);
    }

    body.light-mode .info {
      color: var(--muted-dark);
    }
  </style>
</head>
<body>
  <div class="upload-card">
    <h2><i class="fas fa-image"></i> Update Profile Picture</h2>
    <form action="upload_pfp_handler.php" method="POST" enctype="multipart/form-data">
      <div class="file-drop-area" id="file-drop-area">
        <input type="file" name="pfp" id="pfp" accept="image/*" required />
        <span>Drag & Drop image or click to select</span>
      </div>
      <div class="file-preview" id="file-preview"></div>
      <button type="submit"><i class="fas fa-upload"></i> Upload</button>
    </form>
    <p class="info">Supported formats: JPG, PNG, GIF (Max size: 2MB)</p>
  </div>

  <script>
    const fileDropArea = document.getElementById('file-drop-area');
    const fileInput = document.getElementById('pfp');
    const filePreview = document.getElementById('file-preview');

    // Drag & Drop logic
    fileDropArea.addEventListener('dragover', e => {
      e.preventDefault();
      fileDropArea.classList.add('dragover');
    });

    fileDropArea.addEventListener('dragleave', e => {
      e.preventDefault();
      fileDropArea.classList.remove('dragover');
    });

    fileDropArea.addEventListener('drop', e => {
      e.preventDefault();
      fileDropArea.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
          alert('Only image files under 2MB are allowed.');
          return;
        }
        fileInput.files = e.dataTransfer.files;
        previewImage(file);
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file && file.type.startsWith('image/') && file.size <= 2 * 1024 * 1024) {
        previewImage(file);
      } else {
        alert('Only image files under 2MB are allowed.');
        fileInput.value = '';
        filePreview.innerHTML = '';
      }
    });

    function previewImage(file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        filePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      };
      reader.readAsDataURL(file);
    }

    // Theme Sync
    try {
      const isLight = window.parent.document.body.classList.contains('light-mode');
      document.body.classList.toggle('light-mode', isLight);
    } catch (e) {}

    // Post height to parent
    window.addEventListener("load", () => {
      setTimeout(() => {
        window.parent.postMessage({
          type: "setHeight",
          height: document.body.scrollHeight
        }, "*");
      }, 150);
    });
  </script>
</body>
</html>
