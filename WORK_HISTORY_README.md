# Work History System

## Overview

The Work History system tracks technician activities across turbines and services. It automatically logs time entries and provides comprehensive work history views for each technician.

## Features

✅ **Automatic Activity Logging** - When technicians log time on tasks, activities are automatically recorded
✅ **T3 Trainee Support** - Track trainee activities separately
✅ **Multiple Role Support** - Same technician can work as T1, T2, or T3 on different jobs
✅ **Realistic Time Tracking** - Captures actual vs. target times
✅ **Historical Data** - View complete work history per technician
✅ **Multi-Turbine Tracking** - See which turbines a technician has worked on

## How to Use

### 1. Seed Example Data

Go to **Admin** page (`/admin`) and click the **"Seed Work History"** button in the Development Tools section.

This will create realistic example data including:
- **Markus Anderson (MRADR)** - Multiple services across 3 turbines
- **Sarah Miller (SAMIL)** - WTG-248024
- **Lisa Kim (LIKIM)** - WTG-156782
- **Mike Garcia (MIGAR)** - WTG-392045
- **Emma Lopez (EMLOP)** - T3 Trainee on WTG-248024
- **David Park (DAPAR)** - T3 Trainee on WTG-392045
- **Anna Wilson (ANWIL)** - WTG-501234

The seed data includes:
- ⏱️ Times over target (realistic delays)
- 🚀 Times under target (efficient work)
- 🎓 T3 trainees on training steps
- 📝 Notes on special circumstances
- 🔄 Technicians in different roles (T1/T2)

### 2. View Work History

**Option A: From Technician Profile**

1. Navigate to **Technicians** (`/technicians`)
2. Click on a technician (e.g., Markus Anderson)
3. Click the **"Work History"** tab
4. View:
   - Total Hours Worked
   - Turbines Worked On
   - Steps Completed
   - Detailed activity list grouped by service

**Option B: From Technician Selection Modal**

1. In any flowchart, click to select a technician (T1, T2, or T3)
2. Hover over a technician in the list
3. Click the **"History"** button that appears
4. View their complete work history in a popup dialog

### 3. Automatic Logging

When working in a flowchart:

1. Select technicians (T1, T2)
2. Optionally add T3 (trainee) by clicking the **+** button next to technician badges
3. Log time on tasks using the **"Log time"** button
4. **Activities are automatically recorded** with:
   - Technician ID, name, role
   - Turbine model and service type
   - Step and task details
   - Timestamps and duration
   - Notes (if added)

## Data Structure

Each activity includes:

```typescript
{
  id: string;                    // Unique activity ID
  technicianId: string;          // Technician's ID
  technicianInitials: string;    // e.g., "MRADR"
  technicianName: string;        // Full name
  technicianRole: 'T1'|'T2'|'T3'; // Role on this job
  turbineModel: string;          // e.g., "EnVentus Mk 0"
  serviceType: string;           // e.g., "1Y Service"
  stepId: string;                // Step identifier
  stepTitle: string;             // Step name
  taskId?: string;               // Task identifier
  taskDescription?: string;      // Task description
  checkInTime: string;           // ISO timestamp
  checkOutTime?: string;         // ISO timestamp
  durationMinutes?: number;      // Time spent
  notes?: string;                // Optional notes
  timestamp: string;             // When logged
}
```

## Work History Display

The work history view shows:

### Summary Cards
- **Total Hours Worked** - Sum of all activities
- **Turbines Worked On** - List of unique turbines
- **Steps Completed** - Count of unique steps

### Activity Details

**By Service Tab:**
- Grouped by turbine/service combination
- Shows total time per service
- Lists all activities within each service
- Color-coded role badges (T1=blue, T2=purple, T3=amber)
- Timestamps and durations

**All Activities Tab:**
- Chronological list (newest first)
- All activities across all services
- Same detail level as "By Service" view

## Seed Data Examples

The seed includes realistic scenarios:

### Example 1: Markus Anderson
- **3 turbines**: WTG-248024, WTG-156782, WTG-501234
- **Multiple roles**: T1 and T2
- **Time variance**: Some steps under target, some over
- **Training**: Worked with T3 trainee Emma Lopez

### Example 2: Critical Issue Scenario (WTG-392045)
- **T1**: Mike Garcia finds critical bearing damage
- **T2**: Markus Anderson on gearbox
- **T3**: David Park training on bearing inspection
- **65 minutes** on bearing inspection (target: 45m) due to critical issue
- Detailed notes about the problem

### Example 3: Efficient Service (WTG-156782)
- **Under target** times on multiple steps
- **All issues resolved** during service
- Clean, efficient work

## API Functions

### Log Activity
```typescript
import { logTechnicianActivity } from '@/lib/technician-activity';

logTechnicianActivity({
  technicianId: 'tech-001',
  technicianInitials: 'MRADR',
  technicianName: 'Markus Anderson',
  technicianRole: 'T1',
  turbineModel: 'EnVentus Mk 0',
  serviceType: '1Y Service',
  stepId: 'step-1',
  stepTitle: 'Safety Check',
  taskId: 'task-1',
  taskDescription: 'PPE inspection',
  checkInTime: new Date().toISOString(),
  checkOutTime: new Date().toISOString(),
  durationMinutes: 30,
  notes: 'Optional notes'
});
```

### Get Work History
```typescript
import { getTechnicianWorkHistory } from '@/lib/technician-activity';

const history = getTechnicianWorkHistory('tech-001');

console.log(history?.totalMinutesWorked);  // Total minutes
console.log(history?.turbinesWorkedOn);    // Array of turbines
console.log(history?.activities);           // All activities
```

### Other Functions
```typescript
import {
  getAllActivities,
  getStepActivities,
  getServiceActivities,
  clearAllActivities
} from '@/lib/technician-activity';

// Get all activities system-wide
const all = getAllActivities();

// Get activities for a specific step
const stepActs = getStepActivities('step-1');

// Get activities for a turbine/service
const serviceActs = getServiceActivities('EnVentus Mk 0', '1Y Service');

// Clear all (for testing)
clearAllActivities();
```

## Storage

Data is stored in **localStorage** under the key `technician_activities`.

You can:
- Export activities as JSON
- Import from backup
- Clear for testing

## Development Tips

1. **Check existing data** before seeding - The seed function won't duplicate data if it already exists
2. **Use the "Check Data" button** in Admin to see how many activities are stored
3. **Clear localStorage** to start fresh: `localStorage.removeItem('technician_activities')`
4. **View raw data** in console: `JSON.parse(localStorage.getItem('technician_activities'))`

## Future Enhancements

Potential improvements:
- Export to CSV/Excel
- Filter by date range
- Performance metrics dashboard
- Compare technicians
- Training progress tracking
- Integration with payroll systems
