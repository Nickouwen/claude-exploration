import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { query, queryOne } from '$lib/server/db';
import {
	getAvailableTimeSlots,
	getTimeSlotConfig,
	createReservation,
	addMarketingEmail
} from '$lib/server/reservations';
import { getOperatingHours, getBlockedDates } from '$lib/server/settings';

interface DbRestaurant {
	id: string;
	name: string;
	slug: string;
	phone: string | null;
	email: string | null;
	address: string | null;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const restaurant = await queryOne<DbRestaurant>(
		`SELECT id, name, slug, phone, email, address FROM restaurants WHERE slug = $1`,
		[params.slug]
	);

	if (!restaurant) {
		throw error(404, 'Restaurant not found');
	}

	const dateParam = url.searchParams.get('date');
	const today = new Date().toISOString().split('T')[0];
	const date = dateParam || today;

	const [timeSlots, config, operatingHours, blockedDates] = await Promise.all([
		getAvailableTimeSlots(restaurant.id, date),
		getTimeSlotConfig(restaurant.id),
		getOperatingHours(restaurant.id),
		getBlockedDates(restaurant.id)
	]);

	const maxDate = new Date();
	maxDate.setDate(maxDate.getDate() + (config?.advanceBookingDays || 30));

	return {
		restaurant: {
			id: restaurant.id,
			name: restaurant.name,
			slug: restaurant.slug,
			phone: restaurant.phone,
			email: restaurant.email,
			address: restaurant.address
		},
		date,
		timeSlots,
		config,
		operatingHours,
		blockedDates: blockedDates.map((d) => d.date),
		minDate: today,
		maxDate: maxDate.toISOString().split('T')[0]
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const restaurant = await queryOne<DbRestaurant>(
			`SELECT id FROM restaurants WHERE slug = $1`,
			[params.slug]
		);

		if (!restaurant) {
			return fail(404, { error: 'Restaurant not found' });
		}

		const data = await request.formData();

		const firstName = data.get('firstName')?.toString().trim();
		const lastName = data.get('lastName')?.toString().trim();
		const email = data.get('email')?.toString().trim();
		const phone = data.get('phone')?.toString().trim();
		const date = data.get('date')?.toString();
		const timeSlot = data.get('timeSlot')?.toString();
		const partySize = parseInt(data.get('partySize')?.toString() || '2');
		const notes = data.get('notes')?.toString().trim();
		const marketingOptIn = data.get('marketingOptIn') === 'on';

		if (!firstName || !lastName || !email || !phone || !date || !timeSlot) {
			return fail(400, {
				error: 'Please fill in all required fields',
				values: { firstName, lastName, email, phone, date, timeSlot, partySize, notes }
			});
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Please enter a valid email address',
				values: { firstName, lastName, email, phone, date, timeSlot, partySize, notes }
			});
		}

		const phoneRegex = /^[\d\s\-().+]+$/;
		if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
			return fail(400, {
				error: 'Please enter a valid phone number',
				values: { firstName, lastName, email, phone, date, timeSlot, partySize, notes }
			});
		}

		const availableSlots = await getAvailableTimeSlots(restaurant.id, date);
		const selectedSlot = availableSlots.find((s) => s.time === timeSlot);

		if (!selectedSlot || !selectedSlot.available) {
			return fail(400, {
				error: 'Sorry, this time slot is no longer available. Please select another time.',
				values: { firstName, lastName, email, phone, date, timeSlot, partySize, notes }
			});
		}

		try {
			const reservation = await createReservation(restaurant.id, {
				firstName,
				lastName,
				email,
				phone,
				date,
				timeSlot: timeSlot + ':00',
				partySize,
				notes: notes || undefined
			});

			if (marketingOptIn && email) {
				await addMarketingEmail(restaurant.id, email, firstName, lastName);
			}

			return {
				success: true,
				reservation: {
					id: reservation.id,
					date,
					time: timeSlot,
					partySize,
					name: `${firstName} ${lastName}`
				}
			};
		} catch (err) {
			return fail(500, {
				error: 'Failed to create reservation. Please try again.',
				values: { firstName, lastName, email, phone, date, timeSlot, partySize, notes }
			});
		}
	}
};
