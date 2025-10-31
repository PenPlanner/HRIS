'use client';

import { useState } from 'react';
import { storage } from '@/lib/storage';

export default function TestSyncPage() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testWrite = async () => {
    setLoading(true);
    addLog('🔵 Testing storage write...');

    try {
      const testData = {
        hello: 'supabase',
        timestamp: Date.now(),
        message: 'Cloud sync test from HRIS PWA! 🚀'
      };

      await storage.set('test-key', testData);
      addLog('✅ Write successful! Check console for Supabase sync logs');
      addLog(`📦 Data: ${JSON.stringify(testData)}`);
    } catch (error) {
      addLog(`❌ Write failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRead = async () => {
    setLoading(true);
    addLog('🔵 Testing storage read...');

    try {
      const data = await storage.get('test-key');
      if (data) {
        addLog('✅ Read successful!');
        addLog(`📦 Data: ${JSON.stringify(data)}`);
      } else {
        addLog('⚠️ No data found for test-key');
      }
    } catch (error) {
      addLog(`❌ Read failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testBugReport = async () => {
    setLoading(true);
    addLog('🔵 Testing bug report storage...');

    try {
      const bugReport = {
        id: `bug-${Date.now()}`,
        timestamp: new Date().toISOString(),
        flowchartId: 'test-flowchart',
        flowchartName: 'Test Flowchart',
        stepId: 'step-1',
        stepTitle: 'Test Step',
        taskId: 'task-1',
        taskDescription: 'Test Task',
        reportType: 'other' as const,
        description: 'This is a test bug report to verify cloud sync',
        status: 'open' as const,
        comments: []
      };

      // Get existing bug reports
      const existing = await storage.get<Record<string, any>>('bug_reports') || {};
      existing[bugReport.id] = bugReport;

      await storage.set('bug_reports', existing);
      addLog('✅ Bug report saved! Check Supabase dashboard');
      addLog(`🐛 Bug ID: ${bugReport.id}`);
    } catch (error) {
      addLog(`❌ Bug report failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDelete = async () => {
    setLoading(true);
    addLog('🔵 Testing storage delete...');

    try {
      await storage.remove('test-key');
      addLog('✅ Delete successful! Check console and Supabase');
    } catch (error) {
      addLog(`❌ Delete failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLog = () => {
    setLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Cloud Sync Test 🚀
          </h1>
          <p className="text-gray-600 mb-8">
            Testa Supabase cloud synchronization med offline support
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={testWrite}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📝 Test Write
            </button>

            <button
              onClick={testRead}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📖 Test Read
            </button>

            <button
              onClick={testBugReport}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🐛 Test Bug Report
            </button>

            <button
              onClick={testDelete}
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Test Delete
            </button>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">Console Log</h2>
              <button
                onClick={clearLog}
                className="text-gray-400 hover:text-white text-sm"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {log.length === 0 ? (
                <p className="text-gray-500">No logs yet. Click a button to test!</p>
              ) : (
                log.map((entry, i) => (
                  <div key={i} className="text-green-400">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              💡 Hur man verifierar cloud sync:
            </h3>
            <ol className="space-y-2 text-blue-800 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Klicka "Test Write" och kolla browser console för sync-loggar</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Öppna Supabase Dashboard → Table Editor → pwa_storage</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Du ska se en ny rad med key = "test-key"</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Klicka "Test Read" för att verifiera att data kan läsas</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">5.</span>
                <span>Testa "Test Bug Report" för att se verklig app-data synca</span>
              </li>
            </ol>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              ✅ Offline-First Architecture
            </h3>
            <p className="text-green-800 text-sm">
              All data skrivs direkt till IndexedDB (lokalt) först, sedan syncas till Supabase i bakgrunden.
              Om du är offline funkar allt ändå - datan syncas automatiskt när du kommer online igen!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
