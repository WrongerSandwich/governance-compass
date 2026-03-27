-- DropForeignKey (old quiz tables)
ALTER TABLE "TopicVisibility" DROP CONSTRAINT "TopicVisibility_topicId_fkey";
ALTER TABLE "TopicVisibility" DROP CONSTRAINT "TopicVisibility_userId_fkey";
ALTER TABLE "Annotation" DROP CONSTRAINT "Annotation_topicScoreId_fkey";
ALTER TABLE "Annotation" DROP CONSTRAINT "Annotation_userId_fkey";
ALTER TABLE "TopicScore" DROP CONSTRAINT "TopicScore_profileId_fkey";
ALTER TABLE "TopicScore" DROP CONSTRAINT "TopicScore_topicId_fkey";
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_profileId_fkey";
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT "Question_topicId_fkey";

-- DropTable
DROP TABLE "TopicVisibility";
DROP TABLE "Annotation";
DROP TABLE "TopicScore";
DROP TABLE "Answer";
DROP TABLE "Question";
DROP TABLE "Topic";

-- CreateTable
CREATE TABLE "Axis" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "poleALabel" TEXT NOT NULL,
    "poleBLabel" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "domainOrder" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Axis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForcedChoiceItem" (
    "id" TEXT NOT NULL,
    "axisId" INTEGER NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "abstractionLevel" TEXT NOT NULL,
    "statementA" TEXT NOT NULL,
    "statementB" TEXT NOT NULL,

    CONSTRAINT "ForcedChoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScaledItem" (
    "id" TEXT NOT NULL,
    "axisId" INTEGER NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "questionStem" TEXT NOT NULL,
    "option1Text" TEXT NOT NULL,
    "option2Text" TEXT NOT NULL,
    "option3Text" TEXT NOT NULL,
    "option4Text" TEXT NOT NULL,
    "option5Text" TEXT NOT NULL,

    CONSTRAINT "ScaledItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ministry" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "belowBaselineWarning" TEXT NOT NULL,

    CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinistryAxisMapping" (
    "ministryId" INTEGER NOT NULL,
    "axisId" INTEGER NOT NULL,
    "direction" INTEGER NOT NULL,

    CONSTRAINT "MinistryAxisMapping_pkey" PRIMARY KEY ("ministryId","axisId")
);

-- CreateTable
CREATE TABLE "Archetype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "characteristicTension" TEXT NOT NULL,
    "prototype" DOUBLE PRECISION[],
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "Archetype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForcedChoiceResponse" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "selectedPole" TEXT NOT NULL,

    CONSTRAINT "ForcedChoiceResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScaledResponse" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "ScaledResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ministryId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AxisScore" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "axisId" INTEGER NOT NULL,
    "fcScore" DOUBLE PRECISION NOT NULL,
    "scScore" DOUBLE PRECISION NOT NULL,
    "bgScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "tensionLevel" TEXT NOT NULL DEFAULT 'none',
    "tensionDirection" TEXT,
    "tensionNarrative" TEXT,

    CONSTRAINT "AxisScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompassScore" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "economic" DOUBLE PRECISION NOT NULL,
    "cultural" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CompassScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchetypeResult" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "primaryArchetypeId" TEXT NOT NULL,
    "primaryMatchPct" DOUBLE PRECISION NOT NULL,
    "secondaryArchetypeId" TEXT NOT NULL,
    "secondaryMatchPct" DOUBLE PRECISION NOT NULL,
    "isBlended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ArchetypeResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "axisScoreId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AxisVisibility" (
    "userId" TEXT NOT NULL,
    "axisId" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AxisVisibility_pkey" PRIMARY KEY ("userId","axisId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForcedChoiceResponse_profileId_itemId_key" ON "ForcedChoiceResponse"("profileId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ScaledResponse_profileId_itemId_key" ON "ScaledResponse"("profileId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_profileId_ministryId_key" ON "BudgetAllocation"("profileId", "ministryId");

-- CreateIndex
CREATE UNIQUE INDEX "AxisScore_profileId_axisId_key" ON "AxisScore"("profileId", "axisId");

-- CreateIndex
CREATE UNIQUE INDEX "CompassScore_profileId_key" ON "CompassScore"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchetypeResult_profileId_key" ON "ArchetypeResult"("profileId");

-- AddForeignKey
ALTER TABLE "ForcedChoiceItem" ADD CONSTRAINT "ForcedChoiceItem_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "Axis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScaledItem" ADD CONSTRAINT "ScaledItem_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "Axis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinistryAxisMapping" ADD CONSTRAINT "MinistryAxisMapping_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinistryAxisMapping" ADD CONSTRAINT "MinistryAxisMapping_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "Axis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForcedChoiceResponse" ADD CONSTRAINT "ForcedChoiceResponse_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForcedChoiceResponse" ADD CONSTRAINT "ForcedChoiceResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ForcedChoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScaledResponse" ADD CONSTRAINT "ScaledResponse_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScaledResponse" ADD CONSTRAINT "ScaledResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ScaledItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisScore" ADD CONSTRAINT "AxisScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisScore" ADD CONSTRAINT "AxisScore_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "Axis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompassScore" ADD CONSTRAINT "CompassScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchetypeResult" ADD CONSTRAINT "ArchetypeResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_axisScoreId_fkey" FOREIGN KEY ("axisScoreId") REFERENCES "AxisScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisVisibility" ADD CONSTRAINT "AxisVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AxisVisibility" ADD CONSTRAINT "AxisVisibility_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "Axis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
