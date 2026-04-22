chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("app.html");
  await chrome.tabs.create({ url });
});

// Proxy for HTTP requests to bypass certain foreground restrictions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  if (message.type === 'PROXY_REQUEST') {
    console.log('[Background] Processing PROXY_REQUEST for URL:', message.payload?.url);
    handleProxyRequest(message.payload, sendResponse);
    return true; // Keep channel open for async response
  }

  console.warn('[Background] Unknown message type:', message.type);
  return false;
});

async function handleProxyRequest(payload, sendResponse) {
  const { url, method, headers, body } = payload;
  console.log(`[Proxy] Requesting: ${method} ${url}`);

  try {
    const fetchOptions = {
      method,
      headers,
    };

    // Only add body for non-GET/HEAD methods
    if (method !== 'GET' && method !== 'HEAD' && body !== null) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    console.log(`[Proxy] Status: ${response.status}`);

    const resHeaders = {};
    response.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      console.warn(`[Proxy] Parse error: ${parseError.message}`);
      data = await response.text(); // Fallback to text
    }

    sendResponse({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
      data: data,
      ok: response.ok
    });
  } catch (error) {
    console.error(`[Proxy] Fetch error:`, error);
    sendResponse({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

