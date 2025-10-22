# HRIS - Human Resources Information System

Modern HRIS system for managing technicians, service vehicles, and training at Vestas.

## ✨ Features

### 🎨 Core Features
- **Light/Dark Mode** - Full support for light and dark themes
- **Team Color Coding** - Each team has its own color displayed throughout the UI
- **Auto-save** - All forms save automatically (500ms debounce)
- **Real-time Updates** - Live updates with Supabase (when connected)
- **Responsive Design** - Works on desktop, tablet, and mobile

### 👥 Technician Management
- **List with search and filter** - Search by initials, name, team
- **Team-colored avatars** - Fallback with initials if no image
- **Profile page with tabs:**
  - Overview - Personal data and quick overview
  - **Competency Matrix** - Interactive assessment with auto-calculation
  - Courses - Courses and training needs
  - Vehicle - Assigned service vehicle

### 📊 Competency Matrix (Electrical Competency Assessment)
- **Auto-calculation:**
  - Vestas Level (D/C/B/A) with multiplier (1.0x, 1.5x, 2.0x)
  - Internal & External Experience
  - Education points
  - Extra courses (checkboxes)
  - Subjective assessment (slider 0-5)
- **Real-time point calculation** - Total points and Competency Level (1-5)
- **Auto-save** - Saves automatically with "Saving..." / "Saved" indicator
- **Level Calculation:**
  - Level 1: 0-14 points
  - Level 2: 15-43 points
  - Level 3: 44-79 points
  - Level 4: 80-100 points
  - Level 5: 100+ points

### 🚗 Service Vehicles
- **Fleet overview** - Grouped by team with team colors
- **Team filter** - Quick filtering by team
- **Assigned technicians** - See which technicians belong to each vehicle
- **Vehicle cards** - Registration, make, model, year

### 📚 Admin Panel
- **Teams Management:**
  - CRUD operations
  - Color picker med 18 preset färger
  - Supervisor & Dispatcher initials
  - Team organization (South, North, Travel, Special)
- **Course catalog** (coming soon)
- **System settings** (coming soon)

### 📈 Dashboard
- **Quick Stats Cards:**
  - Total Technicians
  - Service Vehicles
  - Training Needs
  - Avg Competency Level
- **Team Distribution** - Pie chart med team colors
- **Competency Level Distribution** - Bar chart
- **Upcoming Training** - Lista med planerade kurser
- **Alerts & Notifications** - System varningar

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router med React Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Recharts** - Dashboard charts
- **next-themes** - Dark mode support

### Backend (Ready for Integration)
- **Supabase** - PostgreSQL database, Auth, Storage, Real-time
- **Row Level Security** - Prepared (disabled until auth setup)
- **Storage Buckets** - profile-pictures, vehicle-photos, course-certificates

### Form & State Management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **localStorage** - Temporary data persistence (will switch to Supabase)
- **TanStack Table** - Advanced tables

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (you have 24.1.0 ✓)
- npm

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Optional: Setup Supabase (for production)

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

## 📁 Project Structure

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
│       └── teams/page.tsx    # Teams CRUD
├── components/
│   ├── layout/               # Layout components
│   │   ├── main-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── admin/
│   │   └── team-dialog.tsx   # Team CRUD dialog
│   ├── technician/
│   │   └── kompetensmatris-form.tsx  # Assessment form
│   └── providers/
│       └── theme-provider.tsx
├── lib/
│   ├── utils.ts              # Utility functions
│   └── supabase/            # Supabase setup
│       ├── client.ts
│       └── database.types.ts
└── supabase/
    └── migrations/           # Database migrations
        ├── 001_initial_schema.sql
        └── 002_seed_data.sql
```

## 🎯 Current Status

### ✅ Completed Features
- [x] Next.js 15 setup with TypeScript & Tailwind
- [x] Theme system (light/dark mode)
- [x] Base layout with sidebar navigation
- [x] Teams Admin CRUD with color picker
- [x] Technicians list view with search & team colors
- [x] Technician profile page with tabs
- [x] **Competency Matrix form with auto-calculation**
- [x] Service Vehicles fleet overview
- [x] Dashboard with widgets & charts
- [x] Database schema (ready for Supabase)
- [x] Mock data with localStorage
- [x] **Course Catalog CRUD** - Admin panel for managing internal & external courses
- [x] **Training Needs Management** - Completed courses, planned courses, and training needs per technician
- [x] **Team Training Overview** - Aggregated view for quarterly meetings with filters
- [x] **Global Search (Cmd+K)** - Quick search for technicians by initials, name, or team
- [x] **PDF Export** - Export training overview to PDF for quarterly meetings

### 🚧 Pending Features
- [ ] Supabase integration (database connection)
- [ ] Profile picture upload (Supabase Storage)
- [ ] Authentication & RBAC
- [ ] Real-time subscriptions

## 📝 Data Models

### Database Tables (Ready to Deploy)
- **organizations** - South, North, Travel, Special
- **teams** - 20 teams with colors, supervisor, dispatcher
- **technicians** - Personal data, initials, team, profile picture
- **competency_assessments** - Full matrix with calculations
- **service_vehicles** - Registration, specs, team
- **vehicle_assignments** - Technician-to-vehicle mapping
- **courses** - Course catalog (Vestas Internal + External)
- **technician_courses** - Completed courses
- **course_planning** - Planned courses
- **training_needs** - Future training requirements

## 🔄 Auto-save Pattern

All forms use the same auto-save pattern:
- 500ms debounce after last change
- Visual feedback: "Saving..." → "Saved [timestamp]"
- No save button needed
- Data saved to localStorage (temporary) / Supabase (production)

## 🎨 Team Color System

Each team has its own color displayed in:
- Sidebar badges
- Avatar fallbacks
- Card borders
- Buttons (when selected)
- Charts & graphs

Colors are admin-configurable with color picker.

## 🧪 Testing

Run the development server and test:

1. **Dashboard** - http://localhost:3000
2. **Teams Admin** - http://localhost:3000/admin/teams
3. **Course Catalog** - http://localhost:3000/admin/courses
4. **Technicians** - http://localhost:3000/technicians
5. **Technician Profile** - http://localhost:3000/technicians/1
6. **Kompetensmatris** - Profile → Kompetensmatris tab
7. **Training Needs** - Profile → Courses tab
8. **Team Training Overview** - http://localhost:3000/training
9. **Vehicles** - http://localhost:3000/vehicles
10. **Global Search** - Press Cmd+K (or Ctrl+K) anywhere in the app

## 🎓 Competency Matrix Calculation Example

For Carl Emil Gryme (CLEGR):
- **Vestas Level:** C (1.5x multiplier)
- **Internal Experience:** 6 months = 8 points
- **External Experience:** 2-3 years = 10 points
- **Education:** Electrical Education = 40 points
- **Extra Courses:**
  - Electrical Knowledge Sweden = 15 points
  - Electrical Safety for Qualified = 10 points
- **Subjective Score:** 3 points

**Calculation:**
- Experience: (8 + 10) × 1.5 = 27 points
- Education: 40 points
- Extra Courses: 25 points
- Subjective: 3 points
- **Total: 95 points → Level 4**

## 📄 License

Private project for Vestas HRIS.

## 👨‍💻 Development

Built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.

For questions or issues, contact the development team.

---

**Status:** Development build - ready for Supabase integration
**Last Updated:** 2025-10-20
