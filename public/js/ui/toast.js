/**
 * SkyRush Legends - Toast Notification System
 * Non-intrusive, animated glassmorphic notifications with sound cues.
 */
class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✨';
    if (type === 'achievement') icon = '🏆';
    else if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    this.container.appendChild(toast);

    if (type === 'achievement' && window.soundManager) {
      window.soundManager.playAchievement();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  achievement(title) {
    this.show(`Achievement Unlocked: ${title}!`, 'achievement', 4500);
  }

  success(msg) {
    this.show(msg, 'success', 3000);
  }

  error(msg) {
    this.show(msg, 'error', 4000);
  }
}

window.toastManager = new ToastManager();
