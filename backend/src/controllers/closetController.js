const db = require('../config/db');

const VALID_CATEGORIES = ['top', 'bottom', 'outer', 'shoes', 'accessory'];

exports.addItem = async (req, res, next) => {
  try {
    const {
      category, image_url, thumbnail_url,
      primary_color, secondary_colors, color_palette,
      primary_color_name, style_keywords, fit_type, material_hint, user_tags,
    } = req.body;

    if (!category) return res.status(400).json({ error: 'category는 필수입니다.' });
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category는 ${VALID_CATEGORIES.join(', ')} 중 하나여야 합니다.` });
    }
    if (!image_url) return res.status(400).json({ error: 'image_url은 필수입니다.' });

    const result = await db.query(
      `INSERT INTO clothing_items
       (user_id, category, image_url, thumbnail_url, primary_color, secondary_colors,
        color_palette, primary_color_name, style_keywords, fit_type, material_hint, user_tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        req.user.id, category, image_url, thumbnail_url || null,
        primary_color || null, secondary_colors || null, color_palette || null,
        primary_color_name || null, style_keywords || null,
        fit_type || null, material_hint || null, user_tags || null,
      ]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.getItems = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM clothing_items WHERE user_id = $1';
    const params = [req.user.id];
    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json({ items: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM clothing_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: '아이템을 찾을 수 없습니다.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { style_keywords, fit_type, material_hint, user_tags } = req.body;
    const result = await db.query(
      `UPDATE clothing_items
       SET style_keywords = COALESCE($1, style_keywords),
           fit_type = COALESCE($2, fit_type),
           material_hint = COALESCE($3, material_hint),
           user_tags = COALESCE($4, user_tags),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [style_keywords, fit_type, material_hint, user_tags, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: '아이템을 찾을 수 없습니다.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM clothing_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: '아이템을 찾을 수 없습니다.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
