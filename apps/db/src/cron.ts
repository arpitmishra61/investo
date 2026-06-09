import { Client } from "pg";
import "dotenv/config";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
console.log("here", process.env.DATABASE_URL);
client
  .connect()
  .then(() => console.log("connected to db"))
  .catch(console.error);

async function refreshViews() {
  await client.query("REFRESH MATERIALIZED VIEW klines_1m");
  await client.query("REFRESH MATERIALIZED VIEW klines_1h");
  await client.query("REFRESH MATERIALIZED VIEW klines_1w");

  console.log("Materialized views refreshed successfully");
}

refreshViews().catch(console.error);

setInterval(() => {
  refreshViews();
}, 1000 * 5);
