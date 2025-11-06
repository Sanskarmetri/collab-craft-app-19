// Check if current site should be blocked
function checkAndBlockSite() {
  chrome.runtime.sendMessage({ type: 'CHECK_FOCUS_MODE' }, (response) => {
    if (response && response.focusMode) {
      chrome.runtime.sendMessage({ type: 'GET_BLOCKED_SITES' }, (sitesResponse) => {
        const blockedSites = sitesResponse.sites || [];
        const currentHostname = window.location.hostname;
        
        const isBlocked = blockedSites.some((site) => currentHostname.includes(site));
        
        if (isBlocked) {
          // Create full-page overlay
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e3a8a 0%, #334155 100%);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
            color: white;
          `;
          
          overlay.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 2rem;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">🔒</div>
              <h1 style="font-size: 2rem; margin-bottom: 1rem; font-weight: bold;">
                Focus Mode Active
              </h1>
              <p style="font-size: 1.125rem; margin-bottom: 2rem; opacity: 0.9;">
                This site is blocked during your study session. Stay focused on your goals!
              </p>
              <div style="padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 1rem;">
                <p style="font-size: 0.875rem; opacity: 0.8;">
                  Site blocked: <strong>${currentHostname}</strong>
                </p>
              </div>
              <p style="font-size: 0.875rem; opacity: 0.7;">
                Return to your study app to continue your focus session.
              </p>
            </div>
          `;
          
          // Block all interaction with page
          document.body.innerHTML = '';
          document.body.appendChild(overlay);
          
          // Prevent back navigation
          history.pushState(null, '', location.href);
          window.onpopstate = function () {
            history.pushState(null, '', location.href);
          };
        }
      });
    }
  });
}

// Run check immediately and on any navigation
checkAndBlockSite();

// Listen for changes in focus mode
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.focusMode) {
    checkAndBlockSite();
  }
});
