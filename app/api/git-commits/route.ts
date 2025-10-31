import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get last 15 commits with details
    const { stdout } = await execAsync(
      'git log --pretty=format:"%h|%s|%ar|%ad" --date=format:"%Y-%m-%d %H:%M" -15',
      { cwd: process.cwd() }
    );

    const commits = stdout.split('\n').map(line => {
      const [hash, message, relativeTime, date] = line.split('|');
      return { hash, message, relativeTime, date };
    });

    return NextResponse.json({ commits });
  } catch (error) {
    console.error('Error fetching git commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch git commits' },
      { status: 500 }
    );
  }
}
