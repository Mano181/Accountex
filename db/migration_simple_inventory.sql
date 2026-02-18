-- Simple Inventory module migration
-- Safe to run multiple times.

ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS sku TEXT;

ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS quantity_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'inventory_items_quantity_on_hand_non_negative'
    ) THEN
        ALTER TABLE inventory_items
            ADD CONSTRAINT inventory_items_quantity_on_hand_non_negative
            CHECK (quantity_on_hand >= 0) NOT VALID;
        ALTER TABLE inventory_items
            VALIDATE CONSTRAINT inventory_items_quantity_on_hand_non_negative;
    END IF;
END $$;
