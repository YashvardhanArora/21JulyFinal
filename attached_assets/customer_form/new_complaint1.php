<?php
session_start();
require 'db.php';
$submitted_code = '';

// Get username from session
$username = $_SESSION['username'] ?? null;
if (!$username) {
    die('Please log in.');
}

// Fetch user ID, email, phone
$stmtUser = $conn->prepare("SELECT id, email, phone FROM users WHERE username = ?");
$stmtUser->bind_param("s", $username);
$stmtUser->execute();
$resultUser = $stmtUser->get_result();

if ($resultUser->num_rows === 0) {
    die('User not found.');
}

$user = $resultUser->fetch_assoc();
$user_id = $user['id']; // ✅ you need this for the foreign key
$email = $user['email'];
$phone = $user['phone'];
$stmtUser->close();

    function clean($conn, $v){ return htmlspecialchars(strip_tags(trim($conn->real_escape_string($v)))); }
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // sanitize inputs
    $fields = ['depo_name','email','contact_number','category','complaint_source','place_of_supply',
       'complaint_location','month','complaint_type','sales_person','product_name','area_of_concern',
       'subcategory','invoice_no','invoice_date','lr_number','transporter_name','description'];
    foreach ($fields as $f) $$f = clean($conn, $_POST[$f] ?? '');

    // file upload
    $file_name = '';
    if (!empty($_FILES['attachment']['tmp_name'])) {
        $ext = pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION);
        $file_name = uniqid('file_').'.'.$ext;
        move_uploaded_file($_FILES['attachment']['tmp_name'], 'uploads/'.$file_name);
    }

    // complaint code
    $year = date('y'); // last 2 digits of year
$month = date('m'); // 2-digit month

// Fetch latest serial number from complaints table
$stmtSerial = $conn->prepare("SELECT COUNT(*) AS total FROM complaints WHERE DATE_FORMAT(created_at, '%y%m') = ?");
$currentPeriod = $year . $month;
$stmtSerial->bind_param("s", $currentPeriod);
$stmtSerial->execute();
$resultSerial = $stmtSerial->get_result();
$row = $resultSerial->fetch_assoc();
$serial = str_pad($row['total'] + 1, 4, '0', STR_PAD_LEFT); // padded to 4 digits
$stmtSerial->close();

$complaint_code = $year . $month . $serial;


    // insert
    $stmt = $conn->prepare("INSERT INTO complaints (
  user_id, username, complaint_code, depo_name, email, contact_number, category, complaint_source, 
  place_of_supply, complaint_location, month_store, complaint_type, sales_person, product_name, 
  area_of_concern, subcategory, invoice_no, invoice_date, lr_number, transporter_name, 
  `description`, file_name
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");


$stmt->bind_param(
  "isssssssssssssssssssss", // 1 int (user_id) + 21 strings
  $user_id, $username, $complaint_code, $depo_name, $email, $contact_number, $category, 
  $complaint_source, $place_of_supply, $complaint_location, $month, $complaint_type, 
  $sales_person, $product_name, $area_of_concern, $subcategory, $invoice_no, $invoice_date, 
  $lr_number, $transporter_name, $description, $file_name
);





    if ($stmt->execute()) {
        $alert = "Complaint submitted! ID: $complaint_code";
        $submitted_code = $complaint_code;

    } else {
        $alert = "Submission failed. Try again.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Raise Complaint</title>
<style>
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
  --card: #ffffff;
  --border: #ccc;
  --accent: #2575fc;
  --error: #e74c3c;
  --input-bg: #ffffff;
  --shadow-light: rgba(37, 117, 252, 0.6);
}

body.dark-mode {
  --bg: #121212;
  --text: #e0e0e0;
  --card: #181818;
  --border: #444;
  --accent: #2575fc;
  --error: #e74c3c;
  --input-bg: #121212;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 15px;
  overflow-y: hidden;
}

/* Container */
.container {
  background: var(--card);
  border-radius: 16px;
  box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.05),
        0 0 60px var(--shadow-light);
  max-width: 600px;
  width: 100%;
  padding: 40px 30px 50px;
  position: relative;
  color: var(--text);
}

/* Headings */
h2 {
  text-align: center;
  font-weight: 700;
  font-size: 2.25rem;
  color: var(--text);
  margin-bottom: 30px;
  user-select: none;
}

/* Progress Bar */
.progressbar {
  display: flex;
  justify-content: space-between;
  counter-reset: step;
  margin-bottom: 40px;
}
.progressbar li {
  list-style: none;
  text-align: center;
  flex: 1;
  position: relative;
  font-size: 14px;
  color: var(--border);
  font-weight: 600;
  text-transform: uppercase;
  user-select: none;
}
.progressbar li::before {
  content: counter(step);
  counter-increment: step;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border: 2px solid var(--border);
  display: block;
  text-align: center;
  margin: 0 auto 8px;
  border-radius: 50%;
  background-color: var(--input-bg);
  color: var(--border);
  font-weight: 700;
  transition: all 0.3s ease;
}
.progressbar li.active {
  color: var(--accent);
}
.progressbar li.active::before {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}
.progressbar li:not(:last-child)::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: var(--border);
  top: 16px;
  left: calc(50% + 16px);
  z-index: -1;
  transition: background-color 0.3s ease;
}
.progressbar li.active:not(:last-child)::after {
  background-color: var(--accent);
}

/* Form */
form {
  width: 100%;
}
fieldset {
  border: none;
  padding: 0;
  display: none;
  animation: fadeIn 0.5s ease forwards;
}
fieldset.active {
  display: block;
}
legend {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text);
  margin-bottom: 20px;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 6px;
  user-select: none;
}

/* Inputs */
input[type="text"],
input[type="email"],
input[type="date"],
select,
textarea {
  width: 100%;
  padding: 14px 18px;
  margin-bottom: 18px;
  border-radius: 12px;
  border: 1.8px solid var(--border);
  font-size: 1rem;
  color: var(--text);
  background-color: var(--input-bg);
  transition: border-color 0.3s ease;
  font-weight: 500;
}
input[type="text"]:focus,
input[type="email"]:focus,
input[type="date"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
  background-color: var(--card);
  box-shadow: 0 0 8px rgba(37, 117, 252, 0.5);
}
textarea {
  min-height: 100px;
  resize: vertical;
}
input[readonly] {
  background-color: var(--input-bg);
  color: var(--text);
  cursor: not-allowed;
  opacity: 0.8;
}


/* Error */
.error-text {
  font-size: 13px;
  color: var(--error);
  margin-top: -14px;
  margin-bottom: 14px;
  min-height: 18px;
}

/* Buttons */
.button-group {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
button {
  background: var(--accent);
  border: none;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 14px 26px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(37, 117, 252, 0.6);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  flex: 1 1 auto;
  min-width: 140px;
}
button:hover {
  background: #1a57d9;
  box-shadow: 0 6px 20px rgba(26, 87, 217, 0.8);
}
.secondary-btn {
  background: var(--border);
  box-shadow: 0 4px 15px rgba(68, 68, 68, 0.6);
}
.secondary-btn:hover {
  background: #333333;
  box-shadow: 0 6px 20px rgba(51, 51, 51, 0.8);
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2ecc71;
  color: white;
  padding: 16px 28px;
  border-radius: 30px;
  font-weight: 600;
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.8);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: 1000;
  user-select: none;
}
.toast.show {
  opacity: 1;
  pointer-events: auto;
}

/* Ticket Banner */
.ticket-banner {
  margin-top: 40px;
  padding: 30px 20px;
  background: linear-gradient(145deg, var(--card), var(--border));
  border: 2px solid var(--accent);
  border-radius: 16px;
  text-align: center;
  color: var(--text);
  box-shadow: 0 8px 30px rgba(37, 117, 252, 0.25);
}
.ticket-banner h3 {
  font-size: 1.6rem;
  margin-bottom: 12px;
  color: #2ecc71;
}
.ticket-banner p {
  font-size: 1rem;
  margin-bottom: 8px;
}
.ticket-code {
  background: var(--accent);
  display: inline-block;
  padding: 12px 24px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 10px;
  color: #fff;
  letter-spacing: 1px;
  margin-top: 10px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
    flex: 1 1 100%;
    min-width: auto;
  }
}
</style>

</head>
<body>

<div class="container" role="main" aria-label="Raise Complaint Form">
  <h2>Raise a Complaint</h2>

  <ul class="progressbar" id="progressbar" aria-label="Form progress steps">
    <li class="active">Personal</li>
    <li>Details</li>
    <li>Invoice</li>
    <li>Summary</li>
  </ul>

  <form id="multiStepForm" enctype="multipart/form-data" method="POST" action="new_complaint1.php" novalidate>

    <!-- Step 1 -->
        <fieldset class="active">
      <legend>Personal Details</legend>
      <input type="text" name="depo_name" placeholder="Depo/Party Name" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <input type="email" name="email" placeholder="Email" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <!-- contact_number is NOT required now -->
      <input type="text" name="contact_number" placeholder="Contact Number" aria-required="false" />
      <div class="error-text" aria-live="polite"></div>

      <div class="button-group">
        <button type="button" onclick="validateStep()" aria-label="Next step">Next</button>
        <button type="button" class="secondary-btn" onclick="saveDraft()" aria-label="Save draft">Save Draft</button>
      </div>
    </fieldset>

    <!-- Step 2 -->
    <fieldset>
      <legend>Complaint Details</legend>

      <select name="category" required aria-required="true" aria-label="Category">
        <option value="">Select Category</option>
        <option value="Product">Product</option>
        <option value="Service">Service</option>
        <option value="Billing">Billing</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <select name="complaint_source" required aria-required="true" aria-label="Complaint Source">
        <option value="">Complaint Source</option>
        <option value="Depot">Depot</option>
        <option value="Management">Management</option>
        <option value="Customer">Customer</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <select name="place_of_supply" required aria-required="true" aria-label="Place of Supply">
        <option value="">Place of Supply</option>
        <option value="Bhimasur">Bhimasur</option>
        <option value="Mathura">Mathura</option>
        <option value="Agra">Agra</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <input type="text" name="complaint_location" placeholder="Complaint Location" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <input type="text" name="month" value="<?= date('F Y'); ?>" readonly aria-readonly="true" />
      <div class="error-text"></div>

      <select name="complaint_type" required aria-required="true" aria-label="Complaint Type">
        <option value="">Complaint Type</option>
        <option value="Complaint">Complaint</option>
        <option value="Query">Query</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <input type="text" name="sales_person" placeholder="Sales Person Name" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <select name="product_name" required aria-required="true" aria-label="Product Name">
        <option value="">Product Name</option>
        <option value="Nutrica">Nutrica</option>
        <option value="Healthy Value">Healthy Value</option>
        <option value="Simply Fresh Sunflower">Simply Fresh Sunflower</option>
        <option value="Simply Fresh Soya">Simply Fresh Soya</option>
        <option value="Simply Gold Palm">Simply Gold Palm</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <select name="area_of_concern" required aria-required="true" aria-label="Area of Concern">
        <option value="">Area of Concern</option>
        <option value="Packaging Issue">Packaging Issue</option>
        <option value="Variation in Rate">Variation in Rate</option>
        <option value="Product Issue">Product Issue</option>
        <option value="Variation in Weight">Variation in Weight</option>
        <option value="Stock Theft">Stock Theft</option>
        <option value="Variation in Rates">Variation in Rates</option>
        <option value="MRP Related Issues">MRP Related Issues</option>
        <option value="Extraneous Factors">Extraneous Factors</option>
        <option value="Sticker Adhesive Issue">Sticker Adhesive Issue</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <select name="subcategory" required aria-required="true" aria-label="Sub Category">
        <option value="">Sub Category</option>
        <option value="Leakages">Leakages</option>
        <option value="Stock Short">Stock Short</option>
        <option value="Bargain Rate related issue">Bargain Rate related issue</option>
        <option value="Foaming Issue">Foaming Issue</option>
        <option value="Perception">Perception</option>
        <option value="Mismatch Stock">Mismatch Stock</option>
        <option value="Leakages/Short Stock">Leakages/Short Stock</option>
        <option value="Wrong Stock Received">Wrong Stock Received</option>
        <option value="Wrong/Without MRP Print">Wrong/Without MRP Print</option>
        <option value="Wet Carton">Wet Carton</option>
        <option value="Stock Excess">Stock Excess</option>
        <option value="Rust">Rust</option>
        <option value="Jar/Bottle/Tin Broken">Jar/Bottle/Tin Broken</option>
      </select>
      <div class="error-text" aria-live="polite"></div>

      <div class="button-group">
        <button type="button" onclick="prevStep()" aria-label="Previous step">Back</button>
        <button type="button" onclick="validateStep()" aria-label="Next step">Next</button>
        <button type="button" class="secondary-btn" onclick="saveDraft()" aria-label="Save draft">Save Draft</button>
      </div>
    </fieldset>

    <!-- Step 3 -->
    <fieldset>
      <legend>Invoice & Transport</legend>

      <input type="text" name="invoice_no" placeholder="Invoice Number" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <input type="date" name="invoice_date" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <input type="text" name="lr_number" placeholder="LR Number" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <input type="text" name="transporter_name" placeholder="Transporter Name" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <!-- transporter_number NOT required -->
      <input type="text" name="transporter_number" placeholder="Transporter Number (10 digits)" aria-required="false" />
      <div class="error-text" aria-live="polite"></div>

      <div class="button-group">
        <button type="button" onclick="prevStep()" aria-label="Previous step">Back</button>
        <button type="button" onclick="validateStep()" aria-label="Next step">Next</button>
        <button type="button" class="secondary-btn" onclick="saveDraft()" aria-label="Save draft">Save Draft</button>
      </div>
    </fieldset>

    <!-- Step 4 -->
    <fieldset>
      <legend>Additional Info</legend>

      <input type="text" name="subject" placeholder="Subject" required aria-required="true" />
      <div class="error-text" aria-live="polite"></div>

      <textarea name="description" placeholder="Describe the issue..." required aria-required="true"></textarea>
      <div class="error-text" aria-live="polite"></div>

      <input type="file" name="attachment" accept=".jpg,.jpeg,.png,.pdf,.docx,.txt" aria-label="Attachment file" />

      <div class="button-group">
        <button type="button" onclick="prevStep()" aria-label="Previous step">Back</button>
        <button type="submit" name="submit" aria-label="Submit complaint">Submit Complaint</button>
        <button type="button" class="secondary-btn" onclick="saveDraft()" aria-label="Save draft">Save Draft</button>
      </div>
    </fieldset>
  </form>

<?php if (!empty($submitted_code)): ?>
  <div class="ticket-banner">
    <h3>✅ Complaint Submitted Successfully!</h3>
    <p>Your <strong>Ticket Number</strong> is:</p>
    <div class="ticket-code"><?= htmlspecialchars($submitted_code) ?></div>
    <p>Please note this number for future tracking.</p>
  </div>
<?php endif; ?>

</div>

<div class="toast" id="toast" role="alert" aria-live="assertive" aria-atomic="true"></div>

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

  const steps = document.querySelectorAll('fieldset');
  const progressItems = document.querySelectorAll('.progressbar li');
  const form = document.getElementById('multiStepForm');
  const toast = document.getElementById('toast');
  let currentStep = 0;

  function updateProgressbar() {
    progressItems.forEach((item, index) => {
      if (index <= currentStep) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function showToast(message) {
    toast.innerHTML = message;  // allow HTML for bold complaint ID
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

    function validateStep() {
    clearErrors();
    const currentFields = steps[currentStep].querySelectorAll('input, select, textarea');
    let valid = true;

    currentFields.forEach(field => {
      const errorDiv = field.nextElementSibling;
      if (field.hasAttribute('required') && !field.value.trim()) {
        errorDiv.textContent = 'This field is required.';
        valid = false;
      } else if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        errorDiv.textContent = 'Invalid email format.';
        valid = false;
      } else if ((field.name === 'contact_number' || field.name === 'transporter_number') && field.value.trim() !== '' && !/^\d{10}$/.test(field.value)) {
        errorDiv.textContent = 'Must be 10 digits.';
        valid = false;
      }
    });
  if (valid) {
    steps[currentStep].classList.remove('active');
    currentStep++;
    if (currentStep < steps.length) {
      steps[currentStep].classList.add('active');
      updateProgressbar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

  function prevStep() {
    if (currentStep > 0) {
      steps[currentStep].classList.remove('active');
      currentStep--;
      steps[currentStep].classList.add('active');
      updateProgressbar();
      window.scrollTo({top:0, behavior:'smooth'});
      clearErrors();
    }
  }

  function clearErrors() {
    const errorTexts = steps[currentStep].querySelectorAll('.error-text');
    errorTexts.forEach(div => div.textContent = '');
  }

  function saveDraft() {
    const formData = new FormData(form);
    const draft = {};
    formData.forEach((value, key) => {
      if(key !== 'attachment') draft[key] = value;
    });
    localStorage.setItem('complaintDraft', JSON.stringify(draft));
    showToast('Draft saved successfully!');
  }

  function loadDraft() {
    const draft = JSON.parse(localStorage.getItem('complaintDraft'));
    if(draft) {
      Object.keys(draft).forEach(key => {
        if(form.elements[key]) form.elements[key].value = draft[key];
      });
    }
  }

  form.addEventListener('submit', e => {
  clearErrors();
  let allValid = true;

  steps.forEach((step) => {
    const fields = step.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      const errorDiv = field.nextElementSibling;
      if(field.hasAttribute('required') && !field.value.trim()){
        errorDiv.textContent = 'This field is required.';
        allValid = false;
      } else if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        errorDiv.textContent = 'Invalid email format.';
        allValid = false;
      } else if ((field.name === 'contact_number' || field.name === 'transporter_number') && !/^\d{10}$/.test(field.value)) {
        errorDiv.textContent = 'Must be 10 digits.';
        allValid = false;
      }
    });
  });

  if (!allValid) {
    e.preventDefault(); // Block submission if validation fails
    showToast('Please fix errors before submitting.');
  } else {
    // Generate client-side complaint ID (for display only)
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');

    let lastSerial = localStorage.getItem('complaintSerial');
    if (!lastSerial) lastSerial = 0;
    let newSerial = parseInt(lastSerial) + 1;
    localStorage.setItem('complaintSerial', newSerial);

    const serialStr = newSerial.toString().padStart(4, '0');
    const complaintId = `${yy}-${mm}-${serialStr}`;

    showToast(`Complaint submitted successfully! Your Complaint ID: <strong>${complaintId}</strong>`);

    localStorage.removeItem('complaintDraft');  // Clean up
    // form will now submit to PHP where real complaint ID will be generated
  }
});


  window.onload = () => {
    loadDraft();
    updateProgressbar();
  };
  <?php if (!empty($submitted_code)): ?>
window.onload = () => {
  loadDraft();
  updateProgressbar();
  const banner = document.querySelector('.ticket-banner');
  if (banner) {
    banner.scrollIntoView({ behavior: 'smooth' });
  }
};
<?php else: ?>
window.onload = () => {
  loadDraft();
  updateProgressbar();
};
<?php endif; ?>

</script>

<script>
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
  const dateInput = document.querySelector('input[type="date"]');
  if(dateInput){
    dateInput.addEventListener('click', () => {
      if (dateInput.showPicker) {
        dateInput.showPicker();
      }
    });
  }
</script>
<script>
  const body = document.body;

  function applyTheme(theme) {
    if (theme === 'light') {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    } else {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    }
  }
  </script>
<script>
  // Apply received theme
  function applyTheme(mode) {
    document.body.classList.toggle('light-mode', mode === 'light');
    document.body.classList.toggle('dark-mode', mode === 'dark');
  }

  // Listen for theme message from parent
  window.addEventListener('message', function (event) {
    if (event.data?.type === 'theme') {
      applyTheme(event.data.mode);
    }
  });

  // Ask parent for current theme on load (optional)
  window.parent.postMessage({ type: 'request-theme' }, '*');
</script>


</body>
</html>