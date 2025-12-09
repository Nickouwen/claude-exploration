import type { Handle } from '@sveltejs/kit';
import { validateRefreshToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const refreshToken = event.cookies.get('refresh_token');

	if (refreshToken) {
		const session = await validateRefreshToken(refreshToken);
		if (session) {
			event.locals.user = {
				id: session.userId,
				username: session.username,
				restaurantId: session.restaurantId,
				restaurantName: session.restaurantName
			};
		} else {
			event.cookies.delete('refresh_token', { path: '/' });
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
