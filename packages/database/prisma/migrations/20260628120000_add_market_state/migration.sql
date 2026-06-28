-- CreateTable
CREATE TABLE "market_state" (
    "market" VARCHAR(20) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_state_pkey" PRIMARY KEY ("market")
);
