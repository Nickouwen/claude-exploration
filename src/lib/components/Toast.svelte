<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
	{#each $toast as t (t.id)}
		<div
			transition:fly={{ x: 100, duration: 300 }}
			class="px-4 py-3 rounded-lg shadow-lg max-w-sm"
			class:bg-green-600={t.type === 'success'}
			class:bg-red-600={t.type === 'error'}
			class:bg-primary-600={t.type === 'info'}
			role="alert"
		>
			<div class="flex items-center gap-3">
				<span class="text-white">{t.message}</span>
				<button
					type="button"
					class="text-white/80 hover:text-white"
					onclick={() => toast.dismiss(t.id)}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	{/each}
</div>
