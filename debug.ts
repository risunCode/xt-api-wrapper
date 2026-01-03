/**
 * Debug - Check raw API response
 */

const API_KEY = 'xt_45277959eec3b6f17ea049324b62902f925faf07c084c1832d9bfbe18b4824f2';
const BASE_URL = 'http://localhost:3002';

async function debug() {
  const url = 'https://x.com/lac_n_c/status/2007422156045725871?s=20';
  
  console.log('Fetching:', url);
  
  const response = await fetch(`${BASE_URL}/api/v1/publicservices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ url }),
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  const data = await response.json();
  console.log('\nResponse:');
  console.log(JSON.stringify(data, null, 2));
}

debug();
