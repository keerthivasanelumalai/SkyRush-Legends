/**
 * SkyRush Legends - API Client
 * Secure communication with backend with graceful offline fallback
 */
class ApiClient {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('skyrush_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('skyrush_token', token);
    } else {
      localStorage.removeItem('skyrush_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`API [${endpoint}] request failed:`, err.message);
      throw err;
    }
  }

  // Auth Endpoints
  async register(username, email, password, confirmPassword) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, confirmPassword })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async login(usernameOrEmail, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async updateProfile(updates) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async updatePassword(currentPassword, newPassword) {
    return await this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async syncGuest(guestProfile, guestProgress) {
    return await this.request('/auth/sync-guest', {
      method: 'POST',
      body: JSON.stringify({ guestProfile, guestProgress })
    });
  }

  async deleteAccount() {
    return await this.request('/auth/account', { method: 'DELETE' });
  }

  // Score & Runs
  async startRun(mode = 'endless', levelId = null) {
    return await this.request('/scores/start', {
      method: 'POST',
      body: JSON.stringify({ mode, levelId })
    });
  }

  async submitScore(payload) {
    return await this.request('/scores/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Progress
  async getProgress() {
    return await this.request('/progress');
  }

  async submitLevelProgress(payload) {
    return await this.request('/progress/level', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Leaderboard
  async getLeaderboard(category = 'global') {
    return await this.request(`/leaderboard?category=${category}`);
  }

  // Missions
  async getMissions() {
    return await this.request('/missions');
  }

  async claimMission(missionId) {
    return await this.request('/missions/claim', {
      method: 'POST',
      body: JSON.stringify({ missionId })
    });
  }

  // Achievements
  async getAchievements() {
    return await this.request('/achievements');
  }

  // Shop & Inventory
  async getShopCatalog() {
    return await this.request('/shop');
  }

  async buyItem(itemId) {
    return await this.request('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  }

  async equipItem(itemId) {
    return await this.request('/shop/equip', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  }

  // Daily Challenge
  async getDailyChallenge() {
    return await this.request('/daily');
  }

  async completeDailyChallenge(score, coins) {
    return await this.request('/daily/complete', {
      method: 'POST',
      body: JSON.stringify({ score, coins })
    });
  }

  // Settings
  async getSettings() {
    return await this.request('/settings');
  }

  async saveSettings(settings) {
    return await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
}

window.apiClient = new ApiClient();
