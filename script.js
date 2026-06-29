/* =============================================================
 * penalty striker - Core Game Engine
 * ============================================================= */

/**
 * LocalStorage Utility to persist highscores and user preferences safely.
 */
class LocalStorageUtil {
    static save(key, data) {
        try {
            window.localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error("Error writing to LocalStorage", e);
            return false;
        }
    }

    static load(key, defaultValue = null) {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error("Error reading from LocalStorage", e);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error("Error removing from LocalStorage", e);
            return false;
        }
    }
}

/**
 * Handles preloading images and audio assets with progress reporting.
 */
class AssetLoader {
    constructor() {
        this.images = new Map();
        this.audio = new Map();
        this.queue = [];
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onProgress = null; // Callback: (progressPercentage) => {}
        this.onComplete = null; // Callback: () => {}
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
            if (asset.type === 'image') {
                this.loadImage(asset.key, asset.src);
            } else if (asset.type === 'audio') {
                this.loadAudio(asset.key, asset.src);
            }
        });
    }

    loadAsync(onProgress) {
        return new Promise((resolve) => {
            this.onComplete = () => {
                this.onProgress = null;
                this.onComplete = null;
                resolve({
                    images: this.images,
                    audio: this.audio
                });
            };
            if (onProgress) {
                const userOnProgress = onProgress;
                const origOnProgress = this.onProgress;
                this.onProgress = (pct) => {
                    userOnProgress(pct);
                    if (origOnProgress) origOnProgress(pct);
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
            const placeholder = this.createPlaceholderTexture(key);
            this.onAssetLoaded(key, placeholder, 'image');
        };
    }

    loadAudio(key, src) {
        // Safe loading shell: load via Audio objects.
        const audio = new Audio();
        audio.src = src;
        audio.oncanplaythrough = () => {
            audio.oncanplaythrough = null; // Prevent multi-fires
            this.onAssetLoaded(key, audio, 'audio');
        };
        audio.onerror = () => {
            console.error(`Failed to load audio: ${src}`);
            this.onAssetLoaded(key, null, 'audio');
        };
    }

    onAssetLoaded(key, resource, type) {
        if (type === 'image') {
            this.images.set(key, resource);
        } else if (type === 'audio') {
            this.audio.set(key, resource);
        }
        this.loadedCount++;

        const progress = Math.min(100, Math.floor((this.loadedCount / this.totalCount) * 100));
        if (this.onProgress) {
            this.onProgress(progress);
        }

        if (this.loadedCount === this.totalCount) {
            if (this.onComplete) {
                this.onComplete();
            }
        }
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

/**
 * Handles Web Audio API creation and playback.
 * Browser policy requires user input to unlock AudioContext.
 */
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.isMuted = LocalStorageUtil.load('penalty_muted', false);
        this.volume = LocalStorageUtil.load('penalty_volume', 0.8);

        this.unlockAudioBound = this.unlockAudio.bind(this);
        this.setupUnlockEvents();
    }

    setupUnlockEvents() {
        ['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
            document.addEventListener(event, this.unlockAudioBound, { once: true });
        });
    }

    unlockAudio() {
        if (this.audioCtx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            this.audioCtx = new AudioCtx();
            console.log("AudioContext unlocked and initialized successfully.");
        }
        // Clean up listeners
        ['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
            document.removeEventListener(event, this.unlockAudioBound);
        });
    }

    // Playback shells for integration in future phases
    playSound(key, loop = false) {
        if (this.isMuted) return;
        this.unlockAudio(); // Fallback trigger

        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        console.log(`[SoundManager] Play Sound: ${key} (Loop: ${loop})`);
    }

    stopSound(key) {
        console.log(`[SoundManager] Stop Sound: ${key}`);
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        LocalStorageUtil.save('penalty_volume', this.volume);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        LocalStorageUtil.save('penalty_muted', this.isMuted);
        console.log(`[SoundManager] Mute Toggled: ${this.isMuted}`);
        return this.isMuted;
    }
}

/**
 * Captures user mouse and touch inputs, mapping client screen bounds
 * to the fixed 1920x1080 canvas coordinate space.
 */
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.keysPressed = new Set();

        this.pointer = {
            x: 0,
            y: 0,
            isDown: false,
            startX: 0,
            startY: 0,
            startTime: 0,
            isTapped: false,
            swipe: {
                active: false,
                dx: 0,
                dy: 0,
                vx: 0,
                vy: 0
            }
        };

        this.init();
    }

    init() {
        // Keyboard inputs
        window.addEventListener('keydown', (e) => {
            const blockDefault = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
            if (blockDefault) e.preventDefault();

            if (!this.keys[e.code]) {
                this.keysPressed.add(e.code);
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse inputs
        this.canvas.addEventListener('mousedown', (e) => {
            this.onPointerDown(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            this.onPointerMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', (e) => {
            this.onPointerUp(e.clientX, e.clientY);
        });

        // Touch inputs
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                e.preventDefault(); // Stop screen panning/scrolling
                this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        });

        window.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                this.onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        });
    }

    getLogicalCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
        return {
            x: (clientX - rect.left) * (this.canvas.width / rect.width),
            y: (clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    onPointerDown(clientX, clientY) {
        const coords = this.getLogicalCoords(clientX, clientY);
        this.pointer.isDown = true;
        this.pointer.startX = coords.x;
        this.pointer.startY = coords.y;
        this.pointer.x = coords.x;
        this.pointer.y = coords.y;
        this.pointer.startTime = performance.now();
        this.pointer.isTapped = false;
        this.pointer.swipe.active = false;
    }

    onPointerMove(clientX, clientY) {
        const coords = this.getLogicalCoords(clientX, clientY);
        this.pointer.x = coords.x;
        this.pointer.y = coords.y;
    }

    onPointerUp(clientX, clientY) {
        if (!this.pointer.isDown) return;
        const coords = this.getLogicalCoords(clientX, clientY);
        this.pointer.x = coords.x;
        this.pointer.y = coords.y;

        const dt = (performance.now() - this.pointer.startTime) / 1000;
        const dx = coords.x - this.pointer.startX;
        const dy = coords.y - this.pointer.startY;
        const dist = Math.hypot(dx, dy);

        if (dist > 30 && dt < 0.5) {
            // Register flick/swipe
            this.pointer.swipe = {
                active: true,
                dx: dx,
                dy: dy,
                vx: dx / dt,
                vy: dy / dt
            };
        } else if (dist < 15) {
            // Register press
            this.pointer.isTapped = true;
        }

        this.pointer.isDown = false;
    }

    clearFrameTriggers() {
        this.keysPressed.clear();
        this.pointer.isTapped = false;
        this.pointer.swipe.active = false;
    }

    isKeyPressed(code) {
        return !!this.keys[code];
    }

    isKeyJustPressed(code) {
        return this.keysPressed.has(code);
    }
}

/**
 * Base Abstract Scene. All scene modules must extend this.
 */
class Scene {
    constructor(game) {
        this.game = game;
    }
    enter(data) { }
    exit() { }
    update(dt) { }
    render(ctx) { }
}

/**
 * Handles switching active game states and triggering lifecycle hooks.
 */
class SceneManager {
    constructor(game) {
        this.game = game;
        this.scenes = new Map();
        this.currentScene = null;
        this.transitionAlpha = 0;
        this.transitionState = null;
        this.pendingSwitch = null;
    }

    add(name, sceneInstance) {
        this.scenes.set(name, sceneInstance);
    }

    switchTo(name, data = null) {
        const nextScene = this.scenes.get(name);
        if (!nextScene) {
            console.error(`[SceneManager] Scene "${name}" not found!`);
            return;
        }
        if (this.transitionState) return;

        this.pendingSwitch = { name, data };
        this.transitionState = 'fadeOut';
        this.transitionAlpha = 0;
    }

    update(dt) {
        if (this.transitionState === 'fadeOut') {
            this.transitionAlpha += dt * 4;
            if (this.transitionAlpha >= 1) {
                this.transitionAlpha = 1;
                if (this.currentScene) this.currentScene.exit();
                this.currentScene = this.scenes.get(this.pendingSwitch.name);
                this.currentScene.enter(this.pendingSwitch.data);
                this.transitionState = 'fadeIn';
            }
        } else if (this.transitionState === 'fadeIn') {
            this.transitionAlpha -= dt * 4;
            if (this.transitionAlpha <= 0) {
                this.transitionAlpha = 0;
                this.transitionState = null;
                this.pendingSwitch = null;
            }
            if (this.currentScene) this.currentScene.update(dt);
        } else {
            if (this.currentScene) this.currentScene.update(dt);
        }
    }

    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);
        }
        if (this.transitionState && this.transitionAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            ctx.fillRect(0, 0, 1920, 1080);
        }
    }
}

/* =============================================================
 * Game Scene Implementations
 * ============================================================= */

/**
 * Helper to draw rounded rectangle shapes with backward compatibility.
 */
function drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
}

/**
 * Helper to draw glow text styles.
 */
function drawGlowingText(ctx, text, x, y, font, color, glowColor, glowRadius = 15, align = 'center') {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowRadius;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

/**
 * LoadingScene - Preloads assets and simulates engine initialization with details.
 */
class LoadingScene extends Scene {
    constructor(game) {
        super(game);
        this.progress = 0;
        this.targetProgress = 0;
        this.dots = '';
        this.dotTimer = 0;
    }

    enter() {
        this.progress = 0;
        this.targetProgress = 0;

        // Enqueue high quality inline SVG placeholders to verify asset loading
        this.game.loader.queueImage('ball', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2246%22%20fill%3D%22%2523ffffff%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M50%2032%20L61%2040%20L57%2052%20L43%2052%20L39%2040%20Z%22%20fill%3D%22%25231e293b%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M50%202%20L50%2032%20M92%2026%20L61%2040%20M76%2080%20L57%2052%20M24%2080%20L43%2052%20M8%2026%20L39%2040%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E');
        this.game.loader.queueImage('glove', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20x%3D%2225%22%20y%3D%2235%22%20width%3D%2250%22%20height%3D%2245%22%20rx%3D%2212%22%20fill%3D%22%25230ea5e9%22%20stroke%3D%22%2523ffffff%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M30%2035%20V15%20M42%2035%20V10%20M54%2035%20V10%20M66%2035%20V15%20M75%2045%20L88%2030%22%20stroke%3D%22%2523ffffff%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E');

        // Start asset loader with Promise-based async loading
        this.game.loader.loadAsync((pct) => {
            this.targetProgress = pct;
        }).then(() => {
            this.targetProgress = 100;
        });
    }

    update(dt) {
        // Smoothly interpolate loading progress for high premium aesthetic flow
        if (this.progress < this.targetProgress) {
            this.progress += 80 * dt; // Caps speed so animation feels fluid
            if (this.progress > this.targetProgress) this.progress = this.targetProgress;
        }

        // Animate loading text dots
        this.dotTimer += dt;
        if (this.dotTimer > 0.4) {
            this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
            this.dotTimer = 0;
        }

        // Scene switch on completed loading + small aesthetic delay
        if (this.progress >= 100) {
            this.game.sceneManager.switchTo('MainMenu');
        }
    }

    render(ctx) {
        // Clear frame with background
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, 1920, 1080);

        // Tech grid lines in background
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1920; i += 80) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 1080);
            ctx.stroke();
        }
        for (let j = 0; j < 1080; j += 80) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(1920, j);
            ctx.stroke();
        }

        // Ambient radial light glow
        const glow = ctx.createRadialGradient(960, 540, 50, 960, 540, 800);
        glow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 1920, 1080);

        // Logo Title
        drawGlowingText(ctx, "PENALTY STRIKER", 960, 430, "bold 90px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", "#ffffff", "rgba(16, 185, 129, 0.4)", 25);
        drawGlowingText(ctx, "LOADING" + this.dots, 960, 510, "500 20px Space Grotesk, monospace", "#10b981", "transparent", 0);

        // Loading Bar Container
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        drawRoundRect(ctx, 660, 560, 600, 16, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Glowing progress bar fill
        ctx.save();
        const fillWidth = (this.progress / 100) * 592;
        if (fillWidth > 0) {
            const fillGrad = ctx.createLinearGradient(664, 0, 664 + fillWidth, 0);
            fillGrad.addColorStop(0, '#8b5cf6');
            fillGrad.addColorStop(0.5, '#0ea5e9');
            fillGrad.addColorStop(1, '#10b981');

            ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = fillGrad;
            ctx.beginPath();
            drawRoundRect(ctx, 664, 564, fillWidth, 8, 4);
            ctx.fill();
        }
        ctx.restore();

        // Progress Text
        ctx.font = '500 14px Space Grotesk, monospace';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(this.progress)}%`, 1260, 600);
    }
}

/**
 * MainMenuScene - Welcome interface, play commands, highscore lists.
 */
class MainMenuScene extends Scene {
    constructor(game) {
        super(game);

        this.buttons = [
            { x: 960, y: 600, w: 380, h: 80, label: "PLAY", key: 'play', color: '#10b981', hoverColor: '#059669' },
            { x: 960, y: 710, w: 380, h: 80, label: "SETTINGS", key: 'settings', color: '#0ea5e9', hoverColor: '#0284c7' },
            { x: 960, y: 820, w: 380, h: 80, label: "HOW TO PLAY", key: 'howtoplay', color: '#8b5cf6', hoverColor: '#6d28d9' },
        ];

        this.footballs = [];
        for (let i = 0; i < 6; i++) {
            this.footballs.push({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                r: Math.random() * 35 + 15,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.015,
                alpha: Math.random() * 0.12 + 0.04,
                floatAmp: Math.random() * 20 + 10,
                floatSpeed: Math.random() * 1.5 + 0.5,
                floatPhase: Math.random() * Math.PI * 2,
            });
        }

        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * 1920,
                y: Math.random() * 350,
                size: Math.random() * 2 + 1,
                baseAlpha: Math.random() * 0.5 + 0.2,
                twinkleSpeed: Math.random() * 2 + 1,
                twinklePhase: Math.random() * Math.PI * 2,
            });
        }

        this.entranceTimer = 0;
        this.entranceDuration = 1.0;
    }

    enter() {
        this.entranceTimer = 0;
    }

    update(dt) {
        if (this.entranceTimer < this.entranceDuration) {
            this.entranceTimer = Math.min(this.entranceTimer + dt, this.entranceDuration);
        }

        const time = performance.now();
        const p = this.game.inputManager.pointer;

        this.footballs.forEach(b => {
            b.x += b.speedX;
            b.y += b.speedY + Math.sin(time * 0.001 * b.floatSpeed + b.floatPhase) * 0.3;
            b.rotation += b.rotSpeed;
            if (b.x < -b.r * 2) b.x = 1920 + b.r;
            if (b.x > 1920 + b.r * 2) b.x = -b.r;
            if (b.y < -b.r * 2) b.y = 1080 + b.r;
            if (b.y > 1080 + b.r * 2) b.y = -b.r;
        });

        this.stars.forEach(s => {
            const twinkle = Math.sin(time * 0.002 * s.twinkleSpeed + s.twinklePhase);
            s.alpha = s.baseAlpha + twinkle * 0.15;
            s.alpha = Math.max(0.1, Math.min(0.9, s.alpha));
        });

        this.buttons.forEach(btn => {
            const isOver = Math.abs(p.x - btn.x) < btn.w / 2 &&
                Math.abs(p.y - btn.y) < btn.h / 2;
            btn.hovered = isOver;
        });

        if (p.isTapped) {
            for (const btn of this.buttons) {
                const isOver = Math.abs(p.x - btn.x) < btn.w / 2 &&
                    Math.abs(p.y - btn.y) < btn.h / 2;
                if (isOver) {
                    this.game.soundManager.playSound('click');
                    switch (btn.key) {
                        case 'play': this.game.sceneManager.switchTo('Gameplay'); break;
                        case 'settings': this.game.sceneManager.switchTo('Settings'); break;
                        case 'howtoplay': this.game.sceneManager.switchTo('HowToPlay'); break;
                    }
                    break;
                }
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = '#060814';
        ctx.fillRect(0, 0, 1920, 1080);

        this.renderStars(ctx);
        this.renderFloodlights(ctx);
        this.renderPitch(ctx);
        this.renderFootballParticles(ctx);
        this.renderTitle(ctx);
        this.renderButtons(ctx);
        this.renderFooter(ctx);
    }

    renderStars(ctx) {
        ctx.save();
        this.stars.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    renderFloodlights(ctx) {
        this.drawFloodlight(ctx, 200, 100);
        this.drawFloodlight(ctx, 1720, 100);
    }

    drawFloodlight(ctx, x, y) {
        ctx.save();
        const beam = ctx.createRadialGradient(x, y, 10, x, y + 250, 400);
        beam.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
        beam.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(x - 40, y);
        ctx.lineTo(x + 40, y);
        ctx.lineTo(x + 300, y + 500);
        ctx.lineTo(x - 300, y + 500);
        ctx.closePath();
        ctx.fill();

        const pulse = Math.sin(performance.now() * 0.002) * 0.2 + 0.8;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(x - 45, y - 25, 90, 45);
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 20, y, 8, 0, Math.PI * 2);
        ctx.arc(x + 20, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    renderPitch(ctx) {
        ctx.save();
        const fieldGrad = ctx.createLinearGradient(960, 450, 960, 1080);
        fieldGrad.addColorStop(0, '#062010');
        fieldGrad.addColorStop(0.4, '#0d4a22');
        fieldGrad.addColorStop(1, '#083216');
        ctx.fillStyle = fieldGrad;
        ctx.beginPath();
        ctx.moveTo(300, 450);
        ctx.lineTo(1620, 450);
        ctx.lineTo(1920, 1080);
        ctx.lineTo(0, 1080);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 12; i++) {
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(300 + i * 110, 450);
                ctx.lineTo(300 + (i + 1) * 110, 450);
                ctx.lineTo(i * 160 + 160, 1080);
                ctx.lineTo(i * 160, 1080);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(300, 450);
        ctx.lineTo(0, 1080);
        ctx.moveTo(1620, 450);
        ctx.lineTo(1920, 1080);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(550, 450);
        ctx.lineTo(400, 550);
        ctx.lineTo(1520, 550);
        ctx.lineTo(1370, 450);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, 450);
        ctx.lineTo(1620, 450);
        ctx.stroke();
        ctx.restore();
    }

    renderFootballParticles(ctx) {
        this.footballs.forEach(b => {
            ctx.save();
            ctx.globalAlpha = b.alpha;
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation);

            ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, b.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.shadowBlur = 0;

            const pentR = b.r * 0.38;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const px = Math.cos(angle) * pentR;
                const py = Math.sin(angle) * pentR;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const px = Math.cos(angle) * pentR;
                const py = Math.sin(angle) * pentR;
                const ex = Math.cos(angle) * b.r;
                const ey = Math.sin(angle) * b.r;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    renderTitle(ctx) {
        const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        ctx.save();
        ctx.globalAlpha = easeOut;

        ctx.shadowColor = 'rgba(16, 185, 129, 0.2)';
        ctx.shadowBlur = 60;
        ctx.font = '900 100px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("PENALTY", 960, 260);

        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 80;
        ctx.fillStyle = '#10b981';
        ctx.fillText("STRIKER", 960, 365);

        ctx.shadowBlur = 0;
        ctx.font = '500 16px Space Grotesk, monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.fillText("CAN YOU SCORE THE WINNING PENALTY?", 960, 430);

        ctx.restore();
    }

    renderButtons(ctx) {
        const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
        this.buttons.forEach((btn, i) => {
            const btnDelay = 0.3 + i * 0.15;
            const btnProgress = Math.max(0, Math.min(1, (progress - btnDelay) / 0.3));
            const btnEase = 1 - Math.pow(1 - btnProgress, 3);
            this.drawButton(ctx, btn, btnEase);
        });
    }

    drawButton(ctx, btn, ease) {
        if (ease <= 0) return;
        ctx.save();
        ctx.globalAlpha = ease;

        const hoverScale = btn.hovered ? 1.06 : 1;
        ctx.translate(btn.x, btn.y);
        ctx.scale(hoverScale, hoverScale);
        ctx.translate(-btn.x, -btn.y);

        ctx.shadowColor = btn.hovered ? btn.color : 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = btn.hovered ? 30 : 10;

        const grad = ctx.createLinearGradient(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.x - btn.w / 2, btn.y + btn.h / 2);
        if (btn.hovered) {
            grad.addColorStop(0, btn.color);
            grad.addColorStop(1, btn.hoverColor);
            ctx.fillStyle = grad;
        } else {
            grad.addColorStop(0, 'rgba(30, 41, 59, 0.8)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 16);
        ctx.fill();

        ctx.strokeStyle = btn.hovered ? '#ffffff' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = btn.hovered ? 2.5 : 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.font = '800 24px Outfit, sans-serif';
        ctx.fillStyle = btn.hovered ? '#0b0f19' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x, btn.y);
        ctx.restore();
    }

    renderFooter(ctx) {
        const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
        ctx.save();
        ctx.globalAlpha = progress * 0.5;
        ctx.font = '500 12px Space Grotesk, monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText("HTML5 CANVAS GAME", 960, 1040);
        ctx.restore();
    }
}

/**
 * GameplayScene - Holds the main arena UI, kicker spot, goalposts, and swipe controllers.
 */
class GameplayScene extends Scene {
    constructor(game) {
        super(game);
        this.pauseBtn = { x: 1840, y: 80, w: 60, h: 60, hovered: false };
        this.score = 0;
        this.attempts = 0;
        this.multiplier = 1;
        this.ballLoaded = false;

        // Touch instruction helper variables
        this.swipePulse = 0;

        // Ball position (logical scale)
        this.ball = { x: 960, y: 850, r: 50 };
    }

    enter() {
        this.score = 0;
        this.attempts = 0;
        this.multiplier = 1;
        this.ball.x = 960;
        this.ball.y = 850;
        this.ballLoaded = true;
    }

    update(dt) {
        const p = this.game.inputManager.pointer;

        // Pulse the instruction visual
        this.swipePulse += 3.5 * dt;

        // Handle pause button hover
        const isOverPause = Math.abs(p.x - this.pauseBtn.x) < this.pauseBtn.w / 2 &&
            Math.abs(p.y - this.pauseBtn.y) < this.pauseBtn.h / 2;
        this.pauseBtn.hovered = isOverPause;

        // Triggers pause
        if (p.isTapped && isOverPause) {
            this.game.soundManager.playSound('click');
            this.game.sceneManager.switchTo('Pause', this);
            return;
        }

        // Catch Esc keyboard input to pause
        if (this.game.inputManager.isKeyJustPressed('Escape')) {
            this.game.soundManager.playSound('click');
            this.game.sceneManager.switchTo('Pause', this);
            return;
        }

        // Temporary simulator for shooting: swipe upwards triggers score, any swipe sideways triggers miss.
        if (p.swipe.active) {
            this.attempts++;
            const isTargeted = Math.abs(p.swipe.dx) < 250 && p.swipe.dy < -100;

            if (isTargeted) {
                this.score++;
                this.multiplier = Math.min(5, this.multiplier + 1);
                this.game.soundManager.playSound('goal');
            } else {
                this.multiplier = 1;
                this.game.soundManager.playSound('miss');
            }

            // Simulating match termination limit of 5 attempts
            if (this.attempts >= 5) {
                // Save records
                const currentHighScore = LocalStorageUtil.load('penalty_highscore', 0);
                const finalPoints = this.score * 300 + (this.multiplier * 50);

                if (finalPoints > currentHighScore) {
                    LocalStorageUtil.save('penalty_highscore', finalPoints);
                }

                const prevPlayed = LocalStorageUtil.load('penalty_matches', 0);
                LocalStorageUtil.save('penalty_matches', prevPlayed + 1);

                setTimeout(() => {
                    this.game.sceneManager.switchTo('GameOver', {
                        score: this.score,
                        attempts: this.attempts,
                        points: finalPoints,
                        newRecord: finalPoints > currentHighScore
                    });
                }, 800);
            }
        }
    }

    render(ctx) {
        // Clear screen with premium dark grass color
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, 1920, 1080);

        // Render football pitch grass
        this.renderStadiumField(ctx);

        // Render visual Goal Post
        this.renderGoalPost(ctx);

        // Render HUD stats cards
        this.renderHUD(ctx);

        // Render Ball at Penalty spot
        this.renderBall(ctx);

        // Render Tutorial Swipe Hint
        if (this.attempts === 0) {
            this.renderSwipeTutorial(ctx);
        }

        // Render HUD Pause Button
        this.renderPauseButton(ctx, this.pauseBtn);
    }

    renderStadiumField(ctx) {
        // Green lawn horizon division
        const horizon = 460;

        ctx.save();
        const fieldGrad = ctx.createLinearGradient(960, horizon, 960, 1080);
        fieldGrad.addColorStop(0, '#092915');
        fieldGrad.addColorStop(0.6, '#0f4f24');
        fieldGrad.addColorStop(1, '#0a3617');
        ctx.fillStyle = fieldGrad;

        ctx.beginPath();
        ctx.moveTo(350, horizon);
        ctx.lineTo(1570, horizon);
        ctx.lineTo(1920, 1080);
        ctx.lineTo(0, 1080);
        ctx.closePath();
        ctx.fill();

        // Radial Stadium glow
        const glow = ctx.createRadialGradient(960, horizon, 100, 960, horizon, 700);
        glow.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 1920, 1080);

        // Penalty area box line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Outer penalty box lines
        ctx.moveTo(600, horizon);
        ctx.lineTo(480, horizon + 150);
        ctx.lineTo(1440, horizon + 150);
        ctx.lineTo(1320, horizon);
        ctx.stroke();

        // Draw penalty spot circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(960, 850, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    renderGoalPost(ctx) {
        const gx = 960;
        const gy = 440;
        const gw = 760;
        const gh = 280;

        ctx.save();
        // Net Mesh Grids in Background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Draw Net columns
        for (let col = gx - gw / 2; col <= gx + gw / 2; col += 20) {
            ctx.moveTo(col, gy - gh);
            ctx.lineTo(col + (col - gx) * 0.05, gy); // perspective tilt
        }
        // Draw Net rows
        for (let row = gy - gh; row <= gy; row += 20) {
            // compute width at row perspective
            const scale = 1.0 + ((row - (gy - gh)) / gh) * 0.05;
            ctx.moveTo(gx - (gw / 2) * scale, row);
            ctx.lineTo(gx + (gw / 2) * scale, row);
        }
        ctx.stroke();

        // Goalkeeper Shadow guide (visual placeholder)
        const keeperPulse = Math.sin(performance.now() * 0.003) * 140;
        const gloveImg = this.game.loader.getImage('glove');
        if (gloveImg) {
            // Draw goalie gloves left and right
            ctx.drawImage(gloveImg, gx - 40 + keeperPulse, gy - gh + 80, 80, 80);
            ctx.drawImage(gloveImg, gx - 120 + keeperPulse, gy - gh + 100, 80, 80);
        } else {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(gx + keeperPulse, gy - gh + 120, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Thick Goal Posts (Posts Outline)
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(gx - gw / 2, gy);
        ctx.lineTo(gx - gw / 2, gy - gh);
        ctx.lineTo(gx + gw / 2, gy - gh);
        ctx.lineTo(gx + gw / 2, gy);
        ctx.stroke();

        ctx.restore();
    }

    renderBall(ctx) {
        ctx.save();
        // Shadow underneath ball
        const shadowGrad = ctx.createRadialGradient(this.ball.x, this.ball.y + 40, 2, this.ball.x, this.ball.y + 40, 50);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y + 40, 50, 0, Math.PI * 2);
        ctx.fill();

        // Draw the Ball Texture
        const ballImg = this.game.loader.getImage('ball');
        if (ballImg) {
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 8;
            ctx.drawImage(ballImg, this.ball.x - this.ball.r, this.ball.y - this.ball.r, this.ball.r * 2, this.ball.r * 2);
        } else {
            // Draw vector backup ball
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    renderHUD(ctx) {
        ctx.save();
        // Main HUD container card
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, 800, 40, 320, 80, 16);
        ctx.fill();
        ctx.stroke();

        // Labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 12px Space Grotesk, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText("MATCH PENALTIES", 960, 60);

        ctx.font = 'bold 32px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${this.score} / ${this.attempts}`, 960, 95);

        // Multiplier streak tag left side
        if (this.multiplier > 1) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            drawRoundRect(ctx, 700, 50, 80, 60, 12);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 20px Space Grotesk, monospace';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`x${this.multiplier}`, 740, 80);
        }
        ctx.restore();
    }

    renderSwipeTutorial(ctx) {
        ctx.save();
        // Dynamic moving arrow pointing to goal post
        const yOffset = Math.sin(this.swipePulse) * 30;

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(960, 750 + yOffset);
        ctx.lineTo(960, 680 + yOffset);
        ctx.lineTo(945, 695 + yOffset);
        ctx.moveTo(960, 680 + yOffset);
        ctx.lineTo(975, 695 + yOffset);
        ctx.stroke();

        drawGlowingText(ctx, "FLICK OR DRAG BALL UPWARDS TO SHOOT", 960, 960, "bold 16px Space Grotesk, monospace", "#ffffff", "rgba(0,0,0,0.5)", 8);
        ctx.restore();
    }

    renderPauseButton(ctx, btn) {
        ctx.save();
        ctx.fillStyle = btn.hovered ? 'rgba(255,255,255,0.1)' : 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        // Draw standard pause lines
        ctx.fillRect(btn.x - 8, btn.y - 12, 5, 24);
        ctx.fillRect(btn.x + 3, btn.y - 12, 5, 24);
        ctx.restore();
    }
}

/**
 * PauseScene - Freezes dynamic scene frames and renders translucent options overlay.
 */
class PauseScene extends Scene {
    constructor(game) {
        super(game);
        this.resumeBtn = { x: 960, y: 530, w: 320, h: 64, label: "RESUME", hovered: false };
        this.quitBtn = { x: 960, y: 630, w: 320, h: 64, label: "QUIT TO MENU", hovered: false };
        this.previousScene = null;
    }

    enter(data) {
        this.previousScene = data;
    }

    update(dt) {
        const p = this.game.inputManager.pointer;

        // Hover checkers
        const isOverResume = Math.abs(p.x - this.resumeBtn.x) < this.resumeBtn.w / 2 &&
            Math.abs(p.y - this.resumeBtn.y) < this.resumeBtn.h / 2;
        this.resumeBtn.hovered = isOverResume;

        const isOverQuit = Math.abs(p.x - this.quitBtn.x) < this.quitBtn.w / 2 &&
            Math.abs(p.y - this.quitBtn.y) < this.quitBtn.h / 2;
        this.quitBtn.hovered = isOverQuit;

        // Click handlers
        if (p.isTapped) {
            if (isOverResume) {
                this.game.soundManager.playSound('click');
                this.game.sceneManager.switchTo('Gameplay');
            } else if (isOverQuit) {
                this.game.soundManager.playSound('click');
                this.game.sceneManager.switchTo('MainMenu');
            }
        }

        // Keyboard resume
        if (this.game.inputManager.isKeyJustPressed('Escape')) {
            this.game.soundManager.playSound('click');
            this.game.sceneManager.switchTo('Gameplay');
        }
    }

    render(ctx) {
        // Draw underlying active gameplay in background
        if (this.previousScene) {
            this.previousScene.render(ctx);
        }

        // Draw overlay frosted glass tint
        ctx.fillStyle = 'rgba(5, 7, 12, 0.82)';
        ctx.fillRect(0, 0, 1920, 1080);

        // Options Dialog container Box
        ctx.save();
        ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        drawRoundRect(ctx, 760, 340, 400, 400, 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Titles
        drawGlowingText(ctx, "PAUSED", 960, 410, "900 48px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", "#ffffff", "rgba(14, 165, 233, 0.4)", 15);

        // Buttons
        this.renderOptionButton(ctx, this.resumeBtn, '#0ea5e9');
        this.renderOptionButton(ctx, this.quitBtn, '#ef4444');
    }

    renderOptionButton(ctx, btn, hoverColor) {
        ctx.save();

        ctx.fillStyle = btn.hovered ? hoverColor : 'rgba(30, 41, 59, 0.6)';
        ctx.strokeStyle = btn.hovered ? '#ffffff' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = btn.hovered ? 2 : 1;

        ctx.beginPath();
        drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 20px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.fillStyle = btn.hovered ? '#0b0f19' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x, btn.y);

        ctx.restore();
    }
}

/**
 * GameOverScene - Match summary scorecard layout and restart handlers.
 */
class GameOverScene extends Scene {
    constructor(game) {
        super(game);
        this.replayBtn = { x: 960, y: 730, w: 320, h: 64, label: "PLAY AGAIN", hovered: false };
        this.menuBtn = { x: 960, y: 830, w: 320, h: 64, label: "MAIN MENU", hovered: false };
        this.stats = { score: 0, attempts: 0, points: 0, newRecord: false };
    }

    enter(data) {
        if (data) {
            this.stats = data;
        }
    }

    update(dt) {
        const p = this.game.inputManager.pointer;

        // Hover checkers
        const isOverReplay = Math.abs(p.x - this.replayBtn.x) < this.replayBtn.w / 2 &&
            Math.abs(p.y - this.replayBtn.y) < this.replayBtn.h / 2;
        this.replayBtn.hovered = isOverReplay;

        const isOverMenu = Math.abs(p.x - this.menuBtn.x) < this.menuBtn.w / 2 &&
            Math.abs(p.y - this.menuBtn.y) < this.menuBtn.h / 2;
        this.menuBtn.hovered = isOverMenu;

        // Clicks
        if (p.isTapped) {
            if (isOverReplay) {
                this.game.soundManager.playSound('click');
                this.game.sceneManager.switchTo('Gameplay');
            } else if (isOverMenu) {
                this.game.soundManager.playSound('click');
                this.game.sceneManager.switchTo('MainMenu');
            }
        }
    }

    render(ctx) {
        // Full screen cover
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, 1920, 1080);

        // Ambient glow behind scorecard
        const ambientGlow = ctx.createRadialGradient(960, 540, 10, 960, 540, 500);
        ambientGlow.addColorStop(0, this.stats.newRecord ? 'rgba(245, 158, 11, 0.08)' : 'rgba(139, 92, 246, 0.08)');
        ambientGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ambientGlow;
        ctx.fillRect(0, 0, 1920, 1080);

        // Scorecard Card container
        ctx.save();
        ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
        ctx.strokeStyle = this.stats.newRecord ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = this.stats.newRecord ? 3 : 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, 720, 220, 480, 420, 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Titles
        if (this.stats.newRecord) {
            drawGlowingText(ctx, "NEW STADIUM RECORD!", 960, 280, "900 36px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", "#f59e0b", "rgba(245, 158, 11, 0.3)", 15);
        } else {
            drawGlowingText(ctx, "MATCH COMPLETED", 960, 280, "900 36px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", "#ffffff", "rgba(255, 255, 255, 0.1)", 10);
        }

        // Stats Values Rows
        ctx.save();
        ctx.textAlign = 'left';
        ctx.font = '500 20px Space Grotesk, monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText("GOALS SCORED:", 780, 360);
        ctx.fillText("ATTEMPTS:", 780, 420);
        ctx.fillText("SCORE POINTS:", 780, 480);

        ctx.textAlign = 'right';
        ctx.font = 'bold 24px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`${this.stats.score} / ${this.stats.attempts}`, 1140, 360);
        ctx.fillText(`${this.stats.attempts}`, 1140, 420);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`${this.stats.points} PTS`, 1140, 480);
        ctx.restore();

        // Render Action Buttons
        this.renderOptionButton(ctx, this.replayBtn, '#10b981');
        this.renderOptionButton(ctx, this.menuBtn, '#475569');
    }

    renderOptionButton(ctx, btn, hoverColor) {
        ctx.save();
        ctx.fillStyle = btn.hovered ? hoverColor : 'rgba(30, 41, 59, 0.6)';
        ctx.strokeStyle = btn.hovered ? '#ffffff' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = btn.hovered ? 2 : 1;

        ctx.beginPath();
        drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 20px Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.fillStyle = btn.hovered ? '#0b0f19' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x, btn.y);
        ctx.restore();
    }
}

/**
 * SettingsScene - Placeholder for settings/preferences screen.
 */
class SettingsScene extends Scene {
    constructor(game) {
        super(game);
        this.backBtn = { x: 960, y: 880, w: 320, h: 64, label: "BACK", hovered: false };
    }

    enter() {}

    update(dt) {
        const p = this.game.inputManager.pointer;
        const isOverBack = Math.abs(p.x - this.backBtn.x) < this.backBtn.w / 2 &&
            Math.abs(p.y - this.backBtn.y) < this.backBtn.h / 2;
        this.backBtn.hovered = isOverBack;

        if (p.isTapped && isOverBack) {
            this.game.soundManager.playSound('click');
            this.game.sceneManager.switchTo('MainMenu');
        }
        if (this.game.inputManager.isKeyJustPressed('Escape')) {
            this.game.sceneManager.switchTo('MainMenu');
        }
    }

    render(ctx) {
        ctx.fillStyle = '#060814';
        ctx.fillRect(0, 0, 1920, 1080);

        ctx.save();
        ctx.shadowColor = 'rgba(14, 165, 233, 0.3)';
        ctx.shadowBlur = 30;
        ctx.font = '900 64px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("SETTINGS", 960, 300);
        ctx.shadowBlur = 0;

        ctx.font = '500 22px Space Grotesk, monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText("SOUND SETTINGS & PREFERENCES", 960, 400);
        ctx.fillStyle = '#475569';
        ctx.fillText("COMING SOON", 960, 460);
        ctx.restore();

        this.renderButton(ctx, this.backBtn, '#0ea5e9');
    }

    renderButton(ctx, btn, color) {
        ctx.save();
        ctx.shadowColor = btn.hovered ? color : 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = btn.hovered ? 20 : 5;
        ctx.fillStyle = btn.hovered ? color : 'rgba(30, 41, 59, 0.6)';
        ctx.strokeStyle = btn.hovered ? '#ffffff' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = btn.hovered ? 2 : 1;
        ctx.beginPath();
        drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillStyle = btn.hovered ? '#0b0f19' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x, btn.y);
        ctx.restore();
    }
}

/**
 * HowToPlayScene - Shows game instructions and controls.
 */
class HowToPlayScene extends Scene {
    constructor(game) {
        super(game);
        this.backBtn = { x: 960, y: 880, w: 320, h: 64, label: "BACK", hovered: false };
    }

    enter() {}

    update(dt) {
        const p = this.game.inputManager.pointer;
        const isOverBack = Math.abs(p.x - this.backBtn.x) < this.backBtn.w / 2 &&
            Math.abs(p.y - this.backBtn.y) < this.backBtn.h / 2;
        this.backBtn.hovered = isOverBack;

        if (p.isTapped && isOverBack) {
            this.game.soundManager.playSound('click');
            this.game.sceneManager.switchTo('MainMenu');
        }
        if (this.game.inputManager.isKeyJustPressed('Escape')) {
            this.game.sceneManager.switchTo('MainMenu');
        }
    }

    render(ctx) {
        ctx.fillStyle = '#060814';
        ctx.fillRect(0, 0, 1920, 1080);

        ctx.save();
        ctx.shadowColor = 'rgba(139, 92, 246, 0.3)';
        ctx.shadowBlur = 30;
        ctx.font = '900 64px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("HOW TO PLAY", 960, 250);
        ctx.shadowBlur = 0;

        ctx.font = '500 22px Space Grotesk, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        const instructions = [
            "1. SWIPE UP on the ball to shoot",
            "2. AIM by swiping left or right",
            "3. SCORE 5 penalties to win the match",
            "4. BUILD streaks for multiplier bonus",
            "5. BEAT your high score to set records",
        ];
        instructions.forEach((text, i) => {
            ctx.fillText(text, 540, 400 + i * 60);
        });
        ctx.restore();

        this.renderButton(ctx, this.backBtn, '#8b5cf6');
    }

    renderButton(ctx, btn, color) {
        ctx.save();
        ctx.shadowColor = btn.hovered ? color : 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = btn.hovered ? 20 : 5;
        ctx.fillStyle = btn.hovered ? color : 'rgba(30, 41, 59, 0.6)';
        ctx.strokeStyle = btn.hovered ? '#ffffff' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = btn.hovered ? 2 : 1;
        ctx.beginPath();
        drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillStyle = btn.hovered ? '#0b0f19' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x, btn.y);
        ctx.restore();
    }
}

/* =============================================================
 * Core Engine Class - Orchestrator
 * ============================================================= */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Define high res internal dimensions for graphics crispness
        this.canvas.width = 1920;
        this.canvas.height = 1080;

        // Managers initializations
        this.loader = new AssetLoader();
        this.soundManager = new SoundManager();
        this.inputManager = new InputManager(this.canvas);
        this.sceneManager = new SceneManager(this);

        // Delta-Time properties
        this.lastTime = 0;
        this.fps = 0;

        // Game status flags
        this.isTabPaused = false;

        this.init();
    }

    init() {
        // Bind window resize event
        window.addEventListener('resize', () => this.onResize());
        this.onResize();

        // Listen for visibility transitions to pause loop
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());

        // Create and register game Scenes
        this.sceneManager.add('Loading', new LoadingScene(this));
        this.sceneManager.add('MainMenu', new MainMenuScene(this));
        this.sceneManager.add('Settings', new SettingsScene(this));
        this.sceneManager.add('HowToPlay', new HowToPlayScene(this));
        this.sceneManager.add('Gameplay', new GameplayScene(this));
        this.sceneManager.add('Pause', new PauseScene(this));
        this.sceneManager.add('GameOver', new GameOverScene(this));

        // Start loading loop scene
        this.sceneManager.switchTo('Loading');

        // Initial launch of requestAnimationFrame loop
        requestAnimationFrame((time) => this.run(time));
    }

    onResize() {
        // Forces canvas bounds updates
        // Layout updates are handled by CSS styles natively.
        // Input Manager coordinates translate correctly using canvas bounding box client dimensions dynamically.
        console.log(`[Game] Layout Resized: Width=${window.innerWidth} Height=${window.innerHeight}`);
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.isTabPaused = true;
            if (this.sceneManager.currentScene && this.sceneManager.currentScene.constructor.name === 'GameplayScene') {
                // Auto pause if active gameplay is hidden
                this.sceneManager.switchTo('Pause', this.sceneManager.currentScene);
            }
            console.log("[Game] Tab out of focus, engine loop suspended.");
        } else {
            this.isTabPaused = false;
            this.lastTime = performance.now();
            console.log("[Game] Tab in focus, engine loop resumed.");
        }
    }

    run(time) {
        if (this.isTabPaused) {
            // Wait and request again
            requestAnimationFrame((t) => this.run(t));
            return;
        }

        if (!this.lastTime) this.lastTime = time;
        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Cap deltaTime to prevent major calculation glitch jumps
        if (dt > 0.1) dt = 0.1;

        // Update current frames per second metric
        this.fps = Math.round(1 / dt);

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.run(t));
    }

    update(dt) {
        // Run active state logic updates
        this.sceneManager.update(dt);

        // Clear dynamic trigger locks in inputs
        this.inputManager.clearFrameTriggers();
    }

    render() {
        // Clear logic frames
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render current active scene drawings
        this.sceneManager.render(this.ctx);

        // Draw Debug FPS Indicator top-left
        this.renderDebugHUD();
    }

    renderDebugHUD() {
        // Semi-transparent tiny dark tag
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        this.ctx.beginPath();
        drawRoundRect(this.ctx, 20, 20, 80, 30, 6);
        this.ctx.fill();

        this.ctx.font = 'bold 12px Space Grotesk, monospace';
        this.ctx.fillStyle = this.fps >= 55 ? '#10b981' : (this.fps >= 30 ? '#f59e0b' : '#ef4444');
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.fps} FPS`, 60, 35);
        this.ctx.restore();
    }
}

// Instantiate the game core once HTML and elements render
window.addEventListener('load', () => {
    window.game = new Game();
});
