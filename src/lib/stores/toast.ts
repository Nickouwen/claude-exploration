import { writable } from 'svelte/store';
import type { Toast } from '$lib/types';

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		success: (message: string, duration = 4000) => {
			const id = crypto.randomUUID();
			update((toasts) => [...toasts, { id, type: 'success', message, duration }]);
			setTimeout(() => {
				update((toasts) => toasts.filter((t) => t.id !== id));
			}, duration);
		},
		error: (message: string, duration = 5000) => {
			const id = crypto.randomUUID();
			update((toasts) => [...toasts, { id, type: 'error', message, duration }]);
			setTimeout(() => {
				update((toasts) => toasts.filter((t) => t.id !== id));
			}, duration);
		},
		info: (message: string, duration = 4000) => {
			const id = crypto.randomUUID();
			update((toasts) => [...toasts, { id, type: 'info', message, duration }]);
			setTimeout(() => {
				update((toasts) => toasts.filter((t) => t.id !== id));
			}, duration);
		},
		dismiss: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}
	};
}

export const toast = createToastStore();
