import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { deleteSession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const refreshToken = cookies.get('refresh_token');

		if (refreshToken) {
			await deleteSession(refreshToken);
		}

		cookies.delete('refresh_token', { path: '/' });

		throw redirect(302, '/login');
	}
};
