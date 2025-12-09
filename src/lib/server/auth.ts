import bcrypt from 'bcryptjs';
import { query, queryOne, execute } from './db';
import type { User, Session } from '$lib/types';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

interface DbUser {
	id: string;
	restaurant_id: string;
	username: string;
	password_hash: string;
}

interface DbSession {
	id: string;
	user_id: string;
	refresh_token: string;
	expires_at: Date;
}

interface DbRestaurant {
	name: string;
}

export async function validateCredentials(
	username: string,
	password: string
): Promise<{ user: User; restaurant: { name: string } } | null> {
	const dbUser = await queryOne<DbUser>(
		`SELECT id, restaurant_id, username, password_hash FROM users WHERE username = $1`,
		[username]
	);

	if (!dbUser) {
		return null;
	}

	const isValid = await bcrypt.compare(password, dbUser.password_hash);
	if (!isValid) {
		return null;
	}

	const restaurant = await queryOne<DbRestaurant>(
		`SELECT name FROM restaurants WHERE id = $1`,
		[dbUser.restaurant_id]
	);

	return {
		user: {
			id: dbUser.id,
			restaurantId: dbUser.restaurant_id,
			username: dbUser.username,
			passwordHash: dbUser.password_hash,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		restaurant: { name: restaurant?.name || '' }
	};
}

export async function createSession(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
	const accessToken = uuidv4();
	const refreshToken = uuidv4();
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

	await query(
		`INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)`,
		[userId, refreshToken, expiresAt]
	);

	return { accessToken, refreshToken };
}

export async function validateRefreshToken(
	refreshToken: string
): Promise<{ userId: string; restaurantId: string; username: string; restaurantName: string } | null> {
	const session = await queryOne<DbSession & { username: string; restaurant_id: string; restaurant_name: string }>(
		`SELECT s.id, s.user_id, s.refresh_token, s.expires_at, u.username, u.restaurant_id, r.name as restaurant_name
		 FROM sessions s
		 JOIN users u ON s.user_id = u.id
		 JOIN restaurants r ON u.restaurant_id = r.id
		 WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
		[refreshToken]
	);

	if (!session) {
		return null;
	}

	return {
		userId: session.user_id,
		restaurantId: session.restaurant_id,
		username: session.username,
		restaurantName: session.restaurant_name
	};
}

export async function deleteSession(refreshToken: string): Promise<void> {
	await execute(`DELETE FROM sessions WHERE refresh_token = $1`, [refreshToken]);
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
	await execute(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}

export async function cleanExpiredSessions(): Promise<void> {
	await execute(`DELETE FROM sessions WHERE expires_at < NOW()`);
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}
