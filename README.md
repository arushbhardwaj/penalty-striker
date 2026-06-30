# Penalty Striker

An HTML5 canvas penalty shootout game built with vanilla JavaScript (ES Modules).

## Quick Start

Serve the project root with any static file server:

```bash
npx serve .
```

Then open the URL in your browser.

## Structure

```
├── index.html          # Shell – loads fonts & bootstraps the app
├── assets/             # Static assets (images, audio, fonts)
├── css/
│   ├── style.css       # Layout, reset, variables
│   ├── ui.css          # Orientation overlay styles
│   └── animations.css  # Keyframe animations
└── js/
    ├── main.js         # Entry point – registers scenes & starts game
    ├── config.js       # Game constants & tuning values
    ├── game.js         # Core engine (Scene, SceneManager, Game, GameplayScene)
    ├── gameplay/       # Gameplay entities
    │   ├── ball.js
    │   ├── player.js
    │   ├── goalkeeper.js
    │   └── physics.js
    ├── ui/             # Screen-level UI
    │   ├── menu.js     # Loading & Main Menu scenes
    │   ├── hud.js      # In-game HUD components
    │   └── popup.js    # Pause, Game Over, Settings, How To Play
    ├── systems/        # Cross-cutting systems
    │   ├── input.js    # Keyboard, mouse & touch input
    │   ├── audio.js    # Asset loader & sound manager
    │   └── save.js     # LocalStorage persistence
    └── utils/
        └── helpers.js  # Canvas drawing utilities
```

## Publishing

The game is a single-page app. Upload the entire directory to any static host (Netlify, Vercel, itch.io, GitHub Pages). No build step required.
