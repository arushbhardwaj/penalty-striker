import { SaveManager } from './save.js';

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.audio = new Map();
    this.queue = [];
    this.loadedCount = 0;
    this.totalCount = 0;
    this.onProgress = null;
    this.onComplete = null;
  }

  queueImage(key, src) {
    this.queue.push({ type: 'image', key, src });
    this.totalCount++;
  }

  queueAudio(key, src) {
    this.queue.push({ type: 'audio', key, src });
    this.totalCount++;
  }

  start() {
    if (this.queue.length === 0) {
      if (this.onComplete) this.onComplete();
      return;
    }
    const assetsToLoad = [...this.queue];
    this.queue = [];
    assetsToLoad.forEach(asset => {
      if (asset.type === 'image') this.loadImage(asset.key, asset.src);
      else if (asset.type === 'audio') this.loadAudio(asset.key, asset.src);
    });
  }

  loadAsync(onProgress) {
    return new Promise((resolve) => {
      this.onComplete = () => {
        this.onProgress = null;
        this.onComplete = null;
        resolve({ images: this.images, audio: this.audio });
      };
      if (onProgress) {
        const userFn = onProgress;
        const orig = this.onProgress;
        this.onProgress = (pct) => {
          userFn(pct);
          if (orig) orig(pct);
        };
      }
      this.start();
    });
  }

  loadImage(key, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => this.onAssetLoaded(key, img, 'image');
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      this.onAssetLoaded(key, this.createPlaceholderTexture(key), 'image');
    };
  }

  loadAudio(key, src) {
    const audio = new Audio();
    audio.src = src;
    audio.oncanplaythrough = () => {
      audio.oncanplaythrough = null;
      this.onAssetLoaded(key, audio, 'audio');
    };
    audio.onerror = () => {
      console.error(`Failed to load audio: ${src}`);
      this.onAssetLoaded(key, null, 'audio');
    };
  }

  onAssetLoaded(key, resource, type) {
    if (type === 'image') this.images.set(key, resource);
    else if (type === 'audio') this.audio.set(key, resource);
    this.loadedCount++;
    const progress = Math.min(100, Math.floor((this.loadedCount / this.totalCount) * 100));
    if (this.onProgress) this.onProgress(progress);
    if (this.loadedCount === this.totalCount && this.onComplete) this.onComplete();
  }

  getImage(key) {
    return this.images.get(key);
  }

  getAudio(key) {
    return this.audio.get(key);
  }

  createPlaceholderTexture(key) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.substring(0, 6).toUpperCase(), 32, 32);
    return canvas;
  }
}

export class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = SaveManager.load('penalty_muted', false);
    this.volume = SaveManager.load('penalty_volume', 0.8);
    this.unlockBound = this.unlock.bind(this);
    this.setupUnlockEvents();
  }

  setupUnlockEvents() {
    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
      document.addEventListener(event, this.unlockBound, { once: true });
    });
  }

  unlock() {
    if (this.audioCtx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) this.audioCtx = new AudioCtx();
    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
      document.removeEventListener(event, this.unlockBound);
    });
  }

  playSound(key, loop = false) {
    if (this.isMuted) return;
    this.unlock();
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  stopSound(key) {}

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    SaveManager.save('penalty_volume', this.volume);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    SaveManager.save('penalty_muted', this.isMuted);
    return this.isMuted;
  }
}
