/**
 * Background Service Worker for Quick Tab Media Manager
 * Handles tab scanning, media detection, and muting operations
 */

// Content script to inject for detecting media elements
const MEDIA_DETECTION_SCRIPT = `
  (function() {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    
    let hasPlaying = false;
    
    // Check videos
    for (const video of videos) {
      if (!video.paused && !video.muted && video.currentTime > 0) {
        hasPlaying = true;
        break;
      }
    }
    
    // Check audios if no playing video found
    if (!hasPlaying) {
      for (const audio of audios) {
        if (!audio.paused && !audio.muted && audio.currentTime > 0) {
          hasPlaying = true;
          break;
        }
      }
    }
    
    return {
      hasMediaElements: videos.length > 0 || audios.length > 0,
      isPlaying: hasPlaying
    };
  })();
`;

/**
 * Scan all tabs for media elements
 * @returns {Promise<Array>} Array of MediaTab objects
 */
async function scanMediaTabs() {
  try {
    // Get all tabs
    const allTabs = await chrome.tabs.query({});
    const mediaTabs = [];
    
    // Process tabs in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < Math.min(allTabs.length, 200); i += batchSize) {
      const batch = allTabs.slice(i, i + batchSize);
      const batchPromises = batch.map(async (tab) => {
        try {
          // Skip chrome:// and extension pages
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
            return null;
          }
          
          let mediaInfo = { hasMediaElements: false, isPlaying: false };
          
          // Try to inject script to detect media
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: new Function('return ' + MEDIA_DETECTION_SCRIPT)
            });
            
            if (results && results[0] && results[0].result) {
              mediaInfo = results[0].result;
            }
          } catch (scriptError) {
            // Fallback: use tab.audible as heuristic
            mediaInfo.isPlaying = tab.audible || false;
            mediaInfo.hasMediaElements = tab.audible || false;
          }
          
          // Include tab if it has media elements or is audible
          if (mediaInfo.hasMediaElements || tab.audible || mediaInfo.isPlaying) {
            return {
              id: tab.id,
              title: tab.title || 'Untitled',
              favIconUrl: tab.favIconUrl,
              playing: mediaInfo.isPlaying || tab.audible || false,
              muted: tab.mutedInfo?.muted || false,
              url: tab.url
            };
          }
          
          return null;
        } catch (error) {
          console.warn(`Error processing tab ${tab.id}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      mediaTabs.push(...batchResults.filter(tab => tab !== null));
    }
    
    return mediaTabs;
  } catch (error) {
    console.error('Error scanning media tabs:', error);
    return [];
  }
}

/**
 * Toggle mute state for a specific tab
 * @param {number} tabId - Tab ID to toggle
 * @returns {Promise<boolean>} New muted state
 */
async function toggleTabMute(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const newMutedState = !tab.mutedInfo?.muted;
    
    await chrome.tabs.update(tabId, { muted: newMutedState });
    return newMutedState;
  } catch (error) {
    console.error(`Error toggling mute for tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Mute all media tabs
 * @param {Array} tabIds - Array of tab IDs to mute
 * @returns {Promise<number>} Number of tabs successfully muted
 */
async function muteAllTabs(tabIds) {
  let mutedCount = 0;
  
  for (const tabId of tabIds) {
    try {
      await chrome.tabs.update(tabId, { muted: true });
      mutedCount++;
    } catch (error) {
      console.warn(`Failed to mute tab ${tabId}:`, error);
    }
  }
  
  return mutedCount;
}

/**
 * Message handler for popup communications
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'scanMediaTabs':
      scanMediaTabs().then(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'toggleTabMute':
      toggleTabMute(message.tabId)
        .then(newMutedState => sendResponse({ success: true, muted: newMutedState }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'muteAllTabs':
      muteAllTabs(message.tabIds)
        .then(mutedCount => sendResponse({ success: true, mutedCount }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      console.warn('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Optional: Badge showing number of playing tabs
async function updateBadge() {
  try {
    const mediaTabs = await scanMediaTabs();
    const playingCount = mediaTabs.filter(tab => tab.playing).length;
    
    if (playingCount > 0) {
      chrome.action.setBadgeText({ text: playingCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Update badge periodically (every 10 seconds)
setInterval(updateBadge, 10000);

// Update badge on startup
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge); 