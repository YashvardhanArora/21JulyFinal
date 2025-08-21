<?php
session_start();

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ccms";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$errors = [];
$confirmationData = null;
$confirmation = null;
if (isset($_SESSION['confirmation'])) {
    $confirmation = $_SESSION['confirmation'];
    unset($_SESSION['confirmation']);
}

// Handle POST request
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Helper function for cleaning input
    function clean($conn, $val) {
        return $conn->real_escape_string(trim($val));
    }

    // Server-side validation helper
    function validate_required($field, $val) {
        return !empty($val);
    }

    // Sanitize and validate inputs
    $Complaint_Source = clean($conn, $_POST['Complaint_Source'] ?? '');
    $Place_of_Supply = clean($conn, $_POST['Place_of_Supply'] ?? '');
    $Complaint_Receiving_Location = clean($conn, $_POST['Complaint_Receiving_Location'] ?? '');
    $Month = clean($conn, $_POST['Month'] ?? '');
    $Depo_Party_Name = clean($conn, $_POST['Depo_Party_Name'] ?? '');
    $Email = clean($conn, $_POST['Email'] ?? '');
    $Contact_Number = clean($conn, $_POST['Contact_Number'] ?? '');
    $Invoice_No = clean($conn, $_POST['Invoice_No'] ?? '');
    $Invoice_Date = clean($conn, $_POST['Invoice_Date'] ?? '');
    $LR_Number = clean($conn, $_POST['LR_Number'] ?? '');
    $Transporter_Name = clean($conn, $_POST['Transporter_Name'] ?? '');
    $Transporter_Number = clean($conn, $_POST['Transporter_Number'] ?? '');
    $Complaint_Type = clean($conn, $_POST['Complaint_Type'] ?? '');
    $Salesperson_Name = clean($conn, $_POST['Salesperson_Name'] ?? '');
    $Product_Name = clean($conn, $_POST['Product_Name'] ?? '');
    $Area_of_Concern = clean($conn, $_POST['Area_of_Concern'] ?? '');
    $Subcategory = clean($conn, $_POST['Subcategory'] ?? '');
    $Complaint_Creation_Date = clean($conn, $_POST['Complaint_Creation_Date'] ?? '');
    $Status = clean($conn, $_POST['Status'] ?? '');

    // Validate required fields server-side (simple example)
    $required_fields = [
        'Complaint_Source' => $Complaint_Source,
        'Place_of_Supply' => $Place_of_Supply,
        'Complaint_Receiving_Location' => $Complaint_Receiving_Location,
        'Depo_Party_Name' => $Depo_Party_Name,
        'Email' => $Email,
        'Contact_Number' => $Contact_Number,
        'Invoice_No' => $Invoice_No,
        'Invoice_Date' => $Invoice_Date,
        'LR_Number' => $LR_Number,
        'Transporter_Name' => $Transporter_Name,
        'Transporter_Number' => $Transporter_Number,
        'Complaint_Type' => $Complaint_Type,
        'Salesperson_Name' => $Salesperson_Name,
        'Product_Name' => $Product_Name,
        'Area_of_Concern' => $Area_of_Concern,
        'Subcategory' => $Subcategory,
        'Complaint_Creation_Date' => $Complaint_Creation_Date,
        'Status' => $Status,
    ];

    foreach ($required_fields as $field => $value) {
        if (!validate_required($field, $value)) {
            $errors[$field] = "The $field field is required.";
        }
    }

    // Email format validation
    if (!filter_var($Email, FILTER_VALIDATE_EMAIL)) {
        $errors['Email'] = "Invalid email format.";
    }

    // Contact number validation (digits 10-15)
    if (!preg_match('/^\d{10,15}$/', $Contact_Number)) {
        $errors['Contact_Number'] = "Contact Number must be 10 to 15 digits.";
    }
    if (!preg_match('/^\d{10,15}$/', $Transporter_Number)) {
        $errors['Transporter_Number'] = "Transporter Number must be 10 to 15 digits.";
    }

    // File upload handling & validation
    $uploadDir = "uploads/";
    $uploadedFileName = null;

    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['attachment']['tmp_name'];
            $fileName = basename($_FILES['attachment']['name']);
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
            $maxFileSize = 5 * 1024 * 1024; // 5 MB max

            if (!in_array($fileExtension, $allowedExtensions)) {
                $errors['attachment'] = "Only PDF, JPG, JPEG, PNG files are allowed.";
            } elseif ($_FILES['attachment']['size'] > $maxFileSize) {
                $errors['attachment'] = "File size must be less than 5 MB.";
            } else {
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                // Secure file name with timestamp and sanitized name
                $newFileName = time() . "_" . preg_replace("/[^a-zA-Z0-9.]/", "_", $fileName);
                $destPath = $uploadDir . $newFileName;
                if (!move_uploaded_file($fileTmpPath, $destPath)) {
                    $errors['attachment'] = "File upload failed.";
                } else {
                    $uploadedFileName = $newFileName;
                }
            }
        } else {
            $errors['attachment'] = "File upload error code: " . $_FILES['attachment']['error'];
        }
    }

    if (empty($errors)) {
        // Use prepared statement for security
        $stmt = $conn->prepare("INSERT INTO complaimnts (
            Complaint_Source, Place_of_Supply, Complaint_Receiving_Location, Month,
            Depo_Party_Name, Email, Contact_Number, Invoice_No, Invoice_Date,
            LR_Number, Transporter_Name, Transporter_Number, Complaint_Type,
            Salesperson_Name, Product_Name, Area_of_Concern, Subcategory,
            Complaint_Creation_Date, Status, File_Attachment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->bind_param("ssssssssssssssssssss",
            $Complaint_Source, $Place_of_Supply, $Complaint_Receiving_Location, $Month,
            $Depo_Party_Name, $Email, $Contact_Number, $Invoice_No, $Invoice_Date,
            $LR_Number, $Transporter_Name, $Transporter_Number, $Complaint_Type,
            $Salesperson_Name, $Product_Name, $Area_of_Concern, $Subcategory,
            $Complaint_Creation_Date, $Status, $uploadedFileName
        );

        if ($stmt->execute()) {
            $lastId = $stmt->insert_id;
            $year = date('y');
            $month = date('m');
            $serialNo = str_pad($lastId, 3, '0', STR_PAD_LEFT);
            $ticketNo = $year . $month . $serialNo;

            // Update Ticket_No
            $updateStmt = $conn->prepare("UPDATE complaimnts SET Ticket_No = ? WHERE id = ?");
            $updateStmt->bind_param("si", $ticketNo, $lastId);
            $updateStmt->execute();
            $updateStmt->close();

            // Store confirmation data in session for showing confirmation page
            $_SESSION['confirmation'] = [
                'Ticket_No' => $ticketNo,
                'Complaint_Source' => $Complaint_Source,
                'Place_of_Supply' => $Place_of_Supply,
                'Complaint_Receiving_Location' => $Complaint_Receiving_Location,
                'Month' => $Month,
                'Depo_Party_Name' => $Depo_Party_Name,
                'Email' => $Email,
                'Contact_Number' => $Contact_Number,
                'Invoice_No' => $Invoice_No,
                'Invoice_Date' => $Invoice_Date,
                'LR_Number' => $LR_Number,
                'Transporter_Name' => $Transporter_Name,
                'Transporter_Number' => $Transporter_Number,
                'Complaint_Type' => $Complaint_Type,
                'Salesperson_Name' => $Salesperson_Name,
                'Product_Name' => $Product_Name,
                'Area_of_Concern' => $Area_of_Concern,
                'Subcategory' => $Subcategory,
                'Complaint_Creation_Date' => $Complaint_Creation_Date,
                'Status' => $Status,
                'File_Attachment' => $uploadedFileName,
            ];

            $stmt->close();
            $conn->close();

            // Redirect to confirmation page
            header("Location: complaint_form.php");
            exit;
        } else {
            $errors['db'] = "Database error: " . $stmt->error;
        }

        $stmt->close();
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Raise Complaint</title>
<style>
  /* Your existing CSS (same as before) with minor additions for validation */
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: transparent;
    font-family: 'Poppins', sans-serif;
  }

  :root {
    --color-bg: #fff;
    --color-bg-dark: #121212;
    --color-text: #111;
    --color-text-light: #eee;
    --color-primary: #000;
    --color-primary-light: #444;
    --color-progress-bg: #ddd;
    --color-progress-active: #000;
    --color-button-bg: #000;
    --color-button-hover-bg: #444;
    --error-color: #cc0000;
  }

  body {
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: var(--color-bg);
    color: var(--color-text);
    transition: background-color 0.4s ease, color 0.4s ease;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  body.dark {
    background: var(--color-bg-dark);
    color: var(--color-text-light);
  }
  .container, form, .main {
  overflow: hidden;
}

  .container {
    width: 100%;
    max-width: 900px;
    background: var(--color-bg);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    padding: 40px 50px;
    box-sizing: border-box;
    transition: background 0.4s ease, color 0.4s ease;
  }
  body.dark .container {
    background: #222;
    box-shadow: 0 10px 30px rgba(255,255,255,0.1);
  }
  .progressbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
    position: relative;
    counter-reset: step;
  }
  .progressbar::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 30px;
    right: 30px;
    height: 4px;
    background: var(--color-progress-bg);
    z-index: 0;
    border-radius: 2px;
  }
  .progressbar li {
    list-style-type: none;
    width: 33.3333%;
    text-align: center;
    position: relative;
    font-weight: 600;
    font-size: 14px;
    color: var(--color-primary-light);
    cursor: default;
    z-index: 1;
    user-select: none;
  }
  .progressbar li::before {
    counter-increment: step;
    content: counter(step);
    width: 36px;
    height: 36px;
    line-height: 36px;
    display: block;
    margin: 0 auto 12px auto;
    background: var(--color-progress-bg);
    border-radius: 50%;
    color: var(--color-primary-light);
    font-weight: 700;
    font-size: 18px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    transition: background-color 0.4s ease, color 0.4s ease;
  }
  .progressbar li.active {
    color: var(--color-primary);
    font-weight: 700;
  }
  .progressbar li.active::before {
    background: var(--color-progress-active);
    color: var(--color-bg);
    box-shadow: 0 0 10px var(--color-progress-active);
  }
  .progressbar li:not(:last-child)::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 4px;
    background: var(--color-progress-bg);
    top: 16px;
    left: 50%;
    z-index: -1;
    transition: background-color 0.4s ease;
    border-radius: 2px;
  }
  .progressbar li.active:not(:last-child)::after {
    background: var(--color-progress-active);
  }
  .progressbar li::before {
    font-family: 'Segoe UI Symbol', sans-serif;
  }
  .progressbar li:nth-child(1)::before {
    content: "\270D"; /* Pencil icon */
  }
  .progressbar li:nth-child(2)::before {
    content: "\1F4C4"; /* Page icon */
  }
  .progressbar li:nth-child(3)::before {
    content: "\1F4E6"; /* Package icon */
  }
  form {
    display: flex;
    flex-direction: column;
  }
  .step {
    display: none;
    animation: fadeIn 0.5s ease forwards;
  }
  .step.active {
    display: block;
  }
  @keyframes fadeIn {
    from {opacity: 0; transform: translateY(10px);}
    to {opacity: 1; transform: translateY(0);}
  }
  .input-group {
    margin-bottom: 18px;
    position: relative;
  }
  .input-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
    color: inherit;
  }
  .input-group input,
  .input-group select {
    width: 100%;
    padding: 12px 14px;
    border: 1.8px solid #bbb;
    border-radius: 8px;
    font-size: 15px;
    background: transparent;
    color: inherit;
    transition: border-color 0.3s ease;
    outline-offset: 3px;
  }
  .input-group input:focus,
  .input-group select:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 8px var(--color-primary);
  }
  .input-group input.invalid,
  .input-group select.invalid {
    border-color: var(--error-color);
  }
  .error-message {
    color: var(--error-color);
    font-size: 13px;
    margin-top: 4px;
    min-height: 18px;
  }
  /* Preview image */
  #filePreview {
    max-width: 120px;
    max-height: 120px;
    margin-top: 8px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    display: none;
  }
  /* Buttons */
  .buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 35px;
  }
  .buttons button {
    flex: 1;
    padding: 12px 0;
    margin: 0 8px;
    border: none;
    border-radius: 25px;
    font-weight: 700;
    font-size: 16px;
    background-color: var(--color-button-bg);
    color: var(--color-bg);
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transition: background-color 0.3s ease, transform 0.15s ease;
    position: relative;
  }
  .buttons button:hover:not(:disabled) {
    background-color: var(--color-button-hover-bg);
    transform: translateY(-2px);
  }
  .buttons button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
    transform: none;
  }
  .buttons button:first-child {
    margin-left: 0;
  }
  .buttons button:last-child {
    margin-right: 0;
  }
  /* Loading spinner */
  .spinner {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
  }
  @keyframes spin {
    0% { transform: rotate(0deg) translateY(-50%);}
    100% { transform: rotate(360deg) translateY(-50%);}
  }
  /* Theme Toggle */
  .theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: var(--color-button-bg);
    border: none;
    border-radius: 25px;
    font-weight: 700;
    font-size: 14px;
    color: var(--color-bg);
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transition: background-color 0.3s ease;
    user-select: none;
  }
  .theme-toggle:hover {
    background: var(--color-button-hover-bg);
  }
  /* Responsive */
  @media (max-width: 640px) {
    .container {
      padding: 25px 20px;
    }
    .buttons {
      flex-direction: column;
    }
    .buttons button {
      margin: 8px 0;
      width: 100%;
    }
    .progressbar li::before {
      width: 30px;
      height: 30px;
      line-height: 30px;
      font-size: 16px;
    }
  }
</style>
</head>
<body>
  <button class="theme-toggle" aria-label="Toggle theme" title="Toggle Light/Dark Theme" onclick="toggleTheme()">🌗</button>
  <div class="container" role="main" aria-label="Raise Complaint Form">
    <ul class="progressbar" role="list" aria-label="Form Progress" aria-live="polite" aria-atomic="true" id="progressbar">
      <li class="active" aria-current="step" aria-label="Basic Info">Basic Info</li>
      <li aria-label="Invoice and Transport Details">Invoice & Transport</li>
      <li aria-label="Product and Summary">Product & Summary</li>
    </ul>

    <?php if (!empty($errors)): ?>
      <div role="alert" style="color: var(--error-color); font-weight:700; margin-bottom: 1em;">
        Please fix the errors below before submitting.
      </div>
    <?php endif; ?>
    <?php if ($confirmation): ?>
  <div role="alert" style="background:#d4edda; color:#155724; padding:15px; border-radius:8px; margin-bottom:20px;">
    <strong>Complaint Submitted Successfully!</strong><br />
    Your Ticket Number is: <code><?= htmlspecialchars($confirmation['Ticket_No']) ?></code><br />
    Thank you for your submission.
  </div>
<?php endif; ?>

    <form id="complaintForm" method="POST" action="complaint_form.php" enctype="multipart/form-data" novalidate>
      <!-- Step 1 -->
      <div class="step active" aria-live="polite" aria-atomic="true" data-step="1">
        <div class="input-group">
          <label for="Complaint_Source">Complaint Source</label>
          <select id="Complaint_Source" name="Complaint_Source" required
            aria-describedby="errComplaint_Source">
            <option value="">Select</option>
            <option value="Depot" <?= (isset($_POST['Complaint_Source']) && $_POST['Complaint_Source'] === 'Depot') ? 'selected' : '' ?>>Depot</option>
            <option value="Customer" <?= (isset($_POST['Complaint_Source']) && $_POST['Complaint_Source'] === 'Customer') ? 'selected' : '' ?>>Customer</option>
            <option value="Management" <?= (isset($_POST['Complaint_Source']) && $_POST['Complaint_Source'] === 'Management') ? 'selected' : '' ?>>Management</option>
          </select>
          <div id="errComplaint_Source" class="error-message"><?= $errors['Complaint_Source'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Place_of_Supply">Place of Supply</label>
          <select id="Place_of_Supply" name="Place_of_Supply" required
            aria-describedby="errPlace_of_Supply">
            <option value="">Select</option>
            <option value="Agra" <?= (isset($_POST['Place_of_Supply']) && $_POST['Place_of_Supply'] === 'Agra') ? 'selected' : '' ?>>Agra</option>
            <option value="Mathura" <?= (isset($_POST['Place_of_Supply']) && $_POST['Place_of_Supply'] === 'Mathura') ? 'selected' : '' ?>>Mathura</option>
            <option value="Bhimasur" <?= (isset($_POST['Place_of_Supply']) && $_POST['Place_of_Supply'] === 'Bhimasur') ? 'selected' : '' ?>>Bhimasur</option>
          </select>
          <div id="errPlace_of_Supply" class="error-message"><?= $errors['Place_of_Supply'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Complaint_Receiving_Location">Complaint Receiving Location</label>
          <input id="Complaint_Receiving_Location" name="Complaint_Receiving_Location" type="text" required
            aria-describedby="errComplaint_Receiving_Location"
            value="<?= htmlspecialchars($_POST['Complaint_Receiving_Location'] ?? '') ?>" />
          <div id="errComplaint_Receiving_Location" class="error-message"><?= $errors['Complaint_Receiving_Location'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Month">Month</label>
          <input id="Month" name="Month" type="text" value="<?php echo date('F'); ?>" readonly />
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step" aria-live="polite" aria-atomic="true" data-step="2">
        <div class="input-group">
          <label for="Depo_Party_Name">Depo/Party Name</label>
          <input id="Depo_Party_Name" name="Depo_Party_Name" type="text" required
            aria-describedby="errDepo_Party_Name"
            value="<?= htmlspecialchars($_POST['Depo_Party_Name'] ?? '') ?>" />
          <div id="errDepo_Party_Name" class="error-message"><?= $errors['Depo_Party_Name'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Email">Email</label>
          <input id="Email" name="Email" type="email" required
            aria-describedby="errEmail"
            value="<?= htmlspecialchars($_POST['Email'] ?? '') ?>" />
          <div id="errEmail" class="error-message"><?= $errors['Email'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Contact_Number">Contact Number</label>
          <input id="Contact_Number" name="Contact_Number" type="tel" pattern="[0-9]{10,15}" title="Enter valid phone number" required
            aria-describedby="errContact_Number"
            value="<?= htmlspecialchars($_POST['Contact_Number'] ?? '') ?>" />
          <div id="errContact_Number" class="error-message"><?= $errors['Contact_Number'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Invoice_No">Invoice No</label>
          <input id="Invoice_No" name="Invoice_No" type="text" required
            aria-describedby="errInvoice_No"
            value="<?= htmlspecialchars($_POST['Invoice_No'] ?? '') ?>" />
          <div id="errInvoice_No" class="error-message"><?= $errors['Invoice_No'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Invoice_Date">Invoice Date</label>
          <input id="Invoice_Date" name="Invoice_Date" type="date" required
            aria-describedby="errInvoice_Date"
            value="<?= htmlspecialchars($_POST['Invoice_Date'] ?? '') ?>" />
          <div id="errInvoice_Date" class="error-message"><?= $errors['Invoice_Date'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="LR_Number">LR Number</label>
          <input id="LR_Number" name="LR_Number" type="text" required
            aria-describedby="errLR_Number"
            value="<?= htmlspecialchars($_POST['LR_Number'] ?? '') ?>" />
          <div id="errLR_Number" class="error-message"><?= $errors['LR_Number'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Transporter_Name">Transporter Name</label>
          <input id="Transporter_Name" name="Transporter_Name" type="text" required
            aria-describedby="errTransporter_Name"
            value="<?= htmlspecialchars($_POST['Transporter_Name'] ?? '') ?>" />
          <div id="errTransporter_Name" class="error-message"><?= $errors['Transporter_Name'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Transporter_Number">Transporter Number</label>
          <input id="Transporter_Number" name="Transporter_Number" type="tel" pattern="[0-9]{10,15}" title="Enter valid phone number" required
            aria-describedby="errTransporter_Number"
            value="<?= htmlspecialchars($_POST['Transporter_Number'] ?? '') ?>" />
          <div id="errTransporter_Number" class="error-message"><?= $errors['Transporter_Number'] ?? '' ?></div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step" aria-live="polite" aria-atomic="true" data-step="3">
        <div class="input-group">
          <label for="Complaint_Type">Complaint Type</label>
          <select id="Complaint_Type" name="Complaint_Type" required
            aria-describedby="errComplaint_Type">
            <option value="">Select</option>
            <option value="Complaint" <?= (isset($_POST['Complaint_Type']) && $_POST['Complaint_Type'] === 'Complaint') ? 'selected' : '' ?>>Complaint</option>
            <option value="Query" <?= (isset($_POST['Complaint_Type']) && $_POST['Complaint_Type'] === 'Query') ? 'selected' : '' ?>>Query</option>
          </select>
          <div id="errComplaint_Type" class="error-message"><?= $errors['Complaint_Type'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Salesperson_Name">Salesperson Name</label>
          <input id="Salesperson_Name" name="Salesperson_Name" type="text" required
            aria-describedby="errSalesperson_Name"
            value="<?= htmlspecialchars($_POST['Salesperson_Name'] ?? '') ?>" />
          <div id="errSalesperson_Name" class="error-message"><?= $errors['Salesperson_Name'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Product_Name">Product Name</label>
          <select id="Product_Name" name="Product_Name" required
            aria-describedby="errProduct_Name">
            <option value="">Select</option>
            <option value="Nutrica" <?= (isset($_POST['Product_Name']) && $_POST['Product_Name'] === 'Nutrica') ? 'selected' : '' ?>>Nutrica</option>
            <option value="Healthy Value" <?= (isset($_POST['Product_Name']) && $_POST['Product_Name'] === 'Healthy Value') ? 'selected' : '' ?>>Healthy Value</option>
          </select>
          <div id="errProduct_Name" class="error-message"><?= $errors['Product_Name'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Area_of_Concern">Area of Concern</label>
          <select id="Area_of_Concern" name="Area_of_Concern" required
            aria-describedby="errArea_of_Concern">
            <option value="">Select</option>
            <option value="Packaging Issue" <?= (isset($_POST['Area_of_Concern']) && $_POST['Area_of_Concern'] === 'Packaging Issue') ? 'selected' : '' ?>>Packaging Issue</option>
            <option value="Product Issue" <?= (isset($_POST['Area_of_Concern']) && $_POST['Area_of_Concern'] === 'Product Issue') ? 'selected' : '' ?>>Product Issue</option>
          </select>
          <div id="errArea_of_Concern" class="error-message"><?= $errors['Area_of_Concern'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Subcategory">Subcategory</label>
          <select id="Subcategory" name="Subcategory" required
            aria-describedby="errSubcategory">
            <option value="">Select</option>
            <option value="Leakages" <?= (isset($_POST['Subcategory']) && $_POST['Subcategory'] === 'Leakages') ? 'selected' : '' ?>>Leakages</option>
            <option value="Stock short" <?= (isset($_POST['Subcategory']) && $_POST['Subcategory'] === 'Stock short') ? 'selected' : '' ?>>Stock short</option>
          </select>
          <div id="errSubcategory" class="error-message"><?= $errors['Subcategory'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="Complaint_Creation_Date">Complaint Creation Date</label>
          <input id="Complaint_Creation_Date" name="Complaint_Creation_Date" type="date" value="<?php echo date('Y-m-d'); ?>" readonly />
        </div>
        <div class="input-group">
          <label for="Status">Status</label>
          <select id="Status" name="Status" required aria-describedby="errStatus">
            <option value="Open" <?= (isset($_POST['Status']) && $_POST['Status'] === 'Open') ? 'selected' : '' ?>>Open</option>
            <option value="In Progress" <?= (isset($_POST['Status']) && $_POST['Status'] === 'In Progress') ? 'selected' : '' ?>>In Progress</option>
          </select>
          <div id="errStatus" class="error-message"><?= $errors['Status'] ?? '' ?></div>
        </div>
        <div class="input-group">
          <label for="attachment">Attach File (optional)</label>
          <input id="attachment" name="attachment" type="file" accept=".jpg,.jpeg,.png,.pdf"
            aria-describedby="errattachment" />
          <div id="errattachment" class="error-message"><?= $errors['attachment'] ?? '' ?></div>
          <img id="filePreview" alt="File Preview" />
        </div>
      </div>

      <!-- Add these buttons below the form buttons -->
<div class="buttons" role="group" aria-label="Form navigation buttons">
  <button type="button" id="prevBtn" onclick="prevStep()" disabled aria-disabled="true" aria-label="Previous step">Back</button>
  <button type="button" id="nextBtn" onclick="nextStep()" aria-label="Next step">Next</button>
  <button type="button" id="saveDraftBtn" onclick="saveDraft()" aria-label="Save draft">Save Draft</button>
  <button type="button" id="loadDraftBtn" onclick="loadDraft()" aria-label="Load draft">Load Draft</button>
</div>

      </div>
    </form>
  </div>

<script>
  // Multi-step form logic with validation and aria-live announcements
  const steps = document.querySelectorAll('.step');
  const progressItems = document.querySelectorAll('.progressbar li');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const form = document.getElementById('complaintForm');
  const fileInput = document.getElementById('attachment');
  const filePreview = document.getElementById('filePreview');

  let currentStep = 0;

  function announce(message) {
    // Could be enhanced with ARIA live regions - handled by aria-live="polite" on progress bar
    // We just rely on existing markup here
    console.log("Announcement: ", message);
  }

  function showStep(step) {
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === step);
      progressItems[i].classList.toggle('active', i <= step);
    });
    prevBtn.disabled = step === 0;
    prevBtn.setAttribute('aria-disabled', step === 0);
    nextBtn.textContent = (step === steps.length - 1) ? 'Submit' : 'Next';

    validateStep();
    announce(`Step ${step + 1} of ${steps.length} displayed.`);
  }

  function validateStep() {
    const inputs = steps[currentStep].querySelectorAll('input, select');
    let allValid = true;
    inputs.forEach(input => {
      if (!input.checkValidity()) {
        allValid = false;
      }
    });
    nextBtn.disabled = !allValid;
    nextBtn.setAttribute('aria-disabled', !allValid);
  }

  function nextStep() {
    if (!nextBtn.disabled) {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      } else {
        // Final step: submit the form
        if (validateAllSteps()) {
          form.submit();
        } else {
          alert("Please fix errors before submitting the form.");
        }
      }
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  }

  // Validate all steps before final submission
  function validateAllSteps() {
    for (let i = 0; i < steps.length; i++) {
      const inputs = steps[i].querySelectorAll('input, select');
      for (const input of inputs) {
        if (!input.checkValidity()) {
          return false;
        }
      }
    }
    return true;
  }

  // Preview file if image
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      const fileType = file.type;
      if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          filePreview.src = e.target.result;
          filePreview.style.display = 'block';
          filePreview.style.maxWidth = '200px';
          filePreview.style.marginTop = '10px';
          filePreview.style.borderRadius = '8px';
        };
        reader.readAsDataURL(file);
      } else {
        filePreview.style.display = 'none';
      }
    }
  });

  // Listen for input changes to re-validate step
  steps.forEach(step => {
    step.addEventListener('input', () => {
      validateStep();
    });
  });

  // Theme toggle
  function toggleTheme() {
    document.body.classList.toggle('dark');
  }

  showStep(currentStep);
  // Save draft function
function saveDraft() {
  const formData = {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if(input.type === 'file') return; // skip files for now
    formData[input.name] = input.value;
  });
  localStorage.setItem('complaintDraft', JSON.stringify(formData));
  alert('Draft saved locally!');
}

// Load draft function
function loadDraft() {
  const draft = localStorage.getItem('complaintDraft');
  if (!draft) {
    alert('No draft found!');
    return;
  }
  const formData = JSON.parse(draft);
  Object.keys(formData).forEach(name => {
    const input = form.querySelector(`[name="${name}"]`);
    if (input) {
      input.value = formData[name];
      input.dispatchEvent(new Event('input')); // Trigger validation on load
    }
  });
  alert('Draft loaded!');
  validateStep();  // Re-validate current step after loading draft
}

// Live validation with inline errors
const inputs = form.querySelectorAll('input, select');

inputs.forEach(input => {
  input.addEventListener('input', () => {
    validateInput(input);
    validateStep();
  });
  input.addEventListener('blur', () => {
    validateInput(input);
  });
});

function validateInput(input) {
  const errorElem = document.getElementById('err' + input.id);
  if (!errorElem) return;

  if (input.validity.valid) {
    errorElem.textContent = '';
  } else {
    if (input.validity.valueMissing) {
      errorElem.textContent = 'This field is required.';
    } else if (input.validity.typeMismatch) {
      errorElem.textContent = 'Please enter a valid value.';
    } else if (input.validity.patternMismatch) {
      errorElem.textContent = 'Please match the requested format.';
    } else {
      errorElem.textContent = 'Invalid input.';
    }
  }
}

// Override validateStep to check all inputs on current step and disable/enable Next button
function validateStep() {
  const stepInputs = steps[currentStep].querySelectorAll('input, select');
  let allValid = true;
  stepInputs.forEach(input => {
    if (!input.checkValidity()) {
      allValid = false;
      validateInput(input); // show error message
    }
  });
  nextBtn.disabled = !allValid;
  nextBtn.setAttribute('aria-disabled', !allValid);
}

</script>
<script>
  function resizeIframe() {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ type: 'setHeight', height }, '*');
  }

  window.addEventListener('load', resizeIframe);
  window.addEventListener('resize', resizeIframe);
  setInterval(resizeIframe, 500); // fallback for dynamic changes
</script>

</body>
</html>
