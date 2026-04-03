-- CreateTable
CREATE TABLE "AICache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AICache_userId_expiresAt_idx" ON "AICache"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AICache_userId_key_key" ON "AICache"("userId", "key");

-- AddForeignKey
ALTER TABLE "AICache" ADD CONSTRAINT "AICache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
