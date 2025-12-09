import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getReservationsByDate,
	createReservation,
	updateReservation,
	deleteReservation,
	getAvailableTimeSlots,
	getTimeSlotConfig
} from '$lib/server/reservations';

export const load: PageServerLoad = async ({ locals, url }) => {
	const restaurantId = locals.user!.restaurantId;
	const dateParam = url.searchParams.get('date');
	const today = new Date().toISOString().split('T')[0];
	const date = dateParam || today;

	const [reservations, timeSlots, config] = await Promise.all([
		getReservationsByDate(restaurantId, date),
		getAvailableTimeSlots(restaurantId, date),
		getTimeSlotConfig(restaurantId)
	]);

	return {
		date,
		reservations,
		timeSlots,
		config
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const firstName = data.get('firstName')?.toString().trim();
		const lastName = data.get('lastName')?.toString().trim();
		const phone = data.get('phone')?.toString().trim();
		const email = data.get('email')?.toString().trim();
		const date = data.get('date')?.toString();
		const timeSlot = data.get('timeSlot')?.toString();
		const partySize = parseInt(data.get('partySize')?.toString() || '2');
		const notes = data.get('notes')?.toString().trim();

		if (!firstName || !lastName || !phone || !date || !timeSlot) {
			return fail(400, {
				error: 'Please fill in all required fields',
				values: { firstName, lastName, phone, email, date, timeSlot, partySize, notes }
			});
		}

		try {
			await createReservation(restaurantId, {
				firstName,
				lastName,
				phone,
				email: email || undefined,
				date,
				timeSlot: timeSlot + ':00',
				partySize,
				notes: notes || undefined
			});

			return { success: true, action: 'create' };
		} catch (error) {
			return fail(500, {
				error: 'Failed to create reservation. Please try again.',
				values: { firstName, lastName, phone, email, date, timeSlot, partySize, notes }
			});
		}
	},

	update: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const reservationId = data.get('reservationId')?.toString();
		const date = data.get('date')?.toString();
		const timeSlot = data.get('timeSlot')?.toString();
		const partySize = parseInt(data.get('partySize')?.toString() || '2');
		const notes = data.get('notes')?.toString().trim();
		const status = data.get('status')?.toString();

		if (!reservationId) {
			return fail(400, { error: 'Invalid reservation' });
		}

		try {
			await updateReservation(restaurantId, reservationId, {
				date,
				timeSlot: timeSlot ? timeSlot + ':00' : undefined,
				partySize,
				notes: notes || undefined,
				status
			});

			return { success: true, action: 'update' };
		} catch (error) {
			return fail(500, { error: 'Failed to update reservation. Please try again.' });
		}
	},

	delete: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();
		const reservationId = data.get('reservationId')?.toString();

		if (!reservationId) {
			return fail(400, { error: 'Invalid reservation' });
		}

		try {
			await deleteReservation(restaurantId, reservationId);
			return { success: true, action: 'delete' };
		} catch (error) {
			return fail(500, { error: 'Failed to delete reservation. Please try again.' });
		}
	},

	updateStatus: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();
		const reservationId = data.get('reservationId')?.toString();
		const status = data.get('status')?.toString();

		if (!reservationId || !status) {
			return fail(400, { error: 'Invalid request' });
		}

		try {
			await updateReservation(restaurantId, reservationId, { status });
			return { success: true, action: 'updateStatus' };
		} catch (error) {
			return fail(500, { error: 'Failed to update status. Please try again.' });
		}
	}
};
