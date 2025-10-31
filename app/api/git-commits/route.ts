import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

// Fallback commit info when git is not available (e.g., in production)
const FALLBACK_COMMITS = [
  {
    hash: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || '0f3fecb',
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Production build',
    relativeTime: 'Unknown',
    date: new Date().toISOString().split('T')[0].replace(/-/g, '-') + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5),
  },
];

export async function GET() {
  try {
    // Check if .git directory exists
    const gitDir = join(process.cwd(), '.git');
    if (!existsSync(gitDir)) {
      console.log('Git directory not found, using fallback commits');
      return NextResponse.json({ commits: FALLBACK_COMMITS });
    }

    // Get last 15 commits with details
    const { stdout } = await execAsync(
      'git log --pretty=format:"%h|%s|%ar|%ad" --date=format:"%Y-%m-%d %H:%M" -15',
      { cwd: process.cwd(), timeout: 5000 }
    );

    if (!stdout || stdout.trim() === '') {
      console.log('No git output, using fallback commits');
      return NextResponse.json({ commits: FALLBACK_COMMITS });
    }

    const commits = stdout.split('\n').map(line => {
      const [hash, message, relativeTime, date] = line.split('|');
      return { hash, message, relativeTime, date };
    });

    return NextResponse.json({ commits });
  } catch (error) {
    console.error('Error fetching git commits, using fallback:', error);
    // Return fallback commits instead of error
    return NextResponse.json({ commits: FALLBACK_COMMITS });
  }
}
