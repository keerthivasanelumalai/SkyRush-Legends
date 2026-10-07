const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../auth');

const SHOP_ITEMS = [
  // Skins
  { id: 'classic', type: 'skin', name: 'Aero Falcon', rarity: 'common', priceCoins: 0, priceGems: 0, desc: 'The swift celestial fledgling with azure plumage.' },
  { id: 'neon', type: 'skin', name: 'Cyberpunk Horizon', rarity: 'rare', priceCoins: 800, priceGems: 0, desc: 'Electrified synth circuits pulsing with hyperwave energy.' },
  { id: 'ice', type: 'skin', name: 'Frost Wyrm', rarity: 'rare', priceCoins: 900, priceGems: 0, desc: 'Chilled crystalline wings that freeze the high altitudes.' },
  { id: 'golden', type: 'skin', name: 'Emperor Solis', rarity: 'epic', priceCoins: 1200, priceGems: 15, desc: 'Forged in stellar crucibles with pure auric radiance.' },
  { id: 'fire', type: 'skin', name: 'Phoenix Flare', rarity: 'epic', priceCoins: 1500, priceGems: 20, desc: 'Reborn from astral ashes, cloaked in living flame.' },
  { id: 'shadow', type: 'skin', name: 'Nightmare Specter', rarity: 'epic', priceCoins: 1600, priceGems: 25, desc: 'A phantom entity veiled in abyssal smoke and crimson eyes.' },
  { id: 'galaxy', type: 'skin', name: 'Cosmic Void', rarity: 'legendary', priceCoins: 2200, priceGems: 35, desc: 'Harbors a swirling nebula within its translucent celestial feathers.' },
  { id: 'rainbow', type: 'skin', name: 'Prism Seraph', rarity: 'legendary', priceCoins: 2600, priceGems: 40, desc: 'Refracts pure light into dazzling polychromatic spectra.' },
  { id: 'legendary', type: 'skin', name: 'Celestial Sovereign', rarity: 'celestial', priceCoins: 3500, priceGems: 60, desc: 'The divine guardian of the upper cosmos, crowned in golden runes.' },

  // Trails
  { id: 'starlight', type: 'trail', name: 'Starlight Ribbon', rarity: 'common', priceCoins: 0, priceGems: 0, desc: 'Gentle twinkling stardust following your flight path.' },
  { id: 'plasma_fire', type: 'trail', name: 'Blazing Exhaust', rarity: 'rare', priceCoins: 500, priceGems: 5, desc: 'Luminescent hyper-thermal fire trail.' },
  { id: 'frost_crystal', type: 'trail', name: 'Glacial Glint', rarity: 'rare', priceCoins: 600, priceGems: 8, desc: 'Floating ice crystals and frost mist.' },
  { id: 'rainbow_stream', type: 'trail', name: 'Chromatic Aurora', rarity: 'epic', priceCoins: 900, priceGems: 12, desc: 'Vibrant neon ribbon weaving dynamic color waves.' },
  { id: 'shadow_smoke', type: 'trail', name: 'Abyssal Miasma', rarity: 'epic', priceCoins: 800, priceGems: 10, desc: 'Dark ethereal smoke with drifting shadow motes.' },

  // Particle Effects
  { id: 'sparks', type: 'particle', name: 'Solar Sparks', rarity: 'common', priceCoins: 0, priceGems: 0, desc: 'Golden micro-sparks on aerodynamic thrust.' },
  { id: 'feathers', type: 'particle', name: 'Mystic Feathers', rarity: 'rare', priceCoins: 400, priceGems: 5, desc: 'Gentle iridescent feathers floating in your wake.' },
  { id: 'runes', type: 'particle', name: 'Ancient Glyphs', rarity: 'epic', priceCoins: 750, priceGems: 10, desc: 'Floating runic sky-symbols radiating arcane energy.' }
];

// Get shop catalog with ownership state
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  let ownedSet = new Set(['classic', 'starlight', 'sparks']);
  let equipped = { skin: 'classic', trail: 'starlight', particle: 'sparks' };

  if (userId) {
    const ownedRows = db.prepare('SELECT item_id FROM inventory WHERE user_id = ?').all(userId);
    ownedRows.forEach(r => ownedSet.add(r.item_id));

    const profile = db.prepare('SELECT equipped_skin, equipped_trail, equipped_particle FROM profiles WHERE user_id = ?').get(userId);
    if (profile) {
      equipped = {
        skin: profile.equipped_skin || 'classic',
        trail: profile.equipped_trail || 'starlight',
        particle: profile.equipped_particle || 'sparks'
      };
    }
  }

  const catalog = SHOP_ITEMS.map(item => ({
    ...item,
    owned: ownedSet.has(item.id),
    equipped: (item.type === 'skin' && equipped.skin === item.id) ||
              (item.type === 'trail' && equipped.trail === item.id) ||
              (item.type === 'particle' && equipped.particle === item.id)
  }));

  res.json({ items: catalog, equipped });
});

// Purchase item
router.post('/buy', authMiddleware, (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Shop item not found' });
  }

  const existing = db.prepare('SELECT 1 FROM inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
  if (existing) {
    return res.status(400).json({ error: 'Item is already owned' });
  }

  const profile = db.prepare('SELECT coins, gems FROM profiles WHERE user_id = ?').get(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  if (profile.coins < item.priceCoins || profile.gems < item.priceGems) {
    return res.status(400).json({
      error: 'Insufficient currency',
      requiredCoins: item.priceCoins,
      requiredGems: item.priceGems,
      currentCoins: profile.coins,
      currentGems: profile.gems
    });
  }

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO inventory (user_id, item_type, item_id) VALUES (?, ?, ?)').run(userId, item.type, item.id);
    db.prepare('UPDATE profiles SET coins = coins - ?, gems = gems - ? WHERE user_id = ?').run(item.priceCoins, item.priceGems, userId);
  });

  try {
    tx();
    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      item,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// Equip item
router.post('/equip', authMiddleware, (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Check ownership (free defaults are always owned)
  if (item.priceCoins > 0 || item.priceGems > 0) {
    const owned = db.prepare('SELECT 1 FROM inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
    if (!owned) {
      return res.status(403).json({ error: 'You do not own this item yet' });
    }
  }

  let updateField = '';
  if (item.type === 'skin') updateField = 'equipped_skin';
  else if (item.type === 'trail') updateField = 'equipped_trail';
  else if (item.type === 'particle') updateField = 'equipped_particle';

  db.prepare(`UPDATE profiles SET ${updateField} = ? WHERE user_id = ?`).run(item.id, userId);
  const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    message: `Equipped ${item.name}!`,
    equipped: { [item.type]: item.id },
    profile: updatedProfile
  });
});

module.exports = router;
