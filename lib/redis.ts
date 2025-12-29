import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Session interface
export interface VerificationSession {
    wsEndpoint: string;
    pageUrl: string;
    timestamp: number;
}

// Session TTL: 5 minutes
const SESSION_TTL = 5 * 60; // seconds

export class SessionManager {
    /**
     * Store a session
     */
    static async set(token: string, session: VerificationSession): Promise<void> {
        // Upstash Redis automatically handles JSON serialization
        await redis.setex(`session:${token}`, SESSION_TTL, session);
    }

    /**
     * Get a session
     */
    static async get(token: string): Promise<VerificationSession | null> {
        // Upstash Redis automatically deserializes JSON
        const data = await redis.get<VerificationSession>(`session:${token}`);
        return data;
    }

    /**
     * Delete a session
     */
    static async delete(token: string): Promise<void> {
        await redis.del(`session:${token}`);
    }

    /**
     * Check if session exists
     */
    static async exists(token: string): Promise<boolean> {
        const result = await redis.exists(`session:${token}`);
        return result === 1;
    }

    /**
     * Get all active session keys (for debugging)
     */
    static async getAllKeys(): Promise<string[]> {
        const keys = await redis.keys('session:*');
        return keys;
    }
}
