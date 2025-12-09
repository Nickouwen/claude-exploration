import { query, queryOne, execute } from './db';
import type { Reservation, Customer, TimeSlot, TimeSlotConfig, OperatingHours, BlockedDate } from '$lib/types';
import { v4 as uuidv4 } from 'uuid';

interface DbReservation {
	id: string;
	restaurant_id: string;
	customer_id: string;
	date: string;
	time_slot: string;
	party_size: number;
	notes: string | null;
	status: string;
	created_at: Date;
	updated_at: Date;
	first_name?: string;
	last_name?: string;
	email?: string;
	phone?: string;
}

interface DbCustomer {
	id: string;
	restaurant_id: string;
	first_name: string;
	last_name: string;
	email: string | null;
	phone: string;
	created_at: Date;
	updated_at: Date;
}

interface DbTimeSlotConfig {
	slot_duration_minutes: number;
	max_reservations_per_slot: number;
	default_party_size: number;
	max_party_size: number;
	advance_booking_days: number;
}

interface DbOperatingHours {
	day_of_week: number;
	open_time: string;
	close_time: string;
	is_closed: boolean;
}

function mapDbReservation(db: DbReservation): Reservation {
	return {
		id: db.id,
		restaurantId: db.restaurant_id,
		customerId: db.customer_id,
		date: db.date,
		timeSlot: db.time_slot,
		partySize: db.party_size,
		notes: db.notes || undefined,
		status: db.status as Reservation['status'],
		createdAt: db.created_at,
		updatedAt: db.updated_at,
		customer: db.first_name
			? {
					id: db.customer_id,
					restaurantId: db.restaurant_id,
					firstName: db.first_name,
					lastName: db.last_name!,
					email: db.email || undefined,
					phone: db.phone!,
					createdAt: db.created_at,
					updatedAt: db.updated_at
				}
			: undefined
	};
}

export async function getReservationsByDate(
	restaurantId: string,
	date: string
): Promise<Reservation[]> {
	const rows = await query<DbReservation>(
		`SELECT r.*, c.first_name, c.last_name, c.email, c.phone
		 FROM reservations r
		 JOIN customers c ON r.customer_id = c.id
		 WHERE r.restaurant_id = $1 AND r.date = $2 AND r.status != 'cancelled'
		 ORDER BY r.time_slot ASC`,
		[restaurantId, date]
	);
	return rows.map(mapDbReservation);
}

export async function getReservationById(
	restaurantId: string,
	reservationId: string
): Promise<Reservation | null> {
	const row = await queryOne<DbReservation>(
		`SELECT r.*, c.first_name, c.last_name, c.email, c.phone
		 FROM reservations r
		 JOIN customers c ON r.customer_id = c.id
		 WHERE r.restaurant_id = $1 AND r.id = $2`,
		[restaurantId, reservationId]
	);
	return row ? mapDbReservation(row) : null;
}

export async function createReservation(
	restaurantId: string,
	data: {
		firstName: string;
		lastName: string;
		email?: string;
		phone: string;
		date: string;
		timeSlot: string;
		partySize: number;
		notes?: string;
	}
): Promise<Reservation> {
	let customer = await queryOne<DbCustomer>(
		`SELECT * FROM customers WHERE restaurant_id = $1 AND phone = $2`,
		[restaurantId, data.phone]
	);

	if (!customer) {
		const customerId = uuidv4();
		await query(
			`INSERT INTO customers (id, restaurant_id, first_name, last_name, email, phone)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[customerId, restaurantId, data.firstName, data.lastName, data.email || null, data.phone]
		);
		customer = {
			id: customerId,
			restaurant_id: restaurantId,
			first_name: data.firstName,
			last_name: data.lastName,
			email: data.email || null,
			phone: data.phone,
			created_at: new Date(),
			updated_at: new Date()
		};
	} else {
		await execute(
			`UPDATE customers SET first_name = $1, last_name = $2, email = $3 WHERE id = $4`,
			[data.firstName, data.lastName, data.email || null, customer.id]
		);
	}

	const reservationId = uuidv4();
	await query(
		`INSERT INTO reservations (id, restaurant_id, customer_id, date, time_slot, party_size, notes)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		[reservationId, restaurantId, customer.id, data.date, data.timeSlot, data.partySize, data.notes || null]
	);

	return {
		id: reservationId,
		restaurantId,
		customerId: customer.id,
		date: data.date,
		timeSlot: data.timeSlot,
		partySize: data.partySize,
		notes: data.notes,
		status: 'confirmed',
		createdAt: new Date(),
		updatedAt: new Date(),
		customer: {
			id: customer.id,
			restaurantId,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
			createdAt: customer.created_at,
			updatedAt: customer.updated_at
		}
	};
}

export async function updateReservation(
	restaurantId: string,
	reservationId: string,
	data: Partial<{
		date: string;
		timeSlot: string;
		partySize: number;
		notes: string;
		status: string;
	}>
): Promise<Reservation | null> {
	const updates: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;

	if (data.date !== undefined) {
		updates.push(`date = $${paramIndex++}`);
		values.push(data.date);
	}
	if (data.timeSlot !== undefined) {
		updates.push(`time_slot = $${paramIndex++}`);
		values.push(data.timeSlot);
	}
	if (data.partySize !== undefined) {
		updates.push(`party_size = $${paramIndex++}`);
		values.push(data.partySize);
	}
	if (data.notes !== undefined) {
		updates.push(`notes = $${paramIndex++}`);
		values.push(data.notes);
	}
	if (data.status !== undefined) {
		updates.push(`status = $${paramIndex++}`);
		values.push(data.status);
	}

	if (updates.length === 0) {
		return getReservationById(restaurantId, reservationId);
	}

	values.push(restaurantId, reservationId);
	await execute(
		`UPDATE reservations SET ${updates.join(', ')} WHERE restaurant_id = $${paramIndex++} AND id = $${paramIndex}`,
		values
	);

	return getReservationById(restaurantId, reservationId);
}

export async function deleteReservation(restaurantId: string, reservationId: string): Promise<boolean> {
	const count = await execute(
		`DELETE FROM reservations WHERE restaurant_id = $1 AND id = $2`,
		[restaurantId, reservationId]
	);
	return count > 0;
}

export async function getTimeSlotConfig(restaurantId: string): Promise<TimeSlotConfig | null> {
	const row = await queryOne<DbTimeSlotConfig & { id: string; restaurant_id: string }>(
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

export async function getOperatingHours(restaurantId: string): Promise<OperatingHours[]> {
	const rows = await query<DbOperatingHours & { id: string; restaurant_id: string }>(
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

export async function getBlockedDates(restaurantId: string): Promise<BlockedDate[]> {
	const rows = await query<{ id: string; restaurant_id: string; date: string; reason: string | null; created_at: Date }>(
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

export async function isDateBlocked(restaurantId: string, date: string): Promise<boolean> {
	const row = await queryOne<{ id: string }>(
		`SELECT id FROM blocked_dates WHERE restaurant_id = $1 AND date = $2`,
		[restaurantId, date]
	);
	return !!row;
}

export async function getAvailableTimeSlots(
	restaurantId: string,
	date: string
): Promise<TimeSlot[]> {
	const config = await getTimeSlotConfig(restaurantId);
	if (!config) return [];

	const blocked = await isDateBlocked(restaurantId, date);
	if (blocked) return [];

	const dateObj = new Date(date + 'T00:00:00');
	const dayOfWeek = dateObj.getDay();

	const hours = await queryOne<DbOperatingHours>(
		`SELECT * FROM operating_hours WHERE restaurant_id = $1 AND day_of_week = $2`,
		[restaurantId, dayOfWeek]
	);

	if (!hours || hours.is_closed) return [];

	const reservationCounts = await query<{ time_slot: string; count: string }>(
		`SELECT time_slot, COUNT(*) as count
		 FROM reservations
		 WHERE restaurant_id = $1 AND date = $2 AND status != 'cancelled'
		 GROUP BY time_slot`,
		[restaurantId, date]
	);

	const countMap = new Map(reservationCounts.map((r) => [r.time_slot, parseInt(r.count)]));

	const slots: TimeSlot[] = [];
	const [openHour, openMin] = hours.open_time.split(':').map(Number);
	const [closeHour, closeMin] = hours.close_time.split(':').map(Number);

	let currentMinutes = openHour * 60 + openMin;
	const closeMinutes = closeHour * 60 + closeMin;

	while (currentMinutes < closeMinutes - config.slotDurationMinutes) {
		const hour = Math.floor(currentMinutes / 60);
		const min = currentMinutes % 60;
		const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

		const booked = countMap.get(timeStr + ':00') || 0;
		const remaining = config.maxReservationsPerSlot - booked;

		slots.push({
			time: timeStr,
			available: remaining > 0,
			remainingSpots: Math.max(0, remaining),
			totalSpots: config.maxReservationsPerSlot
		});

		currentMinutes += config.slotDurationMinutes;
	}

	return slots;
}

export async function addMarketingEmail(
	restaurantId: string,
	email: string,
	firstName?: string,
	lastName?: string
): Promise<void> {
	await query(
		`INSERT INTO marketing_emails (restaurant_id, email, first_name, last_name)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (restaurant_id, email) DO NOTHING`,
		[restaurantId, email, firstName || null, lastName || null]
	);
}
