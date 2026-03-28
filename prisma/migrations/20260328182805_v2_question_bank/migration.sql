/*
  Warnings:

  - You are about to drop the column `statementA` on the `ForcedChoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `statementB` on the `ForcedChoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `option1Text` on the `ScaledItem` table. All the data in the column will be lost.
  - You are about to drop the column `option2Text` on the `ScaledItem` table. All the data in the column will be lost.
  - You are about to drop the column `option3Text` on the `ScaledItem` table. All the data in the column will be lost.
  - You are about to drop the column `option4Text` on the `ScaledItem` table. All the data in the column will be lost.
  - You are about to drop the column `option5Text` on the `ScaledItem` table. All the data in the column will be lost.
  - Added the required column `bodyA` to the `ForcedChoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bodyB` to the `ForcedChoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headlineA` to the `ForcedChoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headlineB` to the `ForcedChoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option1Detail` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option1Label` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option2Detail` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option2Label` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option3Detail` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option3Label` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option4Detail` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option4Label` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option5Detail` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option5Label` to the `ScaledItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ForcedChoiceItem" DROP COLUMN "statementA",
DROP COLUMN "statementB",
ADD COLUMN     "bodyA" TEXT NOT NULL,
ADD COLUMN     "bodyB" TEXT NOT NULL,
ADD COLUMN     "headlineA" TEXT NOT NULL,
ADD COLUMN     "headlineB" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScaledItem" DROP COLUMN "option1Text",
DROP COLUMN "option2Text",
DROP COLUMN "option3Text",
DROP COLUMN "option4Text",
DROP COLUMN "option5Text",
ADD COLUMN     "option1Detail" TEXT NOT NULL,
ADD COLUMN     "option1Label" TEXT NOT NULL,
ADD COLUMN     "option2Detail" TEXT NOT NULL,
ADD COLUMN     "option2Label" TEXT NOT NULL,
ADD COLUMN     "option3Detail" TEXT NOT NULL,
ADD COLUMN     "option3Label" TEXT NOT NULL,
ADD COLUMN     "option4Detail" TEXT NOT NULL,
ADD COLUMN     "option4Label" TEXT NOT NULL,
ADD COLUMN     "option5Detail" TEXT NOT NULL,
ADD COLUMN     "option5Label" TEXT NOT NULL;
