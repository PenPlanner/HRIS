# HRIS - Human Resources Information System

> **🤖 För Claude AI:** Starta med att läsa [`README-CLAUDE-START.md`](README-CLAUDE-START.md) för projektöversikt, agent-system och aktuell status!

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

### 📊 Flowchart System (Flowy)
- **Interactive Flowcharts** - Smart service program flowcharts for wind turbine maintenance
- **React Flow Integration** - Drag-and-drop flowchart editor with custom nodes
- **Real-time Progress Tracking** - Visual step completion with color-coded service types
- **Technician Assignment** - Dynamic T1/T2/T3 assignments per step or globally
- **Search Functionality** - Quick search for steps, tasks, and documents (Ctrl+K)
- **Flow-ID System** - Auto-generated unique identifiers (YYRRNN format: Year-Region-Sequence)
- **Revision History** - Track changes and updates to flowcharts
- **Offline Support** - PWA with service worker for offline access

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.0.1** - App Router with React Server Components and Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **React Flow (@xyflow/react)** - Flowchart visualization and editing
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
**Last Updated:** 2025-10-30

---

## 📋 Recent Session Work (2025-10-30)

### Flowchart Header Redesign
Complete reorganization of the flowchart page header layout for better UX and optimized space usage.

#### Changes Made:

**1. Two-Row Header Layout**
- **Row 1**: Year input + Flow-ID display (read-only)
- **Row 2**: Back button + WTG input + Model name + Service Program Rev.4 + T1/T2/T3 + Search field

**2. Flow-ID Format Change** (BREAKING)
- **Old format**: `YYYYRR-NNN` (e.g., "202501-001") - 9 characters with hyphen
- **New format**: `YYRRNN` (e.g., "250302") - 6 digits compact
  - YY = Year (last 2 digits, e.g., 25 for 2025)
  - RR = Region code (2 digits, default: 03)
  - NN = Sequential number (2 digits, auto-incremented)
- **Example**: `250302` = Year 2025, Region 03, ID 02

**3. Input Box Optimization**
- **WTG**: `w-[70px]` - optimized for 6 digits (e.g., "248024")
- **Year**: `w-[52px]` - optimized for 4 digits (e.g., "2024")
- **Flow-ID**: `w-[70px]` - optimized for 6 digits (e.g., "250302")
- All inputs now use monospace font (`font-mono`) for better number readability

**4. Flow-ID Styling**
- Removed blue text color
- Now matches WTG box styling exactly
- Read-only display with gray background
- Centered text alignment

**5. Logo Restoration**
Logo and commit hash were repositioned to be visible next to Step 1:
- **Logo position**: `x: -360, y: 60` (previously x: -450, too far left)
- **Logo size**: `300x200` (reduced from 400x240)
- **Commit hash position**: `x: -120, y: 180` (previously x: -150)
- Both are draggable in edit mode

**6. Login Page Cleanup**
Removed 2 bullet points from feature list:
- ❌ "Smart flowcharts with full revision history"
- ❌ "Visual workflow to boost efficiency"

Kept focus on key features:
- ✓ "Target vs actual time comparison live"
- ✓ "Visual timeline shows if you're ahead or behind"
- ✓ "Dynamic technician assignments and scheduling"

#### Files Modified:

1. **[app/flowcharts/[model]/[service]/page.tsx](app/flowcharts/[model]/[service]/page.tsx)** (lines 1863-2097)
   - Complete header redesign with two-row layout
   - Optimized input widths
   - WTG alignment with "EnVentus" text

2. **[lib/flowchart-data.ts](lib/flowchart-data.ts)** (lines 853-887, line 179)
   - `generateUniqueFlowchartId()` rewritten for YYRRNN format
   - Changed default region from "01" to "03"
   - Updated ENVENTUS_MK0_1Y example ID

3. **[components/flowchart/flowchart-editor.tsx](components/flowchart/flowchart-editor.tsx)** (lines 1166-1190, 1367-1388)
   - Logo and commit hash node position adjustments
   - Reduced logo size for better proportions

4. **[app/login/page.tsx](app/login/page.tsx)** (lines 212-217)
   - Removed 2 bullet points from feature list

5. **[components/flowchart/flowchart-manager-dialog.tsx](components/flowchart/flowchart-manager-dialog.tsx)** (line 51)
   - Already correctly uses `generateUniqueFlowchartId()` - no changes needed

#### Known Issues:

**🔴 CRITICAL: Jest Worker Crashes**
- **Status**: UNRESOLVED
- **Symptoms**:
  - Turbopack's Jest workers crash with "2 child process exceptions, exceeding retry limit"
  - Flowchart page returns 404 errors: `/flowcharts/enventus-mk0/enventus-mk0-1y`
  - Console shows "missing required error components, refreshing..."
  - MaxListenersExceededWarning for EventEmitter memory leak
- **Temporary Fix**:
  1. Kill all Node processes: `taskkill /F /IM node.exe` (Windows)
  2. Delete .next folder: `rmdir /s /q ".next"` or `rm -rf .next` (bash)
  3. Restart dev server fresh: `npm run dev -- --hostname=0.0.0.0`
- **Root Cause**: Likely Turbopack/Next.js 16.0.1 bug with dynamic routes

**⚠️ Multiple Dev Server Instances**
- **Problem**: Multiple bash sessions trying to run `npm run dev` simultaneously
- **Error**: "Unable to acquire lock at .next/dev/lock"
- **Fix**:
  ```bash
  # Kill processes and remove lock
  taskkill /F /IM node.exe
  rm -f "d:/Dev folder/HRIS/.next/dev/lock"
  ```

#### Migration Notes:

**For existing flowcharts with old Flow-ID format:**
- Old IDs like "202501-001" will still work
- New flowcharts will use YYRRNN format
- Consider data migration script if consistency needed:
  ```typescript
  // Example migration
  "202501-001" → "250101" (Year 25, Region 01, Sequence 01)
  "202503-042" → "250342" (Year 25, Region 03, Sequence 42)
  ```

#### Testing Checklist:

- [x] Header layout displays correctly on flowchart page
- [x] Year input accepts 4 digits max
- [x] Flow-ID displays in YYRRNN format (read-only)
- [x] WTG input accepts 6 digits max
- [x] T1/T2/T3 buttons work for technician assignment
- [x] Search field works after T1/T2/T3
- [x] Logo visible next to Step 1
- [x] Commit hash visible below logo
- [ ] New flowchart creation generates correct Flow-ID (blocked by Jest worker crash)
- [ ] Flowchart page loads without 404 errors (blocked by Jest worker crash)

#### How to Resume After Crash:

1. **Clean up processes**:
   ```bash
   # Windows
   taskkill /F /IM node.exe
   rmdir /s /q ".next"

   # Linux/Mac
   pkill node
   rm -rf .next
   ```

2. **Start fresh dev server**:
   ```bash
   npm run dev -- --hostname=0.0.0.0
   ```

3. **Test flowchart page**:
   - Navigate to http://localhost:3000/flowcharts
   - Create new flowchart or open existing
   - Verify header layout and Flow-ID format

4. **If Jest worker crashes persist**:
   - Check Next.js GitHub issues for Turbopack bugs
   - Consider downgrading to Next.js 15.x
   - Try disabling Turbopack: `npm run dev -- --no-turbopack`
