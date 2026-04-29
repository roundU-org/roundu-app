-- RoundU Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    address TEXT,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    response_rate INTEGER DEFAULT 100,
    is_online BOOLEAN DEFAULT false,
    service_radius INTEGER DEFAULT 5,
    working_hours TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_hr INTEGER NOT NULL
);

-- Provider Services (Many-to-Many)
CREATE TABLE IF NOT EXISTS provider_services (
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    service_id VARCHAR(50) REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, service_id)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES providers(id),
    service_id VARCHAR(50) REFERENCES services(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, completed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    address TEXT,
    price DECIMAL(10, 2),
    notes TEXT,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions (Earnings/Payments)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- credit (earning), debit (payment)
    description TEXT,
    booking_id UUID REFERENCES bookings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Initial Services
INSERT INTO services (id, label, description, price_per_hr) VALUES
('plumber', 'Plumber', 'Pipes & drainage', 299),
('electrician', 'Electrician', 'Wiring & fixtures', 299),
('carwash', 'Car Wash', 'At your doorstep', 199),
('drivers', 'Acting Drivers', 'Expert chauffeurs', 399),
('housekeeping', 'House Keeping', 'Deep & regular', 499)
ON CONFLICT (id) DO NOTHING;
