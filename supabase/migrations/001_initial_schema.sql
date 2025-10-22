-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations/Regions table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT '#3b82f6', -- Hex color
  supervisor_initials TEXT,
  dispatcher_initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technicians table
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  initials TEXT NOT NULL UNIQUE, -- 5-letter initials
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  profile_picture_url TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competency assessments table
CREATE TABLE competency_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  assessment_date DATE DEFAULT CURRENT_DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  -- Vestas level
  vestas_level TEXT CHECK (vestas_level IN ('D', 'C', 'B', 'A')),

  -- Experience (stored as dropdown values, points calculated)
  internal_experience TEXT,
  internal_experience_points INT DEFAULT 0,
  external_experience TEXT,
  external_experience_points INT DEFAULT 0,

  -- Education
  education_type TEXT,
  education_points INT DEFAULT 0,

  -- Extra courses (stored as JSONB array of course objects with points)
  extra_courses JSONB DEFAULT '[]',
  extra_courses_points INT DEFAULT 0,

  -- Subjective assessment (0-5)
  subjective_score INT CHECK (subjective_score >= 0 AND subjective_score <= 5) DEFAULT 0,

  -- Calculated totals
  experience_multiplier DECIMAL(3,1) DEFAULT 1.0, -- 1.0, 1.5, or 2.0
  total_points INT DEFAULT 0,
  multiplied_experience_points INT DEFAULT 0,
  final_level INT CHECK (final_level >= 1 AND final_level <= 5),

  -- Workflow
  is_signed BOOLEAN DEFAULT FALSE,
  signed_date DATE,
  submitted_to_ecc BOOLEAN DEFAULT FALSE,
  submitted_date DATE,
  submitted_by UUID REFERENCES technicians(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service vehicles table
CREATE TABLE service_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration TEXT NOT NULL UNIQUE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  specs JSONB DEFAULT '{}', -- Make, model, year, VIN, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle assignments (many-to-many)
CREATE TABLE vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES service_vehicles(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, technician_id)
);

-- Vehicle photos
CREATE TABLE vehicle_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES service_vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses catalog
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  category TEXT NOT NULL, -- Safety, Electrical, Turbine-Specific, Lifts, Specialized, External
  type TEXT NOT NULL CHECK (type IN ('internal', 'external')),
  validity_period_months INT, -- NULL if no expiry
  prerequisites TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technician completed courses
CREATE TABLE technician_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  expiry_date DATE, -- Calculated based on validity_period
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(technician_id, course_id, completed_date)
);

-- Course planning (planned courses)
CREATE TABLE course_planning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  target_period TEXT, -- e.g., "Q1 2026"
  added_by UUID REFERENCES technicians(id),
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training needs
CREATE TABLE training_needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  reason TEXT,
  priority BOOLEAN DEFAULT FALSE, -- TRUE for starred/priority
  target_period TEXT, -- e.g., "Q1 2026"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_technicians_team ON technicians(team_id);
CREATE INDEX idx_technicians_initials ON technicians(initials);
CREATE INDEX idx_competency_technician ON competency_assessments(technician_id);
CREATE INDEX idx_vehicles_team ON service_vehicles(team_id);
CREATE INDEX idx_vehicle_assignments_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX idx_vehicle_assignments_tech ON vehicle_assignments(technician_id);
CREATE INDEX idx_tech_courses_tech ON technician_courses(technician_id);
CREATE INDEX idx_tech_courses_course ON technician_courses(course_id);
CREATE INDEX idx_training_needs_tech ON training_needs(technician_id);
CREATE INDEX idx_training_needs_course ON training_needs(course_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON service_vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_needs_updated_at BEFORE UPDATE ON training_needs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
