/**
 * Background Service Worker for Quick Tab Media Manager
 * Handles tab scanning, media detection, and muting operations
 */

// Cache for tab media states to avoid unnecessary rescanning
let mediaTabsCache = new Map();
let lastFullScan = 0;
const FULL_SCAN_INTERVAL = 30000; // 30 seconds
const CACHE_VALIDITY = 10000; // 10 seconds

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
 * Check if a tab likely has media based on URL patterns
 */
function hasMediaKeywords(url) {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('youtube') || 
         lowerUrl.includes('vimeo') || 
         lowerUrl.includes('spotify') || 
         lowerUrl.includes('soundcloud') || 
         lowerUrl.includes('twitch') || 
         lowerUrl.includes('netflix') || 
         lowerUrl.includes('hulu') || 
         lowerUrl.includes('video') || 
         lowerUrl.includes('audio');
}

/**
 * Get cached tab info or create new entry
 */
function getCachedTabInfo(tabId, tab) {
  const cached = mediaTabsCache.get(tabId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_VALIDITY) {
    // Update basic properties that might change quickly
    cached.data.title = tab.title || 'Untitled';
    cached.data.muted = tab.mutedInfo?.muted || false;
    cached.data.playing = cached.data.playing || tab.audible || false;
    return cached.data;
  }
  
  return null;
}

/**
 * Update cache with new tab info
 */
function updateCache(tabId, tabData) {
  mediaTabsCache.set(tabId, {
    data: tabData,
    timestamp: Date.now()
  });
}

/**
 * Scan specific tabs for media elements
 */
async function scanSpecificTabs(tabIds) {
  const mediaTabs = [];
  
  for (const tabId of tabIds) {
    try {
      const tab = await chrome.tabs.get(tabId);
      
      // Skip chrome:// and extension pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
        continue;
      }
      
      // Check cache first
      let cachedInfo = getCachedTabInfo(tabId, tab);
      if (cachedInfo) {
        mediaTabs.push(cachedInfo);
        continue;
      }
      
      let mediaInfo = { hasMediaElements: false, isPlaying: false };
      let shouldIncludeTab = false;
      
      // Try to inject script to detect media
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: new Function('return ' + MEDIA_DETECTION_SCRIPT)
        });
        
        if (results && results[0] && results[0].result) {
          mediaInfo = results[0].result;
          shouldIncludeTab = mediaInfo.hasMediaElements;
        }
      } catch (scriptError) {
        // Fallback: use tab.audible and URL patterns
        mediaInfo.isPlaying = tab.audible || false;
        shouldIncludeTab = hasMediaKeywords(tab.url) || tab.audible;
        mediaInfo.hasMediaElements = shouldIncludeTab;
      }
      
      // Include tab if it has media elements, is audible, or is playing
      if (shouldIncludeTab || mediaInfo.hasMediaElements || tab.audible || mediaInfo.isPlaying) {
        const tabData = {
          id: tab.id,
          title: tab.title || 'Untitled',
          favIconUrl: tab.favIconUrl,
          playing: mediaInfo.isPlaying || tab.audible || false,
          muted: tab.mutedInfo?.muted || false,
          url: tab.url
        };
        
        updateCache(tabId, tabData);
        mediaTabs.push(tabData);
      }
    } catch (error) {
      console.warn(`Error processing tab ${tabId}:`, error);
    }
  }
  
  return mediaTabs;
}

/**
 * Scan all tabs for media elements (with intelligent caching)
 * @param {boolean} forceFullScan - Force a complete rescan
 * @returns {Promise<Array>} Array of MediaTab objects
 */
async function scanMediaTabs(forceFullScan = false) {
  try {
    const now = Date.now();
    const needsFullScan = forceFullScan || (now - lastFullScan) > FULL_SCAN_INTERVAL;
    
    if (needsFullScan) {
      // Full scan - get all tabs
      const allTabs = await chrome.tabs.query({});
      const mediaTabs = [];
      
      // Clear old cache entries
      mediaTabsCache.clear();
      
      // Process tabs in batches
      const batchSize = 10;
      for (let i = 0; i < Math.min(allTabs.length, 200); i += batchSize) {
        const batch = allTabs.slice(i, i + batchSize);
        const tabIds = batch.map(tab => tab.id);
        const batchResults = await scanSpecificTabs(tabIds);
        mediaTabs.push(...batchResults);
      }
      
      lastFullScan = now;
      return mediaTabs;
    } else {
      // Quick scan - only check cached entries and audible tabs
      const audibleTabs = await chrome.tabs.query({ audible: true });
      const cachedTabIds = Array.from(mediaTabsCache.keys());
      const allRelevantTabIds = [...new Set([...audibleTabs.map(t => t.id), ...cachedTabIds])];
      
      return await scanSpecificTabs(allRelevantTabIds);
    }
  } catch (error) {
    console.error('Error scanning media tabs:', error);
    return [];
  }
}

/**
 * Handle tab updates - invalidate cache for changed tabs
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If audible state or URL changed, invalidate cache
  if (changeInfo.audible !== undefined || changeInfo.url || changeInfo.status === 'complete') {
    mediaTabsCache.delete(tabId);
    
    // Update badge if this might affect playing count
    if (changeInfo.audible !== undefined) {
      updateBadge();
    }
  }
});

/**
 * Handle tab removal - clean up cache
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  mediaTabsCache.delete(tabId);
  updateBadge();
});

/**
 * Handle new tabs - they might be media tabs
 */
chrome.tabs.onCreated.addListener((tab) => {
  if (hasMediaKeywords(tab.url || '')) {
    // Delay a bit for the page to load
    setTimeout(() => updateBadge(), 2000);
  }
});

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
    
    // Update cache
    const cached = mediaTabsCache.get(tabId);
    if (cached) {
      cached.data.muted = newMutedState;
      cached.timestamp = Date.now();
    }
    
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
      
      // Update cache
      const cached = mediaTabsCache.get(tabId);
      if (cached) {
        cached.data.muted = true;
        cached.timestamp = Date.now();
      }
      
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
      scanMediaTabs(message.forceRefresh).then(sendResponse);
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

// Optimized badge update - less frequent
async function updateBadge() {
  try {
    const mediaTabs = await scanMediaTabs(); // Use smart scanning
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

// Reduced polling frequency - badge updates every 30 seconds instead of 10
setInterval(updateBadge, 30000);

// Update badge on startup
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge); 