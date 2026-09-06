-- The API used to read-then-write annotations, so concurrent POSTs could leave
-- more than one note for the same user on the same axis score. Collapse those
-- to the most recently updated one before the constraint goes on; the older
-- rows were unreachable for editing and only ever showed up as stale copies.
DELETE FROM "Annotation" a
USING "Annotation" b
WHERE a."axisScoreId" = b."axisScoreId"
  AND a."userId" = b."userId"
  AND (a."updatedAt", a."id") < (b."updatedAt", b."id");

-- CreateIndex
CREATE UNIQUE INDEX "Annotation_axisScoreId_userId_key" ON "Annotation"("axisScoreId", "userId");
