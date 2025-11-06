document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const blockedSitesList = document.getElementById('blockedSites');
  const openAppBtn = document.getElementById('openApp');

  // Check focus mode status
  chrome.storage.local.get(['focusMode', 'blockedSites'], (result) => {
    const isActive = result.focusMode || false;
    statusText.textContent = isActive ? 'Active - Focus mode enabled' : 'Inactive';
    
    if (isActive) {
      statusDiv.classList.add('active');
    }

    // Display blocked sites
    const sites = result.blockedSites || [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'youtube.com',
      'reddit.com',
      'netflix.com',
      'tiktok.com',
    ];

    blockedSitesList.innerHTML = sites.map(site => `<li>🚫 ${site}</li>`).join('');
  });

  // Open study app
  openAppBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://60740f4f-0f2e-451e-a6f4-51a143c53bf1.lovableproject.com/focus',
    });
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.focusMode) {
      const isActive = changes.focusMode.newValue;
      statusText.textContent = isActive ? 'Active - Focus mode enabled' : 'Inactive';
      
      if (isActive) {
        statusDiv.classList.add('active');
      } else {
        statusDiv.classList.remove('active');
      }
    }
  });
});
