import { useState, useEffect } from 'react';

interface CommitInfo {
  hash: string;
  message: string;
  relativeTime: string;
  date: string;
}

interface UseGitCommitOptions {
  refreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

export function useGitCommit(options: UseGitCommitOptions = {}) {
  const { refreshInterval = 30000 } = options;
  const [latestCommit, setLatestCommit] = useState<CommitInfo | null>(null);
  const [allCommits, setAllCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommits = async () => {
    try {
      const response = await fetch('/api/git-commits');

      // Check if response is OK and is JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Git commits API returned non-JSON response, skipping...');
        setError('API returned non-JSON response');
        return;
      }

      const data = await response.json();

      if (data.commits && data.commits.length > 0) {
        setLatestCommit(data.commits[0]);
        setAllCommits(data.commits);
        setError(null);
      } else {
        setError('No commits found');
      }
    } catch (err) {
      console.warn('Error fetching git commits (non-critical):', err instanceof Error ? err.message : err);
      setError('Failed to fetch commits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCommits();

    // Set up polling interval
    const interval = setInterval(fetchCommits, refreshInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    latestCommit,
    allCommits,
    loading,
    error,
    refresh: fetchCommits,
  };
}
