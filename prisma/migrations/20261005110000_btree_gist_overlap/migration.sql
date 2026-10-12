CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "time_range" tstzrange GENERATED ALWAYS AS (tstzrange("starts_at", "ends_at")) STORED;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_no_overlap'
    ) THEN
        ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING gist (
          "barber_id" WITH =,
          "time_range" WITH &&
        ) WHERE ("status" IN ('confirmed', 'completed'));
    END IF;
END $$;
