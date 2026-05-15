const jwt = require('jsonwebtoken');
const db = require('../config/db');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.socialLogin = async (req, res, next) => {
  try {
    const { provider, provider_id, email, nickname } = req.body;
    if (!provider || !provider_id) {
      return res.status(400).json({ error: 'provider와 provider_id는 필수입니다.' });
    }

    const VALID_PROVIDERS = ['kakao', 'google', 'apple'];
    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: `provider는 ${VALID_PROVIDERS.join(', ')} 중 하나여야 합니다.` });
    }

    const existing = await db.query(
      'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
      [provider, provider_id]
    );

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const result = await db.query(
        `INSERT INTO users (provider, provider_id, email, nickname)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [provider, provider_id, email || null, nickname || null]
      );
      user = result.rows[0];
    }

    const token = signToken(user.id);
    const { id, email, nickname, personal_color, preferred_styles, provider: userProvider, provider_id: userProviderId } = user;
    const safeUser = { id, email, nickname, personal_color, preferred_styles, provider: userProvider, provider_id: userProviderId };
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { personal_color, preferred_styles } = req.body;
    const result = await db.query(
      `UPDATE users SET personal_color = $1, preferred_styles = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [personal_color, preferred_styles, req.user.id]
    );
    const row = result.rows[0];
    const { id, email, nickname, personal_color, preferred_styles } = row;
    res.json({ user: { id, email, nickname, personal_color, preferred_styles } });
  } catch (err) {
    next(err);
  }
};
