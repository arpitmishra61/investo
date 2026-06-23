-- CreateTable
CREATE TABLE "trades" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMPTZ(6) NOT NULL,
    "market" VARCHAR(20) NOT NULL,
    "price" DOUBLE PRECISION,
    "qty" DECIMAL(18,2),
    "currency_code" VARCHAR(10),
    "side" VARCHAR(4) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id","time","market")
);
