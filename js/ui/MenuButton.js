export class MenuButton {
  constructor({
    label = 'BUTTON',
    theme = 'red',
    onClick = null,
    sceneName = null,
    width = '100%',
    maxWidth = '400px',
    fontSize = 'clamp(0.9rem, 1.5vw, 1.4rem)',
    borderRadius = null,
    borderWidth = '0.04em',
    depth = '0.5em',
    transitionDuration = '120ms',
    fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight = '800',
    letterSpacing = '0.08em',
    minHeight = '3.8em',
    entranceDelay = '0s',
    colors = null,
  } = {}) {
    this.config = {
      label,
      theme,
      onClick,
      sceneName,
      width,
      maxWidth,
      fontSize,
      borderRadius,
      borderWidth,
      depth,
      transitionDuration,
      fontFamily,
      fontWeight,
      letterSpacing,
      minHeight,
      entranceDelay,
      colors,
    };
    this.element = null;
    this._onClickBound = null;
  }

  create(container) {
    const c = this.config;

    const btn = document.createElement('button');
    btn.className = `game-btn game-btn--${c.theme}`;
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', c.label);

    if (c.sceneName && !c.onClick) {
      btn.dataset.scene = c.sceneName;
    }

    const span = document.createElement('span');
    span.className = 'btn-text';
    span.textContent = c.label;
    btn.appendChild(span);

    btn.style.width = c.width;
    btn.style.maxWidth = c.maxWidth;
    btn.style.fontSize = c.fontSize;
    btn.style.minHeight = c.minHeight;
    btn.style.fontFamily = c.fontFamily;
    btn.style.fontWeight = c.fontWeight;
    btn.style.letterSpacing = c.letterSpacing;
    btn.style.setProperty('--b-radius', c.borderRadius);
    btn.style.setProperty('--b-outline', c.borderWidth);
    btn.style.setProperty('--b-depth', c.depth);
    btn.style.setProperty('--btn-transition', c.transitionDuration);
    btn.style.animationDelay = c.entranceDelay;
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(24px)';

    if (c.colors) {
      this._applyCustomColors(btn, c.colors);
    }

    if (c.onClick) {
      this._onClickBound = c.onClick;
      btn.addEventListener('click', this._onClickBound);
    }

    this.element = btn;
    if (container) {
      container.appendChild(btn);
      btn.getBoundingClientRect();
      btn.style.transition =
        `opacity ${c.transitionDuration} ease ${c.entranceDelay}, ` +
        `transform ${c.transitionDuration} ease ${c.entranceDelay}`;
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    }

    return btn;
  }

  _applyCustomColors(btn, colors) {
    const map = {
      outline: '--btn-outline',
      glossyTop: '--btn-glossy-top',
      glossyBot: '--btn-glossy-bot',
      faceTop: '--btn-face-top',
      faceBot: '--btn-face-bot',
      glossband: '--btn-glossband',
      bodyTop: '--btn-body-top',
      bodyBot: '--btn-body-bot',
      separator: '--btn-separator',
      depthFill: '--btn-depth-fill',
      shadow: '--btn-shadow',
    };
    for (const [key, prop] of Object.entries(map)) {
      if (colors[key] !== undefined) {
        btn.style.setProperty(prop, colors[key]);
      }
    }
  }

  setDisabled(disabled) {
    if (this.element) {
      this.element.disabled = disabled;
    }
  }

  setLabel(label) {
    if (this.element) {
      const span = this.element.querySelector('.btn-text');
      if (span) span.textContent = label;
    }
  }

  destroy() {
    if (this.element) {
      if (this._onClickBound) {
        this.element.removeEventListener('click', this._onClickBound);
      }
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
    this.element = null;
  }

  static create(container, config) {
    const btn = new MenuButton(config);
    btn.create(container);
    return btn;
  }
}
