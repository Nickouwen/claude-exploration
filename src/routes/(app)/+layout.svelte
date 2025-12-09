<script lang="ts">
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	let menuOpen = $state(false);

	const navItems = [
		{ href: '/reservations', label: 'Reservations', icon: 'calendar' },
		{ href: '/settings', label: 'Settings', icon: 'cog' }
	];
</script>

<div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
	<header class="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center gap-4">
					<button
						type="button"
						class="lg:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
						onclick={() => (menuOpen = !menuOpen)}
						aria-label="Toggle menu"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
					<a href="/reservations" class="flex items-center gap-2">
						<span class="text-xl font-bold font-serif text-neutral-900 dark:text-neutral-100">
							{data.user?.restaurantName || 'Reservations'}
						</span>
					</a>
				</div>

				<nav class="hidden lg:flex items-center gap-1">
					{#each navItems as item}
						{@const isActive = $page.url.pathname.startsWith(item.href)}
						<a
							href={item.href}
							class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {isActive
								? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
								: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'}"
						>
							{item.label}
						</a>
					{/each}
				</nav>

				<div class="flex items-center gap-2">
					<ThemeToggle />
					<span class="hidden sm:inline text-sm text-neutral-600 dark:text-neutral-400">
						{data.user?.username}
					</span>
					<form method="POST" action="/logout">
						<button type="submit" class="btn btn-secondary text-sm">
							Sign out
						</button>
					</form>
				</div>
			</div>
		</div>

		{#if menuOpen}
			<nav class="lg:hidden border-t border-neutral-200 dark:border-neutral-700 p-4">
				<div class="flex flex-col gap-1">
					{#each navItems as item}
						{@const isActive = $page.url.pathname.startsWith(item.href)}
						<a
							href={item.href}
							class="px-4 py-3 rounded-lg text-sm font-medium transition-colors {isActive
								? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
								: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'}"
							onclick={() => (menuOpen = false)}
						>
							{item.label}
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
</div>
