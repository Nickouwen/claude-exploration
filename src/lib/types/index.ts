export interface Restaurant {
	id: string;
	name: string;
	slug: string;
	phone?: string;
	email?: string;
	address?: string;
	timezone: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface User {
	id: string;
	restaurantId: string;
	username: string;
	passwordHash: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Session {
	id: string;
	userId: string;
	refreshToken: string;
	expiresAt: Date;
	createdAt: Date;
}

export interface Reservation {
	id: string;
	restaurantId: string;
	customerId: string;
	date: string;
	timeSlot: string;
	partySize: number;
	notes?: string;
	status: ReservationStatus;
	createdAt: Date;
	updatedAt: Date;
	customer?: Customer;
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'completed';

export interface Customer {
	id: string;
	restaurantId: string;
	firstName: string;
	lastName: string;
	email?: string;
	phone: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface MarketingEmail {
	id: string;
	restaurantId: string;
	email: string;
	firstName?: string;
	lastName?: string;
	optedInAt: Date;
	optedOutAt?: Date;
}

export interface OperatingHours {
	id: string;
	restaurantId: string;
	dayOfWeek: number;
	openTime: string;
	closeTime: string;
	isClosed: boolean;
}

export interface BlockedDate {
	id: string;
	restaurantId: string;
	date: string;
	reason?: string;
	createdAt: Date;
}

export interface TimeSlotConfig {
	id: string;
	restaurantId: string;
	slotDurationMinutes: number;
	maxReservationsPerSlot: number;
	defaultPartySize: number;
	maxPartySize: number;
	advanceBookingDays: number;
}

export interface TimeSlot {
	time: string;
	available: boolean;
	remainingSpots: number;
	totalSpots: number;
}

export interface ReservationFormData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	date: string;
	timeSlot: string;
	partySize: number;
	notes: string;
	marketingOptIn: boolean;
}

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
	duration?: number;
}
