-- Restaurant Reservation System Database Schema
-- PostgreSQL (AWS RDS compatible)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurants_slug ON restaurants(slug);

-- Users table (restaurant owners/staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, username)
);

CREATE INDEX idx_users_restaurant ON users(restaurant_id);

-- Sessions table (for refresh token management)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX idx_customers_phone ON customers(restaurant_id, phone);
CREATE INDEX idx_customers_email ON customers(restaurant_id, email);

-- Reservations table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_restaurant_date ON reservations(restaurant_id, date);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Marketing emails table (separate from customers for opt-in tracking)
CREATE TABLE marketing_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    opted_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    opted_out_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(restaurant_id, email)
);

CREATE INDEX idx_marketing_emails_restaurant ON marketing_emails(restaurant_id);

-- Operating hours table
CREATE TABLE operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(restaurant_id, day_of_week)
);

CREATE INDEX idx_operating_hours_restaurant ON operating_hours(restaurant_id);

-- Blocked dates table (holidays, special events, etc.)
CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, date)
);

CREATE INDEX idx_blocked_dates_restaurant_date ON blocked_dates(restaurant_id, date);

-- Time slot configuration table
CREATE TABLE time_slot_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
    max_reservations_per_slot INTEGER NOT NULL DEFAULT 10 CHECK (max_reservations_per_slot > 0),
    default_party_size INTEGER NOT NULL DEFAULT 2 CHECK (default_party_size > 0),
    max_party_size INTEGER NOT NULL DEFAULT 12 CHECK (max_party_size > 0),
    advance_booking_days INTEGER NOT NULL DEFAULT 30 CHECK (advance_booking_days > 0)
);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for development/testing
-- Note: Password is 'password123' hashed with bcrypt
INSERT INTO restaurants (id, name, slug, phone, email, address, timezone)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'The Golden Fork',
    'golden-fork',
    '555-123-4567',
    'info@goldenfork.example.com',
    '123 Main Street, Anytown, USA',
    'America/New_York'
);

INSERT INTO users (restaurant_id, username, password_hash)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin',
    '$2a$10$1tsJGgObRzdJtQqdaY0cCOfL.zJYh.8S8MGeGrUpPu93fvy5wS0/i'
);

INSERT INTO time_slot_configs (restaurant_id, slot_duration_minutes, max_reservations_per_slot, default_party_size, max_party_size, advance_booking_days)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    30,
    8,
    2,
    10,
    30
);

-- Default operating hours (Monday-Sunday, 11am-10pm)
INSERT INTO operating_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, '11:00', '22:00', FALSE),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, '11:00', '22:00', FALSE),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, '11:00', '22:00', FALSE),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, '11:00', '22:00', FALSE),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, '11:00', '23:00', FALSE),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5, '11:00', '23:00', FALSE),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 6, '12:00', '21:00', FALSE);
