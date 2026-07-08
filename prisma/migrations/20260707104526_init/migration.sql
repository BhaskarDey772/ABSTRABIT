-- CreateEnum
CREATE TYPE "MirrorType" AS ENUM ('SLACK', 'DISCORD');

-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'RESPONDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MirrorStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "discordUsername" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "discordGuildId" TEXT NOT NULL,
    "guildName" TEXT NOT NULL,
    "replyChannelId" TEXT,
    "mirrorType" "MirrorType" NOT NULL,
    "mirrorWebhookUrl" TEXT NOT NULL,
    "connectedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandConfig" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "responseTemplate" TEXT NOT NULL DEFAULT 'Thanks, logged: {{summary}}',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "flagKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "CommandConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "discordInteractionId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "interactionType" TEXT NOT NULL,
    "status" "InteractionStatus" NOT NULL DEFAULT 'RECEIVED',
    "ackType" INTEGER,
    "aiTag" TEXT,
    "aiSummary" TEXT,
    "aiFailed" BOOLEAN NOT NULL DEFAULT false,
    "mirrorStatus" "MirrorStatus" NOT NULL DEFAULT 'PENDING',
    "errorLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "mirroredAt" TIMESTAMP(3),

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_discordUserId_key" ON "AdminUser"("discordUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_discordGuildId_key" ON "Server"("discordGuildId");

-- CreateIndex
CREATE UNIQUE INDEX "CommandConfig_serverId_commandName_key" ON "CommandConfig"("serverId", "commandName");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_discordInteractionId_key" ON "Interaction"("discordInteractionId");

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandConfig" ADD CONSTRAINT "CommandConfig_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
