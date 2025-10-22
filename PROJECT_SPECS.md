# HRIS Project Specifications & Development Guide

## Project Overview

Modern HRIS (Human Resources Information System) for managing Vestas wind turbine technicians, service vehicles, and training programs across multiple teams in Sweden.

**Current Version:** 1.0 (Development)
**Last Updated:** 2025-10-22
**Repository:** https://github.com/PenPlanner/HRIS

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Completed Features](#completed-features)
3. [Development Phases](#development-phases)
4. [Technical Specifications](#technical-specifications)
5. [Data Models](#data-models)
6. [Key Design Decisions](#key-design-decisions)
7. [Pending Features](#pending-features)
8. [How to Continue Development](#how-to-continue-development)

---

## System Architecture

### Frontend Stack
- **Next.js 15** - App Router with React Server Components
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Recharts** - Dashboard analytics
- **next-themes** - Dark/light mode
- **cmdk** - Command palette (global search)

### Backend (Ready for Integration)
- **Supabase** - PostgreSQL database, Auth, Storage, Real-time
- **Row Level Security** - Prepared (disabled until auth setup)
- **Storage Buckets** - profile-pictures, vehicle-photos, course-certificates

### Current Data Storage
- **localStorage** - Temporary persistence (will migrate to Supabase)
- All forms use auto-save pattern (500ms debounce)

---

## Completed Features

### ✅ Phase 1: Core Infrastructure (Completed)
- [x] Next.js 15 setup with TypeScript & Tailwind
- [x] Theme system (light/dark mode)
- [x] Base layout with sidebar navigation
- [x] Responsive design (mobile, tablet, desktop)
- [x] Global search (Cmd+K) for quick navigation

### ✅ Phase 2: Team Management (Completed)
- [x] Teams Admin CRUD with color picker (18 preset colors)
- [x] Team color coding throughout UI
- [x] Team organization (South, North, Travel, Special)
- [x] Supervisor & Dispatcher assignment

### ✅ Phase 3: Technician Management (Completed)
- [x] Technician list view with search & filters
- [x] Team-colored avatars with initials fallback
- [x] Technician profile page with tabs:
  - Overview (personal info + competency summary)
  - Competency Matrix
  - Courses
  - Vehicle assignment
- [x] Profile picture support (ready for upload)

### ✅ Phase 4: Competency Matrix (Completed)
**Auto-calculation system:**
- [x] Vestas Level selection (D/C/B/A/Field Trainer)
- [x] Experience multiplier (D=1.0x, C=1.5x, B/A=2.0x, Field Trainer=2.5x)
- [x] Internal experience points (6 months to 5+ years)
- [x] External experience points (0.5-2, 2-3, 3+ years)
- [x] External Education (multiple selections via checkboxes):
  - Electrical Education (40 points)
  - EN50110 Training (35 points)
  - Wind Turbine Education (25 points)
  - Technical Education (20 points)
- [x] Extra courses (checkboxes, max 28 points):
  - Electrical Knowledge Sweden (15 points)
  - Electrical Safety for Qualified (10 points)
  - Add on C-Level HV (8 points)
- [x] Subjective assessment slider (0-5 points)
- [x] Real-time total points calculation
- [x] Automatic Competency Level assignment (1-5):
  - Level 1: 0-14 points
  - Level 2: 15-43 points
  - Level 3: 44-79 points
  - Level 4: 80-99 points
  - Level 5: 100+ points
- [x] Level descriptions dialog with info button
- [x] Hover tooltips on level badges
- [x] Auto-save with visual feedback

### ✅ Phase 5: Vestas Level Color Coding (Completed)
**Color scheme implemented across the entire app:**
- [x] **D-Level**: Gray (#9ca3af) - Entry level, 1.0x multiplier
- [x] **C-Level**: Blue (#3b82f6) - Intermediate, 1.5x multiplier
- [x] **B-Level**: Green (#10b981) - Advanced, 2.0x multiplier
- [x] **A-Level**: Purple (#8b5cf6) - Expert, 2.0x multiplier
- [x] **Field Trainer**: Amber/Gold (#f59e0b) - Highest level, 2.5x multiplier

**Applied in:**
- [x] Competency matrix form (radio button selection with visual highlighting)
- [x] Technician profile header badge
- [x] Technician profile Overview tab
- [x] Technician list cards
- [x] Assessment summary section

### ✅ Phase 6: Service Vehicles (Completed)
- [x] Fleet overview with team grouping
- [x] Vehicle cards (registration, make, model, year)
- [x] Team-colored borders
- [x] Team filter buttons
- [x] Assigned technicians display
- [x] **Fleet Statistics** (NEW):
  - Total vehicles count
  - Total assigned technicians
  - Team count
  - Per-team statistics (vehicles + technicians)
  - Filtered team statistics

### ✅ Phase 7: Training Management (Completed)
- [x] Course catalog (Vestas Internal + External)
- [x] Course CRUD (Admin panel)
- [x] Training needs per technician:
  - Completed courses with dates
  - Planned courses with target dates
  - Training needs with priorities
- [x] Team training overview (for quarterly meetings):
  - Filter by team and target period
  - Toggle between Training Needs and Planned Courses
  - Priority indicators (High/Medium/Low)
  - PDF export functionality

### ✅ Phase 8: Dashboard (Completed)
- [x] Quick stats cards:
  - Total Technicians
  - Service Vehicles
  - Training Needs
  - Average Competency Level
- [x] Team distribution pie chart (with team colors)
- [x] Competency level distribution bar chart
- [x] Upcoming training list
- [x] Alerts & notifications section

### ✅ Phase 9: Admin Panel (Completed)
- [x] Teams management (CRUD)
- [x] Course catalog management (CRUD)
- [x] System settings:
  - Organization settings (name, email, phone, timezone)
  - Display settings (date format, items per page)
  - Notification settings (toggle)
  - Data management (export/import, auto backup)
  - System information
  - Danger zone (clear all data)

---

## Development Phases

### Phase 1: Foundation (✅ Completed 2025-10-15)
- Project setup with Next.js 15, TypeScript, Tailwind
- shadcn/ui component library integration
- Base layout structure
- Dark/light mode implementation

### Phase 2: Core Modules (✅ Completed 2025-10-16)
- Technician module (list view + profile)
- Service vehicles module
- Dashboard with basic stats
- Team administration

### Phase 3: Competency System (✅ Completed 2025-10-18)
- Competency matrix form
- Auto-calculation logic
- Point system implementation
- Level assignment algorithm

### Phase 4: Training System (✅ Completed 2025-10-19)
- Course catalog
- Training needs management
- Team training overview
- PDF export functionality

### Phase 5: Enhancements (✅ Completed 2025-10-22)
- Global search (Cmd+K)
- Education checkboxes (multiple selections)
- Level descriptions with tooltips
- Vestas level color coding
- Field Trainer level addition
- Fleet statistics
- Admin settings page
- Swedish to English translation

### Phase 6: Backend Integration (⏳ Pending)
- Supabase connection
- Authentication system
- Real-time subscriptions
- File uploads (profile pictures, certificates)

---

## Technical Specifications

### Directory Structure
```
HRIS/
├── app/                        # Next.js app directory
│   ├── page.tsx               # Dashboard
│   ├── technicians/           # Technician module
│   │   ├── page.tsx          # List view
│   │   └── [id]/page.tsx     # Profile page
│   ├── vehicles/              # Vehicle module
│   │   └── page.tsx          # Fleet overview
│   ├── training/              # Training module
│   │   └── page.tsx          # Course management
│   └── admin/                 # Admin panel
│       ├── page.tsx          # Admin dashboard
│       ├── teams/page.tsx    # Teams CRUD
│       ├── courses/page.tsx  # Course catalog
│       └── settings/page.tsx # System settings
├── components/
│   ├── layout/               # Layout components
│   │   ├── main-layout.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── global-search.tsx
│   ├── ui/                   # shadcn/ui components
│   ├── admin/
│   │   ├── team-dialog.tsx
│   │   └── course-dialog.tsx
│   ├── technician/
│   │   ├── kompetensmatris-form.tsx
│   │   └── training-needs-manager.tsx
│   └── providers/
│       └── theme-provider.tsx
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── export-training-pdf.ts # PDF export
│   └── supabase/             # Supabase setup
│       ├── client.ts
│       └── database.types.ts
└── supabase/
    └── migrations/           # Database migrations
        ├── 001_initial_schema.sql
        └── 002_seed_data.sql
```

### Key Patterns

#### Auto-save Pattern
All forms use the same auto-save pattern:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setIsSaving(true);
    localStorage.setItem(key, JSON.stringify(data));
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  }, 500); // 500ms debounce

  return () => clearTimeout(timer);
}, [data]);
```

#### Vestas Level Color Helper
```typescript
type VestasLevel = 'D' | 'C' | 'B' | 'A' | 'Field Trainer';

const getVestasLevelColor = (level: VestasLevel) => {
  switch (level) {
    case 'D': return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' };
    case 'C': return { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' };
    case 'B': return { bg: '#10b981', text: '#ffffff', border: '#059669' };
    case 'A': return { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' };
    case 'Field Trainer': return { bg: '#f59e0b', text: '#ffffff', border: '#d97706' };
  }
};
```

#### Competency Level Calculation
```typescript
const getFinalLevel = (points: number): number => {
  if (points >= 100) return 5;
  if (points >= 80) return 4;
  if (points >= 44) return 3;
  if (points >= 15) return 2;
  return 1;
};
```

---

## Data Models

### Core Tables (Ready for Supabase)

#### organizations
- id (uuid, primary key)
- name (text)
- type (enum: 'South', 'North', 'Travel', 'Special')
- created_at (timestamp)

#### teams
- id (uuid, primary key)
- name (text)
- organization_id (uuid, foreign key)
- color (text, hex color)
- supervisor_initials (text)
- dispatcher_initials (text)
- created_at (timestamp)

#### technicians
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- initials (text, 5 chars, unique)
- email (text)
- phone (text)
- team_id (uuid, foreign key)
- vestas_level (enum: 'D', 'C', 'B', 'A', 'Field Trainer')
- competency_level (integer, 1-5)
- profile_picture_url (text)
- created_at (timestamp)

#### competency_assessments
- id (uuid, primary key)
- technician_id (uuid, foreign key)
- vestas_level (enum)
- internal_experience (text)
- external_experience (text)
- education (text[])
- extra_courses (text[])
- subjective_score (integer, 0-5)
- total_points (integer)
- final_level (integer, 1-5)
- submitted_to_ecc (boolean)
- last_updated (timestamp)

#### service_vehicles
- id (uuid, primary key)
- registration (text, unique)
- team_id (uuid, foreign key)
- make (text)
- model (text)
- year (integer)
- created_at (timestamp)

#### vehicle_assignments
- id (uuid, primary key)
- vehicle_id (uuid, foreign key)
- technician_id (uuid, foreign key)
- assigned_at (timestamp)

#### courses
- id (uuid, primary key)
- name (text)
- category (enum: 'Vestas Internal', 'External')
- description (text)
- duration_hours (integer)
- created_at (timestamp)

#### technician_courses (completed)
- id (uuid, primary key)
- technician_id (uuid, foreign key)
- course_id (uuid, foreign key)
- completion_date (date)
- certificate_url (text)
- created_at (timestamp)

#### course_planning
- id (uuid, primary key)
- technician_id (uuid, foreign key)
- course_id (uuid, foreign key)
- target_date (date)
- status (enum: 'Planned', 'In Progress', 'Completed')
- created_at (timestamp)

#### training_needs
- id (uuid, primary key)
- technician_id (uuid, foreign key)
- course_name (text)
- priority (enum: 'High', 'Medium', 'Low')
- reason (text)
- target_quarter (text)
- created_at (timestamp)

---

## Key Design Decisions

### 1. localStorage First, Supabase Later
**Decision:** Build with localStorage first, design for Supabase migration later.

**Rationale:**
- Faster initial development
- User can test without authentication
- All data structures match Supabase schema
- Easy migration path when ready

### 2. Auto-save Everywhere
**Decision:** No save buttons, everything auto-saves with 500ms debounce.

**Rationale:**
- Better UX (never lose data)
- Visual feedback with "Saving..." / "Saved" indicators
- Reduced cognitive load for users

### 3. Team Color System
**Decision:** Every team has a configurable color that propagates throughout UI.

**Rationale:**
- Quick visual identification
- Improved navigation
- Better team distinction
- Admin-configurable (18 preset colors)

### 4. Vestas Level Color Coding
**Decision:** Each Vestas level has a distinct color (D=Gray, C=Blue, B=Green, A=Purple, Field Trainer=Gold).

**Rationale:**
- Visual hierarchy (gray→blue→green→purple→gold progression)
- Instant recognition of technician skill level
- Consistent across all pages
- Color psychology (gold for highest level)

### 5. Multiple Education Selection
**Decision:** Changed from radio buttons to checkboxes for External Education.

**Rationale:**
- Technicians often have multiple qualifications
- More accurate representation of skills
- Points are summed correctly
- User feedback during development

### 6. Field Trainer as Highest Level
**Decision:** Added Field Trainer level with 2.5x multiplier (higher than A-Level's 2.0x).

**Rationale:**
- Recognizes advanced training capability
- Provides career progression beyond A-Level
- Distinct visual identity (gold color)
- User requirement

### 7. Initials Format: 5 Characters
**Decision:** Initials are exactly 5 characters (positions 1,3 from first name + first 3 from last name).

**Example:**
- Carl Emil Gryme → CLEGR (C_L from "Carl Emil" + GRY from "Gryme")
- Markus Anderson → MRADR (M_R from "Markus" + AND from "Anderson")

**Rationale:**
- Unique identifier across organization
- Easy to memorize
- Fits on vehicle assignments and badges

---

## Pending Features

### 🔄 Phase 6: Backend Integration (Next Priority)

#### Supabase Setup
- [ ] Connect to Supabase database
- [ ] Run migration scripts
- [ ] Seed initial data (organizations, teams)
- [ ] Update all data fetching from localStorage to Supabase

#### Authentication
- [ ] Implement Supabase Auth
- [ ] Role-based access control (Admin, Manager, Technician)
- [ ] Row Level Security policies
- [ ] Login/logout flow

#### File Uploads
- [ ] Profile picture upload (technicians)
- [ ] Vehicle photo upload
- [ ] Course certificate upload
- [ ] Supabase Storage integration

#### Real-time Features
- [ ] Real-time dashboard updates
- [ ] Live notifications for training deadlines
- [ ] Real-time competency level updates

### 🚀 Phase 7: Advanced Features (Future)

#### Analytics & Reporting
- [ ] Advanced dashboard analytics
- [ ] Custom report builder
- [ ] Export to Excel
- [ ] Training budget tracking

#### Notifications
- [ ] Email notifications for expiring certifications
- [ ] Reminders for upcoming training
- [ ] Manager notifications for team changes

#### Mobile App
- [ ] React Native mobile app
- [ ] QR code scanning for vehicle check-in
- [ ] Offline mode support

#### Integration
- [ ] Vestas ECC system integration
- [ ] Calendar integration (Google/Outlook)
- [ ] HR system integration

---

## How to Continue Development

### Prerequisites
```bash
Node.js 18+
npm or yarn
Git
```

### Getting Started
```bash
# Clone the repository
git clone https://github.com/PenPlanner/HRIS.git
cd HRIS

# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### Development Workflow

#### 1. Create a New Feature Branch
```bash
git checkout -b feature/your-feature-name
```

#### 2. Make Changes
- Follow existing patterns (auto-save, color coding, etc.)
- Keep components small and focused
- Use TypeScript types strictly
- Test on light and dark mode

#### 3. Test Locally
```bash
npm run dev
# Test all affected pages
# Check mobile responsiveness
```

#### 4. Commit and Push
```bash
git add .
git commit -m "feat: description of feature"
git push origin feature/your-feature-name
```

#### 5. Create Pull Request on GitHub

### Next Steps to Implement (Recommended Order)

#### Step 1: Supabase Setup (Highest Priority)
1. Create Supabase project at https://supabase.com
2. Copy `.env.local.example` to `.env.local`
3. Add Supabase URL and anon key
4. Run migration: `supabase/migrations/001_initial_schema.sql`
5. Seed data: `supabase/migrations/002_seed_data.sql`
6. Update `lib/supabase/client.ts` with your project URL

#### Step 2: Replace localStorage with Supabase
Start with one module at a time:
1. Teams (simplest)
2. Courses
3. Vehicles
4. Technicians
5. Competency assessments
6. Training needs

Pattern for each module:
```typescript
// Before (localStorage)
const teams = JSON.parse(localStorage.getItem('teams') || '[]');

// After (Supabase)
const { data: teams, error } = await supabase
  .from('teams')
  .select('*');
```

#### Step 3: Add Authentication
1. Set up Supabase Auth
2. Create login page
3. Add protected routes
4. Implement role-based access

#### Step 4: File Uploads
1. Set up Supabase Storage buckets
2. Add upload components
3. Implement image optimization
4. Add preview functionality

### Code Style Guidelines

#### TypeScript
- Always use strict types
- No `any` types
- Export types for reuse

#### Components
- Use functional components with hooks
- Keep components under 300 lines
- Extract complex logic to custom hooks

#### Styling
- Use Tailwind utility classes
- Follow shadcn/ui patterns
- Maintain responsive design (mobile-first)

#### Naming Conventions
- Components: PascalCase (`TechnicianCard.tsx`)
- Functions: camelCase (`getTotalPoints()`)
- Constants: UPPER_SNAKE_CASE (`COMPETENCY_LEVELS`)
- Files: kebab-case (`training-needs-manager.tsx`)

### Useful Commands
```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript check

# Git
git status           # Check status
git log --oneline    # View commit history
git diff             # View changes
```

---

## Reference Files

### Important Files to Review
1. **README.md** - Quick start guide and feature overview
2. **SUPABASE_SETUP.md** - Detailed Supabase integration guide
3. **components/technician/kompetensmatris-form.tsx** - Complex form example
4. **lib/export-training-pdf.ts** - PDF export implementation
5. **app/vehicles/page.tsx** - Statistics implementation example

### Excel Reference Files
Located in `files/elmatris/`:
- **elmatris.xlsx** - Original competency matrix specifications
- **training.xlsx** - Training needs structure
- **fleet.xlsx** - Vehicle fleet data structure

---

## Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs

### Project Repository
- GitHub: https://github.com/PenPlanner/HRIS
- Issues: https://github.com/PenPlanner/HRIS/issues

### Development Team
- Primary Developer: Built with Claude Code
- Project Owner: PenPlanner

---

## Version History

### v1.0 - Current (2025-10-22)
- ✅ Complete HRIS system with all core modules
- ✅ Vestas level color coding
- ✅ Field Trainer level
- ✅ Fleet statistics
- ✅ Admin settings
- ✅ Ready for Supabase integration

### Upcoming: v1.1 (Planned)
- 🔄 Supabase integration
- 🔄 Authentication system
- 🔄 File uploads
- 🔄 Real-time updates

---

**Last Updated:** 2025-10-22
**Documentation Version:** 1.0
**Maintained By:** Development Team
