/**
 * SkyRush Legends - Application Entry Point & Orchestrator
 * Boots audio, engines, UI, service worker, and session authentication.
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✨ Booting SkyRush Legends...');

  // 1. Initialize PWA Service Worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service Worker skipped:', err);
    });
  }

  // 2. Resume WebAudio on first user interaction
  const resumeAudio = () => {
    if (window.soundManager) {
      window.soundManager.ensureContext();
      if (window.gameEngine && window.gameEngine.state === 'MENU') {
        window.soundManager.playMusic('menu');
      }
    }
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('touchstart', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);

  // 3. Initialize Master Game Engine
  window.gameEngine = new GameEngine();

  // 4. Initialize UI Manager
  window.uiManager = new UIManager();

  // 5. Check Active Cloud Session
  const token = window.apiClient.getToken();
  if (token) {
    try {
      const me = await window.apiClient.getMe();
      if (me && me.user) {
        window.storageManager.state.user = me.user;
        window.storageManager.state.profile = me.profile;
        window.storageManager.state.isGuest = false;
        window.storageManager.saveLocalState();
        window.uiManager.updateUserHeader();
        console.log(`Cloud pilot verified: ${me.user.username}`);
      }
    } catch (err) {
      console.warn('Session expired or offline fallback active.');
    }
  }

  // 6. Show Menu Screen initially
  window.uiManager.showScreen('menu');

  console.log('🚀 SkyRush Legends ready for flight!');
});
