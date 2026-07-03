const fs = require('fs');
const path = require('path');

function scanDirectory(dir, basePath = '') {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const children = scanDirectory(fullPath, relativePath);
      items.push({
        type: 'folder',
        name: entry.name,
        path: relativePath,
        children: children
      });
    } else {
      const stats = fs.statSync(fullPath);
      const ext = path.extname(entry.name).toLowerCase();

      items.push({
        type: 'file',
        name: entry.name,
        path: relativePath,
        size: stats.size,
        ext: ext
      });
    }
  }

  return items;
}

function generateAssetsJSON(structure) {
  const assets = [];

  function flatten(items) {
    for (const item of items) {
      if (item.name === 'index.html' || item.name === 'generate-index.js' ||
        item.name === 'netlify.toml' || item.name === 'README.md' ||
        item.name === 'logo512.png' || item.name === 'package.json' ||
        item.name === 'package-lock.json' || item.name === 'background.gif' ||
        item.name === 'background.jpg' || item.name === 'background.png' ||
        item.name === 'boot.gif' || item.name === 'boot.png' || item.name === 'boot.jpg' ||
        item.name === 'sobre.html') continue;

      if (item.type === 'file') {
        assets.push({
          name: item.name,
          path: item.path,
          size: item.size,
          ext: item.ext,
          type: item.ext.match(/\.(tiff?|geotiff|png|jpg|jpeg|gif|bmp|webp|pdf)$/i) ? 'image' :
            item.ext.match(/\.(json|geojson|csv)$/i) ? 'data' :
              item.ext.match(/\.(txt|md|xml|svg|js|css|html|htm|yml|yaml|ini|cfg|log|sh|bat|py)$/i) ? 'text' :
                item.ext.match(/\.(json|geojson)$/i) ? 'vector' : 'other',
          previewable: item.ext.match(/\.(tiff?|geotiff|png|jpg|jpeg|gif|bmp|webp|pdf|txt|md|json|geojson|csv|xml|svg|js|css|html|htm|yml|yaml|ini|cfg|log|sh|bat|py)$/i) ? true : false
        });
      }
      if (item.children) flatten(item.children);
    }
  }

  flatten(structure);
  return assets;
}

function generateFoldersJSON(structure) {
  const folders = [];

  function flatten(items) {
    for (const item of items) {
      if (item.name.startsWith('.')) continue;
      if (item.type === 'folder') {
        folders.push({
          name: item.name,
          path: item.path,
          children: item.children ? true : false
        });
        if (item.children) flatten(item.children);
      }
    }
  }

  flatten(structure);
  return folders;
}

function getFileIconSVG(type) {
  if (type === 'image') {
    return '<svg viewBox="0 0 48 48" fill="none"><rect x="4" y="6" width="40" height="36" rx="4" fill="#e0e7ff" stroke="#8b9cf7" stroke-width="2"/><circle cx="17" cy="18" r="4" fill="#8b9cf7"/><path d="M4 32l10-10 8 8 6-6 16 16" fill="#c7d2fe" stroke="#8b9cf7" stroke-width="2"/></svg>';
  } else if (type === 'data' || type === 'vector') {
    return '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="4" width="36" height="40" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><line x1="12" y1="14" x2="36" y2="14" stroke="#d97706" stroke-width="2"/><line x1="12" y1="22" x2="30" y2="22" stroke="#d97706" stroke-width="2"/><line x1="12" y1="30" x2="33" y2="30" stroke="#d97706" stroke-width="2"/><line x1="12" y1="38" x2="24" y2="38" stroke="#d97706" stroke-width="2"/></svg>';
  } else if (type === 'text') {
    return '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="3" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/><line x1="14" y1="16" x2="34" y2="16" stroke="#22c55e" stroke-width="2"/><line x1="14" y1="24" x2="30" y2="24" stroke="#22c55e" stroke-width="2"/><line x1="14" y1="32" x2="26" y2="32" stroke="#22c55e" stroke-width="2"/></svg>';
  } else {
    return '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="4" width="32" height="40" rx="2" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/><line x1="16" y1="16" x2="32" y2="16" stroke="#94a3b8" stroke-width="2"/><line x1="16" y1="24" x2="28" y2="24" stroke="#94a3b8" stroke-width="2"/></svg>';
  }
}

// Verifica wallpaper (background)
let backgroundStyle = "background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80');";
if (fs.existsSync('./background.gif')) {
  backgroundStyle = "background-image: url('/background.gif');";
} else if (fs.existsSync('./background.jpg')) {
  backgroundStyle = "background-image: url('/background.jpg');";
} else if (fs.existsSync('./background.png')) {
  backgroundStyle = "background-image: url('/background.png');";
}

// Verifica boot screen
let bootImage = '';
let bootDuration = 5000;
if (fs.existsSync('./boot.gif')) {
  bootImage = '/boot.gif';
  bootDuration = 5000;
} else if (fs.existsSync('./boot.png')) {
  bootImage = '/boot.png';
  bootDuration = 5000;
} else if (fs.existsSync('./boot.jpg')) {
  bootImage = '/boot.jpg';
  bootDuration = 5000;
}

const structure = scanDirectory('.');
const assets = generateAssetsJSON(structure);
const folders = generateFoldersJSON(structure);

const rootFolders = structure.filter(item => item.type === 'folder');
const rootFiles = structure.filter(item => item.type === 'file' &&
  item.name !== 'index.html' && item.name !== 'generate-index.js' &&
  item.name !== 'netlify.toml' && item.name !== 'README.md' &&
  item.name !== 'logo512.png' && item.name !== 'background.gif' &&
  item.name !== 'background.jpg' && item.name !== 'background.png' &&
  item.name !== 'boot.gif' && item.name !== 'boot.png' && item.name !== 'boot.jpg' &&
  item.name !== 'sobre.html');

let desktopIconsHTML = '';

rootFolders.forEach(folder => {
  desktopIconsHTML += `
    <div class="desktop-icon" data-folder="${folder.path}" ondblclick="openFolder('${folder.path}')" ontouchend="handleTouchIcon(this, '${folder.path}', 'folder')">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M6 8h14l4 4h18a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#f5c842" stroke="#d4a820" stroke-width="2"/>
      </svg>
      <span>${folder.name}</span>
    </div>`;
});

rootFiles.forEach(file => {
  const ext = path.extname(file.name).toLowerCase();
  const type = ext.match(/\.(tiff?|geotiff|png|jpg|jpeg|gif|bmp|webp|pdf)$/i) ? 'image' :
    ext.match(/\.(json|geojson|csv)$/i) ? 'data' :
      ext.match(/\.(txt|md|xml|svg|js|css|html|htm|yml|yaml|ini|cfg|log|sh|bat|py)$/i) ? 'text' : 'other';
  desktopIconsHTML += `
    <div class="desktop-icon" data-file="${file.path}" ondblclick="openFile('${file.path}')" ontouchend="handleTouchIcon(this, '${file.path}', 'file')">
      ${getFileIconSVG(type)}
      <span>${file.name}</span>
    </div>`;
});

const folderStructureJSON = JSON.stringify(structure).replace(/</g, '\\u003c');

let startMenuItemsHTML = '';
rootFolders.forEach(folder => {
  startMenuItemsHTML += `
      <div class="start-menu-item" onclick="openFolder('${folder.path}'); toggleStart();">
        <svg viewBox="0 0 24 24" fill="#f5c842"><path d="M3 5h6l2 2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>
        ${folder.name}
      </div>`;
});

// Boot screen HTML
const bootScreenHTML = bootImage ? `
  <div id="bootScreen">
    <img src="${bootImage}" alt="Carregando..." id="bootImage">
  </div>` : '';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Assets Mapa Imbé</title>
  <link rel="icon" href="/logo512.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Tahoma', 'Segoe UI', system-ui, sans-serif;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      cursor: default;
      user-select: none;
      background: #000;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
    }

    /* Boot Screen */
    #bootScreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: opacity 0.1s ease-out;
    }

    #bootScreen.hide {
      opacity: 0;
      pointer-events: none;
    }

    #bootImage {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
      image-rendering: pixelated;
    }

    /* Desktop */
    #desktop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 40px);
      ${backgroundStyle}
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      padding: 15px;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      gap: 12px;
    }

    .desktop-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 72px;
      padding: 8px 4px;
      border: 2px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      transition: background 0.1s;
    }

    .desktop-icon:hover {
      background: rgba(255,255,255,0.25);
      border-color: rgba(255,255,255,0.5);
    }

    .desktop-icon:active {
      background: rgba(255,255,255,0.35);
      border-color: #3168d5;
    }

    .desktop-icon svg {
      width: 40px;
      height: 40px;
      margin-bottom: 4px;
      filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
    }

    .desktop-icon span {
      color: white;
      font-size: 10px;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
      word-break: break-word;
      line-height: 1.2;
      max-width: 68px;
    }

    #desktop-footer {
      position: absolute;
      bottom: 50px;
      right: 15px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    #desktop-footer .credit {
      color: rgba(255,255,255,0.9);
      font-size: 10px;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    #desktop-footer .credit:hover { color: #67e8f9; }
    #desktop-footer .credit svg { width: 12px; height: 12px; }

    /* Taskbar */
    #taskbar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 40px;
      background: linear-gradient(to bottom, #3c6fd5, #2156c4, #1a4aa8);
      border-top: 2px solid #4f8be3;
      display: flex;
      align-items: center;
      padding: 0 4px;
      z-index: 9999;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
      padding-bottom: env(safe-area-inset-bottom);
    }

    #startBtn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      height: 30px;
      background: linear-gradient(to bottom, #6dad3b, #4c8c2a);
      border: none;
      border-radius: 0 8px 8px 0;
      color: white;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 0 0 1px #3a7a1f;
      margin-right: 4px;
      white-space: nowrap;
    }

    #startBtn:hover { background: linear-gradient(to bottom, #7dbd4b, #5c9c3a); }
    #startBtn img { width: 18px; height: 18px; border-radius: 4px; }

    #taskbar-windows {
      display: flex;
      align-items: center;
      gap: 3px;
      flex: 1;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .taskbar-window {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      height: 26px;
      background: linear-gradient(to bottom, #4b7fd9, #3a6cc9);
      border: 1px solid #1a4aa8;
      border-radius: 3px;
      color: white;
      font-size: 11px;
      cursor: pointer;
      min-width: 80px;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
    }

    .taskbar-window.active {
      background: linear-gradient(to bottom, #e8f0fc, #c8daf8);
      color: #1a3a6a;
      border-color: #1a4aa8;
    }

    #taskbar-clock {
      margin-left: auto;
      padding: 0 8px;
      color: white;
      font-size: 11px;
      text-align: right;
      background: rgba(0,0,0,0.1);
      height: 30px;
      display: flex;
      align-items: center;
      border-radius: 3px;
      white-space: nowrap;
    }

    /* Start Menu */
    #startMenu {
      position: fixed;
      bottom: 40px;
      left: 0;
      width: 280px;
      max-width: 85vw;
      background: linear-gradient(to bottom, #f0f4fc, #dce8f8);
      border: 2px solid #1a4aa8;
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      box-shadow: 4px -4px 20px rgba(0,0,0,0.4);
      z-index: 10000;
      display: none;
      padding-bottom: env(safe-area-inset-bottom);
    }

    #startMenu.show { display: block; }

    .start-menu-header {
      background: linear-gradient(to bottom, #2156c4, #1a4aa8);
      padding: 10px;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .start-menu-header img { width: 32px; height: 32px; border-radius: 8px; }
    .start-menu-header span { color: white; font-weight: bold; font-size: 13px; }
    .start-menu-items { padding: 2px 0; }

    .start-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 12px;
      color: #1a3a6a;
    }

    .start-menu-item:hover { background: #3168d5; color: white; }
    .start-menu-item svg { width: 20px; height: 20px; flex-shrink: 0; }

    /* Windows */
    .window {
      position: fixed;
      background: #f0f4fc;
      border: 2px solid #1a4aa8;
      border-radius: 8px 8px 0 0;
      box-shadow: 4px 4px 10px rgba(0,0,0,0.3);
      z-index: 100;
      display: none;
      flex-direction: column;
      min-width: 280px;
      min-height: 200px;
      overflow: hidden;
      resize: both;
    }

    .window.active { display: flex; }

    .window-header {
      display: flex;
      align-items: center;
      padding: 4px 6px;
      background: linear-gradient(to bottom, #3c6fd5, #2156c4);
      border-radius: 6px 6px 0 0;
      cursor: move;
      gap: 4px;
    }

    .win-icon { width: 18px; height: 18px; flex-shrink: 0; }
    .win-title { flex: 1; color: white; font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .win-buttons { display: flex; gap: 2px; flex-shrink: 0; }

    .win-btn {
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }

    .win-minimize { background: #3c8c3c; }
    .win-maximize { background: #3c6fd5; }
    .win-close { background: #d53c3c; }
    .win-btn:hover { filter: brightness(1.2); }

    .window-content {
      flex: 1;
      overflow: auto;
      background: white;
      -webkit-overflow-scrolling: touch;
    }

    .file-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 8px;
      align-content: flex-start;
    }

    .file-icon, .folder-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 60px;
      padding: 6px 4px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
    }

    .file-icon:hover, .folder-icon:hover { background: #e8f0fc; }
    .file-icon:active, .folder-icon:active { background: #3168d5; color: white; }
    .file-icon svg, .folder-icon svg { width: 28px; height: 28px; margin-bottom: 3px; }
    .file-icon span, .folder-icon span { font-size: 9px; word-break: break-word; line-height: 1.2; }

    /* Image viewer */
    .image-viewer .window-content {
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }

    .image-viewer img, .image-viewer canvas {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .image-viewer iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .image-viewer .loading { color: white; font-size: 13px; }

    .image-viewer .viewer-info {
      position: absolute;
      bottom: 6px;
      left: 6px;
      color: rgba(255,255,255,0.7);
      font-size: 10px;
      background: rgba(0,0,0,0.5);
      padding: 3px 6px;
      border-radius: 4px;
      z-index: 10;
    }

    .image-viewer .viewer-actions {
      position: absolute;
      bottom: 6px;
      right: 6px;
      display: flex;
      gap: 4px;
      z-index: 10;
    }

    .viewer-actions button, .viewer-actions a {
      padding: 5px 10px;
      background: rgba(49, 104, 213, 0.8);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
      text-decoration: none;
    }

    .viewer-actions button:hover, .viewer-actions a:hover {
      background: rgba(49, 104, 213, 1);
    }

    /* Text viewer */
    .text-viewer .window-content {
      background: #1e1e2e;
      padding: 0;
      position: relative;
    }

    .text-viewer pre {
      margin: 0;
      padding: 12px;
      color: #cdd6f4;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #1e1e2e;
      min-height: 100%;
    }

    .json-key { color: #89b4fa; }
    .json-string { color: #a6e3a1; }
    .json-number { color: #fab387; }
    .json-boolean { color: #cba6f7; }
    .json-null { color: #6c7086; }
    .json-bracket { color: #f9e2af; }

    .text-viewer .viewer-info {
      position: absolute;
      bottom: 6px;
      left: 6px;
      color: rgba(205, 214, 244, 0.7);
      font-size: 10px;
      background: rgba(0,0,0,0.5);
      padding: 3px 6px;
      border-radius: 4px;
      z-index: 10;
    }

    /* Context Menu */
    #contextMenu {
      position: fixed;
      background: #f0f4fc;
      border: 1px solid #1a4aa8;
      box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
      z-index: 20000;
      display: none;
      min-width: 160px;
      padding: 2px 0;
    }

    #contextMenu .menu-item {
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #contextMenu .menu-item:hover { background: #3168d5; color: white; }
    #contextMenu .separator { height: 1px; background: #ccc; margin: 2px 6px; }

    .window-footer {
      padding: 4px 8px;
      background: #f0f4fc;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
    }

    .window-breadcrumb {
      padding: 4px 8px;
      background: #f0f4fc;
      border-bottom: 1px solid #ddd;
      font-size: 10px;
      color: #3168d5;
      display: flex;
      align-items: center;
      gap: 3px;
      flex-wrap: wrap;
    }

    .window-breadcrumb span { cursor: pointer; }
    .window-breadcrumb span:hover { text-decoration: underline; }
    .window-breadcrumb .separator { color: #999; }

    .info-content {
      padding: 16px;
      text-align: center;
    }

    .info-content .big-icon { font-size: 40px; margin-bottom: 12px; }
    .info-content h3 { margin-bottom: 8px; font-size: 14px; }
    .info-content p { color: #666; margin: 3px 0; font-size: 11px; }

    .info-content button, .info-content a {
      margin-top: 10px;
      padding: 7px 14px;
      background: #3168d5;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      font-size: 11px;
    }

        /* Browser window */
    .browser-window .window-content {
      background: #fff;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .browser-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      background: linear-gradient(to bottom, #f8f9fc, #e8ecf4);
      border-bottom: 1px solid #ccc;
      flex-shrink: 0;
    }

    .browser-nav-btns {
      display: flex;
      gap: 2px;
    }

    .browser-nav-btn {
      width: 26px;
      height: 24px;
      border: 1px solid #ccc;
      background: linear-gradient(to bottom, #fff, #e8e8e8);
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .browser-nav-btn:hover { background: #e0e8f0; }
    .browser-nav-btn:disabled { opacity: 0.4; cursor: default; }

    .browser-address-bar {
      flex: 1;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #bbb;
      border-radius: 3px;
      padding: 0 8px;
      height: 26px;
      gap: 6px;
    }

    .browser-address-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .browser-address-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 11px;
      font-family: 'Tahoma', sans-serif;
      color: #333;
      background: transparent;
      min-width: 0;
    }

    .browser-go-btn {
      padding: 3px 10px;
      background: linear-gradient(to bottom, #6dad3b, #4c8c2a);
      color: white;
      border: 1px solid #3a7a1f;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      height: 24px;
    }

    .browser-go-btn:hover { background: #5c9c3a; }

    .browser-content-iframe {
      flex: 1;
      width: 100%;
      border: none;
      background: white;
    }

    .info-content button:hover, .info-content a:hover { background: #2156c4; }
    .info-content .download-btn { background: #3c8c3c; margin-left: 6px; }
    .info-content .download-btn:hover { background: #2d6e2d; }

    /* Mobile specific */
    @media (max-width: 768px) {
      #desktop {
        padding: 10px;
        gap: 8px;
        height: calc(100% - 40px);
      }

      .desktop-icon {
        width: 60px;
        padding: 6px 3px;
      }

      .desktop-icon svg {
        width: 32px;
        height: 32px;
      }

      .desktop-icon span {
        font-size: 9px;
        max-width: 56px;
      }

      #desktop-footer {
        bottom: 44px;
        right: 8px;
        gap: 2px;
      }

      #desktop-footer .credit {
        font-size: 9px;
      }

      .window {
        min-width: 100vw !important;
        min-height: 50vh !important;
        max-width: 100vw !important;
        width: 100vw !important;
        left: 0 !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }

      .window-header {
        border-radius: 0 !important;
      }

      #startMenu {
        width: 100vw;
        max-width: 100vw;
        left: 0;
        border-radius: 12px 12px 0 0;
      }

      .taskbar-window {
        min-width: 60px;
        padding: 4px 6px;
        font-size: 10px;
      }

      #taskbar-clock {
        font-size: 10px;
        padding: 0 6px;
      }
    }

    @media (max-width: 480px) {
      .desktop-icon {
        width: 52px;
        padding: 4px 2px;
      }

      .desktop-icon svg {
        width: 28px;
        height: 28px;
      }

      .desktop-icon span {
        font-size: 8px;
        max-width: 48px;
      }

      .file-icon, .folder-icon {
        width: 50px;
      }

      .file-icon svg, .folder-icon svg {
        width: 24px;
        height: 24px;
      }

      .file-icon span, .folder-icon span {
        font-size: 8px;
      }
    }
  </style>
</head>
<body>
  ${bootScreenHTML}

  <div id="desktop">
    ${desktopIconsHTML}
    
    <div id="desktop-footer">
      <span class="credit" style="font-weight:bold;margin-bottom:2px;">Assets Mapa Imbé</span>
      <a class="credit" href="https://github.com/MagalhaesVini" target="_blank">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        MagalhaesVini
      </a>
      <a class="credit" href="mailto:vinizipi@gmail.com">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"/></svg>
        vinizipi@gmail.com
      </a>
      <a class="credit" href="https://www.linkedin.com/in/magalhaesvinicius/" target="_blank">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
        LinkedIn
      </a>
    </div>
  </div>

  <div id="taskbar">
    <button id="startBtn" onclick="toggleStart()">
      <img src="/logo512.png" alt="Logo">
      Iniciar
    </button>
    <div id="taskbar-windows"></div>
    <div id="taskbar-clock"></div>
  </div>

  <div id="startMenu">
    <div class="start-menu-header">
      <img src="/logo512.png" alt="Logo">
      <span>Assets Mapa Imb\u00e9</span>
    </div>
    <div class="start-menu-items">
      ${startMenuItemsHTML}
      <div class="separator"></div>
      <div class="start-menu-item" onclick="openBrowserWindow('/sobre.html', 'Sobre - Assets Mapa Imbé'); toggleStart();">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Sobre
      </div>
    </div>
  </div>

  <div id="contextMenu">
    <div class="menu-item" onclick="refreshDesktop()">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Atualizar
    </div>
  </div>

  <div id="windowContainer"></div>

  <script src="https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist-browser/geotiff.js"></script>
  <script>
    var FOLDER_STRUCTURE = ${folderStructureJSON};
    var windowZIndex = 100;
    var activeWindow = null;
    var dragData = null;
    var isMobile = window.innerWidth <= 768;
    var touchTimeout = null;

    // Boot sequence
    window.addEventListener('DOMContentLoaded', function() {
      var bootScreen = document.getElementById('bootScreen');
      if (!bootScreen) return;

      setTimeout(function() {
        bootScreen.classList.add('hide');
        setTimeout(function() {
          if (bootScreen.parentNode) bootScreen.parentNode.removeChild(bootScreen);
        }, 300);
      }, ${bootDuration});
    });

    // Touch handler for mobile double-tap
    function handleTouchIcon(el, path, type) {
      if (!isMobile) return;
      
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
        if (type === 'folder') {
          openFolder(path);
        } else {
          openFile(path);
        }
      } else {
        touchTimeout = setTimeout(function() {
          touchTimeout = null;
        }, 300);
      }
    }

    function getFileType(ext) {
      if (!ext) return 'other';
      ext = ext.toLowerCase();
      if (ext.match(/\.(tiff?|geotiff|png|jpg|jpeg|gif|bmp|webp|pdf)$/i)) return 'image';
      if (ext.match(/\.(json|geojson)$/i)) return 'json';
      if (ext.match(/\.(csv)$/i)) return 'csv';
      if (ext.match(/\.(txt|md|xml|svg|js|css|html|htm|yml|yaml|ini|cfg|log|sh|bat|py)$/i)) return 'text';
      return 'other';
    }

    function getFileIconSVG(type) {
      if (type === 'image') {
        return '<svg viewBox="0 0 48 48" fill="none"><rect x="4" y="6" width="40" height="36" rx="4" fill="#e0e7ff" stroke="#8b9cf7" stroke-width="2"/><circle cx="17" cy="18" r="4" fill="#8b9cf7"/><path d="M4 32l10-10 8 8 6-6 16 16" fill="#c7d2fe" stroke="#8b9cf7" stroke-width="2"/></svg>';
      } else if (type === 'data' || type === 'vector' || type === 'json' || type === 'csv') {
        return '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="4" width="36" height="40" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><line x1="12" y1="14" x2="36" y2="14" stroke="#d97706" stroke-width="2"/><line x1="12" y1="22" x2="30" y2="22" stroke="#d97706" stroke-width="2"/><line x1="12" y1="30" x2="33" y2="30" stroke="#d97706" stroke-width="2"/><line x1="12" y1="38" x2="24" y2="38" stroke="#d97706" stroke-width="2"/></svg>';
      } else if (type === 'text') {
        return '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="3" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/><line x1="14" y1="16" x2="34" y2="16" stroke="#22c55e" stroke-width="2"/><line x1="14" y1="24" x2="30" y2="24" stroke="#22c55e" stroke-width="2"/><line x1="14" y1="32" x2="26" y2="32" stroke="#22c55e" stroke-width="2"/></svg>';
      } else {
        return '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="4" width="32" height="40" rx="2" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/><line x1="16" y1="16" x2="32" y2="16" stroke="#94a3b8" stroke-width="2"/><line x1="16" y1="24" x2="28" y2="24" stroke="#94a3b8" stroke-width="2"/></svg>';
      }
    }

    function formatSize(bytes) {
      if (!bytes) return '0 B';
      if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
      if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
      if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return bytes + ' B';
    }

    function updateClock() {
      var now = new Date();
      var time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('taskbar-clock').textContent = time;
    }
    setInterval(updateClock, 1000);
    updateClock();

    function toggleStart() {
      document.getElementById('startMenu').classList.toggle('show');
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#startMenu') && !e.target.closest('#startBtn')) {
        document.getElementById('startMenu').classList.remove('show');
      }
    });

    document.getElementById('desktop').addEventListener('contextmenu', function(e) {
      e.preventDefault();
      var menu = document.getElementById('contextMenu');
      menu.style.display = 'block';
      menu.style.left = Math.min(e.clientX, window.innerWidth - 170) + 'px';
      menu.style.top = e.clientY + 'px';
    });

    document.addEventListener('click', function() {
      document.getElementById('contextMenu').style.display = 'none';
    });

    function refreshDesktop() { location.reload(); }

    function findInStructure(path, structure) {
      if (!structure) return null;
      var parts = path.split('/');
      var current = { children: structure };
      
      for (var i = 0; i < parts.length; i++) {
        if (!current.children) return null;
        var found = null;
        for (var j = 0; j < current.children.length; j++) {
          if (current.children[j].name === parts[i]) {
            found = current.children[j];
            break;
          }
        }
        if (!found) return null;
        current = found;
      }
      return current;
    }

    function createWindow(title, content, options) {
      options = options || {};
      var id = 'win_' + Date.now();
      var isImageViewer = options.isImageViewer || false;
      var isTextViewer = options.isTextViewer || false;
      
      var windowEl = document.createElement('div');
      windowEl.className = 'window active';
      if (isImageViewer) windowEl.classList.add('image-viewer');
      if (isTextViewer) windowEl.classList.add('text-viewer');
      windowEl.id = id;
      
      if (isMobile) {
        windowEl.style.left = '0';
        windowEl.style.top = '0';
        windowEl.style.width = '100vw';
        windowEl.style.height = 'calc(100vh - 40px)';
        windowEl.style.minWidth = '100vw';
        windowEl.style.minHeight = '50vh';
        windowEl.style.resize = 'none';
      } else {
        windowEl.style.left = (100 + Math.random() * 100) + 'px';
        windowEl.style.top = (60 + Math.random() * 60) + 'px';
        windowEl.style.width = options.width || '500px';
        windowEl.style.height = options.height || '400px';
      }
      windowEl.style.zIndex = ++windowZIndex;
      
      windowEl.innerHTML = '<div class="window-header" onmousedown="startDrag(event, \\'' + id + '\\')" ontouchstart="startDragTouch(event, \\'' + id + '\\')">' +
        '<svg class="win-icon" viewBox="0 0 24 24" fill="#f5c842"><path d="M3 5h6l2 2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>' +
        '<span class="win-title">' + title + '</span>' +
        '<div class="win-buttons">' +
          '<button class="win-btn win-minimize" onclick="minimizeWindow(\\'' + id + '\\')">_</button>' +
          '<button class="win-btn win-maximize" onclick="maximizeWindow(\\'' + id + '\\')">\u25a1</button>' +
          '<button class="win-btn win-close" onclick="closeWindow(\\'' + id + '\\')">\u00d7</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-content">' + content + '</div>';

      document.getElementById('windowContainer').appendChild(windowEl);
      
      var taskbarBtn = document.createElement('div');
      taskbarBtn.className = 'taskbar-window active';
      taskbarBtn.id = 'tb_' + id;
      taskbarBtn.innerHTML = title;
      taskbarBtn.onclick = function() { toggleWindow(id); };
      document.getElementById('taskbar-windows').appendChild(taskbarBtn);

      focusWindow(id);
      return id;
    }

    function focusWindow(id) {
      var win = document.getElementById(id);
      if (!win) return;
      win.style.zIndex = ++windowZIndex;
      var allTb = document.querySelectorAll('.taskbar-window');
      allTb.forEach(function(tb) { tb.classList.remove('active'); });
      var tb = document.getElementById('tb_' + id);
      if (tb) tb.classList.add('active');
      activeWindow = id;
    }

    function minimizeWindow(id) {
      var win = document.getElementById(id);
      if (win) win.classList.remove('active');
      var tb = document.getElementById('tb_' + id);
      if (tb) tb.classList.remove('active');
      if (activeWindow === id) activeWindow = null;
    }

    function toggleWindow(id) {
      var win = document.getElementById(id);
      if (!win) return;
      if (win.classList.contains('active') && activeWindow === id) {
        minimizeWindow(id);
      } else {
        win.classList.add('active');
        focusWindow(id);
      }
    }

    function maximizeWindow(id) {
      if (isMobile) return;
      var win = document.getElementById(id);
      if (!win) return;
      if (win.style.width === '100%') {
        win.style.width = '500px';
        win.style.height = '400px';
        win.style.left = '100px';
        win.style.top = '60px';
      } else {
        win.style.width = '100%';
        win.style.height = 'calc(100% - 40px)';
        win.style.left = '0';
        win.style.top = '0';
      }
    }

    function closeWindow(id) {
      var win = document.getElementById(id);
      if (win) win.remove();
      var tb = document.getElementById('tb_' + id);
      if (tb) tb.remove();
      if (activeWindow === id) activeWindow = null;
    }

    function startDrag(e, id) {
      if (isMobile) return;
      var win = document.getElementById(id);
      if (!win) return;
      e.preventDefault();
      dragData = { id: id, startX: e.clientX, startY: e.clientY, startLeft: win.offsetLeft, startTop: win.offsetTop };
      focusWindow(id);
    }

    function startDragTouch(e, id) {
      if (!isMobile) return;
      var win = document.getElementById(id);
      if (!win) return;
      if (e.touches.length === 1) {
        dragData = { id: id, startX: e.touches[0].clientX, startY: e.touches[0].clientY, startLeft: win.offsetLeft, startTop: win.offsetTop };
        focusWindow(id);
      }
    }

    document.addEventListener('mousemove', function(e) {
      if (!dragData || isMobile) return;
      var win = document.getElementById(dragData.id);
      if (!win) return;
      var dx = e.clientX - dragData.startX;
      var dy = e.clientY - dragData.startY;
      win.style.left = (dragData.startLeft + dx) + 'px';
      win.style.top = (dragData.startTop + dy) + 'px';
    });

    document.addEventListener('touchmove', function(e) {
      if (!dragData || !isMobile) return;
      var win = document.getElementById(dragData.id);
      if (!win) return;
      var dx = e.touches[0].clientX - dragData.startX;
      var dy = e.touches[0].clientY - dragData.startY;
      win.style.left = (dragData.startLeft + dx) + 'px';
      win.style.top = (dragData.startTop + dy) + 'px';
    }, { passive: true });

    document.addEventListener('mouseup', function() { dragData = null; });
    document.addEventListener('touchend', function() { dragData = null; });

    document.addEventListener('mousedown', function(e) {
      var win = e.target.closest('.window');
      if (win && win.id) focusWindow(win.id);
    });

    function openFolder(folderPath) {
      var folder = findInStructure(folderPath, FOLDER_STRUCTURE);
      if (!folder || !folder.children) {
        folder = { name: folderPath, children: [] };
      }

      var files = [];
      var subfolders = [];

      for (var i = 0; i < folder.children.length; i++) {
        var child = folder.children[i];
        if (child.type === 'file' && 
            child.name !== 'index.html' && child.name !== 'generate-index.js' && 
            child.name !== 'netlify.toml' && child.name !== 'README.md' && 
            child.name !== 'logo512.png' && child.name !== 'background.gif' &&
            child.name !== 'background.jpg' && child.name !== 'background.png' &&
            child.name !== 'boot.gif' && child.name !== 'boot.png' && child.name !== 'boot.jpg' &&
            child.name !== 'sobre.html') {
          files.push(child);
        } else if (child.type === 'folder') {
          subfolders.push(child);
        }
      }

      var parts = folderPath.split('/');
      var breadcrumbHTML = '<div class="window-breadcrumb">';
      for (var b = 0; b < parts.length; b++) {
        if (b > 0) breadcrumbHTML += '<span class="separator">></span>';
        var crumbPath = parts.slice(0, b + 1).join('/');
        breadcrumbHTML += '<span onclick="openFolder(\\'' + crumbPath + '\\')">' + parts[b] + '</span>';
      }
      breadcrumbHTML += '</div>';

      var iconsHTML = '';

      for (var s = 0; s < subfolders.length; s++) {
        var sub = subfolders[s];
        iconsHTML += '<div class="folder-icon" ondblclick="openFolder(\\'' + sub.path + '\\')" ontouchend="handleTouchFolder(this, \\'' + sub.path + '\\')">' +
          '<svg viewBox="0 0 48 48" fill="none"><path d="M6 8h14l4 4h18a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#f5c842" stroke="#d4a820" stroke-width="2"/></svg>' +
          '<span>' + sub.name + '</span></div>';
      }

      for (var f = 0; f < files.length; f++) {
        var file = files[f];
        var ext = file.ext ? file.ext.toLowerCase() : '';
        var type = getFileType(ext);
        iconsHTML += '<div class="file-icon" ondblclick="openFile(\\'' + file.path + '\\')" ontouchend="handleTouchFile(this, \\'' + file.path + '\\')" title="' + file.name + ' - ' + formatSize(file.size || 0) + '">' +
          getFileIconSVG(type) + '<span>' + file.name + '</span></div>';
      }

      var content = breadcrumbHTML + 
        '<div class="file-grid">' + (iconsHTML || '<p style="padding:20px;color:#666;">Pasta vazia</p>') + '</div>' +
        '<div class="window-footer">' + subfolders.length + ' pasta(s) | ' + files.length + ' arquivo(s)</div>';

      createWindow(folder.name || folderPath, content, { width: '600px', height: '450px' });
    }

    // Touch handlers for folder contents
    var folderTouchTimeout = null;
    function handleTouchFolder(el, path) {
      if (folderTouchTimeout) {
        clearTimeout(folderTouchTimeout);
        folderTouchTimeout = null;
        openFolder(path);
      } else {
        folderTouchTimeout = setTimeout(function() { folderTouchTimeout = null; }, 300);
      }
    }

    var fileTouchTimeout = null;
    function handleTouchFile(el, path) {
      if (fileTouchTimeout) {
        clearTimeout(fileTouchTimeout);
        fileTouchTimeout = null;
        openFile(path);
      } else {
        fileTouchTimeout = setTimeout(function() { fileTouchTimeout = null; }, 300);
      }
    }

    function renderTIFF(url, containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '<div class="loading">Carregando TIFF...</div>';
      
      fetch(url)
        .then(function(r) { return r.arrayBuffer(); })
        .then(function(buf) { return GeoTIFF.fromArrayBuffer(buf); })
        .then(function(tiff) { return tiff.getImage(); })
        .then(function(image) {
          var w = image.getWidth(), h = image.getHeight();
          var maxDim = isMobile ? 1200 : 2000;
          var scale = 1;
          if (w > maxDim || h > maxDim) scale = maxDim / Math.max(w, h);
          
          var canvas = document.createElement('canvas');
          canvas.width = Math.floor(w * scale);
          canvas.height = Math.floor(h * scale);
          canvas.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
          container.innerHTML = '';
          container.appendChild(canvas);
          return image.readRasters({ window: [0, 0, w, h] });
        })
        .then(function(rasters) {
          var canvas = container.querySelector('canvas');
          if (!canvas) return;
          var ctx = canvas.getContext('2d');
          var imgData = ctx.createImageData(canvas.width, canvas.height);
          var r = rasters[0], g = rasters[1] || r, b = rasters[2] || r;
          var a = rasters.length >= 4 ? rasters[3] : null;
          var sw = rasters[0].width, sh = rasters[0].length / sw;
          var sx = sw / canvas.width, sy = sh / canvas.height;
          
          for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < canvas.width; x++) {
              var si = Math.floor(y * sy) * sw + Math.floor(x * sx);
              var di = (y * canvas.width + x) * 4;
              imgData.data[di] = r[si] !== undefined ? r[si] : 0;
              imgData.data[di+1] = g[si] !== undefined ? g[si] : 0;
              imgData.data[di+2] = b[si] !== undefined ? b[si] : 0;
              imgData.data[di+3] = a && a[si] !== undefined ? a[si] : 255;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        })
        .catch(function(err) {
          container.innerHTML = '<div class="loading">Erro ao renderizar. <a href="' + url + '" download style="color:#67e8f9;">Baixar</a></div>';
        });
    }

    function syntaxHighlightJSON(json) {
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
            match = match.slice(0, -1) + '</span>:';
            return '<span class="' + cls + '">' + match;
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      });
    }

    function openFile(filePath) {
      var file = findInStructure(filePath, FOLDER_STRUCTURE);
      if (!file || file.type !== 'file') return;

      var ext = file.ext ? file.ext.toLowerCase() : '';
      var type = getFileType(ext);

      if (ext === '.pdf') {
        var content = '<iframe src="/' + file.path + '#toolbar=0&navpanes=0" style="width:100%;height:100%;border:none;"></iframe>' +
          '<div class="viewer-info">' + file.name + ' - ' + formatSize(file.size || 0) + '</div>';
        createWindow(file.name, content, { width: '700px', height: '550px', isImageViewer: true });
      } else if (ext === '.tiff' || ext === '.tif' || ext === '.geotiff') {
        var cid = 'tiff_' + Date.now();
        var content = '<div id="' + cid + '" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;"></div>' +
          '<div class="viewer-info">' + file.name + ' - ' + formatSize(file.size || 0) + '</div>' +
          '<div class="viewer-actions"><a href="/' + file.path + '" download>Download</a></div>';
        var wid = createWindow(file.name, content, { width: '750px', height: '600px', isImageViewer: true });
        setTimeout(function() { renderTIFF('/' + file.path, cid); }, 100);
      } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.bmp' || ext === '.webp') {
        var content = '<img src="/' + file.path + '" alt="' + file.name + '">' +
          '<div class="viewer-info">' + file.name + ' - ' + formatSize(file.size || 0) + '</div>' +
          '<div class="viewer-actions"><a href="/' + file.path + '" download>Download</a></div>';
        createWindow(file.name, content, { width: '700px', height: '550px', isImageViewer: true });
      } else if (type === 'json') {
        var content = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cdd6f4;"><div class="loading">Carregando...</div></div>';
        var winId = createWindow(file.name, content, { width: '700px', height: '550px', isTextViewer: true });
        
        fetch('/' + file.path)
          .then(function(r) { return r.text(); })
          .then(function(text) {
            var win = document.getElementById(winId);
            if (!win) return;
            var wc = win.querySelector('.window-content');
            try {
              var parsed = JSON.parse(text);
              var formatted = JSON.stringify(parsed, null, 2);
              var highlighted = syntaxHighlightJSON(formatted);
              wc.innerHTML = '<pre>' + highlighted + '</pre>' +
                '<div class="viewer-info">' + file.name + ' - ' + formatSize(file.size || 0) + ' | Formatado</div>' +
                '<div class="viewer-actions"><a href="/' + file.path + '" download>Download</a></div>';
            } catch(e) {
              var escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              wc.innerHTML = '<pre>' + escaped + '</pre>' +
                '<div class="viewer-info">JSON inválido - ' + formatSize(file.size || 0) + '</div>' +
                '<div class="viewer-actions"><a href="/' + file.path + '" download>Download</a></div>';
            }
          })
          .catch(function() {
            var win = document.getElementById(winId);
            if (!win) return;
            win.querySelector('.window-content').innerHTML = '<div class="loading">Erro ao carregar. <a href="/' + file.path + '" download" style="color:#67e8f9;">Baixar</a></div>';
          });
      } else if (type === 'text' || type === 'csv') {
        var content = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cdd6f4;"><div class="loading">Carregando...</div></div>';
        var winId2 = createWindow(file.name, content, { width: '650px', height: '500px', isTextViewer: true });
        
        fetch('/' + file.path)
          .then(function(r) { return r.text(); })
          .then(function(text) {
            var win = document.getElementById(winId2);
            if (!win) return;
            var wc = win.querySelector('.window-content');
            var escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            wc.innerHTML = '<pre>' + escaped + '</pre>' +
              '<div class="viewer-info">' + file.name + ' - ' + formatSize(file.size || 0) + ' | ' + text.split('\\n').length + ' linhas</div>' +
              '<div class="viewer-actions"><a href="/' + file.path + '" download>Download</a></div>';
          })
          .catch(function() {
            var win = document.getElementById(winId2);
            if (!win) return;
            win.querySelector('.window-content').innerHTML = '<div class="loading">Erro ao carregar. <a href="/' + file.path + '" download" style="color:#67e8f9;">Baixar</a></div>';
          });
      } else {
        var content = '<div class="info-content">' +
          '<div class="big-icon">\ud83d\udcc4</div>' +
          '<h3>' + file.name + '</h3>' +
          '<p>Tipo: ' + ext.replace('.', '').toUpperCase() + '</p>' +
          '<p>Tamanho: ' + formatSize(file.size || 0) + '</p>' +
          '<p style="word-break:break-all;">Caminho: /' + file.path + '</p>' +
          '<button onclick="copyToClipboard(\\'/' + file.path + '\\')">Copiar URL</button>' +
          '<a href="/' + file.path + '" download class="download-btn">Download</a>' +
        '</div>';
        createWindow(file.name, content, { width: '400px', height: '350px' });
      }
    }


    function openBrowserWindow(url, title) {
      var id = 'browser_' + Date.now();
      
      var windowEl = document.createElement('div');
      windowEl.className = 'window active browser-window';
      windowEl.id = id;
      
      if (isMobile) {
        windowEl.style.left = '0';
        windowEl.style.top = '0';
        windowEl.style.width = '100vw';
        windowEl.style.height = 'calc(100vh - 40px)';
        windowEl.style.minWidth = '100vw';
        windowEl.style.resize = 'none';
      } else {
        windowEl.style.left = (80 + Math.random() * 80) + 'px';
        windowEl.style.top = (40 + Math.random() * 40) + 'px';
        windowEl.style.width = '650px';
        windowEl.style.height = '500px';
      }
      windowEl.style.zIndex = ++windowZIndex;
      
      windowEl.innerHTML = '<div class="window-header" onmousedown="startDrag(event, \\'' + id + '\\')" ontouchstart="startDragTouch(event, \\'' + id + '\\')">' +
        '<svg class="win-icon" viewBox="0 0 24 24" fill="#3b82f6"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><path d="M4 12l4-8 4 8-4 8zM12 12l4-8 4 8-4 8z" fill="white"/></svg>' +
        '<span class="win-title">' + (title || 'Internet Explorer') + '</span>' +
        '<div class="win-buttons">' +
          '<button class="win-btn win-minimize" onclick="minimizeWindow(\\'' + id + '\\')">_</button>' +
          '<button class="win-btn win-maximize" onclick="maximizeWindow(\\'' + id + '\\')">\u25a1</button>' +
          '<button class="win-btn win-close" onclick="closeWindow(\\'' + id + '\\')">\u00d7</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-content" style="padding:0;display:flex;flex-direction:column;">' +
        '<div class="browser-toolbar">' +
          '<div class="browser-nav-btns">' +
            '<button class="browser-nav-btn" disabled><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg></button>' +
            '<button class="browser-nav-btn" disabled><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg></button>' +
          '</div>' +
          '<div class="browser-address-bar">' +
            '<svg class="browser-address-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
            '<input class="browser-address-input" value="' + url + '" readonly onclick="this.select()">' +
          '</div>' +
          '<button class="browser-go-btn" onclick="this.parentElement.parentElement.querySelector(\\'.browser-content-iframe\\').src = this.parentElement.querySelector(\\'.browser-address-input\\').value">Ir</button>' +
        '</div>' +
        '<iframe class="browser-content-iframe" src="' + url + '"></iframe>' +
      '</div>';

      document.getElementById('windowContainer').appendChild(windowEl);
      
      var taskbarBtn = document.createElement('div');
      taskbarBtn.className = 'taskbar-window active';
      taskbarBtn.id = 'tb_' + id;
      taskbarBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#3b82f6"><circle cx="12" cy="12" r="10"/><path d="M4 12l4-8 4 8-4 8zM12 12l4-8 4 8-4 8z" fill="white"/></svg> ' + (title || 'Internet Explorer');
      taskbarBtn.onclick = function() { toggleWindow(id); };
      document.getElementById('taskbar-windows').appendChild(taskbarBtn);

      focusWindow(id);
      return id;
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(function() {
        alert('URL copiada: ' + text);
      });
    }

    // Handle resize
    window.addEventListener('resize', function() {
      isMobile = window.innerWidth <= 768;
    });
  </script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('✅ index.html gerado com sucesso!');
console.log('📦 ' + assets.length + ' assets encontrados');
console.log('📁 ' + folders.length + ' pastas encontradas');
if (fs.existsSync('./boot.gif')) {
  console.log('🎬 Boot GIF detectado!');
}
if (fs.existsSync('./background.gif')) {
  console.log('🖼️ Background GIF detectado!');
}