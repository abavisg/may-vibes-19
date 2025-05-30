/**
 * Quick Tab Media Manager - Popup JavaScript
 * Handles UI interactions and communication with background script
 */

class MediaTabManager {
  constructor() {
    this.mediaTabs = [];
    this.isLoading = false;
    
    // DOM elements
    this.elements = {
      loadingState: document.getElementById('loadingState'),
      emptyState: document.getElementById('emptyState'),
      mediaTabsList: document.getElementById('mediaTabsList'),
      errorState: document.getElementById('errorState'),
      errorMessage: document.getElementById('errorMessage'),
      tabCount: document.getElementById('tabCount'),
      muteAllBtn: document.getElementById('muteAllBtn'),
      refreshBtn: document.getElementById('refreshBtn'),
      refreshEmptyBtn: document.getElementById('refreshEmptyBtn'),
      retryBtn: document.getElementById('retryBtn')
    };
    
    this.init();
  }
  
  /**
   * Initialize the popup
   */
  init() {
    this.bindEvents();
    this.loadMediaTabs();
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    // Refresh buttons
    this.elements.refreshBtn.addEventListener('click', () => this.loadMediaTabs());
    this.elements.refreshEmptyBtn.addEventListener('click', () => this.loadMediaTabs());
    this.elements.retryBtn.addEventListener('click', () => this.loadMediaTabs());
    
    // Mute all button
    this.elements.muteAllBtn.addEventListener('click', () => this.muteAllTabs());
    
    // Auto-refresh every 3 seconds when popup is open
    setInterval(() => {
      if (!this.isLoading) {
        this.loadMediaTabs(false); // Silent refresh
      }
    }, 3000);
  }
  
  /**
   * Show specific state and hide others
   */
  showState(stateName) {
    const states = ['loadingState', 'emptyState', 'mediaTabsList', 'errorState'];
    
    states.forEach(state => {
      const element = this.elements[state];
      if (element) {
        element.style.display = state === stateName ? 'block' : 'none';
      }
    });
  }
  
  /**
   * Load media tabs from background script
   */
  async loadMediaTabs(showLoading = true) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    if (showLoading) {
      this.showState('loadingState');
    }
    
    try {
      const response = await this.sendMessage({ action: 'scanMediaTabs' });
      
      if (response && Array.isArray(response)) {
        this.mediaTabs = response;
        this.renderMediaTabs();
        this.updateTabCount();
        
        if (this.mediaTabs.length === 0) {
          this.showState('emptyState');
        } else {
          this.showState('mediaTabsList');
        }
      } else {
        throw new Error('Invalid response from background script');
      }
    } catch (error) {
      console.error('Error loading media tabs:', error);
      this.showError(error.message);
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Send message to background script
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  /**
   * Render media tabs list
   */
  renderMediaTabs() {
    if (!this.elements.mediaTabsList) return;
    
    this.elements.mediaTabsList.innerHTML = '';
    
    this.mediaTabs.forEach((tab, index) => {
      const tabElement = this.createTabElement(tab);
      this.elements.mediaTabsList.appendChild(tabElement);
      
      // Add animation for new tabs
      setTimeout(() => {
        tabElement.classList.add('new');
      }, index * 50);
    });
    
    // Update mute all button state
    const hasUnmutedTabs = this.mediaTabs.some(tab => !tab.muted);
    this.elements.muteAllBtn.disabled = !hasUnmutedTabs;
  }
  
  /**
   * Create DOM element for a tab
   */
  createTabElement(tab) {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'tab-item';
    tabDiv.dataset.tabId = tab.id;
    
    // Favicon
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    if (tab.favIconUrl) {
      favicon.src = tab.favIconUrl;
      favicon.onerror = () => {
        favicon.style.display = 'none';
        const defaultIcon = document.createElement('div');
        defaultIcon.className = 'tab-favicon default';
        defaultIcon.textContent = '🌐';
        favicon.parentNode.replaceChild(defaultIcon, favicon);
      };
    } else {
      favicon.style.display = 'none';
      const defaultIcon = document.createElement('div');
      defaultIcon.className = 'tab-favicon default';
      defaultIcon.textContent = '🌐';
      tabDiv.appendChild(defaultIcon);
    }
    
    if (favicon.style.display !== 'none') {
      tabDiv.appendChild(favicon);
    }
    
    // Tab info
    const tabInfo = document.createElement('div');
    tabInfo.className = 'tab-info';
    
    const title = document.createElement('div');
    title.className = 'tab-title';
    title.textContent = tab.title;
    title.title = tab.title; // Tooltip for full title
    
    const status = document.createElement('div');
    status.className = 'tab-status';
    
    const indicator = document.createElement('div');
    indicator.className = 'status-indicator';
    
    let statusText = '';
    if (tab.muted) {
      indicator.classList.add('muted');
      statusText = 'Muted';
    } else if (tab.playing) {
      indicator.classList.add('playing');
      statusText = 'Playing';
    } else {
      indicator.classList.add('paused');
      statusText = 'Has Media';
    }
    
    status.appendChild(indicator);
    status.appendChild(document.createTextNode(statusText));
    
    tabInfo.appendChild(title);
    tabInfo.appendChild(status);
    tabDiv.appendChild(tabInfo);
    
    // Mute button
    const muteBtn = document.createElement('button');
    muteBtn.className = `mute-btn ${tab.muted ? 'muted' : ''}`;
    muteBtn.textContent = tab.muted ? 'Unmute' : 'Mute';
    muteBtn.addEventListener('click', () => this.toggleTabMute(tab.id, muteBtn));
    
    tabDiv.appendChild(muteBtn);
    
    // Click to focus tab
    tabDiv.addEventListener('click', (e) => {
      if (e.target === muteBtn) return;
      this.focusTab(tab.id);
    });
    
    return tabDiv;
  }
  
  /**
   * Toggle mute state for a specific tab
   */
  async toggleTabMute(tabId, buttonElement) {
    if (!buttonElement) return;
    
    const originalText = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.textContent = '...';
    
    try {
      const response = await this.sendMessage({
        action: 'toggleTabMute',
        tabId: tabId
      });
      
      if (response && response.success) {
        // Update UI immediately
        const isMuted = response.muted;
        buttonElement.textContent = isMuted ? 'Unmute' : 'Mute';
        buttonElement.classList.toggle('muted', isMuted);
        
        // Update tab data
        const tab = this.mediaTabs.find(t => t.id === tabId);
        if (tab) {
          tab.muted = isMuted;
        }
        
        // Update status indicator
        const tabElement = buttonElement.closest('.tab-item');
        const indicator = tabElement.querySelector('.status-indicator');
        const statusText = tabElement.querySelector('.tab-status');
        
        indicator.className = 'status-indicator';
        if (isMuted) {
          indicator.classList.add('muted');
          statusText.textContent = 'Muted';
        } else if (tab && tab.playing) {
          indicator.classList.add('playing');
          statusText.textContent = 'Playing';
        } else {
          indicator.classList.add('paused');
          statusText.textContent = 'Has Media';
        }
        
        // Update mute all button
        const hasUnmutedTabs = this.mediaTabs.some(tab => !tab.muted);
        this.elements.muteAllBtn.disabled = !hasUnmutedTabs;
        
      } else {
        throw new Error(response?.error || 'Failed to toggle mute');
      }
    } catch (error) {
      console.error('Error toggling tab mute:', error);
      buttonElement.textContent = originalText;
      this.showToast('Failed to toggle mute', 'error');
    } finally {
      buttonElement.disabled = false;
    }
  }
  
  /**
   * Mute all unmuted tabs
   */
  async muteAllTabs() {
    const unmutedTabs = this.mediaTabs.filter(tab => !tab.muted);
    if (unmutedTabs.length === 0) return;
    
    const button = this.elements.muteAllBtn;
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = 'Muting...';
    
    try {
      const response = await this.sendMessage({
        action: 'muteAllTabs',
        tabIds: unmutedTabs.map(tab => tab.id)
      });
      
      if (response && response.success) {
        // Refresh the tab list to get updated states
        await this.loadMediaTabs(false);
        this.showToast(`Muted ${response.mutedCount} tabs`, 'success');
      } else {
        throw new Error(response?.error || 'Failed to mute all tabs');
      }
    } catch (error) {
      console.error('Error muting all tabs:', error);
      this.showToast('Failed to mute all tabs', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
  
  /**
   * Focus a specific tab
   */
  async focusTab(tabId) {
    try {
      await chrome.tabs.update(tabId, { active: true });
      window.close(); // Close popup after focusing tab
    } catch (error) {
      console.error('Error focusing tab:', error);
    }
  }
  
  /**
   * Update tab count display
   */
  updateTabCount() {
    const count = this.mediaTabs.length;
    const playingCount = this.mediaTabs.filter(tab => tab.playing).length;
    
    let text = `${count} tab${count !== 1 ? 's' : ''}`;
    if (playingCount > 0) {
      text += ` (${playingCount} playing)`;
    }
    
    this.elements.tabCount.textContent = text;
  }
  
  /**
   * Show error state
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.showState('errorState');
  }
  
  /**
   * Show toast notification (simple implementation)
   */
  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      ${type === 'error' ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;' : 
        'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'}
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MediaTabManager();
}); 