import { neon } from '@neondatabase/serverless';

// A simple function you can hit once manually (e.g. /api/init-db) to create tables
export const handler = async (event, context) => {
    const DB_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_qPgkfFM9unZ6@ep-autumn-brook-aj4365nt-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

    // Make sure we have the variable injected from .env or Netlify UI
    if (!DB_URL) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Missing DATABASE_URL" }),
        };
    }

    try {
        const sql = neon(DB_URL);

        // Forcefully wipe existing tables to apply the new schema (creator_id)
        await sql`DROP TABLE IF EXISTS poll_votes CASCADE`;
        await sql`DROP TABLE IF EXISTS votes CASCADE`;
        await sql`DROP TABLE IF EXISTS replies CASCADE`;
        await sql`DROP TABLE IF EXISTS problems CASCADE`;

        // 1. Problems Table (Now with creator_id to track who posted it to allow them to delete it)
        await sql`
            CREATE TABLE problems (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                score INTEGER DEFAULT 1,
                time_ago VARCHAR(50) DEFAULT 'Just now',
                creator_id VARCHAR(100),
                solved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                poll_question TEXT
            )
        `;

        // 2. Replies Table
        await sql`
            CREATE TABLE replies (
                id SERIAL PRIMARY KEY,
                problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                time_ago VARCHAR(50) DEFAULT 'Just now',
                creator_id VARCHAR(100),
                parent_reply_id INTEGER REFERENCES replies(id) ON DELETE CASCADE
            )
        `;

        // 3. User Votes Table (Tracks device IDs so they can't vote twice on the same post)
        // Note: Using VARCHAR for device_id since we will generate a random string in localStorage
        await sql`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
                device_id VARCHAR(100) NOT NULL,
                vote_type VARCHAR(10) NOT NULL, -- 'up' or 'down'
                UNIQUE (problem_id, device_id) -- Prevents a device voting twice on the exact same problem
            )
        `;

        // 4. Poll Votes Table (Tracks device IDs so they can't vote twice on the same poll)
        await sql`
            CREATE TABLE IF NOT EXISTS poll_votes (
                id SERIAL PRIMARY KEY,
                problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
                device_id VARCHAR(100) NOT NULL,
                vote_option VARCHAR(10) NOT NULL, -- 'yes' or 'no'
                UNIQUE (problem_id, device_id)
            )
        `;

        // Optional: Insert some initial seed data if the table is totally empty
        const countRes = await sql`SELECT COUNT(*) FROM problems`;
        const count = parseInt(countRes[0].count, 10);

        if (count === 0) {
            await sql`
                INSERT INTO problems (title, description, category, score, time_ago) VALUES
                ('Trash mountain near the faculty is unbearable', 'There is a massive mountain of uncollected trash accumulating right next to our faculty building.', 'Non-academic', 215, '1 day ago'),
                ('Canteen food quality has dropped recently', 'The food at the main canteen has been really bad over the course of the last two weeks.', 'Canteen/Food', 142, '2 hours ago')
            `;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Database tables initialized successfully." }),
        };
    } catch (error) {
        console.error("DB Init Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
