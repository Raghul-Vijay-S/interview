import { app } from "./app.js";
import { config } from "./config.js";
import { hasDatabase } from "./data/store.js";

app.listen(config.port, () => {
  console.log(`NEXVORA API listening on http://localhost:${config.port}`);
  console.log(hasDatabase ? "Database mode: PostgreSQL via Prisma" : "Database mode: in-memory development store");
});
