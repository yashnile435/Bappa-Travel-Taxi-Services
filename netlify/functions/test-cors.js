const ALLOWED_ORIGINS = new Set([
  "https://bappatravels.com",
  "https://www.bappatravels.com",
  "https://bappatravels.netlify.app",
  "http://localhost:3000"
]);

function buildCorsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

exports.handler = async function(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const headers = buildCorsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: "CORS test success" })
  };
};
