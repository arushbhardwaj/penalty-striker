import { Game } from './game.js';
import { LoadingScene, MainMenuScene } from './ui/menu.js';
import { PauseScene, GameOverScene, SettingsScene, HowToPlayScene } from './ui/popup.js';
import { GameplayScene } from './game.js';

window.addEventListener('load', () => {
  const game = new Game();
  window.game = game;

  game.registerScenes([
    { name: 'Loading', instance: new LoadingScene(game) },
    { name: 'MainMenu', instance: new MainMenuScene(game) },
    { name: 'Settings', instance: new SettingsScene(game) },
    { name: 'HowToPlay', instance: new HowToPlayScene(game) },
    { name: 'Gameplay', instance: new GameplayScene(game) },
    { name: 'Pause', instance: new PauseScene(game) },
    { name: 'GameOver', instance: new GameOverScene(game) },
  ]);

  game.start('Loading');
});
