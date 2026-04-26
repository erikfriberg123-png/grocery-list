-- sort_order was integer (max 2^31-1 ≈ 2.1B) but the client uses
-- Date.now() (~1.7T ms) as a sort key, which overflows. Widen to bigint.
alter table shopping_items alter column sort_order type bigint;
