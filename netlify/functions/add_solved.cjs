const { neon } = require('@neondatabase/serverless');

async function migrate() {
    const DB_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_qPgkfFM9unZ6@ep-autumn-brook-aj4365nt-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = neon(DB_URL);

    try {
        await sql`ALTER TABLE problems ADD COLUMN IF NOT EXISTS solved BOOLEAN DEFAULT FALSE`;
        console.log("Successfully added solved column to problems table.");
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

migrate();
