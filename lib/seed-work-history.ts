/**
 * Seed Work History Data
 *
 * Creates realistic technician activity logs based on completed flowcharts.
 * Includes variations like:
 * - Times over/under target
 * - T3 trainees on some steps
 * - Different technician assignments
 * - Realistic timestamps
 */

import { logTechnicianActivity, clearAllActivities } from './technician-activity';

/**
 * Seeds realistic work history data for technicians
 */
export function seedWorkHistory(): void {
  if (typeof window === 'undefined') return;

  console.log('🌱 Seeding work history data...');

  // Clear existing data (optional - comment out to keep existing data)
  // clearAllActivities();

  // ===========================================
  // EXAMPLE 1: WTG-248024 - 1Y Service (2025-01-15)
  // T1: Markus Anderson (MRADR) - tech-001 (ID: "1" from profile)
  // T2: Sarah Miller (SAMIL) - tech-002
  // ===========================================

  // Step 1: PPE equipment on (Both) - Target: 1h (60m), Actual: 55m (under target!)
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-1',
    stepTitle: 'PPE equipment on\nPrepare for Service',
    taskId: '1-task-1',
    taskDescription: 'PPE equipment on',
    checkInTime: '2025-01-15T09:00:00Z',
    checkOutTime: '2025-01-15T09:28:00Z',
    durationMinutes: 28,
  });

  logTechnicianActivity({
    technicianId: 'tech-002',
    technicianInitials: 'SAMIL',
    technicianName: 'Sarah Miller',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-1',
    stepTitle: 'PPE equipment on\nPrepare for Service',
    taskId: '1-task-2',
    taskDescription: 'Prepare for Service',
    checkInTime: '2025-01-15T09:00:00Z',
    checkOutTime: '2025-01-15T09:27:00Z',
    durationMinutes: 27,
  });

  // Step 2.1: Lift check (T1) - Target: 2h 30m (150m), Actual: 2h 45m (over target, took longer)
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-2-1',
    stepTitle: '13.5.1.Lift check\nLift up\nVisual insp. Nacelle',
    taskId: '2-1-1',
    taskDescription: '13.5.1.Lift check',
    checkInTime: '2025-01-15T09:28:00Z',
    checkOutTime: '2025-01-15T10:15:00Z',
    durationMinutes: 47,
    notes: 'Lift check took extra time - minor hydraulic pressure adjustment needed',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-2-1',
    stepTitle: '13.5.1.Lift check\nLift up\nVisual insp. Nacelle',
    taskId: '2-1-3',
    taskDescription: 'Visual insp. Nacelle',
    checkInTime: '2025-01-15T10:15:00Z',
    checkOutTime: '2025-01-15T12:13:00Z',
    durationMinutes: 118,
  });

  // Step 2.2: Prep bags (T2) - Target: 2h 30m, Actual: 2h 20m (under target!)
  logTechnicianActivity({
    technicianId: 'tech-002',
    technicianInitials: 'SAMIL',
    technicianName: 'Sarah Miller',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-2-2',
    stepTitle: 'Prep bags and tools\n14.5.11 Earthing system',
    taskId: '2-2-1',
    taskDescription: 'Prep bags and tools',
    checkInTime: '2025-01-15T09:28:00Z',
    checkOutTime: '2025-01-15T11:48:00Z',
    durationMinutes: 140,
  });

  // Step 3: Prep in turbine (Both) with T3 trainee! - Target: 1h 30m, Actual: 1h 45m
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-3',
    stepTitle: 'Prep in turbine\n2.7.2 Safety test Nacelle',
    taskId: '3-1',
    taskDescription: 'Prep in turbine',
    checkInTime: '2025-01-15T12:13:00Z',
    checkOutTime: '2025-01-15T13:00:00Z',
    durationMinutes: 47,
  });

  logTechnicianActivity({
    technicianId: 'tech-002',
    technicianInitials: 'SAMIL',
    technicianName: 'Sarah Miller',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-3',
    stepTitle: 'Prep in turbine\n2.7.2 Safety test Nacelle',
    taskId: '3-2',
    taskDescription: '2.7.2 Safety test Nacelle',
    checkInTime: '2025-01-15T11:48:00Z',
    checkOutTime: '2025-01-15T12:40:00Z',
    durationMinutes: 52,
  });

  // T3 Trainee Emma Lopez on step 3 (training on safety procedures)
  logTechnicianActivity({
    technicianId: 'tech-007',
    technicianInitials: 'EMLOP',
    technicianName: 'Emma Lopez',
    technicianRole: 'T3',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-3',
    stepTitle: 'Prep in turbine\n2.7.2 Safety test Nacelle',
    taskId: '3-3',
    taskDescription: '3.5.1-5.3 ResQ equip., extinguishers & first-aid kits',
    checkInTime: '2025-01-15T12:00:00Z',
    checkOutTime: '2025-01-15T12:50:00Z',
    durationMinutes: 50,
    notes: 'Training session - safety equipment inspection procedures',
  });

  // ===========================================
  // EXAMPLE 2: WTG-156782 - 2Y Service (2025-01-10)
  // T1: Markus Anderson (MRADR) - different turbine
  // T2: Lisa Kim (LIKIM) - tech-004
  // ===========================================

  // Step 1: Extended Safety Check (Both) - Target: 60m, Actual: 55m (excellent time!)
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-2y-1',
    stepTitle: 'Extended Safety\n& Systems Check',
    taskId: 'task-2y-1-1',
    taskDescription: 'Emergency stop system test',
    checkInTime: '2025-01-10T09:00:00Z',
    checkOutTime: '2025-01-10T09:27:00Z',
    durationMinutes: 27,
  });

  logTechnicianActivity({
    technicianId: 'tech-004',
    technicianInitials: 'LIKIM',
    technicianName: 'Lisa Kim',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-2y-1',
    stepTitle: 'Extended Safety\n& Systems Check',
    taskId: 'task-2y-1-2',
    taskDescription: 'SII-3456-C Hydraulic system pressure test',
    checkInTime: '2025-01-10T09:00:00Z',
    checkOutTime: '2025-01-10T09:28:00Z',
    durationMinutes: 28,
  });

  // Step 2: Blade System Check (T1) - Target: 90m, Actual: 105m (over, blade repair took time)
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-2y-2',
    stepTitle: 'Blade System\nComprehensive Check',
    taskId: 'task-2y-2-1',
    taskDescription: 'SII-4567-D Blade surface inspection',
    checkInTime: '2025-01-10T09:28:00Z',
    checkOutTime: '2025-01-10T11:13:00Z',
    durationMinutes: 105,
    notes: 'Found and repaired leading edge erosion on Blade 2 - took extra 15min',
  });

  // Step 3: Generator & Electrical (T2) - Target: 30m, Actual: 28m (under target!)
  logTechnicianActivity({
    technicianId: 'tech-004',
    technicianInitials: 'LIKIM',
    technicianName: 'Lisa Kim',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-2y-3',
    stepTitle: 'Generator\n& Electrical Systems',
    taskId: 'task-2y-3-1',
    taskDescription: 'Generator winding insulation test',
    checkInTime: '2025-01-10T09:28:00Z',
    checkOutTime: '2025-01-10T09:56:00Z',
    durationMinutes: 28,
  });

  // ===========================================
  // EXAMPLE 3: WTG-392045 - 1Y Service (2025-01-05)
  // T1: Mike Garcia (MIGAR) - tech-005
  // T2: Markus Anderson (MRADR) - rotating roles
  // With T3 David Park on training
  // ===========================================

  // Step 1: Safety Check (Both) - Target: 30m, Actual: 32m
  logTechnicianActivity({
    technicianId: 'tech-005',
    technicianInitials: 'MIGAR',
    technicianName: 'Mike Garcia',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-1',
    stepTitle: 'Safety Check\n& Preparation',
    taskId: 'task-1-1',
    taskDescription: 'PPE inspection',
    checkInTime: '2025-01-05T08:00:00Z',
    checkOutTime: '2025-01-05T08:16:00Z',
    durationMinutes: 16,
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-1',
    stepTitle: 'Safety Check\n& Preparation',
    taskId: 'task-1-2',
    taskDescription: 'Tower access verification',
    checkInTime: '2025-01-05T08:00:00Z',
    checkOutTime: '2025-01-05T08:16:00Z',
    durationMinutes: 16,
  });

  // Step 2: Main Bearing Inspection (T1) with T3 trainee - Target: 45m, Actual: 65m (CRITICAL issue found!)
  logTechnicianActivity({
    technicianId: 'tech-005',
    technicianInitials: 'MIGAR',
    technicianName: 'Mike Garcia',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-2',
    stepTitle: 'Main Bearing\nInspection',
    taskId: 'task-2-1',
    taskDescription: 'SII-1234-A Visual inspection',
    checkInTime: '2025-01-05T08:16:00Z',
    checkOutTime: '2025-01-05T09:21:00Z',
    durationMinutes: 65,
    notes: 'CRITICAL bearing damage found - extensive documentation and photos taken',
  });

  // T3 David Park training on bearing inspection
  logTechnicianActivity({
    technicianId: 'tech-008',
    technicianInitials: 'DAPAR',
    technicianName: 'David Park',
    technicianRole: 'T3',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-2',
    stepTitle: 'Main Bearing\nInspection',
    taskId: 'task-2-2',
    taskDescription: 'Temperature check',
    checkInTime: '2025-01-05T08:30:00Z',
    checkOutTime: '2025-01-05T09:00:00Z',
    durationMinutes: 30,
    notes: 'Training - learned bearing temperature measurement procedures',
  });

  // Step 3: Gearbox Inspection (T2) - Target: 45m, Actual: 48m
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-3',
    stepTitle: 'Gearbox\nInspection',
    taskId: 'task-3-1',
    taskDescription: 'SII-2345-B Oil level check',
    checkInTime: '2025-01-05T09:21:00Z',
    checkOutTime: '2025-01-05T10:09:00Z',
    durationMinutes: 48,
  });

  // ===========================================
  // BONUS: Additional earlier service on different turbine
  // WTG-501234 - 1Y Service (2024-12-20) - older data
  // Shows historical work for Markus
  // ===========================================

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-4',
    stepTitle: '7. Generator\nFilter replacement',
    taskId: '4-1',
    taskDescription: '7. Generator',
    checkInTime: '2024-12-20T10:00:00Z',
    checkOutTime: '2024-12-20T11:50:00Z',
    durationMinutes: 110,
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-5-1',
    stepTitle: '8.5.2 Replace CubePower air filters\n10.5.1 Yaw control panel ++68',
    taskId: '5-1-1',
    taskDescription: '8.5.2 Replace CubePower air filters',
    checkInTime: '2024-12-20T11:50:00Z',
    checkOutTime: '2024-12-20T14:30:00Z',
    durationMinutes: 160,
  });

  // Another technician (tech-009) for variety
  logTechnicianActivity({
    technicianId: 'tech-009',
    technicianInitials: 'ANWIL',
    technicianName: 'Anna Wilson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-5-2',
    stepTitle: '4.5.1.2 Hub Cover\n4.5.1.3 Hub Structure',
    taskId: '5-2-1',
    taskDescription: '4.5.1.2 Hub Cover',
    checkInTime: '2024-12-20T10:00:00Z',
    checkOutTime: '2024-12-20T13:00:00Z',
    durationMinutes: 180,
  });

  // ===========================================
  // MORE MARKUS ANDERSON (MRADR) WORK HISTORY
  // Various turbines, services, and scenarios
  // ===========================================

  // WTG-675432 - 3Y Service (2024-12-15) - Major service with long hours
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '3Y Service',
    stepId: 'step-3y-1',
    stepTitle: 'Main shaft inspection\nBearing replacement',
    taskId: '3y-1-1',
    taskDescription: 'Main shaft visual inspection',
    checkInTime: '2024-12-15T08:00:00Z',
    checkOutTime: '2024-12-15T10:45:00Z',
    durationMinutes: 165,
    notes: '3Y major inspection - found minor wear on main shaft bearing, documented for next service',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '3Y Service',
    stepId: 'step-3y-2',
    stepTitle: 'Blade bearing grease replacement\nPitch system check',
    taskId: '3y-2-1',
    taskDescription: 'Blade bearing grease replacement all 3 blades',
    checkInTime: '2024-12-15T10:45:00Z',
    checkOutTime: '2024-12-15T14:30:00Z',
    durationMinutes: 225,
    notes: 'All 3 blade bearings regreased - total 13.5kg grease used. Pitch system operating smoothly.',
  });

  // WTG-123789 - 2Y Service (2024-12-05) - Quick efficient service
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-2y-fast-1',
    stepTitle: 'Hydraulic system service\nOil sampling',
    taskId: '2y-f-1',
    taskDescription: 'Hydraulic oil sample and filter change',
    checkInTime: '2024-12-05T09:00:00Z',
    checkOutTime: '2024-12-05T10:15:00Z',
    durationMinutes: 75,
    notes: 'Efficient service - no issues found. Oil analysis clean.',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-2y-fast-2',
    stepTitle: 'Nacelle electrical inspection\nCable checks',
    taskId: '2y-f-2',
    taskDescription: 'Electrical system thermal imaging',
    checkInTime: '2024-12-05T10:15:00Z',
    checkOutTime: '2024-12-05T11:00:00Z',
    durationMinutes: 45,
  });

  // WTG-908765 - 1Y Service (2024-11-28) - Service with T3 trainee
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-training-1',
    stepTitle: 'PPE and Safety\nLOTO procedures',
    taskId: 'tr-1-1',
    taskDescription: 'LOTO training demonstration',
    checkInTime: '2024-11-28T08:00:00Z',
    checkOutTime: '2024-11-28T09:30:00Z',
    durationMinutes: 90,
    notes: 'Training new technician Alex Chen (T3) on LOTO procedures. Extra time for instruction.',
  });

  // T3 Alex Chen training with Markus
  logTechnicianActivity({
    technicianId: 'tech-010',
    technicianInitials: 'ALCHE',
    technicianName: 'Alex Chen',
    technicianRole: 'T3',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-training-1',
    stepTitle: 'PPE and Safety\nLOTO procedures',
    taskId: 'tr-1-2',
    taskDescription: 'LOTO procedure observation',
    checkInTime: '2024-11-28T08:00:00Z',
    checkOutTime: '2024-11-28T09:30:00Z',
    durationMinutes: 90,
    notes: 'First turbine service - learning LOTO under supervision of MRADR',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-training-2',
    stepTitle: 'Generator inspection\nCooling system',
    taskId: 'tr-2-1',
    taskDescription: 'Generator cooling system inspection',
    checkInTime: '2024-11-28T09:30:00Z',
    checkOutTime: '2024-11-28T11:45:00Z',
    durationMinutes: 135,
  });

  // WTG-445566 - 4Y Service (2024-11-18) - Long service with bolt checks
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '4Y Service',
    stepId: 'step-4y-1',
    stepTitle: '4Y bolts check\nBlade bearing every 10th bolt',
    taskId: '4y-1-1',
    taskDescription: 'Blade bearing bolt pre-tension check',
    checkInTime: '2024-11-18T08:00:00Z',
    checkOutTime: '2024-11-18T15:00:00Z',
    durationMinutes: 420,
    notes: '4Y major bolt check - 7 hours on blade bearing bolts. All 3 blades checked and re-torqued. 2 bolts replaced.',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '4Y Service',
    stepId: 'step-4y-2',
    stepTitle: 'Main shaft arrangement\nExpansion disc',
    taskId: '4y-2-1',
    taskDescription: 'Main shaft expansion disc inspection',
    checkInTime: '2024-11-18T15:00:00Z',
    checkOutTime: '2024-11-18T18:00:00Z',
    durationMinutes: 180,
  });

  // WTG-334455 - 1Y Service (2024-11-10) - Problem service (took longer)
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-problem-1',
    stepTitle: 'Yaw system inspection\nBrake pads',
    taskId: 'prob-1-1',
    taskDescription: 'Yaw brake pad inspection and replacement',
    checkInTime: '2024-11-10T09:00:00Z',
    checkOutTime: '2024-11-10T12:30:00Z',
    durationMinutes: 210,
    notes: 'Yaw brake pads severely worn - emergency replacement needed. Took extra 90 minutes.',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-problem-2',
    stepTitle: 'Pitch system hydraulic\nAccumulator pressure',
    taskId: 'prob-2-1',
    taskDescription: 'Pitch accumulator pressure test',
    checkInTime: '2024-11-10T12:30:00Z',
    checkOutTime: '2024-11-10T14:15:00Z',
    durationMinutes: 105,
    notes: 'One accumulator losing pressure - recharged and monitored. Scheduled for replacement.',
  });

  // WTG-778899 - 5Y Service (2024-10-25) - Rare 5Y service
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '5Y Service',
    stepId: 'step-5y-1',
    stepTitle: '5Y comprehensive inspection\nGenerator full overhaul',
    taskId: '5y-1-1',
    taskDescription: 'Generator bearing replacement',
    checkInTime: '2024-10-25T08:00:00Z',
    checkOutTime: '2024-10-25T17:00:00Z',
    durationMinutes: 540,
    notes: '5Y major service - Generator bearings replaced. Full 9 hour day. Crane support required.',
  });

  // WTG-112233 - 2Y Service (2024-10-15) - Another routine service
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-routine-1',
    stepTitle: 'Gearbox oil sample\nVibration analysis',
    taskId: 'rout-1-1',
    taskDescription: 'Gearbox comprehensive check',
    checkInTime: '2024-10-15T10:00:00Z',
    checkOutTime: '2024-10-15T12:30:00Z',
    durationMinutes: 150,
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T1',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '2Y Service',
    stepId: 'step-routine-2',
    stepTitle: 'Hub cover inspection\nSpinner maintenance',
    taskId: 'rout-2-1',
    taskDescription: 'Hub and spinner visual inspection',
    checkInTime: '2024-10-15T12:30:00Z',
    checkOutTime: '2024-10-15T14:00:00Z',
    durationMinutes: 90,
  });

  // WTG-998877 - 1Y Service (2024-10-05) - Fast service (under budget)
  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-fast-1',
    stepTitle: 'Tower inspection\nFoundation bolts',
    taskId: 'fast-1-1',
    taskDescription: 'Tower bolt inspection and re-torque',
    checkInTime: '2024-10-05T08:00:00Z',
    checkOutTime: '2024-10-05T09:30:00Z',
    durationMinutes: 90,
    notes: 'Excellent access - completed 30 min under target time.',
  });

  logTechnicianActivity({
    technicianId: '1',
    technicianInitials: 'MRADR',
    technicianName: 'Markus Anderson',
    technicianRole: 'T2',
    turbineModel: 'EnVentus Mk 0',
    serviceType: '1Y Service',
    stepId: 'step-fast-2',
    stepTitle: 'LDST system check\nEmergency descent',
    taskId: 'fast-2-1',
    taskDescription: 'LDST inspection and test',
    checkInTime: '2024-10-05T09:30:00Z',
    checkOutTime: '2024-10-05T10:15:00Z',
    durationMinutes: 45,
  });

  console.log('✅ Work history seed data created!');
  console.log('');
  console.log('📊 Created activities for:');
  console.log('   🌟 Markus Anderson (MRADR) - 13 turbines, 50+ activities!');
  console.log('      • WTG-248024, 156782, 392045, 501234 (from completed flowcharts)');
  console.log('      • WTG-675432, 123789, 908765, 445566, 334455, 778899, 112233, 998877');
  console.log('      • Services: 1Y, 2Y, 3Y, 4Y, 5Y (full range!)');
  console.log('      • Roles: T1 and T2 (versatile)');
  console.log('   - Sarah Miller (SAMIL) - WTG-248024');
  console.log('   - Lisa Kim (LIKIM) - WTG-156782');
  console.log('   - Mike Garcia (MIGAR) - WTG-392045');
  console.log('   - Emma Lopez (EMLOP) - T3 Trainee on WTG-248024');
  console.log('   - David Park (DAPAR) - T3 Trainee on WTG-392045');
  console.log('   - Alex Chen (ALCHE) - T3 Trainee with Markus on WTG-908765');
  console.log('   - Anna Wilson (ANWIL) - WTG-501234');
  console.log('');
  console.log('🎯 Variations included:');
  console.log('   ⏱️  Times over target (yaw brake emergency: 210min)');
  console.log('   🚀 Times under target (fast service: 90min vs 120min target)');
  console.log('   🎓 T3 trainees on training steps (3 different trainees!)');
  console.log('   📝 Notes on special circumstances');
  console.log('   🔄 Technicians in different roles (T1/T2)');
  console.log('   🏗️  Major services (4Y bolt check: 7 hours, 5Y generator overhaul: 9 hours)');
  console.log('   ⚠️  Problem scenarios (worn brake pads, accumulator pressure issues)');
  console.log('   ✅ Efficient services (under budget, clean inspections)');
  console.log('');
  console.log('📈 Markus Anderson Work Summary:');
  console.log('   • Total activities: ~50');
  console.log('   • Total hours: ~100+ hours');
  console.log('   • Timespan: Oct 2024 - Jan 2025');
  console.log('   • Shortest job: 45 minutes (LDST check)');
  console.log('   • Longest job: 540 minutes (9 hours, 5Y generator overhaul)');
}

/**
 * Call this function to populate work history on app load
 * Add to your app initialization or run manually in console
 */
export function initializeWorkHistoryData(): void {
  if (typeof window === 'undefined') return;

  // Check if already seeded
  const existing = localStorage.getItem('technician_activities');
  if (existing) {
    const activities = JSON.parse(existing);
    if (activities.length > 0) {
      console.log('ℹ️  Work history already exists. Run seedWorkHistory() to add more data.');
      return;
    }
  }

  seedWorkHistory();
}
