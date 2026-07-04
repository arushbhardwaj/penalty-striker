export class MenuButton {
  constructor({
    label = 'BUTTON',
    theme = 'red',
    onClick = null,
    sceneName = null,
    icon = null,
    width = '100%',
    maxWidth = '400px',
    fontSize = 'clamp(1.2rem, 2vw, 2rem)',
    borderRadius = null,
    borderWidth = null,
    depth = null,
    transitionDuration = '100ms',
    fontFamily = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight = '800',
    letterSpacing = '0.02em',
    minHeight = null,
    entranceDelay = '0s',
    colors = null,
  } = {}) {
    this.config = {
      label,
      theme,
      onClick,
      sceneName,
      icon,
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

    if (c.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'btn-icon';
      iconSpan.innerHTML = c.icon;
      btn.appendChild(iconSpan);
    }

    const span = document.createElement('span');
    span.className = 'btn-text';
    span.textContent = c.label;
    btn.appendChild(span);

    btn.style.width = c.width;
    btn.style.maxWidth = c.maxWidth;
    btn.style.fontSize = c.fontSize;
    if (c.minHeight) btn.style.minHeight = c.minHeight;
    btn.style.fontFamily = c.fontFamily;
    btn.style.fontWeight = c.fontWeight;
    btn.style.letterSpacing = c.letterSpacing;
    if (c.borderRadius) btn.style.setProperty('--b-radius', c.borderRadius);
    if (c.borderWidth) btn.style.setProperty('--b-outline', c.borderWidth);
    if (c.depth) btn.style.setProperty('--b-depth', c.depth);
    btn.style.setProperty('--btn-transition', c.transitionDuration);
    btn.style.opacity = '0';

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
      btn.style.transition = `opacity ${c.transitionDuration} ease ${c.entranceDelay}`;
      btn.style.opacity = '1';

      const td = c.transitionDuration;
      const tdMs = td.endsWith('ms') ? parseFloat(td) : parseFloat(td) * 1000;
      const total = tdMs + (parseFloat(c.entranceDelay) || 0) * 1000 + 50;
      setTimeout(() => { btn.style.transition = ''; }, total);
    }

    return btn;
  }

  _applyCustomColors(btn, colors) {
    const map = {
      bg: '--btn-bg',
      depth: '--btn-depth',
      outline: '--btn-outline',
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
