import { query, queryOne, execute } from './db';
import type { OperatingHours, BlockedDate, TimeSlotConfig, Restaurant } from '$lib/types';
import { v4 as uuidv4 } from 'uuid';

interface DbRestaurant {
	id: string;
	name: string;
	slug: string;
	phone: string | null;
	email: string | null;
	address: string | null;
	timezone: string;
}

interface DbOperatingHours {
	id: string;
	restaurant_id: string;
	day_of_week: number;
	open_time: string;
	close_time: string;
	is_closed: boolean;
}

interface DbBlockedDate {
	id: string;
	restaurant_id: string;
	date: string;
	reason: string | null;
	created_at: Date;
}

interface DbTimeSlotConfig {
	id: string;
	restaurant_id: string;
	slot_duration_minutes: number;
	max_reservations_per_slot: number;
	default_party_size: number;
	max_party_size: number;
	advance_booking_days: number;
}

export async function getRestaurant(restaurantId: string): Promise<Restaurant | null> {
	const row = await queryOne<DbRestaurant>(
		`SELECT * FROM restaurants WHERE id = $1`,
		[restaurantId]
	);

	if (!row) return null;

	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		phone: row.phone || undefined,
		email: row.email || undefined,
		address: row.address || undefined,
		timezone: row.timezone,
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

export async function updateRestaurant(
	restaurantId: string,
	data: Partial<{ name: string; phone: string; email: string; address: string }>
): Promise<void> {
	const updates: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;

	if (data.name !== undefined) {
		updates.push(`name = $${paramIndex++}`);
		values.push(data.name);
	}
	if (data.phone !== undefined) {
		updates.push(`phone = $${paramIndex++}`);
		values.push(data.phone || null);
	}
	if (data.email !== undefined) {
		updates.push(`email = $${paramIndex++}`);
		values.push(data.email || null);
	}
	if (data.address !== undefined) {
		updates.push(`address = $${paramIndex++}`);
		values.push(data.address || null);
	}

	if (updates.length > 0) {
		values.push(restaurantId);
		await execute(
			`UPDATE restaurants SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
			values
		);
	}
}

export async function getOperatingHours(restaurantId: string): Promise<OperatingHours[]> {
	const rows = await query<DbOperatingHours>(
		`SELECT * FROM operating_hours WHERE restaurant_id = $1 ORDER BY day_of_week`,
		[restaurantId]
	);

	return rows.map((row) => ({
		id: row.id,
		restaurantId: row.restaurant_id,
		dayOfWeek: row.day_of_week,
		openTime: row.open_time,
		closeTime: row.close_time,
		isClosed: row.is_closed
	}));
}

export async function updateOperatingHours(
	restaurantId: string,
	hours: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>
): Promise<void> {
	for (const hour of hours) {
		await execute(
			`INSERT INTO operating_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
			 VALUES ($1, $2, $3, $4, $5)
			 ON CONFLICT (restaurant_id, day_of_week)
			 DO UPDATE SET open_time = $3, close_time = $4, is_closed = $5`,
			[restaurantId, hour.dayOfWeek, hour.openTime, hour.closeTime, hour.isClosed]
		);
	}
}

export async function getBlockedDates(restaurantId: string): Promise<BlockedDate[]> {
	const rows = await query<DbBlockedDate>(
		`SELECT * FROM blocked_dates WHERE restaurant_id = $1 AND date >= CURRENT_DATE ORDER BY date`,
		[restaurantId]
	);

	return rows.map((row) => ({
		id: row.id,
		restaurantId: row.restaurant_id,
		date: row.date,
		reason: row.reason || undefined,
		createdAt: row.created_at
	}));
}

export async function addBlockedDate(
	restaurantId: string,
	date: string,
	reason?: string
): Promise<BlockedDate> {
	const id = uuidv4();
	await query(
		`INSERT INTO blocked_dates (id, restaurant_id, date, reason)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (restaurant_id, date) DO UPDATE SET reason = $4`,
		[id, restaurantId, date, reason || null]
	);

	return {
		id,
		restaurantId,
		date,
		reason,
		createdAt: new Date()
	};
}

export async function removeBlockedDate(restaurantId: string, dateId: string): Promise<boolean> {
	const count = await execute(
		`DELETE FROM blocked_dates WHERE restaurant_id = $1 AND id = $2`,
		[restaurantId, dateId]
	);
	return count > 0;
}

export async function getTimeSlotConfig(restaurantId: string): Promise<TimeSlotConfig | null> {
	const row = await queryOne<DbTimeSlotConfig>(
		`SELECT * FROM time_slot_configs WHERE restaurant_id = $1`,
		[restaurantId]
	);

	if (!row) return null;

	return {
		id: row.id,
		restaurantId: row.restaurant_id,
		slotDurationMinutes: row.slot_duration_minutes,
		maxReservationsPerSlot: row.max_reservations_per_slot,
		defaultPartySize: row.default_party_size,
		maxPartySize: row.max_party_size,
		advanceBookingDays: row.advance_booking_days
	};
}

export async function updateTimeSlotConfig(
	restaurantId: string,
	data: Partial<{
		slotDurationMinutes: number;
		maxReservationsPerSlot: number;
		defaultPartySize: number;
		maxPartySize: number;
		advanceBookingDays: number;
	}>
): Promise<void> {
	const updates: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;

	if (data.slotDurationMinutes !== undefined) {
		updates.push(`slot_duration_minutes = $${paramIndex++}`);
		values.push(data.slotDurationMinutes);
	}
	if (data.maxReservationsPerSlot !== undefined) {
		updates.push(`max_reservations_per_slot = $${paramIndex++}`);
		values.push(data.maxReservationsPerSlot);
	}
	if (data.defaultPartySize !== undefined) {
		updates.push(`default_party_size = $${paramIndex++}`);
		values.push(data.defaultPartySize);
	}
	if (data.maxPartySize !== undefined) {
		updates.push(`max_party_size = $${paramIndex++}`);
		values.push(data.maxPartySize);
	}
	if (data.advanceBookingDays !== undefined) {
		updates.push(`advance_booking_days = $${paramIndex++}`);
		values.push(data.advanceBookingDays);
	}

	if (updates.length > 0) {
		values.push(restaurantId);
		await execute(
			`UPDATE time_slot_configs SET ${updates.join(', ')} WHERE restaurant_id = $${paramIndex}`,
			values
		);
	}
}
