import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validateCredentials, createSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/reservations');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, {
				error: 'Please enter both username and password',
				username
			});
		}

		const result = await validateCredentials(username, password);

		if (!result) {
			return fail(401, {
				error: 'Invalid username or password',
				username
			});
		}

		const { accessToken, refreshToken } = await createSession(result.user.id);

		cookies.set('refresh_token', refreshToken, {
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(302, '/reservations');
	}
};
