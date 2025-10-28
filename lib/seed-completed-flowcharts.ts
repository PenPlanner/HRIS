// Seed data for example completed flowcharts with realistic notes and bug reports
import { CompletedFlowchart, BugReport } from './completed-flowcharts';
import { FlowchartData, FlowchartStep, FlowchartTask } from './flowchart-data';

const STORAGE_KEY = 'completed-flowcharts';

// Example 1: EnVentus Mk 0 - 1Y Service (Completed with minor issues)
const example1: CompletedFlowchart = {
  id: 'enventus-mk0-1y-1735300000000',
  flowchartId: 'enventus-mk0-1y',
  wtgNumber: '248024',
  flowchartData: {
    id: 'enventus-mk0-1y',
    model: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    totalMinutes: 120,
    description: '1-year service inspection',
    steps: []
  },
  steps: [
    {
      id: 'step-1',
      title: 'Safety Check\n& Preparation',
      duration: '30m',
      durationMinutes: 30,
      color: '#3b82f6',
      colorCode: '1',
      technician: 'both',
      position: { x: 0, y: 5 },
      completedAt: '2025-01-15T09:35:00Z',
      completedBy: 'tech-001',
      completedByInitials: 'JODOE',
      startedAt: '2025-01-15T09:00:00Z',
      tasks: [
        {
          id: 'task-1-1',
          description: 'PPE inspection',
          completed: true,
          completedAt: '2025-01-15T09:10:00Z',
          actualTimeMinutes: 10,
          notes: [
            {
              id: 'note-1',
              timestamp: '2025-01-15T09:10:00Z',
              note: 'All PPE in good condition. Harnesses inspected and certified.'
            }
          ]
        },
        {
          id: 'task-1-2',
          description: 'Tower access verification',
          completed: true,
          completedAt: '2025-01-15T09:25:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-2',
              timestamp: '2025-01-15T09:25:00Z',
              note: 'Access ladder slightly rusty at bottom section. Scheduled for maintenance.'
            }
          ]
        },
        {
          id: 'task-1-3',
          description: 'Lock out / Tag out procedures',
          completed: true,
          completedAt: '2025-01-15T09:35:00Z',
          actualTimeMinutes: 5
        }
      ]
    },
    {
      id: 'step-2',
      title: 'Main Bearing\nInspection',
      duration: '45m',
      durationMinutes: 45,
      color: '#10b981',
      colorCode: '2',
      technician: 'T1',
      position: { x: 14, y: 5 },
      completedAt: '2025-01-15T10:30:00Z',
      completedBy: 'tech-001',
      completedByInitials: 'JODOE',
      startedAt: '2025-01-15T09:35:00Z',
      tasks: [
        {
          id: 'task-2-1',
          description: 'SII-1234-A Visual inspection',
          completed: true,
          completedAt: '2025-01-15T10:00:00Z',
          actualTimeMinutes: 25,
          notes: [
            {
              id: 'note-3',
              timestamp: '2025-01-15T10:00:00Z',
              note: 'Minor grease leak detected on bearing seal. Cleaned and monitored.'
            }
          ]
        },
        {
          id: 'task-2-2',
          description: 'Temperature check',
          completed: true,
          completedAt: '2025-01-15T10:15:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-4',
              timestamp: '2025-01-15T10:15:00Z',
              note: 'Temperature reading: 48°C (within normal range 35-55°C)'
            }
          ]
        },
        {
          id: 'task-2-3',
          description: 'Lubrication system check',
          completed: true,
          completedAt: '2025-01-15T10:30:00Z',
          actualTimeMinutes: 5
        }
      ]
    },
    {
      id: 'step-3',
      title: 'Gearbox\nInspection',
      duration: '45m',
      durationMinutes: 45,
      color: '#f59e0b',
      colorCode: '3',
      technician: 'T2',
      position: { x: 28, y: 5 },
      completedAt: '2025-01-15T11:20:00Z',
      completedBy: 'tech-002',
      completedByInitials: 'SAMIL',
      startedAt: '2025-01-15T10:30:00Z',
      tasks: [
        {
          id: 'task-3-1',
          description: 'SII-2345-B Oil level check',
          completed: true,
          completedAt: '2025-01-15T10:45:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-5',
              timestamp: '2025-01-15T10:45:00Z',
              note: 'Oil level low by 2 liters. Topped up with approved oil (batch #45821).'
            }
          ]
        },
        {
          id: 'task-3-2',
          description: 'Vibration analysis',
          completed: true,
          completedAt: '2025-01-15T11:05:00Z',
          actualTimeMinutes: 20,
          notes: [
            {
              id: 'note-6',
              timestamp: '2025-01-15T11:05:00Z',
              note: 'Vibration levels normal. Peak at 3.2mm/s @ 1500 RPM (acceptable range 0-5mm/s)'
            }
          ]
        },
        {
          id: 'task-3-3',
          description: 'Filter replacement',
          completed: true,
          completedAt: '2025-01-15T11:20:00Z',
          actualTimeMinutes: 10,
          notes: [
            {
              id: 'note-7',
              timestamp: '2025-01-15T11:20:00Z',
              note: 'Filter element replaced. Old filter showed minor metal particles - sent to lab for analysis.'
            }
          ]
        }
      ]
    }
  ],
  startedAt: '2025-01-15T09:00:00Z',
  completedAt: '2025-01-15T11:20:00Z',
  totalDurationMinutes: 140,
  technicians: {
    t1: { id: 'tech-001', name: 'John Doe', initials: 'JODOE' },
    t2: { id: 'tech-002', name: 'Sarah Miller', initials: 'SAMIL' }
  },
  bugs: [
    {
      id: 'bug-1',
      taskId: 'task-2-1',
      stepId: 'step-2',
      title: 'Bearing grease leak',
      description: 'Minor grease leak detected from main bearing seal. Requires seal replacement during next major service.',
      severity: 'medium',
      status: 'investigating',
      reportedAt: '2025-01-15T10:00:00Z',
      reportedBy: 'John Doe',
      notes: 'Leak is minor and does not require immediate shutdown. Monitor during next inspection.'
    },
    {
      id: 'bug-2',
      taskId: 'task-3-3',
      stepId: 'step-3',
      title: 'Metal particles in gearbox filter',
      description: 'Gearbox oil filter contained small metal particles. Sample sent for metallurgical analysis.',
      severity: 'high',
      status: 'investigating',
      reportedAt: '2025-01-15T11:20:00Z',
      reportedBy: 'Sarah Miller',
      notes: 'Lab analysis pending. May require gearbox inspection if particles exceed acceptable levels.'
    }
  ],
  summary: {
    totalSteps: 3,
    completedSteps: 3,
    totalTasks: 9,
    completedTasks: 9,
    totalNotes: 7,
    totalBugs: 2,
    openBugs: 0,
    crushedBugs: 0,
    targetTimeMinutes: 120,
    actualTimeMinutes: 140,
    timeVariance: 20
  }
};

// Example 2: EnVentus Mk 0 - 2Y Service (Completed successfully, all issues resolved)
const example2: CompletedFlowchart = {
  id: 'enventus-mk0-2y-1735200000000',
  flowchartId: 'enventus-mk0-2y',
  wtgNumber: '156782',
  flowchartData: {
    id: 'enventus-mk0-2y',
    model: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    totalMinutes: 180,
    description: '2-year extended service',
    steps: []
  },
  steps: [
    {
      id: 'step-2y-1',
      title: 'Extended Safety\n& Systems Check',
      duration: '60m',
      durationMinutes: 60,
      color: '#8b5cf6',
      colorCode: '1',
      technician: 'both',
      position: { x: 0, y: 5 },
      completedAt: '2025-01-10T09:50:00Z',
      completedBy: 'tech-003',
      completedByInitials: 'ROJOH',
      startedAt: '2025-01-10T09:00:00Z',
      tasks: [
        {
          id: 'task-2y-1-1',
          description: 'Emergency stop system test',
          completed: true,
          completedAt: '2025-01-10T09:15:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-8',
              timestamp: '2025-01-10T09:20:00Z',
              note: 'All emergency stop circuits tested and functioning correctly. Response time: 1.2 seconds.'
            }
          ]
        },
        {
          id: 'task-2y-1-2',
          description: 'SII-3456-C Hydraulic system pressure test',
          completed: true,
          completedAt: '2025-01-10T09:35:00Z',
          actualTimeMinutes: 20,
          notes: [
            {
              id: 'note-9',
              timestamp: '2025-01-10T09:45:00Z',
              note: 'Pressure test passed. System holding 180 bar for 15 minutes without drop. Replaced one worn O-ring.'
            }
          ]
        },
        {
          id: 'task-2y-1-3',
          description: 'Fire detection system verification',
          completed: true,
          completedAt: '2025-01-10T09:50:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-10',
              timestamp: '2025-01-10T10:00:00Z',
              note: 'Smoke detectors tested with aerosol. All 4 detectors responding within spec (3-5 seconds).'
            }
          ]
        }
      ]
    },
    {
      id: 'step-2y-2',
      title: 'Blade System\nComprehensive Check',
      duration: '90m',
      durationMinutes: 90,
      color: '#ec4899',
      colorCode: '2',
      technician: 'T1',
      position: { x: 14, y: 5 },
      completedAt: '2025-01-10T11:05:00Z',
      completedBy: 'tech-003',
      completedByInitials: 'ROJOH',
      startedAt: '2025-01-10T09:50:00Z',
      tasks: [
        {
          id: 'task-2y-2-1',
          description: 'SII-4567-D Blade surface inspection',
          completed: true,
          completedAt: '2025-01-10T10:15:00Z',
          actualTimeMinutes: 25,
          notes: [
            {
              id: 'note-11',
              timestamp: '2025-01-10T10:30:00Z',
              note: 'All three blades inspected. Minor leading edge erosion on Blade 2 (15cm section). Repaired with epoxy filler.'
            }
          ]
        },
        {
          id: 'task-2y-2-2',
          description: 'Lightning protection system test',
          completed: true,
          completedAt: '2025-01-10T10:40:00Z',
          actualTimeMinutes: 25,
          notes: [
            {
              id: 'note-12',
              timestamp: '2025-01-10T11:00:00Z',
              note: 'Resistance measurements: Blade 1: 0.8Ω, Blade 2: 0.9Ω, Blade 3: 0.7Ω. All within spec (<1Ω).'
            }
          ]
        },
        {
          id: 'task-2y-2-3',
          description: 'Pitch bearing grease replacement',
          completed: true,
          completedAt: '2025-01-10T11:05:00Z',
          actualTimeMinutes: 30,
          notes: [
            {
              id: 'note-13',
              timestamp: '2025-01-10T11:35:00Z',
              note: 'Old grease purged and replaced with fresh grease (4.5kg per bearing). Rotation tested - smooth operation.'
            }
          ]
        }
      ]
    },
    {
      id: 'step-2y-3',
      title: 'Generator\n& Electrical Systems',
      duration: '30m',
      durationMinutes: 30,
      color: '#06b6d4',
      colorCode: '3',
      technician: 'T2',
      position: { x: 28, y: 5 },
      completedAt: '2025-01-10T11:40:00Z',
      completedBy: 'tech-004',
      completedByInitials: 'LIKIM',
      startedAt: '2025-01-10T11:05:00Z',
      tasks: [
        {
          id: 'task-2y-3-1',
          description: 'Generator winding insulation test',
          completed: true,
          completedAt: '2025-01-10T11:50:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-14',
              timestamp: '2025-01-10T11:50:00Z',
              note: 'Insulation resistance test: Phase A: 2500MΩ, Phase B: 2600MΩ, Phase C: 2550MΩ. All excellent (>1000MΩ required).'
            }
          ]
        },
        {
          id: 'task-2y-3-2',
          description: 'SII-5678-E Cable termination inspection',
          completed: true,
          completedAt: '2025-01-10T12:05:00Z',
          actualTimeMinutes: 12,
          notes: [
            {
              id: 'note-15',
              timestamp: '2025-01-10T12:05:00Z',
              note: 'All cable terminations tight and corrosion-free. One terminal lug slightly discolored - retorqued to 25 Nm.'
            }
          ]
        },
        {
          id: 'task-2y-3-3',
          description: 'Thermal imaging scan',
          completed: true,
          completedAt: '2025-01-10T12:10:00Z',
          actualTimeMinutes: 3,
          notes: [
            {
              id: 'note-16',
              timestamp: '2025-01-10T12:10:00Z',
              note: 'Thermal scan clean. No hot spots detected. All components within normal temperature range.'
            }
          ]
        }
      ]
    }
  ],
  startedAt: '2025-01-10T09:00:00Z',
  completedAt: '2025-01-10T11:40:00Z',
  totalDurationMinutes: 160,
  technicians: {
    t1: { id: 'tech-003', name: 'Robert Johnson', initials: 'ROJOH' },
    t2: { id: 'tech-004', name: 'Lisa Kim', initials: 'LIKIM' }
  },
  bugs: [
    {
      id: 'bug-3',
      taskId: 'task-2y-2-1',
      stepId: 'step-2y-2',
      title: 'Blade 2 leading edge erosion',
      description: 'Minor erosion damage (15cm section) on blade 2 leading edge. Repaired on-site with epoxy filler.',
      severity: 'low',
      status: 'crushed',
      reportedAt: '2025-01-10T10:30:00Z',
      reportedBy: 'Robert Johnson',
      resolvedAt: '2025-01-10T10:30:00Z',
      resolvedBy: 'Robert Johnson',
      notes: 'Repaired immediately with approved epoxy filler. Surface smoothed and protective coating applied.'
    },
    {
      id: 'bug-4',
      taskId: 'task-2y-3-2',
      stepId: 'step-2y-3',
      title: 'Discolored terminal lug',
      description: 'One terminal lug showed slight discoloration indicating possible overheating or loose connection.',
      severity: 'low',
      status: 'crushed',
      reportedAt: '2025-01-10T12:05:00Z',
      reportedBy: 'Lisa Kim',
      resolvedAt: '2025-01-10T12:05:00Z',
      resolvedBy: 'Lisa Kim',
      notes: 'Terminal cleaned and retorqued to specification (25 Nm). Will monitor during next inspection.'
    }
  ],
  summary: {
    totalSteps: 3,
    completedSteps: 3,
    totalTasks: 9,
    completedTasks: 9,
    totalNotes: 9,
    totalBugs: 2,
    openBugs: 0,
    crushedBugs: 2,
    targetTimeMinutes: 180,
    actualTimeMinutes: 160,
    timeVariance: -20
  }
};

// Example 3: EnVentus Mk 0 - 1Y Service (Another turbine with critical issue)
const example3: CompletedFlowchart = {
  id: 'enventus-mk0-1y-1735100000000',
  flowchartId: 'enventus-mk0-1y',
  wtgNumber: '392045',
  flowchartData: {
    id: 'enventus-mk0-1y',
    model: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    totalMinutes: 120,
    description: '1-year service inspection',
    steps: []
  },
  steps: [
    {
      id: 'step-1',
      title: 'Safety Check\n& Preparation',
      duration: '30m',
      durationMinutes: 30,
      color: '#3b82f6',
      colorCode: '1',
      technician: 'both',
      position: { x: 0, y: 5 },
      completedAt: '2025-01-05T08:35:00Z',
      completedBy: 'tech-005',
      completedByInitials: 'MIGAR',
      startedAt: '2025-01-05T08:00:00Z',
      tasks: [
        {
          id: 'task-1-1',
          description: 'PPE inspection',
          completed: true,
          completedAt: '2025-01-05T08:12:00Z',
          actualTimeMinutes: 12
        },
        {
          id: 'task-1-2',
          description: 'Tower access verification',
          completed: true,
          completedAt: '2025-01-05T08:28:00Z',
          actualTimeMinutes: 16,
          notes: [
            {
              id: 'note-17',
              timestamp: '2025-01-05T08:28:00Z',
              note: 'Elevator functioning normally. Inspected all safety brakes - all OK.'
            }
          ]
        },
        {
          id: 'task-1-3',
          description: 'Lock out / Tag out procedures',
          completed: true,
          completedAt: '2025-01-05T08:35:00Z',
          actualTimeMinutes: 7
        }
      ]
    },
    {
      id: 'step-2',
      title: 'Main Bearing\nInspection',
      duration: '45m',
      durationMinutes: 45,
      color: '#10b981',
      colorCode: '2',
      technician: 'T1',
      position: { x: 14, y: 5 },
      completedAt: '2025-01-05T09:45:00Z',
      completedBy: 'tech-005',
      completedByInitials: 'MIGAR',
      startedAt: '2025-01-05T08:35:00Z',
      tasks: [
        {
          id: 'task-2-1',
          description: 'SII-1234-A Visual inspection',
          completed: true,
          completedAt: '2025-01-05T09:10:00Z',
          actualTimeMinutes: 35,
          notes: [
            {
              id: 'note-18',
              timestamp: '2025-01-05T09:10:00Z',
              note: 'CRITICAL: Significant scoring marks found on bearing inner race. Immediate action required!'
            }
          ]
        },
        {
          id: 'task-2-2',
          description: 'Temperature check',
          completed: true,
          completedAt: '2025-01-05T09:25:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-19',
              timestamp: '2025-01-05T09:25:00Z',
              note: 'Temperature elevated: 62°C (normal range 35-55°C). Correlates with bearing damage.'
            }
          ]
        },
        {
          id: 'task-2-3',
          description: 'Lubrication system check',
          completed: true,
          completedAt: '2025-01-05T09:45:00Z',
          actualTimeMinutes: 20,
          notes: [
            {
              id: 'note-20',
              timestamp: '2025-01-05T09:45:00Z',
              note: 'Lubrication system functioning but grease contaminated with metal particles. Bearing replacement scheduled.'
            }
          ]
        }
      ]
    },
    {
      id: 'step-3',
      title: 'Gearbox\nInspection',
      duration: '45m',
      durationMinutes: 45,
      color: '#f59e0b',
      colorCode: '3',
      technician: 'T2',
      position: { x: 28, y: 5 },
      completedAt: '2025-01-05T10:30:00Z',
      completedBy: 'tech-006',
      completedByInitials: 'TICHE',
      startedAt: '2025-01-05T09:45:00Z',
      tasks: [
        {
          id: 'task-3-1',
          description: 'SII-2345-B Oil level check',
          completed: true,
          completedAt: '2025-01-05T10:00:00Z',
          actualTimeMinutes: 15,
          notes: [
            {
              id: 'note-21',
              timestamp: '2025-01-05T10:00:00Z',
              note: 'Oil level normal. Sample taken for analysis due to bearing issues in step 2.'
            }
          ]
        },
        {
          id: 'task-3-2',
          description: 'Vibration analysis',
          completed: true,
          completedAt: '2025-01-05T10:20:00Z',
          actualTimeMinutes: 20,
          notes: [
            {
              id: 'note-22',
              timestamp: '2025-01-05T10:20:00Z',
              note: 'Elevated vibration detected: 6.8mm/s @ 1500 RPM (normal 0-5mm/s). Likely due to main bearing damage.'
            }
          ]
        },
        {
          id: 'task-3-3',
          description: 'Filter replacement',
          completed: true,
          completedAt: '2025-01-05T10:30:00Z',
          actualTimeMinutes: 10
        }
      ]
    }
  ],
  startedAt: '2025-01-05T08:00:00Z',
  completedAt: '2025-01-05T10:30:00Z',
  totalDurationMinutes: 150,
  technicians: {
    t1: { id: 'tech-005', name: 'Mike Garcia', initials: 'MIGAR' },
    t2: { id: 'tech-006', name: 'Tina Chen', initials: 'TICHE' }
  },
  bugs: [
    {
      id: 'bug-5',
      taskId: 'task-2-1',
      stepId: 'step-2',
      title: 'Main bearing inner race damage - CRITICAL',
      description: 'Significant scoring marks on main bearing inner race with metal contamination in grease. Temperature elevated to 62°C.',
      severity: 'critical',
      status: 'open',
      reportedAt: '2025-01-05T09:10:00Z',
      reportedBy: 'Mike Garcia',
      notes: 'Turbine taken offline immediately. Bearing replacement required urgently. Parts ordered, installation scheduled for 2025-01-12.'
    },
    {
      id: 'bug-6',
      taskId: 'task-3-2',
      stepId: 'step-3',
      title: 'Elevated vibration levels',
      description: 'Vibration reading 6.8mm/s exceeds acceptable threshold (5mm/s max). Likely caused by main bearing damage.',
      severity: 'high',
      status: 'open',
      reportedAt: '2025-01-05T10:20:00Z',
      reportedBy: 'Tina Chen',
      notes: 'Secondary issue related to bearing damage. Will be resolved when bearing is replaced.'
    }
  ],
  summary: {
    totalSteps: 3,
    completedSteps: 3,
    totalTasks: 9,
    completedTasks: 9,
    totalNotes: 8,
    totalBugs: 2,
    openBugs: 2,
    crushedBugs: 0,
    targetTimeMinutes: 120,
    actualTimeMinutes: 150,
    timeVariance: 30
  }
};

// Example 4: V136 Mk3 - 2Y Service (Blade bearing service)
const example4: CompletedFlowchart = {
  id: 'v136-mk3-2y-1733840000000',
  flowchartId: 'v136-mk3-2y',
  wtgNumber: 'V136-001',
  flowchartData: {
    id: 'v136-mk3-2y',
    model: 'V136 Mk3',
    serviceType: '2Y Service',
    totalMinutes: 240,
    description: '2-year service - V136 model',
    steps: []
  },
  steps: [
    {
      id: 'step-v136-1',
      title: 'Blade Bearing\nInspection & Greasing',
      duration: '150m',
      durationMinutes: 150,
      color: '#10b981',
      colorCode: '1',
      technician: 'T1',
      position: { x: 0, y: 5 },
      completedAt: '2024-12-10T10:30:00Z',
      completedBy: '1',
      completedByInitials: 'MRADR',
      startedAt: '2024-12-10T08:00:00Z',
      tasks: [
        {
          id: 'task-v136-1-1',
          description: 'Blade 1 bearing inspection and greasing',
          completed: true,
          completedAt: '2024-12-10T08:50:00Z',
          actualTimeMinutes: 50,
          notes: [
            {
              id: 'note-v136-1',
              timestamp: '2024-12-10T08:50:00Z',
              note: 'V136 larger blade bearing - 3.5kg grease per bearing. Blade 1 completed.'
            }
          ]
        },
        {
          id: 'task-v136-1-2',
          description: 'Blade 2 bearing inspection and greasing',
          completed: true,
          completedAt: '2024-12-10T09:40:00Z',
          actualTimeMinutes: 50
        },
        {
          id: 'task-v136-1-3',
          description: 'Blade 3 bearing inspection and greasing',
          completed: true,
          completedAt: '2024-12-10T10:30:00Z',
          actualTimeMinutes: 50
        }
      ]
    },
    {
      id: 'step-v136-2',
      title: 'Hub Inspection\n& Bolt Check',
      duration: '90m',
      durationMinutes: 90,
      color: '#f59e0b',
      colorCode: '2',
      technician: 'T1',
      position: { x: 14, y: 5 },
      completedAt: '2024-12-10T12:00:00Z',
      completedBy: '1',
      completedByInitials: 'MRADR',
      startedAt: '2024-12-10T10:30:00Z',
      tasks: [
        {
          id: 'task-v136-2-1',
          description: 'Hub bolt torque verification',
          completed: true,
          completedAt: '2024-12-10T11:15:00Z',
          actualTimeMinutes: 45
        },
        {
          id: 'task-v136-2-2',
          description: 'Hub surface inspection',
          completed: true,
          completedAt: '2024-12-10T12:00:00Z',
          actualTimeMinutes: 45,
          notes: [
            {
              id: 'note-v136-2',
              timestamp: '2024-12-10T12:00:00Z',
              note: 'All hub bolts within torque spec. Surface clean, no cracks detected.'
            }
          ]
        }
      ]
    }
  ],
  startedAt: '2024-12-10T08:00:00Z',
  completedAt: '2024-12-10T12:00:00Z',
  totalDurationMinutes: 240,
  technicians: {
    t1: { id: '1', name: 'Markus Anderson', initials: 'MRADR' }
  },
  bugs: [],
  summary: {
    totalSteps: 2,
    completedSteps: 2,
    totalTasks: 5,
    completedTasks: 5,
    totalNotes: 2,
    totalBugs: 0,
    openBugs: 0,
    crushedBugs: 0,
    targetTimeMinutes: 240,
    actualTimeMinutes: 240,
    timeVariance: 0
  }
};

// Example 5: V150-4.2 MW - 3Y Service (Pitch system overhaul)
const example5: CompletedFlowchart = {
  id: 'v150-4.2mw-3y-1728720000000',
  flowchartId: 'v150-4.2mw-3y',
  wtgNumber: 'V150-001',
  flowchartData: {
    id: 'v150-4.2mw-3y',
    model: 'V150-4.2 MW',
    serviceType: '3Y Service',
    totalMinutes: 330,
    description: '3-year major service - V150 model',
    steps: []
  },
  steps: [
    {
      id: 'step-v150-1',
      title: 'Pitch System\nComprehensive Check',
      duration: '180m',
      durationMinutes: 180,
      color: '#ec4899',
      colorCode: '1',
      technician: 'T1',
      position: { x: 0, y: 5 },
      completedAt: '2024-10-12T11:00:00Z',
      completedBy: '1',
      completedByInitials: 'MRADR',
      startedAt: '2024-10-12T08:00:00Z',
      tasks: [
        {
          id: 'task-v150-1-1',
          description: 'Pitch motor 1 test and calibration',
          completed: true,
          completedAt: '2024-10-12T09:00:00Z',
          actualTimeMinutes: 60,
          notes: [
            {
              id: 'note-v150-1',
              timestamp: '2024-10-12T09:00:00Z',
              note: '3Y service - Pitch motor 1 tested at various speeds. Response time: 1.8s (spec: <2.5s).'
            }
          ]
        },
        {
          id: 'task-v150-1-2',
          description: 'Pitch motor 2 test and calibration',
          completed: true,
          completedAt: '2024-10-12T10:00:00Z',
          actualTimeMinutes: 60
        },
        {
          id: 'task-v150-1-3',
          description: 'Pitch motor 3 test and calibration',
          completed: true,
          completedAt: '2024-10-12T11:00:00Z',
          actualTimeMinutes: 60
        }
      ]
    },
    {
      id: 'step-v150-2',
      title: 'Main Shaft Bearing\nExtended Inspection',
      duration: '150m',
      durationMinutes: 150,
      color: '#06b6d4',
      colorCode: '2',
      technician: 'T1',
      position: { x: 14, y: 5 },
      completedAt: '2024-10-12T13:30:00Z',
      completedBy: '1',
      completedByInitials: 'MRADR',
      startedAt: '2024-10-12T11:00:00Z',
      tasks: [
        {
          id: 'task-v150-2-1',
          description: 'Bearing temperature monitoring',
          completed: true,
          completedAt: '2024-10-12T12:00:00Z',
          actualTimeMinutes: 60,
          notes: [
            {
              id: 'note-v150-2',
              timestamp: '2024-10-12T12:00:00Z',
              note: 'Temperature stable at 45°C during load test. Normal range 35-55°C.'
            }
          ]
        },
        {
          id: 'task-v150-2-2',
          description: 'Vibration analysis and wear check',
          completed: true,
          completedAt: '2024-10-12T13:30:00Z',
          actualTimeMinutes: 90
        }
      ]
    }
  ],
  startedAt: '2024-10-12T08:00:00Z',
  completedAt: '2024-10-12T13:30:00Z',
  totalDurationMinutes: 330,
  technicians: {
    t1: { id: '1', name: 'Markus Anderson', initials: 'MRADR' }
  },
  bugs: [],
  summary: {
    totalSteps: 2,
    completedSteps: 2,
    totalTasks: 5,
    completedTasks: 5,
    totalNotes: 2,
    totalBugs: 0,
    openBugs: 0,
    crushedBugs: 0,
    targetTimeMinutes: 330,
    actualTimeMinutes: 330,
    timeVariance: 0
  }
};

// Example 6: V162-6.2 MW - 2Y Service (Large generator inspection)
const example6: CompletedFlowchart = {
  id: 'v162-6.2mw-2y-1734192000000',
  flowchartId: 'v162-6.2mw-2y',
  wtgNumber: 'V162-001',
  flowchartData: {
    id: 'v162-6.2mw-2y',
    model: 'V162-6.2 MW',
    serviceType: '2Y Service',
    totalMinutes: 315,
    description: '2-year service - V162 large model',
    steps: []
  },
  steps: [
    {
      id: 'step-v162-1',
      title: 'Generator Bearing\nInspection & Service',
      duration: '180m',
      durationMinutes: 180,
      color: '#8b5cf6',
      colorCode: '1',
      technician: 'T1',
      position: { x: 0, y: 5 },
      completedAt: '2024-12-15T11:00:00Z',
      completedBy: '1',
      completedByInitials: 'MRADR',
      startedAt: '2024-12-15T08:00:00Z',
      tasks: [
        {
          id: 'task-v162-1-1',
          description: 'Generator bearing inspection (drive end)',
          completed: true,
          completedAt: '2024-12-15T09:30:00Z',
          actualTimeMinutes: 90,
          notes: [
            {
              id: 'note-v162-1',
              timestamp: '2024-12-15T09:30:00Z',
              note: '6.2MW generator - larger bearings require extended inspection time. Drive end bearing OK.'
            }
          ]
        },
        {
          id: 'task-v162-1-2',
          description: 'Generator bearing inspection (non-drive end)',
          completed: true,
          completedAt: '2024-12-15T11:00:00Z',
          actualTimeMinutes: 90
        }
      ]
    },
    {
      id: 'step-v162-2',
      title: 'Gearbox Oil Analysis\n& System Check',
      duration: '135m',
      durationMinutes: 135,
      color: '#10b981',
      colorCode: '2',
      technician: 'T1',
      position: { x: 14, y: 5 },
      completedAt: '2024-12-15T13:15:00Z',
      completedBy: '1',
      completedByInitials: 'MRADR',
      startedAt: '2024-12-15T11:00:00Z',
      tasks: [
        {
          id: 'task-v162-2-1',
          description: 'Oil sample collection and analysis',
          completed: true,
          completedAt: '2024-12-15T11:45:00Z',
          actualTimeMinutes: 45,
          notes: [
            {
              id: 'note-v162-2',
              timestamp: '2024-12-15T11:45:00Z',
              note: 'Oil sample sent to lab. Visual inspection shows clean oil, no metal particles.'
            }
          ]
        },
        {
          id: 'task-v162-2-2',
          description: 'Filter replacement',
          completed: true,
          completedAt: '2024-12-15T12:15:00Z',
          actualTimeMinutes: 30
        },
        {
          id: 'task-v162-2-3',
          description: 'Vibration analysis',
          completed: true,
          completedAt: '2024-12-15T13:15:00Z',
          actualTimeMinutes: 60
        }
      ]
    }
  ],
  startedAt: '2024-12-15T08:00:00Z',
  completedAt: '2024-12-15T13:15:00Z',
  totalDurationMinutes: 315,
  technicians: {
    t1: { id: '1', name: 'Markus Anderson', initials: 'MRADR' }
  },
  bugs: [],
  summary: {
    totalSteps: 2,
    completedSteps: 2,
    totalTasks: 5,
    completedTasks: 5,
    totalNotes: 2,
    totalBugs: 0,
    openBugs: 0,
    crushedBugs: 0,
    targetTimeMinutes: 315,
    actualTimeMinutes: 315,
    timeVariance: 0
  }
};

/**
 * Seeds example completed flowcharts to localStorage
 * This provides realistic test data for development and demonstration
 */
export function seedCompletedFlowcharts(): void {
  if (typeof window === 'undefined') return; // Only run in browser

  const existing = localStorage.getItem(STORAGE_KEY);
  let flowcharts: CompletedFlowchart[] = [];

  if (existing) {
    try {
      flowcharts = JSON.parse(existing);
    } catch (e) {
      console.error('Failed to parse existing completed flowcharts:', e);
    }
  }

  // Add examples if they don't already exist
  const exampleIds = [example1.id, example2.id, example3.id, example4.id, example5.id, example6.id];
  const existingIds = flowcharts.map(f => f.id);

  if (!existingIds.includes(example1.id)) {
    flowcharts.push(example1);
    console.log('✅ Added example 1: WTG-248024 (EnVentus Mk 0, 1Y Service - Minor issues)');
  }

  if (!existingIds.includes(example2.id)) {
    flowcharts.push(example2);
    console.log('✅ Added example 2: WTG-156782 (EnVentus Mk 0, 2Y Service - All issues resolved)');
  }

  if (!existingIds.includes(example3.id)) {
    flowcharts.push(example3);
    console.log('✅ Added example 3: WTG-392045 (EnVentus Mk 0, 1Y Service - Critical bearing damage)');
  }

  if (!existingIds.includes(example4.id)) {
    flowcharts.push(example4);
    console.log('✅ Added example 4: WTG-V136-001 (V136 Mk3, 2Y Service - Blade bearing service)');
  }

  if (!existingIds.includes(example5.id)) {
    flowcharts.push(example5);
    console.log('✅ Added example 5: WTG-V150-001 (V150-4.2 MW, 3Y Service - Pitch system overhaul)');
  }

  if (!existingIds.includes(example6.id)) {
    flowcharts.push(example6);
    console.log('✅ Added example 6: WTG-V162-001 (V162-6.2 MW, 2Y Service - Generator inspection)');
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(flowcharts));
  console.log('🎉 Seed data complete! 6 example completed flowcharts added (5 different turbine models).');
}

/**
 * Clears all seed data (for testing purposes)
 */
export function clearSeedData(): void {
  if (typeof window === 'undefined') return;

  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) return;

  try {
    const flowcharts = JSON.parse(existing);
    const exampleIds = [example1.id, example2.id, example3.id];
    const filtered = flowcharts.filter((f: CompletedFlowchart) => !exampleIds.includes(f.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('🗑️ Seed data cleared!');
  } catch (e) {
    console.error('Failed to clear seed data:', e);
  }
}
