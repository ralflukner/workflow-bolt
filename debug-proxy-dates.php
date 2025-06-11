<?php

// Debug what the proxy is actually sending to the API
$fromDate = '2025-06-10';
$toDate = '2025-06-10';

echo "Input dates:\n";
echo "fromDate: $fromDate\n";
echo "toDate: $toDate\n\n";

echo "Proxy conversion:\n";
echo "StartDate: " . date('n/j/Y', strtotime($fromDate)) . ' 8:00:00 AM' . "\n";
echo "EndDate: " . date('n/j/Y', strtotime($toDate)) . ' 5:00:00 PM' . "\n\n";

echo "Working direct format:\n";
echo "StartDate: 6/10/2025 8:00:00 AM\n";
echo "EndDate: 6/10/2025 5:00:00 PM\n\n";

// Check if they match
$proxyStart = date('n/j/Y', strtotime($fromDate)) . ' 8:00:00 AM';
$proxyEnd = date('n/j/Y', strtotime($toDate)) . ' 5:00:00 PM';

$workingStart = '6/10/2025 8:00:00 AM';
$workingEnd = '6/10/2025 5:00:00 PM';

echo "Match check:\n";
echo "StartDate match: " . ($proxyStart === $workingStart ? 'YES' : 'NO') . "\n";
echo "EndDate match: " . ($proxyEnd === $workingEnd ? 'YES' : 'NO') . "\n";

?>