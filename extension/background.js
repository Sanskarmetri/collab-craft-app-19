let focusMode = false;
let blockedSites = [
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'youtube.com',
  'reddit.com',
  'netflix.com',
  'tiktok.com',
];

// Listen for messages from the PWA
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'FOCUS_START') {
    focusMode = true;
    chrome.storage.local.set({ focusMode: true, sessionId: request.sessionId });
    sendResponse({ success: true });
  } else if (request.type === 'FOCUS_END') {
    focusMode = false;
    chrome.storage.local.set({ focusMode: false, sessionId: null });
    sendResponse({ success: true });
  } else if (request.type === 'GET_STATUS') {
    sendResponse({ focusMode });
  } else if (request.type === 'UPDATE_BLOCKED_SITES') {
    blockedSites = request.sites;
    chrome.storage.local.set({ blockedSites });
    sendResponse({ success: true });
  }
  return true;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_FOCUS_MODE') {
    chrome.storage.local.get(['focusMode'], (result) => {
      sendResponse({ focusMode: result.focusMode || false });
    });
    return true;
  } else if (request.type === 'GET_BLOCKED_SITES') {
    chrome.storage.local.get(['blockedSites'], (result) => {
      sendResponse({ sites: result.blockedSites || blockedSites });
    });
    return true;
  }
});

// Block navigation to distracting sites during focus mode
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return; // Only check main frame

    chrome.storage.local.get(['focusMode', 'blockedSites'], (result) => {
      if (result.focusMode) {
        const url = new URL(details.url);
        const sites = result.blockedSites || blockedSites;
        
        const isBlocked = sites.some((site) => url.hostname.includes(site));
        
        if (isBlocked) {
          chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL('blocked.html') + '?site=' + url.hostname,
          });
        }
      }
    });
  }
);

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    focusMode: false,
    sessionId: null,
    blockedSites: blockedSites,
  });
});
