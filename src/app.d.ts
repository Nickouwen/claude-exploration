/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				username: string;
				restaurantId: string;
				restaurantName: string;
			} | null;
		}

		interface PageData {
			user?: {
				id: string;
				username: string;
				restaurantId: string;
				restaurantName: string;
			} | null;
		}
	}
}

export {};
