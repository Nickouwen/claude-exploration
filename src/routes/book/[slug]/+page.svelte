<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let loading = $state(false);
	let selectedDate = $state(data.date);

	function formatTime(timeStr: string): string {
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function handleDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedDate = target.value;
		goto(`/book/${data.restaurant.slug}?date=${selectedDate}`, { keepFocus: true, noScroll: true });
	}

	function isDateBlocked(dateStr: string): boolean {
		return data.blockedDates.includes(dateStr);
	}

	function getDayOfWeek(dateStr: string): number {
		return new Date(dateStr + 'T00:00:00').getDay();
	}

	function isDayClosed(dateStr: string): boolean {
		const dayOfWeek = getDayOfWeek(dateStr);
		const hours = data.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
		return hours?.isClosed || false;
	}
</script>

<svelte:head>
	<title>Book a Table | {data.restaurant.name}</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
	<div class="max-w-xl mx-auto">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
				{data.restaurant.name}
			</h1>
			<p class="mt-2 text-neutral-600 dark:text-neutral-400">Book your table</p>
			{#if data.restaurant.address}
				<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-500">{data.restaurant.address}</p>
			{/if}
		</div>

		{#if form?.success}
			<div class="card p-8 text-center">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
					<svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-serif mb-2">
					Reservation Confirmed!
				</h2>
				<p class="text-neutral-600 dark:text-neutral-400 mb-4">
					Thank you, {form.reservation?.name}. Your table is booked.
				</p>
				<div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-neutral-500 dark:text-neutral-400">Date</span>
							<p class="font-medium text-neutral-900 dark:text-neutral-100">{formatDate(form.reservation?.date || '')}</p>
						</div>
						<div>
							<span class="text-neutral-500 dark:text-neutral-400">Time</span>
							<p class="font-medium text-neutral-900 dark:text-neutral-100">{formatTime(form.reservation?.time || '')}</p>
						</div>
						<div>
							<span class="text-neutral-500 dark:text-neutral-400">Party Size</span>
							<p class="font-medium text-neutral-900 dark:text-neutral-100">{form.reservation?.partySize} guests</p>
						</div>
						<div>
							<span class="text-neutral-500 dark:text-neutral-400">Confirmation</span>
							<p class="font-medium text-neutral-900 dark:text-neutral-100">#{form.reservation?.id.slice(0, 8).toUpperCase()}</p>
						</div>
					</div>
				</div>
				<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
					{#if data.restaurant.phone}
						Questions? Call us at {data.restaurant.phone}
					{/if}
				</p>
				<a href="/book/{data.restaurant.slug}" class="btn btn-primary">
					Make Another Reservation
				</a>
			</div>
		{:else}
			<div class="card p-6">
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
					<div class="space-y-6">
						<div>
							<h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Select Date & Time</h3>
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<label for="date" class="label">Date *</label>
									<input
										type="date"
										id="date"
										name="date"
										required
										class="input"
										value={selectedDate}
										min={data.minDate}
										max={data.maxDate}
										onchange={handleDateChange}
									/>
								</div>
								<div>
									<label for="timeSlot" class="label">Time *</label>
									{#if isDayClosed(selectedDate)}
										<p class="text-sm text-red-600 dark:text-red-400 py-2">
											Sorry, we're closed on this day.
										</p>
									{:else if isDateBlocked(selectedDate)}
										<p class="text-sm text-red-600 dark:text-red-400 py-2">
											Sorry, reservations are not available on this date.
										</p>
									{:else if data.timeSlots.filter((s) => s.available).length === 0}
										<p class="text-sm text-yellow-600 dark:text-yellow-400 py-2">
											No available times. Please select another date.
										</p>
									{:else}
										<select
											id="timeSlot"
											name="timeSlot"
											required
											class="input"
										>
											<option value="">Select a time</option>
											{#each data.timeSlots.filter((s) => s.available) as slot}
												<option value={slot.time} selected={form?.values?.timeSlot === slot.time}>
													{formatTime(slot.time)}
												</option>
											{/each}
										</select>
									{/if}
								</div>
							</div>
						</div>

						<div>
							<label for="partySize" class="label">Party Size *</label>
							<select
								id="partySize"
								name="partySize"
								required
								class="input"
							>
								{#each Array(data.config?.maxPartySize || 10) as _, i}
									<option value={i + 1} selected={(form?.values?.partySize || data.config?.defaultPartySize || 2) === i + 1}>
										{i + 1} {i === 0 ? 'guest' : 'guests'}
									</option>
								{/each}
							</select>
						</div>

						<div>
							<h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Your Information</h3>
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<label for="firstName" class="label">First Name *</label>
									<input
										type="text"
										id="firstName"
										name="firstName"
										required
										class="input"
										value={form?.values?.firstName || ''}
									/>
								</div>
								<div>
									<label for="lastName" class="label">Last Name *</label>
									<input
										type="text"
										id="lastName"
										name="lastName"
										required
										class="input"
										value={form?.values?.lastName || ''}
									/>
								</div>
							</div>
						</div>

						<div>
							<label for="email" class="label">Email *</label>
							<input
								type="email"
								id="email"
								name="email"
								required
								class="input"
								value={form?.values?.email || ''}
							/>
						</div>

						<div>
							<label for="phone" class="label">Phone *</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								required
								class="input"
								placeholder="(555) 123-4567"
								value={form?.values?.phone || ''}
							/>
						</div>

						<div>
							<label for="notes" class="label">Special Requests (optional)</label>
							<textarea
								id="notes"
								name="notes"
								rows="2"
								class="input"
								placeholder="Allergies, special occasions, seating preferences..."
							>{form?.values?.notes || ''}</textarea>
						</div>

						<div class="flex items-start gap-2">
							<input
								type="checkbox"
								id="marketingOptIn"
								name="marketingOptIn"
								class="mt-1 rounded border-neutral-300 dark:border-neutral-600"
							/>
							<label for="marketingOptIn" class="text-sm text-neutral-600 dark:text-neutral-400">
								I'd like to receive updates about special offers and events
							</label>
						</div>

						<button
							type="submit"
							class="btn btn-primary w-full"
							disabled={loading || isDayClosed(selectedDate) || isDateBlocked(selectedDate) || data.timeSlots.filter((s) => s.available).length === 0}
						>
							{#if loading}
								<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Booking...
							{:else}
								Complete Reservation
							{/if}
						</button>
					</div>
				</form>
			</div>

			<p class="text-center text-xs text-neutral-500 dark:text-neutral-500 mt-4">
				By booking, you agree to our cancellation policy.
				{#if data.restaurant.phone}
					<br />Need help? Call {data.restaurant.phone}
				{/if}
			</p>
		{/if}
	</div>
</div>
