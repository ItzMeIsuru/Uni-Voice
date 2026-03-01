import { neon } from '@neondatabase/serverless';
import { Filter } from 'bad-words';
import { GoogleGenAI } from '@google/genai';

const filter = new Filter();

// Main API Handler
export const handler = async (event, context) => {
    // Basic CORS headers to allow local frontend to test it
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const DB_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_qPgkfFM9unZ6@ep-autumn-brook-aj4365nt-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

    if (!DB_URL) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "DB not connected" }) };
    }

    const sql = neon(DB_URL);
    // Remove the base url, then trim any remaining leading or trailing slashes
    const rawPath = event.path.replace(/\.netlify\/functions\/api/, '');
    const path = rawPath.replace(/^\/+|\/+$/g, '');

    console.log("INCOMING EVENT PATH:", event.path);
    console.log("PARSED PATH:", path);

    try {
        // --- GET ALL PROBLEMS ---
        if (event.httpMethod === 'GET' && path === '') {
            const problems = await sql`
                SELECT p.*, 
                COALESCE(
                    (SELECT json_agg(json_build_object('id', r.id, 'text', r.text, 'timeAgo', r.time_ago, 'creator_id', r.creator_id, 'parent_reply_id', r.parent_reply_id)) 
                     FROM replies r WHERE r.problem_id = p.id), 
                    '[]'
                ) as replies,
                (SELECT count(*) FROM poll_votes pv WHERE pv.problem_id = p.id AND pv.vote_option = 'yes') as poll_yes,
                (SELECT count(*) FROM poll_votes pv WHERE pv.problem_id = p.id AND pv.vote_option = 'no') as poll_no
                FROM problems p
                ORDER BY p.score DESC
            `;

            return { statusCode: 200, headers, body: JSON.stringify(problems) };
        }

        // --- POST NEW PROBLEM ---
        if (event.httpMethod === 'POST' && path === 'problems') {
            const { title, description, category, device_id } = JSON.parse(event.body);

            // Profanity Check
            if (filter.isProfane(title) || filter.isProfane(description)) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Profanity is not allowed." }) };
            }

            // AI Poll Question Generation
            let pollQuestion = null;
            try {
                const apiKey = process.env.GEMINI_API_KEY;
                if (apiKey) {
                    const ai = new GoogleGenAI({ apiKey });
                    const prompt = `Based on the following issue reported on a university campus:\nTitle: ${title}\nDescription: ${description}\n\nGenerate ONE simple "Yes/No" poll question to ask the community. Only return the question itself without any quotes or extra text.`;
                    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                    pollQuestion = response.text.trim().replace(/^["']|["']$/g, '');
                }
            } catch (e) {
                console.error("AI Poll Gen Error:", e);
                // Fail silently, pollQuestion remains null
            }

            // 1. Insert problem with creator_id and poll_question
            const newProblem = await sql`
                INSERT INTO problems (title, description, category, creator_id, poll_question) 
                VALUES (${title}, ${description}, ${category}, ${device_id}, ${pollQuestion}) 
                RETURNING *
            `;

            const problemId = newProblem[0].id;

            // 2. Automatically 'upvote' the post they just created so they start at 1
            await sql`
                INSERT INTO votes (problem_id, device_id, vote_type)
                VALUES (${problemId}, ${device_id}, 'up')
            `;

            return { statusCode: 201, headers, body: JSON.stringify(newProblem[0]) };
        }

        // --- DELETE A PROBLEM ---
        if (event.httpMethod === 'DELETE' && path === 'problems') {
            const { problem_id, device_id } = JSON.parse(event.body);

            // Safely delete only if the device_id matches the creator_id
            const result = await sql`
                DELETE FROM problems 
                WHERE id = ${problem_id} AND creator_id = ${device_id}
                RETURNING id
            `;

            if (result.length === 0) {
                return { statusCode: 403, headers, body: JSON.stringify({ error: "Unauthorized or post not found" }) };
            }

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, deletedId: result[0].id }) };
        }

        // --- PATCH A PROBLEM (e.g. Mark as solved) ---
        if (event.httpMethod === 'PATCH' && path === 'problems') {
            const { problem_id, device_id, solved } = JSON.parse(event.body);

            const result = await sql`
                UPDATE problems 
                SET solved = ${solved} 
                WHERE id = ${problem_id} AND creator_id = ${device_id}
                RETURNING id, solved
            `;

            if (result.length === 0) {
                return { statusCode: 403, headers, body: JSON.stringify({ error: "Unauthorized or post not found" }) };
            }

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: result[0].id, solved: result[0].solved }) };
        }

        // --- POST NEW REPLY ---
        if (event.httpMethod === 'POST' && path === 'replies') {
            const { problem_id, text, device_id, parent_reply_id } = JSON.parse(event.body);

            // Profanity Check
            if (filter.isProfane(text)) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Profanity is not allowed in replies." }) };
            }

            let newReply;
            if (parent_reply_id) {
                newReply = await sql`
                    INSERT INTO replies (problem_id, text, creator_id, parent_reply_id) 
                    VALUES (${problem_id}, ${text}, ${device_id}, ${parent_reply_id}) 
                    RETURNING *
                `;
            } else {
                newReply = await sql`
                    INSERT INTO replies (problem_id, text, creator_id) 
                    VALUES (${problem_id}, ${text}, ${device_id}) 
                    RETURNING *
                `;
            }

            return { statusCode: 201, headers, body: JSON.stringify(newReply[0]) };
        }

        // --- DELETE A REPLY ---
        if (event.httpMethod === 'DELETE' && path === 'replies') {
            const { reply_id, device_id } = JSON.parse(event.body);

            // Safely delete only if the device_id matches the creator_id
            const result = await sql`
                DELETE FROM replies 
                WHERE id = ${reply_id} AND creator_id = ${device_id}
                RETURNING id
            `;

            if (result.length === 0) {
                return { statusCode: 403, headers, body: JSON.stringify({ error: "Unauthorized or reply not found" }) };
            }

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, deletedId: result[0].id }) };
        }

        // --- POST A VOTE (Upvote/Downvote logic) ---
        if (event.httpMethod === 'POST' && path === 'vote') {
            const { problem_id, device_id, vote_type } = JSON.parse(event.body); // 'up' or 'down'

            // Check if user already voted on this specific post
            const existingVote = await sql`
                SELECT vote_type FROM votes WHERE problem_id = ${problem_id} AND device_id = ${device_id}
            `;

            let scoreAdjustment = 0;

            if (existingVote.length === 0) {
                // New vote
                await sql`INSERT INTO votes (problem_id, device_id, vote_type) VALUES (${problem_id}, ${device_id}, ${vote_type})`;
                scoreAdjustment = vote_type === 'up' ? 1 : -1;
            } else {
                // Changing a vote OR canceling it
                const previousVote = existingVote[0].vote_type;

                if (previousVote === vote_type) {
                    // They clicked the same button again, meaning they want to CANCEL their vote
                    await sql`DELETE FROM votes WHERE problem_id = ${problem_id} AND device_id = ${device_id}`;
                    scoreAdjustment = vote_type === 'up' ? -1 : 1;
                } else {
                    // They switched from up to down or vice versa (which swings the score by 2 points!)
                    await sql`UPDATE votes SET vote_type = ${vote_type} WHERE problem_id = ${problem_id} AND device_id = ${device_id}`;
                    scoreAdjustment = vote_type === 'up' ? 2 : -2;
                }
            }

            // Apply adjustment to total problem score
            const updatedProblem = await sql`
                UPDATE problems SET score = score + ${scoreAdjustment} WHERE id = ${problem_id} RETURNING score
            `;

            return { statusCode: 200, headers, body: JSON.stringify({ newScore: updatedProblem[0].score }) };
        }

        // --- CHECK USER VOTES (Returns array of post IDs they voted on) ---
        if (event.httpMethod === 'POST' && path === 'sync_votes') {
            const { device_id } = JSON.parse(event.body);
            const userVotes = await sql`SELECT problem_id, vote_type FROM votes WHERE device_id = ${device_id}`;
            return { statusCode: 200, headers, body: JSON.stringify(userVotes) };
        }

        // --- CHECK USER POLL VOTES ---
        if (event.httpMethod === 'POST' && path === 'sync_poll_votes') {
            const { device_id } = JSON.parse(event.body);
            const userPollVotes = await sql`SELECT problem_id, vote_option FROM poll_votes WHERE device_id = ${device_id}`;
            return { statusCode: 200, headers, body: JSON.stringify(userPollVotes) };
        }

        // --- POST A POLL VOTE ---
        if (event.httpMethod === 'POST' && path === 'poll_vote') {
            const { problem_id, device_id, vote_option } = JSON.parse(event.body); // 'yes' or 'no'

            const existingVote = await sql`
                SELECT vote_option FROM poll_votes WHERE problem_id = ${problem_id} AND device_id = ${device_id}
            `;

            if (existingVote.length === 0) {
                // New vote
                await sql`INSERT INTO poll_votes (problem_id, device_id, vote_option) VALUES (${problem_id}, ${device_id}, ${vote_option})`;
            } else {
                if (existingVote[0].vote_option === vote_option) {
                    // Cancel vote
                    await sql`DELETE FROM poll_votes WHERE problem_id = ${problem_id} AND device_id = ${device_id}`;
                } else {
                    // Switch vote
                    await sql`UPDATE poll_votes SET vote_option = ${vote_option} WHERE problem_id = ${problem_id} AND device_id = ${device_id}`;
                }
            }

            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        // --- TRACK AND GET TOTAL VISITORS ---
        if (event.httpMethod === 'POST' && path === 'visitors') {
            const { device_id } = JSON.parse(event.body);

            if (device_id) {
                // Insert the visitor if they don't exist yet (ON CONFLICT DO NOTHING)
                await sql`
                    INSERT INTO visitors (device_id) 
                    VALUES (${device_id}) 
                    ON CONFLICT (device_id) DO NOTHING
                `;
            }

            // Return the total count of unique visitors
            const countRes = await sql`SELECT COUNT(*) FROM visitors`;
            const totalVisitors = parseInt(countRes[0].count, 10);

            return { statusCode: 200, headers, body: JSON.stringify({ total_visitors: totalVisitors }) };
        }

        return { statusCode: 404, headers, body: "Not found" };

    } catch (error) {
        console.error("API Error:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
