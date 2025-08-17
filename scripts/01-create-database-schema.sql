-- Creating comprehensive database schema for AgriSecure Hub
-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    farm_name VARCHAR(200),
    farm_location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fields table for farm field management
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    area_hectares DECIMAL(10,2),
    crop_type VARCHAR(100),
    planting_date DATE,
    harvest_date DATE,
    location_coordinates TEXT,
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos table for storing uploaded and drone images
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    source VARCHAR(50) DEFAULT 'upload', -- 'upload', 'drone', 'satellite'
    capture_date TIMESTAMP,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    altitude DECIMAL(8, 2),
    analysis_status VARCHAR(50) DEFAULT 'pending',
    analysis_results JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drone data table for drone operations and telemetry
CREATE TABLE IF NOT EXISTS drone_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
    drone_id VARCHAR(100),
    flight_id VARCHAR(100) UNIQUE,
    mission_type VARCHAR(100), -- 'survey', 'monitoring', 'spraying'
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    flight_duration INTEGER, -- in seconds
    battery_start INTEGER,
    battery_end INTEGER,
    weather_conditions JSONB,
    flight_path JSONB,
    altitude_avg DECIMAL(8, 2),
    speed_avg DECIMAL(8, 2),
    area_covered DECIMAL(10, 2),
    photos_taken INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor data table for IoT sensor readings
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    sensor_id VARCHAR(100),
    sensor_type VARCHAR(100), -- 'soil_moisture', 'temperature', 'humidity', 'ph'
    reading_value DECIMAL(10, 4),
    unit VARCHAR(20),
    location_coordinates TEXT,
    reading_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_score INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis reports table for crop health and field analysis
CREATE TABLE IF NOT EXISTS analysis_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
    report_type VARCHAR(100), -- 'crop_health', 'pest_detection', 'disease_analysis'
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5, 2),
    findings JSONB,
    recommendations TEXT,
    severity_level VARCHAR(50),
    affected_area DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events table for farm security monitoring
CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
    event_type VARCHAR(100), -- 'intrusion', 'theft', 'vandalism', 'animal'
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    location_coordinates TEXT,
    detection_method VARCHAR(100), -- 'camera', 'sensor', 'drone', 'manual'
    photo_evidence INTEGER REFERENCES photos(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'open',
    response_actions TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys table for managing external service integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    service_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_field_id ON photos(field_id);
CREATE INDEX IF NOT EXISTS idx_photos_source ON photos(source);
CREATE INDEX IF NOT EXISTS idx_photos_capture_date ON photos(capture_date);
CREATE INDEX IF NOT EXISTS idx_drone_data_user_id ON drone_data(user_id);
CREATE INDEX IF NOT EXISTS idx_drone_data_flight_id ON drone_data(flight_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_field_id ON sensor_data(field_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_reading_time ON sensor_data(reading_time);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
