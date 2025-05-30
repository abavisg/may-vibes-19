# Quick Tab Media Manager

> **A lightweight Chrome extension that gives users instant control over every tab that's currently hosting audio or video elements—stopping rogue sound, preventing meeting‑time embarrassment, and saving focus with one click.**

## 🎯 Features

- **🔇 One-Click Mute All**: Instantly mute all tabs playing audio or video
- **📋 Comprehensive Media Detection**: Shows all tabs with audio/video elements, whether playing or paused
- **🎵 Individual Tab Control**: Mute/unmute specific tabs with a single click
- **📊 Visual Status Indicators**: Clear display of playing, paused, and muted states
- **🔄 Auto-Refresh**: Automatically updates the tab list every 3 seconds
- **🎨 Modern UI**: Clean, responsive design with smooth animations
- **⚡ Performance Optimized**: Efficient scanning with batch processing (≤200 tabs)
- **🔗 Quick Tab Switching**: Click any tab in the list to focus it immediately

## 🚀 Installation

### Development Installation (Load Unpacked)

1. **Clone or download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the `tab-media-manager` folder
5. **Pin the extension** to your toolbar for easy access

### Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store after initial testing phase.

## 📖 Usage

### Basic Workflow

1. **Click the extension icon** in your Chrome toolbar
2. **View all media tabs** - The popup shows all tabs with audio/video elements (playing or paused)
3. **Mute individual tabs** - Click the "Mute" button next to any tab
4. **Mute all at once** - Use the "Mute All Tabs" button for emergency silence
5. **Focus a tab** - Click anywhere on a tab row (except the mute button) to switch to it

### Status Indicators

- 🟢 **Green dot + "Playing"**: Tab is actively playing audio/video
- 🟡 **Yellow dot + "Has Media"**: Tab has media elements but they're paused
- 🔴 **Red dot + "Muted"**: Tab is currently muted

### Interface Elements

- **🔄 Refresh button**: Manually refresh the tab list
- **🔇 Mute All button**: Mute every unmuted tab with media
- **Tab count**: Shows total media tabs and how many are playing
- **Auto-refresh**: List updates automatically every 3 seconds

## 🛠️ Technical Details

### Architecture

- **Manifest V3**: Modern Chrome extension standard
- **Service Worker**: Lightweight background script for tab scanning
- **Content Script Injection**: Detects media elements in web pages
- **Chrome APIs**: Uses `tabs`, `scripting`, and `activeTab` permissions

### Performance Features

- **Batch Processing**: Handles up to 200 tabs efficiently
- **Fallback Detection**: Uses `tab.audible` when script injection fails
- **Error Handling**: Graceful degradation for protected pages
- **Memory Efficient**: Minimal background resource usage

### Supported Media

- HTML5 `<video>` elements
- HTML5 `<audio>` elements
- Embedded media players (YouTube, Vimeo, Spotify Web, etc.)
- Any content that triggers Chrome's native "audible" state

## 🔒 Permissions

The extension requests these permissions:

- **`tabs`**: Read tab information (title, audio state, etc.)
- **`scripting`**: Inject content scripts to detect media elements
- **`activeTab`**: Access active tab when popup is opened
- **`host_permissions: ["<all_urls>"]`**: Required for content script injection

## 🐛 Troubleshooting

### Common Issues

**"No Media Tabs Found" but tabs are playing audio:**
- Some sites may block content script injection
- The extension falls back to Chrome's native audio detection
- Try refreshing the extension popup

**Mute button doesn't work:**
- Ensure the tab hasn't been closed
- Some protected pages (chrome://, extension pages) cannot be muted
- Try refreshing the tab list

**Extension not detecting new media:**
- The list auto-refreshes every 3 seconds
- Click the refresh button for immediate update
- Newly opened tabs may take a moment to appear

### Limitations

- Cannot access `chrome://` or `chrome-extension://` pages
- Some sites with strict Content Security Policy may block detection
- Requires active tab permission for each site

## 🧪 Testing

### Manual Testing Checklist

- [ ] Open multiple tabs with video content (YouTube, Vimeo, etc.)
- [ ] Verify all media tabs appear in the extension popup
- [ ] Test individual tab mute/unmute functionality
- [ ] Test "Mute All" button with multiple playing tabs
- [ ] Verify status indicators update correctly
- [ ] Test tab focusing by clicking tab rows
- [ ] Check auto-refresh functionality
- [ ] Test with 10+ tabs for performance

### Test Sites

- YouTube videos
- Vimeo content
- Spotify Web Player
- Twitter videos
- Twitch streams
- HTML5 audio/video demos

## 📁 Project Structure

```
tab-media-manager/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (tab scanning)
├── popup.html            # Popup interface markup
├── popup.js              # Popup logic & UI interactions
├── popup.css             # Modern styling & animations
├── create_icons.py       # Icon generator script
├── README.md             # This file
└── icons/
    ├── icon16.png        # Toolbar icon (16x16)
    ├── icon32.png        # Extension manager (32x32)
    └── icon128.png       # Chrome Web Store (128x128)
```

## 🚧 Development

### Local Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test changes in the popup

### Building Icons

```bash
python3 create_icons.py
```

### Version Updates

1. Update `version` in `manifest.json`
2. Update version display in `popup.html`
3. Test thoroughly before releasing

## 🎯 Product Goals & Metrics

| Priority | Goal | Success Metric |
|----------|------|----------------|
| P0 | Let users mute all noisy tabs instantly | One‑click "Mute All" works on 100% of test tabs |
| P0 | Show live play/pause status for every media tab | Status icon accurate ≥95% in manual testing |
| P1 | Allow mute/unmute on individual tabs | Toggle responds <150ms |
| P2 | Persist muted state across window focus changes | Muted tabs stay muted until user unmutes |
| P3 | Auto‑refresh list when tabs change | New media tabs appear within 1s |

## 📋 Roadmap

### v0.2.0 (Next Release)
- [ ] Keyboard shortcuts (Ctrl+Shift+M for mute all)
- [ ] Badge showing number of playing tabs
- [ ] Dark mode support

### v0.3.0 (Future)
- [ ] Per-site auto-mute preferences
- [ ] Volume level indicators
- [ ] Export/import settings

### v1.0.0 (Stable)
- [ ] Chrome Web Store publication
- [ ] Comprehensive error reporting
- [ ] Performance optimizations

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

---

**Built for the #may25aivibes challenge** - Creating useful tools with AI assistance. 