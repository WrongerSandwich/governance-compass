-- DropIndex
DROP INDEX IF EXISTS "UserProfile_anonymousToken_key";

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "anonymousToken";
