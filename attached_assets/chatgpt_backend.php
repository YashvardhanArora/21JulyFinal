<?php
// chatgpt_backend.php
header('Content-Type: application/json');

// IMPORTANT: Replace this with your actual API key securely
$apiKey = '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';

// Get the JSON input and parse message
$input = json_decode(file_get_contents('php://input'), true);
$question = trim($input['message'] ?? '');

if (!$question) {
    echo json_encode(['reply' => 'Please ask a valid question.']);
    exit;
}

// Prepare request payload
$data = [
    "model" => "gpt-3.5-turbo",
    "messages" => [
        [
            "role" => "system",
            "content" => "You are a helpful support assistant for BN Group. You should ONLY respond to queries related to BN Group's services, complaints, tracking, or policies. If a query is unrelated, politely decline and state that you only assist with BN Group-related concerns."
        ],
        [
            "role" => "user",
            "content" => $question
        ]
    ],
    "temperature" => 0.7,
    "max_tokens" => 300,
    "n" => 1,
];

// Retry settings
$maxRetries = 3;
$retryCount = 0;

do {
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: ' . 'Bearer ' . $apiKey,
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
    ]);

    $response = curl_exec($ch);

    if ($response === false) {
        $error_msg = curl_error($ch);
        curl_close($ch);
        echo json_encode(['reply' => "Curl error: $error_msg"]);
        exit;
    }

    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_status == 429) {
        $retryCount++;
        // Exponential backoff: 2, 4, 8 seconds
        sleep(pow(2, $retryCount));
    } else {
        break;
    }
} while ($retryCount < $maxRetries);

if ($http_status !== 200) {
    echo json_encode(['reply' => "OpenAI API returned status code $http_status."]);
    exit;
}

$responseData = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['reply' => 'Invalid response from ChatGPT API.']);
    exit;
}

$reply = $responseData['choices'][0]['message']['content'] ?? 'Sorry, something went wrong.';
echo json_encode(['reply' => trim($reply)]);
