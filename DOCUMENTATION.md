# Restaurant Reservation System - Documentation

## Overview

A lightweight digital reservation management system designed for small to medium-sized restaurants. This application replaces traditional pen-and-paper booking with an easy-to-use web interface.

## Technology Stack

- **Frontend**: SvelteKit 5 with Svelte 5 (runes syntax)
- **Styling**: Tailwind CSS with custom design tokens
- **Database**: PostgreSQL (AWS RDS compatible)
- **Hosting**: AWS Fargate (containerized deployment)
- **Language**: TypeScript

## Project Structure

```
├── database/
│   └── schema.sql          # PostgreSQL database schema with seed data
├── src/
│   ├── app.css             # Global styles and Tailwind directives
│   ├── app.d.ts            # TypeScript type declarations
│   ├── app.html            # HTML template
│   ├── hooks.server.ts     # Server hooks for authentication
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   │   ├── DatePicker.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── ThemeToggle.svelte
│   │   │   └── Toast.svelte
│   │   ├── server/         # Server-side utilities
│   │   │   ├── auth.ts     # Authentication logic
│   │   │   ├── db.ts       # Database connection pool
│   │   │   ├── reservations.ts
│   │   │   └── settings.ts
│   │   ├── stores/         # Svelte stores
│   │   │   ├── theme.ts    # Dark/light mode
│   │   │   └── toast.ts    # Toast notifications
│   │   └── types/          # TypeScript interfaces
│   │       └── index.ts
│   └── routes/
│       ├── (app)/          # Protected routes (require auth)
│       │   ├── reservations/
│       │   └── settings/
│       ├── book/           # Public booking form
│       │   └── [slug]/
│       ├── login/
│       └── logout/
├── tailwind.config.js
├── svelte.config.js
└── package.json
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose (recommended)
- Or: Node.js 18+, PostgreSQL 14+, npm

### Quick Start with Docker (Recommended)

The easiest way to run the application is with Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd restaurant-reservation-system

# Start the application (builds and runs both app and database)
docker compose up --build

# Or run in detached mode
docker compose up -d --build
```

The application will be available at:
- **Admin interface**: http://localhost:3000/login
- **Customer booking**: http://localhost:3000/book/golden-fork
- **Default credentials**: `admin` / `password123`

To stop the application:
```bash
docker compose down

# To also remove the database volume (resets all data)
docker compose down -v
```

### Development with Docker

For development with hot-reloading:

```bash
docker compose -f docker-compose.dev.yml up --build
```

The dev server will be available at http://localhost:5173

### Manual Setup (Without Docker)

#### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

#### Steps

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd restaurant-reservation-system
   npm install
   ```

2. **Set up PostgreSQL database:**
   ```bash
   createdb restaurant_reservations
   psql -d restaurant_reservations -f database/schema.sql
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=restaurant_reservations
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Admin interface: http://localhost:5173/login
   - Default credentials: `admin` / `password123`
   - Customer booking: http://localhost:5173/book/golden-fork

### Production Deployment (AWS Fargate)

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY build ./build
   COPY package.json ./
   ENV NODE_ENV=production
   EXPOSE 3000
   CMD ["node", "build"]
   ```

3. **Configure AWS RDS:**
   - Create PostgreSQL instance
   - Run `schema.sql` against the database
   - Note connection details for environment variables

4. **Deploy to Fargate:**
   - Push Docker image to ECR
   - Create ECS task definition with environment variables
   - Configure load balancer and target group
   - Set up service with desired task count

## Features

### Restaurant Owner Features

- **Dashboard**: View daily reservations at a glance
- **Date Navigation**: Easy date picker to browse reservations
- **Reservation Management**: Create, edit, and delete reservations
- **Status Tracking**: Mark reservations as confirmed, completed, no-show, or cancelled
- **Operating Hours**: Configure hours for each day of the week
- **Blocked Dates**: Block specific dates for holidays or events
- **Slot Configuration**: Set time slot duration, max reservations per slot, party size limits

### Customer Features

- **Online Booking**: Simple form to make reservations
- **Real-time Availability**: See available time slots
- **Confirmation**: Instant booking confirmation
- **Marketing Opt-in**: Option to receive promotional emails

## Database Schema

### Tables

- `restaurants`: Restaurant information and settings
- `users`: Staff/owner accounts
- `sessions`: Authentication sessions with refresh tokens
- `customers`: Customer contact information
- `reservations`: Reservation records
- `marketing_emails`: Email opt-in list
- `operating_hours`: Weekly operating schedule
- `blocked_dates`: Dates closed for reservations
- `time_slot_configs`: Reservation slot settings

## Authentication

The system uses a session-based authentication with refresh tokens:

1. User submits username/password
2. Server validates credentials against bcrypt hash
3. Refresh token is created and stored in HTTP-only cookie
4. Session validated on each request via server hooks
5. 7-day session expiry with automatic cleanup

## Adding a New Restaurant

Since restaurant owners don't self-register, follow these steps:

1. **Insert restaurant record:**
   ```sql
   INSERT INTO restaurants (name, slug, phone, email, address, timezone)
   VALUES ('Restaurant Name', 'restaurant-slug', '555-123-4567', 'email@example.com', 'Address', 'America/New_York');
   ```

2. **Create user account:**
   ```sql
   -- Hash password using bcrypt (cost factor 10)
   INSERT INTO users (restaurant_id, username, password_hash)
   VALUES ('<restaurant_id>', 'username', '<bcrypt_hash>');
   ```

3. **Initialize time slot config:**
   ```sql
   INSERT INTO time_slot_configs (restaurant_id, slot_duration_minutes, max_reservations_per_slot, default_party_size, max_party_size, advance_booking_days)
   VALUES ('<restaurant_id>', 30, 8, 2, 10, 30);
   ```

4. **Set operating hours:**
   ```sql
   INSERT INTO operating_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
   VALUES
     ('<restaurant_id>', 0, '11:00', '22:00', FALSE),
     -- ... repeat for days 1-6
   ```

5. **Provide the customer with:**
   - Login URL: `/login`
   - Username and temporary password
   - Booking URL: `/book/<restaurant-slug>`

## Theming

The application supports dark and light modes:

- Toggle in the header persists to localStorage
- Respects system preference on first visit
- Custom color palette for sophisticated appearance
- Serif fonts for headings (Playfair Display)
- Sans-serif for body text (Inter)

## API Routes

All API routes are server-side rendered using SvelteKit form actions:

- `POST /login` - Authenticate user
- `POST /logout` - End session
- `POST /reservations?/create` - Create reservation
- `POST /reservations?/update` - Update reservation
- `POST /reservations?/delete` - Delete reservation
- `POST /reservations?/updateStatus` - Change reservation status
- `POST /settings?/updateRestaurant` - Update restaurant info
- `POST /settings?/updateHours` - Update operating hours
- `POST /settings?/addBlockedDate` - Block a date
- `POST /settings?/removeBlockedDate` - Unblock a date
- `POST /settings?/updateSlotConfig` - Update slot settings
- `POST /book/[slug]` - Create customer reservation

## Security Considerations

- Passwords hashed with bcrypt (cost factor 10)
- HTTP-only cookies for session tokens
- CSRF protection via SvelteKit form actions
- Input validation on all forms
- SQL injection prevention via parameterized queries
- XSS prevention via Svelte's automatic escaping

## Future Enhancements

See `CLAUDE.md` section 6 for planned features:
- SMS/email notifications
- Analytics dashboard
- PWA support for offline access
- Integration with restaurant websites
