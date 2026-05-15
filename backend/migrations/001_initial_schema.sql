-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    nickname VARCHAR(100),
    personal_color VARCHAR(20),
    preferred_styles TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

-- 의류 아이템 테이블
CREATE TABLE IF NOT EXISTS clothing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    primary_color VARCHAR(7),
    secondary_colors TEXT[],
    color_palette TEXT[],
    primary_color_name VARCHAR(30),
    style_keywords TEXT[],
    fit_type VARCHAR(30),
    material_hint VARCHAR(30),
    user_tags TEXT[],
    wear_count INTEGER DEFAULT 0,
    last_worn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: item_ids stores clothing_item UUIDs as an array for Phase 1 simplicity.
-- PostgreSQL does not enforce FK constraints on array elements.
-- Application layer must validate item_ids before insert.
-- Phase 2 will migrate to a junction table (outfit_items) for full referential integrity.
CREATE TABLE IF NOT EXISTS outfit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_ids UUID[] NOT NULL,
    mood VARCHAR(30),
    worn_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: item_ids stores clothing_item UUIDs as an array for Phase 1 simplicity.
-- PostgreSQL does not enforce FK constraints on array elements.
-- Application layer must validate item_ids before insert.
-- Phase 2 will migrate to a junction table (outfit_items) for full referential integrity.
CREATE TABLE IF NOT EXISTS saved_outfits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_ids UUID[] NOT NULL,
    mood VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clothing_items_updated_at
    BEFORE UPDATE ON clothing_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_category ON clothing_items(category);
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_id ON outfit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_id ON saved_outfits(user_id);
