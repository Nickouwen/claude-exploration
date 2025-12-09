<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Login | Restaurant Reservations</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
	<div class="card w-full max-w-md p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
				Restaurant Reservations
			</h1>
			<p class="mt-2 text-neutral-600 dark:text-neutral-400">Sign in to manage your reservations</p>
		</div>

		{#if form?.error}
			<div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<label for="username" class="label">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						required
						autocomplete="username"
						class="input"
						value={form?.username ?? ''}
					/>
				</div>

				<div>
					<label for="password" class="label">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						autocomplete="current-password"
						class="input"
					/>
				</div>

				<button
					type="submit"
					class="btn btn-primary w-full"
					disabled={loading}
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
