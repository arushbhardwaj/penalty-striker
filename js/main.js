import { Game } from './game.js';
import { LoadingScene, MainMenuScene } from './ui/menu.js';
import { PauseScene, GameOverScene, SettingsScene, HowToPlayScene, QuickPlayResultScene } from './ui/popup.js';
import { GameplayScene } from './game.js';
import { TournamentMenuScene, TournamentTeamSelectScene, TournamentMatchIntroScene, TournamentHubScene } from './ui/TournamentScene.js';
import { QuickPlaySetupScene } from './ui/QuickPlayScene.js';
import { PracticeSetupScene } from './ui/PracticeScene.js';

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
    { name: 'TournamentMenu', instance: new TournamentMenuScene(game) },
    { name: 'TournamentTeamSelect', instance: new TournamentTeamSelectScene(game) },
    { name: 'TournamentMatchIntro', instance: new TournamentMatchIntroScene(game) },
    { name: 'TournamentHub', instance: new TournamentHubScene(game) },
    { name: 'QuickPlaySetup', instance: new QuickPlaySetupScene(game) },
    { name: 'QuickPlayResult', instance: new QuickPlayResultScene(game) },
    { name: 'PracticeSetup', instance: new PracticeSetupScene(game) },
  ]);

  game.start('Loading');
});
