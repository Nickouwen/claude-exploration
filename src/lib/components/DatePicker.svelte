<script lang="ts">
	interface Props {
		value: string;
		onchange: (date: string) => void;
		min?: string;
		max?: string;
	}

	let { value, onchange, min, max }: Props = $props();

	function formatDisplayDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function handlePrevDay() {
		const date = new Date(value + 'T00:00:00');
		date.setDate(date.getDate() - 1);
		const newDate = date.toISOString().split('T')[0];
		if (!min || newDate >= min) {
			onchange(newDate);
		}
	}

	function handleNextDay() {
		const date = new Date(value + 'T00:00:00');
		date.setDate(date.getDate() + 1);
		const newDate = date.toISOString().split('T')[0];
		if (!max || newDate <= max) {
			onchange(newDate);
		}
	}

	function handleToday() {
		const today = new Date().toISOString().split('T')[0];
		onchange(today);
	}
</script>

<div class="flex items-center justify-center gap-3">
	<button
		type="button"
		class="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		onclick={handlePrevDay}
		disabled={min && value <= min}
		aria-label="Previous day"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
	</button>

	<div class="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 min-w-[200px] text-center">
		<span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 font-serif">
			{formatDisplayDate(value)}
		</span>
		<input
			type="date"
			{value}
			{min}
			{max}
			class="input w-auto text-sm py-1"
			onchange={(e) => onchange(e.currentTarget.value)}
		/>
	</div>

	<button
		type="button"
		class="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		onclick={handleNextDay}
		disabled={max && value >= max}
		aria-label="Next day"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</button>

	<button
		type="button"
		class="btn btn-secondary text-sm"
		onclick={handleToday}
	>
		Today
	</button>
</div>
