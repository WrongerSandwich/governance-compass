-- Addresses are now matched exactly rather than case-insensitively, so every
-- write path stores them lowercased (the signup route and the NextAuth
-- adapter). Rows written before that kept whatever casing the user typed and
-- would no longer be findable at sign-in. Fold them down.
--
-- If one address exists under more than one casing those are two separate
-- accounts with separate profiles, and picking a survivor here would silently
-- orphan someone's data. Refuse instead and let a human merge them.
DO $$
DECLARE conflicting text;
BEGIN
  SELECT string_agg(e, ', ')
    INTO conflicting
    FROM (
      SELECT lower(btrim(email)) AS e
        FROM "User"
       GROUP BY 1
      HAVING count(*) > 1
    ) AS duplicates;

  IF conflicting IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot normalize User.email: % exists under more than one casing. Merge those accounts by hand, then re-run this migration.',
      conflicting;
  END IF;
END $$;

UPDATE "User"
   SET email = lower(btrim(email))
 WHERE email <> lower(btrim(email));
