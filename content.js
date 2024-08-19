// YouTubeの字幕要素を監視する関数
function observeSubtitles() {
  // ビデオプレーヤーを選択
  const videoPlayer = document.querySelector('.html5-video-player');
  
  if (videoPlayer) {
    // MutationObserverを作成
    const observer = new MutationObserver((mutations) => {
      // 字幕コンテナを選択
      const subtitlesContainer = document.querySelector('.ytp-caption-window-container');
      if (subtitlesContainer) {
        // 字幕要素にクラスを適用
        const subtitles = subtitlesContainer.querySelectorAll('.ytp-caption-segment');
        subtitles.forEach(subtitle => {
          subtitle.classList.add('mosaic-subtitle');
        });
      }
    });

    // 監視を開始
    observer.observe(videoPlayer, { childList: true, subtree: true });
  }
}

// オーバーレイの表示状態を保存する関数
function saveOverlayVisibility(isVisible) {
  localStorage.setItem('subtitleOverlayVisible', isVisible);
  console.log("オーバーレイの表示状態を保存しました:", isVisible);
}

// オーバーレイの表示状態を読み込む関数
function loadOverlayVisibility() {
  const savedVisibility = localStorage.getItem('subtitleOverlayVisible');
  return savedVisibility === null ? true : savedVisibility === 'true';
}

// オーバーレイを作成し、追加する関数
function createOverlay() {
  console.log("createOverlay関数が呼び出されました");
  const videoPlayer = document.querySelector('.html5-video-player');
  if (!videoPlayer) {
    console.log("動画プレーヤーが見つかりません");
    return;
  }

  console.log("動画プレーヤーが見つかりました");

  const existingOverlay = document.getElementById('subtitle-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'subtitle-overlay';
  
  // デフォルト値を設定
  const defaultPosition = { top: '80%', left: '0%', width: '100%', height: '20%' };
  const savedPosition = JSON.parse(localStorage.getItem('subtitleOverlayPosition')) || defaultPosition;
  Object.assign(overlay.style, savedPosition);

  // オーバーレイの表示/非表示を設定
  isOverlayVisible = loadOverlayVisibility();
  overlay.style.display = isOverlayVisible ? 'block' : 'none';

  // オーバーレイが非表示の場合、字幕を表示する
  const subtitlesContainer = document.querySelector('.ytp-caption-window-container');
  if (subtitlesContainer) {
    subtitlesContainer.style.display = isOverlayVisible ? 'none' : 'block';
  }

  // オーバーレイのスタイルを設定
  overlay.style.position = 'absolute';
  overlay.style.zIndex = '1000';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 1.0)'; // アルファ値を1.0に固定
  overlay.style.pointerEvents = 'auto';
  overlay.style.cursor = 'move'; // カーソルをmoveに変更

  // ハンドルを4つ作成（上下左右）
  const handles = ['top', 'right', 'bottom', 'left'].map(direction => {
    const handle = document.createElement('div');
    handle.className = `overlay-handle ${direction}-handle`;
    handle.style.position = 'absolute';
    handle.style.backgroundColor = 'transparent'; // 背景色を透明に設定
    return handle;
  });

  handles.forEach(handle => overlay.appendChild(handle));
  videoPlayer.appendChild(overlay);

  console.log("オーバーレイが追加されました");
  console.log("オーバーレイの状態:", overlay.style.display, overlay.style.top, overlay.style.left, overlay.style.width, overlay.style.height);

  // ドラッグ機能の実装
  let isDragging = false;
  let startX, startY;
  let currentHandle;
  let isMoving = false; // オーバーレイ全体の移動フラグ

  overlay.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('overlay-handle')) {
      isDragging = true;
      currentHandle = e.target;
    } else {
      isMoving = true; // オーバーレイ本体のドラッグ開始
    }
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging && !isMoving) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const videoWidth = videoPlayer.offsetWidth;
    const videoHeight = videoPlayer.offsetHeight;

    if (isMoving) {
      // オーバーレイ全体の移動処理
      const newLeft = (parseFloat(overlay.style.left) || 0) + (deltaX / videoWidth) * 100;
      const newTop = (parseFloat(overlay.style.top) || 0) + (deltaY / videoHeight) * 100;
      overlay.style.left = `${Math.max(0, Math.min(100 - parseFloat(overlay.style.width), newLeft))}%`;
      overlay.style.top = `${Math.max(0, Math.min(100 - parseFloat(overlay.style.height), newTop))}%`;
    } else if (currentHandle.classList.contains('top-handle')) {
      const newTop = (parseFloat(overlay.style.top) || 0) + (deltaY / videoHeight) * 100;
      const newHeight = (parseFloat(overlay.style.height) || 100) - (deltaY / videoHeight) * 100;
      overlay.style.top = `${Math.max(0, Math.min(95, newTop))}%`;
      overlay.style.height = `${Math.max(5, Math.min(100, newHeight))}%`;
    } else if (currentHandle.classList.contains('bottom-handle')) {
      const newHeight = (parseFloat(overlay.style.height) || 100) + (deltaY / videoHeight) * 100;
      const currentTop = parseFloat(overlay.style.top) || 0;
      const maxHeight = 100 - currentTop;
      overlay.style.height = `${Math.max(5, Math.min(maxHeight, newHeight))}%`;
    } else if (currentHandle.classList.contains('left-handle')) {
      const newLeft = (parseFloat(overlay.style.left) || 0) + (deltaX / videoWidth) * 100;
      const newWidth = (parseFloat(overlay.style.width) || 100) - (deltaX / videoWidth) * 100;
      overlay.style.left = `${Math.max(0, Math.min(95, newLeft))}%`;
      overlay.style.width = `${Math.max(5, Math.min(100, newWidth))}%`;
    } else if (currentHandle.classList.contains('right-handle')) {
      const newWidth = (parseFloat(overlay.style.width) || 100) + (deltaX / videoWidth) * 100;
      const currentLeft = parseFloat(overlay.style.left) || 0;
      const maxWidth = 100 - currentLeft;
      overlay.style.width = `${Math.max(5, Math.min(maxWidth, newWidth))}%`;
    }

    startX = e.clientX;
    startY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging || isMoving) {
      isDragging = false;
      isMoving = false;
      // 位置とサイズを localStorage に保存
      const overlayPosition = {
        top: overlay.style.top,
        left: overlay.style.left,
        width: overlay.style.width,
        height: overlay.style.height
      };
      localStorage.setItem('subtitleOverlayPosition', JSON.stringify(overlayPosition));
      console.log("オーバーレイの位置とサイズを保存しました:", overlayPosition);
    }
  });
}

// 動画プレーヤーの変更を監視し、必要に応じてオーバーレイを再作成
function observeVideoPlayer() {
  console.log("observeVideoPlayer関数が呼び出されました");
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const videoPlayer = document.querySelector('.html5-video-player');
        if (videoPlayer && !document.getElementById('subtitle-overlay')) {
          console.log("動画プレーヤーの変更を検出しました");
          createOverlay();
          break;
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

// ページ読み込み完了時に実行
window.addEventListener('load', () => {
  console.log("ページが読み込まれました");
  initializeOverlay();
});

// URLの変更を監視する
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    onUrlChange();
  }
}).observe(document, {subtree: true, childList: true});

// URL変更時の処理
function onUrlChange() {
  console.log("URLが変更されました");
  if (window.location.pathname.startsWith('/watch')) {
    console.log("動画ページを検出しました");
    initializeOverlay();
  } else {
    console.log("動画ページではありません");
    removeOverlay();
  }
}

// オーバーレイの初期化
function initializeOverlay() {
  console.log("initializeOverlay関数が呼び出されました");
  removeOverlay(); // 既存のオーバーレイを削除

  createOverlay();
  observeSubtitles();
  observeVideoPlayer();
}

// オーバーレイを中央に移動する関数
function centerOverlay() {
  const overlay = document.getElementById('subtitle-overlay');
  const videoPlayer = document.querySelector('.html5-video-player');
  if (overlay && videoPlayer) {
    const videoWidth = videoPlayer.offsetWidth;
    const videoHeight = videoPlayer.offsetHeight;
    const overlayWidth = parseFloat(overlay.style.width) || 100;
    const overlayHeight = parseFloat(overlay.style.height) || 20;

    const newLeft = (100 - overlayWidth) / 2;
    const newTop = (100 - overlayHeight) / 2;

    overlay.style.left = `${newLeft}%`;
    overlay.style.top = `${newTop}%`;

    // 位置を localStorage に保存
    const overlayPosition = {
      top: overlay.style.top,
      left: overlay.style.left,
      width: overlay.style.width,
      height: overlay.style.height
    };
    localStorage.setItem('subtitleOverlayPosition', JSON.stringify(overlayPosition));
    console.log("オーバーレイを中央に移動しました:", overlayPosition);
  } else {
    console.log("オーバーレイまたは動画プレーヤーが見つかりません");
  }
}

// キーボードイベントリスナーを変更
document.addEventListener('keydown', function(event) {
  // '[' キーが押されたかチェック
  if (event.key === '[') {
    centerOverlay();
  }
  // ']' キーが押されたかチェック
  else if (event.key === ']') {
    toggleOverlay();
  }
});

// オーバーレイのオン・オフを切り替える関数
function toggleOverlay() {
  const overlay = document.getElementById('subtitle-overlay');
  const subtitlesContainer = document.querySelector('.ytp-caption-window-container');
  if (overlay) {
    const isVisible = overlay.style.display !== 'none';
    overlay.style.display = isVisible ? 'none' : 'block';
    if (subtitlesContainer) {
      subtitlesContainer.style.display = isVisible ? 'block' : 'none';
    }
    saveOverlayVisibility(!isVisible);
    console.log("オーバーレイの表示を切り替えました:", !isVisible);
  } else {
    console.log("オーバーレイが見つかりません");
  }
}

// オーバーレイのアルファ値を更新する関数
function updateOverlayAlpha(alpha) {
  const overlay = document.getElementById('subtitle-overlay');
  if (overlay) {
    overlay.style.backgroundColor = `rgba(0, 0, 0, 1.0)`; // アルファ値を1.0に固定
    console.log("オーバーレイのアルファ値を更新しました:", 1.0);
  } else {
    console.log("オーバーレイが見つかりません");
  }
}

// オーバーレイの初期化
function removeOverlay() {
  const existingOverlay = document.getElementById('subtitle-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
}

// オーバーレイの位置を変更する関数
function removeKeyboardListener() {
  document.removeEventListener('keydown', handleKeyDown);
}