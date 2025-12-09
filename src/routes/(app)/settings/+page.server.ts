import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getRestaurant,
	updateRestaurant,
	getOperatingHours,
	updateOperatingHours,
	getBlockedDates,
	addBlockedDate,
	removeBlockedDate,
	getTimeSlotConfig,
	updateTimeSlotConfig
} from '$lib/server/settings';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const load: PageServerLoad = async ({ locals }) => {
	const restaurantId = locals.user!.restaurantId;

	const [restaurant, operatingHours, blockedDates, timeSlotConfig] = await Promise.all([
		getRestaurant(restaurantId),
		getOperatingHours(restaurantId),
		getBlockedDates(restaurantId),
		getTimeSlotConfig(restaurantId)
	]);

	return {
		restaurant,
		operatingHours,
		blockedDates,
		timeSlotConfig,
		days: DAYS
	};
};

export const actions: Actions = {
	updateRestaurant: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const name = data.get('name')?.toString().trim();
		const phone = data.get('phone')?.toString().trim();
		const email = data.get('email')?.toString().trim();
		const address = data.get('address')?.toString().trim();

		if (!name) {
			return fail(400, { error: 'Restaurant name is required', section: 'restaurant' });
		}

		try {
			await updateRestaurant(restaurantId, { name, phone, email, address });
			return { success: true, section: 'restaurant' };
		} catch (error) {
			return fail(500, { error: 'Failed to update restaurant', section: 'restaurant' });
		}
	},

	updateHours: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const hours = [];
		for (let i = 0; i < 7; i++) {
			const isClosed = data.get(`day_${i}_closed`) === 'on';
			const openTime = data.get(`day_${i}_open`)?.toString() || '09:00';
			const closeTime = data.get(`day_${i}_close`)?.toString() || '21:00';

			hours.push({
				dayOfWeek: i,
				openTime,
				closeTime,
				isClosed
			});
		}

		try {
			await updateOperatingHours(restaurantId, hours);
			return { success: true, section: 'hours' };
		} catch (error) {
			return fail(500, { error: 'Failed to update operating hours', section: 'hours' });
		}
	},

	addBlockedDate: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const date = data.get('date')?.toString();
		const reason = data.get('reason')?.toString().trim();

		if (!date) {
			return fail(400, { error: 'Date is required', section: 'blocked' });
		}

		try {
			await addBlockedDate(restaurantId, date, reason);
			return { success: true, section: 'blocked' };
		} catch (error) {
			return fail(500, { error: 'Failed to add blocked date', section: 'blocked' });
		}
	},

	removeBlockedDate: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const dateId = data.get('dateId')?.toString();

		if (!dateId) {
			return fail(400, { error: 'Invalid date', section: 'blocked' });
		}

		try {
			await removeBlockedDate(restaurantId, dateId);
			return { success: true, section: 'blocked' };
		} catch (error) {
			return fail(500, { error: 'Failed to remove blocked date', section: 'blocked' });
		}
	},

	updateSlotConfig: async ({ request, locals }) => {
		const restaurantId = locals.user!.restaurantId;
		const data = await request.formData();

		const slotDurationMinutes = parseInt(data.get('slotDurationMinutes')?.toString() || '30');
		const maxReservationsPerSlot = parseInt(data.get('maxReservationsPerSlot')?.toString() || '10');
		const defaultPartySize = parseInt(data.get('defaultPartySize')?.toString() || '2');
		const maxPartySize = parseInt(data.get('maxPartySize')?.toString() || '10');
		const advanceBookingDays = parseInt(data.get('advanceBookingDays')?.toString() || '30');

		try {
			await updateTimeSlotConfig(restaurantId, {
				slotDurationMinutes,
				maxReservationsPerSlot,
				defaultPartySize,
				maxPartySize,
				advanceBookingDays
			});
			return { success: true, section: 'slots' };
		} catch (error) {
			return fail(500, { error: 'Failed to update slot configuration', section: 'slots' });
		}
	}
};
