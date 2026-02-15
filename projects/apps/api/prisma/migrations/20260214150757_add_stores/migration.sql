-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stores_user_id_idx" ON "stores"("user_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
