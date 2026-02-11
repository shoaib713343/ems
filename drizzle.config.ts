import { defineConfig } from "drizzle-kit";
import "dotenv/config"
export default defineConfig({
    schema: "./src/config/schema.ts",
    out: "./src/config/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url : process.env.DATABASE_URL!
    }
});