<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let loading = $state<string | null>(null);

	$effect(() => {
		if (form?.success) {
			const messages: Record<string, string> = {
				restaurant: 'Restaurant information updated',
				hours: 'Operating hours updated',
				blocked: form.success ? 'Blocked date updated' : '',
				slots: 'Slot configuration updated'
			};
			if (form.section && messages[form.section]) {
				toast.success(messages[form.section]);
			}
			loading = null;
		} else if (form?.error) {
			toast.error(form.error);
			loading = null;
		}
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Settings | {data.user?.restaurantName}</title>
</svelte:head>

<div class="space-y-8">
	<h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">Settings</h1>

	<div class="card p-6">
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Restaurant Information</h2>
		<form
			method="POST"
			action="?/updateRestaurant"
			use:enhance={() => {
				loading = 'restaurant';
				return async ({ update }) => {
					await update();
				};
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<label for="name" class="label">Restaurant Name *</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						class="input"
						value={data.restaurant?.name || ''}
					/>
				</div>
				<div>
					<label for="phone" class="label">Phone</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						class="input"
						value={data.restaurant?.phone || ''}
					/>
				</div>
				<div>
					<label for="email" class="label">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						class="input"
						value={data.restaurant?.email || ''}
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="address" class="label">Address</label>
					<textarea
						id="address"
						name="address"
						rows="2"
						class="input"
					>{data.restaurant?.address || ''}</textarea>
				</div>
			</div>
			<div class="mt-4 flex justify-end">
				<button type="submit" class="btn btn-primary" disabled={loading === 'restaurant'}>
					{loading === 'restaurant' ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	</div>

	<div class="card p-6">
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Operating Hours</h2>
		<form
			method="POST"
			action="?/updateHours"
			use:enhance={() => {
				loading = 'hours';
				return async ({ update }) => {
					await update();
				};
			}}
		>
			<div class="space-y-3">
				{#each data.days as day, index}
					{@const hours = data.operatingHours.find((h) => h.dayOfWeek === index)}
					<div class="flex flex-wrap items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
						<div class="w-24 font-medium text-neutral-900 dark:text-neutral-100">{day}</div>
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								name="day_{index}_closed"
								class="rounded border-neutral-300 dark:border-neutral-600"
								checked={hours?.isClosed || false}
							/>
							<span class="text-sm text-neutral-600 dark:text-neutral-400">Closed</span>
						</label>
						<div class="flex items-center gap-2">
							<input
								type="time"
								name="day_{index}_open"
								class="input w-auto text-sm"
								value={hours?.openTime || '09:00'}
							/>
							<span class="text-neutral-500">to</span>
							<input
								type="time"
								name="day_{index}_close"
								class="input w-auto text-sm"
								value={hours?.closeTime || '21:00'}
							/>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 flex justify-end">
				<button type="submit" class="btn btn-primary" disabled={loading === 'hours'}>
					{loading === 'hours' ? 'Saving...' : 'Save Hours'}
				</button>
			</div>
		</form>
	</div>

	<div class="card p-6">
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Blocked Dates</h2>
		<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
			Block specific dates for holidays, special events, or closures.
		</p>

		<form
			method="POST"
			action="?/addBlockedDate"
			class="flex flex-wrap items-end gap-3 mb-6"
			use:enhance={() => {
				loading = 'blocked';
				return async ({ update }) => {
					await update();
				};
			}}
		>
			<div>
				<label for="blockDate" class="label">Date</label>
				<input
					type="date"
					id="blockDate"
					name="date"
					required
					class="input"
					min={new Date().toISOString().split('T')[0]}
				/>
			</div>
			<div class="flex-1">
				<label for="blockReason" class="label">Reason (optional)</label>
				<input
					type="text"
					id="blockReason"
					name="reason"
					class="input"
					placeholder="e.g., Christmas Day"
				/>
			</div>
			<button type="submit" class="btn btn-primary" disabled={loading === 'blocked'}>
				{loading === 'blocked' ? 'Adding...' : 'Add Date'}
			</button>
		</form>

		{#if data.blockedDates.length === 0}
			<p class="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
				No blocked dates. Add dates above to block reservations.
			</p>
		{:else}
			<div class="space-y-2">
				{#each data.blockedDates as blockedDate (blockedDate.id)}
					<div class="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
						<div>
							<span class="font-medium text-neutral-900 dark:text-neutral-100">
								{formatDate(blockedDate.date)}
							</span>
							{#if blockedDate.reason}
								<span class="text-sm text-neutral-500 dark:text-neutral-400 ml-2">
									- {blockedDate.reason}
								</span>
							{/if}
						</div>
						<form method="POST" action="?/removeBlockedDate" use:enhance>
							<input type="hidden" name="dateId" value={blockedDate.id} />
							<button
								type="submit"
								class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
								aria-label="Remove blocked date"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="card p-6">
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Reservation Settings</h2>
		<form
			method="POST"
			action="?/updateSlotConfig"
			use:enhance={() => {
				loading = 'slots';
				return async ({ update }) => {
					await update();
				};
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="slotDuration" class="label">Time Slot Duration (minutes)</label>
					<select
						id="slotDuration"
						name="slotDurationMinutes"
						class="input"
					>
						<option value="15" selected={data.timeSlotConfig?.slotDurationMinutes === 15}>15 minutes</option>
						<option value="30" selected={data.timeSlotConfig?.slotDurationMinutes === 30}>30 minutes</option>
						<option value="45" selected={data.timeSlotConfig?.slotDurationMinutes === 45}>45 minutes</option>
						<option value="60" selected={data.timeSlotConfig?.slotDurationMinutes === 60}>1 hour</option>
						<option value="90" selected={data.timeSlotConfig?.slotDurationMinutes === 90}>1.5 hours</option>
						<option value="120" selected={data.timeSlotConfig?.slotDurationMinutes === 120}>2 hours</option>
					</select>
				</div>
				<div>
					<label for="maxPerSlot" class="label">Max Reservations per Slot</label>
					<input
						type="number"
						id="maxPerSlot"
						name="maxReservationsPerSlot"
						min="1"
						max="100"
						class="input"
						value={data.timeSlotConfig?.maxReservationsPerSlot || 10}
					/>
				</div>
				<div>
					<label for="defaultParty" class="label">Default Party Size</label>
					<input
						type="number"
						id="defaultParty"
						name="defaultPartySize"
						min="1"
						max="20"
						class="input"
						value={data.timeSlotConfig?.defaultPartySize || 2}
					/>
				</div>
				<div>
					<label for="maxParty" class="label">Maximum Party Size</label>
					<input
						type="number"
						id="maxParty"
						name="maxPartySize"
						min="1"
						max="50"
						class="input"
						value={data.timeSlotConfig?.maxPartySize || 10}
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="advanceDays" class="label">Advance Booking (days)</label>
					<input
						type="number"
						id="advanceDays"
						name="advanceBookingDays"
						min="1"
						max="365"
						class="input"
						value={data.timeSlotConfig?.advanceBookingDays || 30}
					/>
					<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
						How many days in advance customers can make reservations
					</p>
				</div>
			</div>
			<div class="mt-4 flex justify-end">
				<button type="submit" class="btn btn-primary" disabled={loading === 'slots'}>
					{loading === 'slots' ? 'Saving...' : 'Save Settings'}
				</button>
			</div>
		</form>
	</div>
</div>
