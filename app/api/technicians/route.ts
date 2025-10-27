import { NextResponse } from 'next/server';
import { ALL_TECHNICIANS } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(ALL_TECHNICIANS);
}
