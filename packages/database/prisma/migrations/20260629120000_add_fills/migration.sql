-- CreateTable
CREATE TABLE "fills" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMPTZ(6) NOT NULL,
    "market" VARCHAR(20) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "qty" DECIMAL(18,2) NOT NULL,
    "side" VARCHAR(4) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "trade_id" BIGINT NOT NULL,

    CONSTRAINT "fills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fills_user_id_time_idx" ON "fills"("user_id", "time");

-- AddForeignKey
ALTER TABLE "fills" ADD CONSTRAINT "fills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
