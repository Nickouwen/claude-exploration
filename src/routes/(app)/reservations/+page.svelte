<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageData, ActionData } from './$types';
	import type { Reservation, TimeSlot } from '$lib/types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedReservation: Reservation | null = $state(null);
	let loading = $state(false);

	$effect(() => {
		if (form?.success) {
			if (form.action === 'create') {
				toast.success('Reservation created successfully');
				showAddModal = false;
			} else if (form.action === 'update') {
				toast.success('Reservation updated successfully');
				showEditModal = false;
			} else if (form.action === 'delete') {
				toast.success('Reservation deleted');
				showDeleteModal = false;
			} else if (form.action === 'updateStatus') {
				toast.info('Status updated');
			}
			selectedReservation = null;
		} else if (form?.error) {
			toast.error(form.error);
		}
	});

	function handleDateChange(newDate: string) {
		goto(`/reservations?date=${newDate}`, { keepFocus: true, noScroll: true });
	}

	function formatTime(timeStr: string): string {
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'confirmed':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'cancelled':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			case 'no_show':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
			case 'completed':
				return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
			default:
				return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
		}
	}

	function openEditModal(reservation: Reservation) {
		selectedReservation = reservation;
		showEditModal = true;
	}

	function openDeleteModal(reservation: Reservation) {
		selectedReservation = reservation;
		showDeleteModal = true;
	}
</script>

<svelte:head>
	<title>Reservations | {data.user?.restaurantName}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
				Reservations
			</h1>
			<button type="button" class="btn btn-primary" onclick={() => (showAddModal = true)}>
				<svg class="w-5 h-5 mr-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add
			</button>
		</div>
		<div class="flex justify-center">
			<DatePicker value={data.date} onchange={handleDateChange} />
		</div>
	</div>

	{#if data.reservations.length === 0}
		<div class="card p-12 text-center">
			<svg class="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			<h3 class="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">No reservations</h3>
			<p class="mt-1 text-neutral-500 dark:text-neutral-400">
				No reservations for this date. Click "Add" to create one.
			</p>
		</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-neutral-50 dark:bg-neutral-800/50">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Time</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Guest</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Contact</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Party</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Notes</th>
							<th class="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
						{#each data.reservations as reservation (reservation.id)}
							<tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
								<td class="px-4 py-4 whitespace-nowrap">
									<span class="font-medium text-neutral-900 dark:text-neutral-100">
										{formatTime(reservation.timeSlot)}
									</span>
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									<span class="text-neutral-900 dark:text-neutral-100">
										{reservation.customer?.firstName} {reservation.customer?.lastName}
									</span>
								</td>
								<td class="px-4 py-4">
									<div class="text-sm">
										<div class="text-neutral-900 dark:text-neutral-100">{reservation.customer?.phone}</div>
										{#if reservation.customer?.email}
											<div class="text-neutral-500 dark:text-neutral-400 text-xs">{reservation.customer.email}</div>
										{/if}
									</div>
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									<span class="text-neutral-900 dark:text-neutral-100">{reservation.partySize}</span>
								</td>
								<td class="px-4 py-4 whitespace-nowrap">
									<form method="POST" action="?/updateStatus" use:enhance>
										<input type="hidden" name="reservationId" value={reservation.id} />
										<select
											name="status"
											class="text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer {getStatusColor(reservation.status)}"
											onchange={(e) => e.currentTarget.form?.requestSubmit()}
										>
											<option value="confirmed" selected={reservation.status === 'confirmed'}>Confirmed</option>
											<option value="completed" selected={reservation.status === 'completed'}>Completed</option>
											<option value="no_show" selected={reservation.status === 'no_show'}>No Show</option>
											<option value="cancelled" selected={reservation.status === 'cancelled'}>Cancelled</option>
										</select>
									</form>
								</td>
								<td class="px-4 py-4 max-w-xs">
									<span class="text-sm text-neutral-500 dark:text-neutral-400 truncate block">
										{reservation.notes || '-'}
									</span>
								</td>
								<td class="px-4 py-4 whitespace-nowrap text-right">
									<div class="flex items-center justify-end gap-2">
										<button
											type="button"
											class="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
											onclick={() => openEditModal(reservation)}
											aria-label="Edit reservation"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button
											type="button"
											class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
											onclick={() => openDeleteModal(reservation)}
											aria-label="Delete reservation"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<div class="card p-4">
		<h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Availability</h3>
		<div class="flex flex-wrap gap-2">
			{#each data.timeSlots as slot}
				<span
					class="px-2 py-1 text-xs rounded {slot.available
						? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
						: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}"
				>
					{formatTime(slot.time)} ({slot.remainingSpots}/{slot.totalSpots})
				</span>
			{/each}
		</div>
	</div>
</div>

<Modal open={showAddModal} onclose={() => (showAddModal = false)} title="New Reservation">
	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<input type="hidden" name="date" value={data.date} />
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="firstName" class="label">First Name *</label>
					<input type="text" id="firstName" name="firstName" required class="input" />
				</div>
				<div>
					<label for="lastName" class="label">Last Name *</label>
					<input type="text" id="lastName" name="lastName" required class="input" />
				</div>
			</div>
			<div>
				<label for="phone" class="label">Phone *</label>
				<input type="tel" id="phone" name="phone" required class="input" />
			</div>
			<div>
				<label for="email" class="label">Email</label>
				<input type="email" id="email" name="email" class="input" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="timeSlot" class="label">Time *</label>
					<select id="timeSlot" name="timeSlot" required class="input">
						{#each data.timeSlots.filter((s) => s.available) as slot}
							<option value={slot.time}>{formatTime(slot.time)} ({slot.remainingSpots} left)</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="partySize" class="label">Party Size *</label>
					<input
						type="number"
						id="partySize"
						name="partySize"
						required
						min="1"
						max={data.config?.maxPartySize || 10}
						value={data.config?.defaultPartySize || 2}
						class="input"
					/>
				</div>
			</div>
			<div>
				<label for="notes" class="label">Notes</label>
				<textarea id="notes" name="notes" rows="2" class="input"></textarea>
			</div>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn btn-secondary" onclick={() => (showAddModal = false)}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Reservation'}
				</button>
			</div>
		</div>
	</form>
</Modal>

<Modal open={showEditModal} onclose={() => (showEditModal = false)} title="Edit Reservation">
	{#if selectedReservation}
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<input type="hidden" name="reservationId" value={selectedReservation.id} />
			<input type="hidden" name="date" value={data.date} />
			<div class="space-y-4">
				<div class="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
					<p class="text-sm text-neutral-600 dark:text-neutral-400">
						<span class="font-medium">{selectedReservation.customer?.firstName} {selectedReservation.customer?.lastName}</span>
						<br />
						{selectedReservation.customer?.phone}
					</p>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="editTimeSlot" class="label">Time *</label>
						<select id="editTimeSlot" name="timeSlot" required class="input">
							{#each data.timeSlots as slot}
								<option value={slot.time} selected={slot.time + ':00' === selectedReservation.timeSlot}>
									{formatTime(slot.time)} ({slot.remainingSpots} left)
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="editPartySize" class="label">Party Size *</label>
						<input
							type="number"
							id="editPartySize"
							name="partySize"
							required
							min="1"
							max={data.config?.maxPartySize || 10}
							value={selectedReservation.partySize}
							class="input"
						/>
					</div>
				</div>
				<div>
					<label for="editNotes" class="label">Notes</label>
					<textarea id="editNotes" name="notes" rows="2" class="input">{selectedReservation.notes || ''}</textarea>
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button type="button" class="btn btn-secondary" onclick={() => (showEditModal = false)}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={showDeleteModal} onclose={() => (showDeleteModal = false)} title="Delete Reservation">
	{#if selectedReservation}
		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<input type="hidden" name="reservationId" value={selectedReservation.id} />
			<div class="space-y-4">
				<p class="text-neutral-600 dark:text-neutral-400">
					Are you sure you want to delete the reservation for
					<span class="font-medium text-neutral-900 dark:text-neutral-100">
						{selectedReservation.customer?.firstName} {selectedReservation.customer?.lastName}
					</span>
					at
					<span class="font-medium text-neutral-900 dark:text-neutral-100">
						{formatTime(selectedReservation.timeSlot)}
					</span>?
				</p>
				<p class="text-sm text-red-600 dark:text-red-400">
					This action cannot be undone.
				</p>
				<div class="flex justify-end gap-2 pt-2">
					<button type="button" class="btn btn-secondary" onclick={() => (showDeleteModal = false)}>
						Cancel
					</button>
					<button type="submit" class="btn btn-danger" disabled={loading}>
						{loading ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</form>
	{/if}
</Modal>
