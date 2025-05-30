# Quick Tab Media Manager

A lightweight Chrome extension that gives users instant control over every tab that's currently hosting audio or video elements—stopping rogue sound, preventing meeting‑time embarrassment, and saving focus with one click.

## 🎯 Overview

This Chrome extension solves a common problem: managing multiple tabs with audio/video content. With Quick Tab Media Manager, you can:

- **🔇 Mute all noisy tabs instantly** with one click
- **📋 See which tabs are playing media** with live status indicators  
- **🎵 Control individual tabs** with dedicated mute/unmute buttons
- **🔄 Auto-refresh** the media tab list in real-time
- **⚡ Handle many tabs efficiently** with optimized performance

## 📁 Project Structure

```
├── tab-media-manager/          # Chrome extension source code
│   ├── manifest.json          # Extension configuration (Manifest V3)
│   ├── background.js          # Service worker for tab scanning
│   ├── popup.html             # Popup interface markup
│   ├── popup.js               # UI logic and interactions  
│   ├── popup.css              # Modern styling and animations
│   ├── README.md              # Detailed extension documentation
│   └── icons/                 # Extension icons (16, 32, 128px)
├── LICENSE                     # Project license
└── README.md                   # This overview file
```

## 🚀 Quick Start

1. **Navigate to the extension folder:**
   ```bash
   cd tab-media-manager
   ```

2. **Open Chrome and go to** `chrome://extensions/`

3. **Enable Developer mode** (toggle in top right)

4. **Click "Load unpacked"** and select the `tab-media-manager` folder

5. **Pin the extension** to your toolbar and start managing your media tabs!

## ✨ Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **One-Click Mute All** | Instantly silence all tabs with media | ✅ |
| **Comprehensive Media Detection** | Shows all tabs with audio/video elements (playing or paused) | ✅ |
| **Individual Tab Control** | Mute/unmute specific tabs | ✅ |
| **Visual Status Indicators** | Playing, paused, and muted states | ✅ |
| **Auto-Refresh** | Updates every 3 seconds automatically | ✅ |
| **Performance Optimized** | Handles 200+ tabs efficiently | ✅ |
| **Modern UI** | Clean, responsive design | ✅ |
| **Quick Tab Switching** | Click to focus any tab | ✅ |

## 🛠️ Technical Stack

- **Manifest V3** - Modern Chrome extension standard
- **Vanilla JavaScript** - No external dependencies
- **Chrome APIs** - tabs, scripting, activeTab permissions
- **Service Worker** - Lightweight background processing
- **CSS3** - Modern styling with animations

## 📋 Development Status

**Current Version:** v0.1.0

### Completed (Day 1-3)
- ✅ Core extension architecture
- ✅ Background service worker
- ✅ Popup interface with modern UI
- ✅ Media detection and tab scanning
- ✅ Individual and bulk mute functionality
- ✅ Auto-refresh and status indicators
- ✅ Error handling and edge cases
- ✅ Performance optimizations
- ✅ Complete documentation

### Next Steps (v0.2.0)
- [ ] Keyboard shortcuts
- [ ] Badge showing playing tab count
- [ ] Dark mode support
- [ ] Chrome Web Store preparation

## 📊 Product Goals

| Priority | Goal | Success Metric |
|----------|------|----------------|
| P0 | Mute all noisy tabs instantly | 100% success on test tabs |
| P0 | Show live media status | ≥95% accuracy in detection |
| P1 | Individual tab control | <150ms response time |
| P2 | Persist muted state | Maintains state across focus changes |
| P3 | Auto-refresh capability | New tabs appear within 1s |

## 🧪 Testing

The extension has been tested with:
- YouTube videos
- Vimeo content  
- Spotify Web Player
- Twitter videos
- Twitch streams
- HTML5 audio/video elements

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

---

**Built for the #may25aivibes challenge** - Creating useful tools with AI assistance.

For detailed technical documentation, installation instructions, and troubleshooting, see [`tab-media-manager/README.md`](tab-media-manager/README.md). 