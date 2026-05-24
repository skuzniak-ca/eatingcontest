# Eatingcontest

Eatingcontest is a browser extension (Firefox and Chrome) that dynamically replaces words on web pages with user-configurable substitutions. Started as a prank in a previous job where we replaced the word "election" with "eating contest".

## How It Works

1. Add word replacement pairs through the extension popup (e.g. "election" -> "eating contest")
2. The extension scans every page you visit and replaces matching text in real time
3. Dynamically loaded content (SPAs, infinite scroll) is handled automatically
4. Removing a pair reverts the page text back to the original

Matching is whole-word and case-insensitive, so "election" matches but "reelection" does not. Special characters like `$` are supported.

## Architecture

- **Manifest V3** browser extension (works in Chrome and Firefox)
- **Content script** walks DOM text nodes using `TreeWalker`, replacing matches via regex with `\b` word boundaries (falls back to lookahead/lookbehind for strings starting or ending with special characters like `$`)
- **MutationObserver** watches for dynamically added content
- **WeakMap** stores original text node values for clean undo/restore
- **chrome.storage.local** persists replacement pairs
- Popup UI built with vanilla HTML/CSS/JS

# Getting Started

## Requirements

- A Chromium-based browser (Chrome, Edge, Brave) or Firefox
- No build step or dependencies; the extension loads unpacked as-is

## Installation

1. Clone this repository
2. **Chrome**: Go to `chrome://extensions`, enable Developer mode, click "Load unpacked", and select the project folder
3. **Firefox**: Go to `about:debugging#/runtime/this-device`, click "Load Temporary Add-on", and select `manifest.json`

## Usage

Click the extension icon to open the popup and add replacement pairs (e.g. "election" -> "eating contest"). Replacements apply to every page you visit in real time, including dynamically loaded content. Remove a pair to revert affected pages back to the original text.

## Project Structure

```
eatingcontest/
├── manifest.json   # Extension manifest (Manifest V3)
├── content.js      # Content script, DOM text replacement
├── popup.html      # Popup UI markup
├── popup.js        # Popup UI logic
├── popup.css       # Popup styling
```

## Acknowledgements

Built with assistance from [Claude](https://claude.ai) by Anthropic.
