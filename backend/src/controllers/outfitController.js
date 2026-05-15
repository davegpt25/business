const db = require('../config/db');

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function colorCompatibilityScore(hex1, hex2) {
  if (!hex1 || !hex2) return 50;
  try {
    const c1 = hexToHsl(hex1);
    const c2 = hexToHsl(hex2);
    const hueDiff = Math.abs(c1.h - c2.h);

    // Neutral (one is achromatic)
    if (c1.s < 15 || c2.s < 15) return 85;
    // Complementary (150–210 degree difference)
    if (hueDiff >= 150 && hueDiff <= 210) return 90;
    // Analogous (within 30 degrees)
    if (hueDiff <= 30 || hueDiff >= 330) return 80;
    // Tone-on-tone (low lightness difference)
    if (Math.abs(c1.l - c2.l) < 20) return 70;

    return 50;
  } catch {
    return 50;
  }
}

const COMPLEMENTARY_CATEGORIES = {
  top: ['bottom', 'outer', 'shoes'],
  bottom: ['top', 'outer', 'shoes'],
  outer: ['top', 'bottom'],
  shoes: ['top', 'bottom'],
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const { base_item_id, mood } = req.query;
    if (!base_item_id) return res.status(400).json({ error: 'base_item_id는 필수입니다.' });

    const baseResult = await db.query(
      'SELECT * FROM clothing_items WHERE id = $1 AND user_id = $2',
      [base_item_id, req.user.id]
    );
    if (!baseResult.rows.length) {
      return res.status(404).json({ error: '기준 아이템을 찾을 수 없습니다.' });
    }
    const baseItem = baseResult.rows[0];

    const complementaryCategories = COMPLEMENTARY_CATEGORIES[baseItem.category] || [];
    if (!complementaryCategories.length) {
      return res.json({ recommendations: [], base_item: baseItem });
    }

    const placeholders = complementaryCategories.map((_, i) => `$${i + 2}`).join(', ');
    const candidatesResult = await db.query(
      `SELECT * FROM clothing_items WHERE user_id = $1 AND category IN (${placeholders})`,
      [req.user.id, ...complementaryCategories]
    );

    const scored = candidatesResult.rows.map((item) => ({
      ...item,
      _score: colorCompatibilityScore(baseItem.primary_color, item.primary_color),
    }));
    scored.sort((a, b) => b._score - a._score);

    // Pick top 1 per category (max 3 total)
    const seen = new Set();
    const recommendations = [];
    for (const item of scored) {
      if (!seen.has(item.category) && recommendations.length < 3) {
        seen.add(item.category);
        const { _score, ...cleanItem } = item;
        recommendations.push({ ...cleanItem, compatibility_score: _score });
      }
    }

    res.json({ base_item: baseItem, recommendations });
  } catch (err) {
    next(err);
  }
};
