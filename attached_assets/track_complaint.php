<?php
session_start();
require 'db.php';
$username = $_SESSION['username'] ?? null;
if (!$username) {
    header('Location: login.php');
    exit;
}

// Fetch user_id from username
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    die("User not found.");
}
$user = $res->fetch_assoc();
$id = $user['id'];

$selected_id = '';
$result = null;
$error = '';

$stmt = $conn->prepare("SELECT id, complaint_code, description FROM complaints WHERE username = ? ORDER BY created_at DESC");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();
$complaints = [];
while ($row = $res->fetch_assoc()) {
    $complaints[] = $row;
}
$complaint_ids = array_column($complaints, 'id');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $selected_id = (int)($_POST['complaint_id'] ?? 0);
    if (!in_array($selected_id, $complaint_ids, true)) {
        $error = "Invalid Complaint selected.";
    } else {
        $stmt = $conn->prepare("
            SELECT 
                c.id, c.depo_name, c.email, c.contact_number,
                c.category, c.complaint_source, c.place_of_supply,
                c.complaint_location, c.month_store, c.complaint_type,
                c.sales_person, c.product_name, c.area_of_concern,
                c.subcategory, c.invoice_no, c.invoice_date,
                c.lr_number, c.transporter_name, c.description,
                c.created_at,
                u.name AS user_name, u.id AS user_id
            FROM complaints c
            JOIN users u ON c.username = u.username
            WHERE c.id = ?
        ");
        $stmt->bind_param("i", $selected_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            $error = "Complaint not found.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Track Complaint - CCMS</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    /* Variables matching Raise Complaint form */
    :root {
      --bg: #ffffff;
      --text: #1a1a1a;
      --card: #ffffff;
      --border: #ccc;
      --accent: #2575fc;
      --accent-hover: #1a57d9;
      --error: #e74c3c;
      --input-bg: #ffffff;
      --radius: 16px;
      --font: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      --shadow-light: rgba(37, 117, 252, 0.25);
    }
    body.dark-mode {
      --bg: #121212;
      --text: #e0e0e0;
      --card: #181818;
      --border: #444;
      --accent: #2575fc;
      --accent-hover: #1a57d9;
      --error: #e74c3c;
      --input-bg: #121212;
      --shadow-light: rgba(37, 117, 252, 0.6);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 40px 15px;
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .container {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.05),
        0 0 60px var(--shadow-light);
      max-width: 700px;
      width: 100%;
      padding: 40px 30px 50px;
      color: var(--text);
      transition: background 0.3s ease, color 0.3s ease;
    }

    h2 {
      text-align: center;
      font-weight: 700;
      font-size: 2.25rem;
      margin-bottom: 30px;
      user-select: none;
      color: var(--accent);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    label {
      font-weight: 600;
      color: var(--text);
      user-select: none;
    }

    select {
      width: 100%;
      padding: 14px 18px;
      border-radius: var(--radius);
      border: 1.8px solid var(--border);
      background-color: var(--input-bg);
      color: var(--text);
      font-size: 1rem;
      font-weight: 500;
      transition: border-color 0.3s ease;
      cursor: pointer;
    }
    select:focus {
      outline: none;
      border-color: var(--accent);
      background-color: var(--card);
      box-shadow: 0 0 8px var(--accent);
    }

    button {
      padding: 14px 26px;
      border: none;
      border-radius: var(--radius);
      background: var(--accent);
      color: white;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 15px var(--shadow-light);
      transition: background 0.3s ease, box-shadow 0.3s ease;
      user-select: none;
    }
    button:hover {
      background: var(--accent-hover);
      box-shadow: 0 6px 20px var(--shadow-light);
    }
    button:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }

    .error {
      color: var(--error);
      font-weight: 700;
      text-align: center;
      margin-top: 12px;
      user-select: none;
    }

    .info {
      margin-top: 24px;
      background: var(--card);
      padding: 30px 20px;
      border-radius: var(--radius);
      border: 2px solid var(--accent);
      box-shadow: 0 8px 30px var(--shadow-light);
      overflow-wrap: break-word;
      user-select: text;
    }

    .info p {
      margin: 8px 0;
      line-height: 1.6;
    }

    .info p strong {
      color: var(--accent);
    }

    /* Scroll if content overflows vertically */
    @media (max-height: 650px) {
      body {
        overflow-y: auto;
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .container {
        padding: 30px 20px 40px;
      }
      h2 {
        font-size: 1.75rem;
      }
      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>

<div class="container" role="main" aria-label="Track Complaint Form">
  <h2>Track Your Complaint</h2>

  <?php if (empty($complaint_ids)): ?>
    <p class="error">You have no complaints to track.</p>
  <?php endif; ?>

  <form method="post" aria-live="polite" aria-relevant="additions">
    <label for="complaint_id">Complaint ID</label>
    <select name="complaint_id" id="complaint_id" <?= empty($complaints) ? 'disabled' : 'required' ?>>
      <option value="" disabled <?= $selected_id === '' ? 'selected' : '' ?>>Select your complaint</option>
      <?php foreach ($complaints as $complaint): ?>
        <option value="<?= $complaint['id'] ?>" <?= $complaint['id'] == $selected_id ? 'selected' : '' ?>>
          <?= htmlspecialchars($complaint['complaint_code']) ?> - <?= htmlspecialchars(mb_strimwidth($complaint['description'], 0, 40, '...')) ?>
        </option>
      <?php endforeach; ?>
    </select>
    <button type="submit" <?= empty($complaint_ids) ? 'disabled' : '' ?>>Track</button>
  </form>

  <?php if ($error): ?>
    <div class="error" role="alert"><?= htmlspecialchars($error) ?></div>
  <?php elseif ($result && $result->num_rows): 
    $r = $result->fetch_assoc(); ?>
    <div class="info" tabindex="0" role="region" aria-label="Complaint details">
      <p><strong>ID:</strong> <?= $r['id'] ?></p>
      <p><strong>Raised by:</strong> <?= htmlspecialchars($r['user_name']) ?></p>
      <p><strong>Depot Name:</strong> <?= htmlspecialchars($r['depo_name']) ?></p>
      <p><strong>Email:</strong> <?= htmlspecialchars($r['email']) ?></p>
      <p><strong>Contact #:</strong> <?= htmlspecialchars($r['contact_number']) ?></p>
      <p><strong>Category:</strong> <?= htmlspecialchars($r['category']) ?></p>
      <p><strong>Source:</strong> <?= htmlspecialchars($r['complaint_source']) ?></p>
      <p><strong>Place of Supply:</strong> <?= htmlspecialchars($r['place_of_supply']) ?></p>
      <p><strong>Location:</strong> <?= htmlspecialchars($r['complaint_location']) ?></p>
      <p><strong>Month:</strong> <?= htmlspecialchars($r['month_store']) ?></p>
      <p><strong>Type:</strong> <?= htmlspecialchars($r['complaint_type']) ?></p>
      <p><strong>Sales Person:</strong> <?= htmlspecialchars($r['sales_person']) ?></p>
      <p><strong>Product:</strong> <?= htmlspecialchars($r['product_name']) ?></p>
      <p><strong>Area of Concern:</strong> <?= htmlspecialchars($r['area_of_concern']) ?></p>
      <p><strong>Subcategory:</strong> <?= htmlspecialchars($r['subcategory']) ?></p>
      <p><strong>Invoice No:</strong> <?= htmlspecialchars($r['invoice_no']) ?></p>
      <p><strong>Invoice Date:</strong> <?= htmlspecialchars($r['invoice_date']) ?></p>
      <p><strong>LR Number:</strong> <?= htmlspecialchars($r['lr_number']) ?></p>
      <p><strong>Description:</strong><br><?= nl2br(htmlspecialchars($r['description'])) ?></p>
      <p><strong>Created At:</strong> <?= date('d M Y, H:i', strtotime($r['created_at'])) ?></p>
    </div>
  <?php endif; ?>
</div>

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

  // Resize iframe
  function notifyParentHeight() {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ type: 'resize', height }, '*');
  }
  window.addEventListener('load', notifyParentHeight);
  document.querySelector('form').addEventListener('submit', () => {
    setTimeout(notifyParentHeight, 300);
  });
</script>

</body>
</html>
