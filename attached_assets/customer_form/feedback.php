<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php';

$success = '';
$error = '';
$rating = '';
$comments = '';
$complaint_code = '';
$upload_path = null;
$complaints = [];

if (!isset($_SESSION['username'])) {
    die("Unauthorized access. Please <a href='login.php'>login</a> first.");
}

$username = $_SESSION['username'];

$user_stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$user_stmt->bind_param("s", $username);
$user_stmt->execute();
$user_stmt->bind_result($user_id);
$user_stmt->fetch();
$user_stmt->close();

$stmt = $conn->prepare("SELECT complaint_code FROM complaints WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $complaints[] = $row['complaint_code'];
}
$stmt->close();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $complaint_code = trim($_POST['complaint_code']);
    $rating = $_POST['rating'] ?? '';
    $comments = trim($_POST['comments']);

    if ($comments === '') {
        $error = "Comments cannot be empty.";
    } else {
        $check = $conn->prepare("SELECT id FROM complaints WHERE complaint_code = ? AND user_id = ?");
        $check->bind_param("si", $complaint_code, $user_id);
        $check->execute();
        $check->store_result();

        if ($check->num_rows === 0) {
            $error = "Invalid Complaint ID or it does not belong to you.";
        } else {
            $check->bind_result($complaint_id);
            $check->fetch();

            $feedback_check = $conn->prepare("SELECT id FROM feedback WHERE complaint_id = ? AND user_id = ?");
            $feedback_check->bind_param("ii", $complaint_id, $user_id);
            $feedback_check->execute();
            $feedback_check->store_result();

            if ($feedback_check->num_rows > 0) {
                $error = "You have already submitted feedback for this complaint.";
            } else {
                if (isset($_FILES['proof']) && $_FILES['proof']['error'] === UPLOAD_ERR_OK) {
                    $allowed = ['image/jpeg', 'image/png', 'application/pdf'];
                    $mime = mime_content_type($_FILES['proof']['tmp_name']);
                    $size = $_FILES['proof']['size'];

                    if (!in_array($mime, $allowed)) {
                        $error = "Only JPG, PNG, and PDF files are allowed.";
                    } elseif ($size > 2 * 1024 * 1024) {
                        $error = "File must be under 2MB.";
                    } else {
                        $ext = pathinfo($_FILES['proof']['name'], PATHINFO_EXTENSION);
                        $newName = uniqid('proof_', true) . '.' . $ext;
                        $upload_dir = 'uploads/';
                        if (!is_dir($upload_dir)) mkdir($upload_dir);
                        $upload_path = $upload_dir . $newName;
                        move_uploaded_file($_FILES['proof']['tmp_name'], $upload_path);
                    }
                }

                if (!$error) {
                    $stmt = $conn->prepare("INSERT INTO feedback (complaint_id, user_id, rating, comments, proof_file) VALUES (?, ?, ?, ?, ?)");
                    $stmt->bind_param("iiiss", $complaint_id, $user_id, $rating, $comments, $upload_path);
                    if ($stmt->execute()) {
                        $success = "Thank you for your feedback!";
                        $complaint_code = $rating = $comments = '';
                    } else {
                        $error = "Something went wrong. Please try again.";
                    }
                }
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
  <title>Give Feedback - CCMS</title>
  <script>
  // Function to apply theme to <body> based on mode
  function applyTheme(mode) {
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  // Initialize theme on page load from localStorage (default light)
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Optional: expose toggle function globally (if you want a toggle button)
  window.toggleTheme = function() {
    const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  };

  // If inside iframe and parent sends theme updates, listen for them
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'setTheme') {
      applyTheme(event.data.theme);
    }
  });
</script>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  <style>
  :root {
  --bg: #ffffff;
  --card: #ffffff;
  --text-color: #1e293b;
  --accent: #2575fc;
  --accent-hover: #1a57d9;
  --input-bg: #ffffff;
  --input-border: #cbd5e1;
  --radius: 16px;
  --font: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --shadow: rgba(37, 117, 252, 0.25);
  --toast-success-bg: #22c55e;
  --toast-error-bg: #ef4444;
  --shadow-light: rgba(37, 117, 252, 0.25);
}

body.dark-mode {
  --bg: #121212;
  --card: #181818;
  --text-color: #e0e0e0;
  --accent: #2575fc;
  --accent-hover: #1a57d9;
  --input-bg: #121212;
  --input-border: #334155;
  --shadow: rgba(0, 0, 0, 0.6);
  --shadow-light: rgba(37, 117, 252, 0.6);
}

/* Base styles */
html, body {
  margin: 0;
  padding: 0;
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-color);
  min-height: 100%;
  overflow-x: hidden;
}

/* Container */
.container {
  max-width: 700px;
  margin: 40px auto;
  background: var(--card);
  padding: 32px;
  border-radius: var(--radius);
  box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.05),
        0 0 60px var(--shadow-light);
  transition: background 0.3s, color 0.3s;
}

/* Heading */
h2 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  font-weight: 600;
  color: var(--text);
}

/* Inputs & Textarea */
select,
textarea {
  padding: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 15px;
  width: 100%;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

/* Star rating */
.star-rating {
  display: flex;
  justify-content: center;
  direction: rtl;
  gap: 6px;
}
.star-rating input {
  display: none;
}
.star-rating label {
  font-size: 28px;
  color: #888;
  cursor: pointer;
  transition: color 0.3s;
}
.star-rating input:checked ~ label,
.star-rating input:checked ~ label ~ label,
.star-rating label:hover,
.star-rating label:hover ~ label {
  color: gold;
}

/* Button */
button {
  padding: 14px 26px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px var(--shadow);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  user-select: none;
}
button:hover {
  background: var(--accent-hover);
  box-shadow: 0 6px 20px var(--shadow);
}

/* File Drop Area */
.file-drop-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 2px dashed var(--input-border);
  border-radius: var(--radius);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 15px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s, color 0.3s;
  user-select: none;
}
.file-drop-area input[type="file"] {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}
.file-drop-area.dragover {
  background-color: var(--accent-hover);
  border-color: var(--accent-hover);
  color: #fff;
}

/* File Preview */
.file-preview {
  margin-top: 12px;
  width: 100%;
  text-align: left;
  color: var(--text-color);
}
.file-preview-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: var(--radius);
  border: 1px solid var(--input-border);
  margin-top: 8px;
  background: var(--card);
}
.file-preview-item img {
  max-height: 32px;
  max-width: 32px;
  border-radius: 4px;
  margin-right: 10px;
  object-fit: contain;
}
.file-preview-item .file-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-preview-item .remove-file {
  margin-left: 8px;
  cursor: pointer;
  color: var(--accent);
  font-weight: bold;
}
.file-preview-item .remove-file:hover {
  color: var(--accent-hover);
}

/* Toasts */
#toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 320px;
}
.toast {
  padding: 14px 20px;
  border-radius: var(--radius);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 0;
  transform: translateX(100%);
  animation: slideIn 0.3s forwards;
  cursor: pointer;
  user-select: none;
}
.toast.success {
  background-color: var(--toast-success-bg);
}
.toast.error {
  background-color: var(--toast-error-bg);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
</head>
<body>
  <div class="container">
    <h2>Give Feedback</h2>

    <form method="post" enctype="multipart/form-data" id="feedback-form" novalidate>
      <label for="complaint_code">Select Complaint</label>
      <select name="complaint_code" id="complaint_code" required>
        <option value="">-- Select Complaint --</option>
        <?php foreach ($complaints as $code): ?>
          <option value="<?= htmlspecialchars($code) ?>" <?= ($complaint_code == $code) ? 'selected' : '' ?>>
            <?= htmlspecialchars($code) ?>
          </option>
        <?php endforeach; ?>
      </select>

      <div class="star-rating" aria-label="Rating">
        <?php for ($i = 5; $i >= 1; $i--): ?>
          <input type="radio" id="star<?= $i ?>" name="rating" value="<?= $i ?>" <?= ($rating == $i) ? 'checked' : '' ?> />
          <label for="star<?= $i ?>" title="<?= $i ?> stars">&#9733;</label>
        <?php endfor; ?>
      </div>

      <label for="comments">Comments</label>
      <textarea name="comments" id="comments" placeholder="Additional Comments (Optional)"><?= htmlspecialchars($comments) ?></textarea>

      <label for="proof">Optional Proof (PDF, JPG, PNG)</label>
      <div class="file-drop-area" id="file-drop-area" tabindex="0">
        Drag & Drop file here or click to select
        <input type="file" name="proof" id="proof" accept=".pdf,.jpg,.jpeg,.png" />
      </div>
      <div class="file-preview" id="file-preview"></div>

      <button type="submit">Submit Feedback</button>
    </form>
  </div>

  <div id="toast-container"></div>
<script>
  // Apply stored theme instantly
  const storedTheme = localStorage.getItem('theme') || 'light';
  if (storedTheme === 'dark') {
    document.documentElement.classList.remove('light-mode');
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.add('light-mode');
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }

  // Theme + iframe height sync
  (function () {
    const applyTheme = (mode) => {
      if (mode === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    };
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'theme') {
        applyTheme(event.data.mode);
      }
    });
    window.parent.postMessage({ type: 'requestTheme' }, '*');
  })();
</script>
<script>
  // Toast functions
  const toastContainer = document.getElementById('toast-container');
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Remove on click
    toast.addEventListener('click', () => {
      hideToast(toast);
    });

    // Auto-hide after 4s
    setTimeout(() => {
      hideToast(toast);
    }, 4000);
  }
  function hideToast(toast) {
    toast.style.animation = 'slideOut 0.3s forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }

  // Show PHP messages as toast
  <?php if ($success): ?>
    showToast("<?= addslashes(htmlspecialchars($success)) ?>", 'success');
  <?php elseif ($error): ?>
    showToast("<?= addslashes(htmlspecialchars($error)) ?>", 'error');
  <?php endif; ?>

  // File drag & drop & preview
  const fileDropArea = document.getElementById('file-drop-area');
  const fileInput = document.getElementById('proof');
  const filePreview = document.getElementById('file-preview');

  function clearPreview() {
    filePreview.innerHTML = '';
  }

  function createPreview(file) {
    clearPreview();
    const previewItem = document.createElement('div');
    previewItem.className = 'file-preview-item';

    let thumbnail;
    if (file.type.startsWith('image/')) {
      thumbnail = document.createElement('img');
      thumbnail.src = URL.createObjectURL(file);
      thumbnail.onload = () => URL.revokeObjectURL(thumbnail.src);
    } else if (file.type === 'application/pdf') {
      thumbnail = document.createElement('img');
      thumbnail.src = 'https://img.icons8.com/ios-filled/50/000000/pdf.png'; // PDF icon
      thumbnail.alt = 'PDF Icon';
    } else {
      thumbnail = document.createElement('span');
      thumbnail.textContent = 'File';
    }

    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-file';
    removeBtn.title = 'Remove file';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = () => {
      fileInput.value = '';
      clearPreview();
    };

    previewItem.appendChild(thumbnail);
    previewItem.appendChild(fileName);
    previewItem.appendChild(removeBtn);
    filePreview.appendChild(previewItem);
  }

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!['image/jpeg','image/png','application/pdf'].includes(file.type)) {
        showToast('Only JPG, PNG and PDF files allowed.', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('File must be under 2MB.', 'error');
        return;
      }
      fileInput.files = files; // set file input value
      createPreview(file);
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
      clearPreview();
      return;
    }
    if (!['image/jpeg','image/png','application/pdf'].includes(file.type)) {
      showToast('Only JPG, PNG and PDF files allowed.', 'error');
      fileInput.value = '';
      clearPreview();
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('File must be under 2MB.', 'error');
      fileInput.value = '';
      clearPreview();
      return;
    }
    createPreview(file);
  });

  // Accessibility: keyboard support for file-drop area
  fileDropArea.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // Notify parent iframe about height (if used in iframe)
  function sendHeight() {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'setHeight', height: height }, window.location.origin);
  }

  window.addEventListener('load', sendHeight);
  window.addEventListener('resize', sendHeight);

  const observer = new MutationObserver(sendHeight);
  observer.observe(document.body, { attributes: true, childList: true, subtree: true });

  
</script>
<script>
  const fileInput = document.getElementById('proof');
const fileDropArea = document.getElementById('fileDropArea');
const filePreview = document.getElementById('filePreview');

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
    fileInput.files = e.dataTransfer.files;
    updateFilePreview();
  }
});

fileInput.addEventListener('change', updateFilePreview);

function updateFilePreview() {
  filePreview.innerHTML = '';
  if (fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const fileName = file.name;
  const fileType = file.type;

  let previewHTML = `<div class="file-preview-item">`;

  if (fileType.startsWith('image/')) {
    const imgURL = URL.createObjectURL(file);
    previewHTML += `<img src="${imgURL}" alt="${fileName}" style="max-height: 60px; max-width: 60px; margin-right: 12px; border-radius: 8px; object-fit: contain;">`;
  } else if (fileType === 'application/pdf') {
    previewHTML += `<svg style="width: 40px; height: 40px; margin-right: 12px;" fill="currentColor" viewBox="0 0 24 24"><path d="M19 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8l5-5V4a2 2 0 0 0-2-2zM8 4h8v5h5v11h-5v-5H8V4z"/></svg>`;
  } else {
    previewHTML += `<span style="margin-right: 12px;">📄</span>`;
  }

  previewHTML += `<span>${fileName}</span></div>`;

  filePreview.innerHTML = previewHTML;
}

  </script>
</body>
</html>
