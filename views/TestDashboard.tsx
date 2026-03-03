
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Play, ChevronLeft, AlertTriangle } from 'lucide-react';
import { getLines, formatDate } from '../helpers';
import { parseResponse } from '../services/aiUtils';

// Simple Assertion Library
const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`Expected ${expected}, but got ${actual}`);
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
  },
  toBeTruthy: () => {
    if (!actual) throw new Error(`Expected truthy, but got ${actual}`);
  }
});

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'running';
  error?: string;
  duration?: number;
}

export const TestDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const tests = [
      {
        name: 'helpers.ts: getLines should split strings correctly',
        fn: () => {
          expect(getLines("Line 1\nLine 2")).toEqual(["Line 1", "Line 2"]);
          expect(getLines("Single Line")).toEqual(["Single Line"]);
          expect(getLines("")).toEqual([]);
          expect(getLines(null)).toEqual([]);
        }
      },
      {
        name: 'helpers.ts: formatDate should handle defaults',
        fn: () => {
          const today = new Date().toLocaleDateString('no-NO');
          expect(formatDate(undefined)).toBe(today);
          expect(formatDate("12.12.2023")).toBe("12.12.2023");
        }
      },
      {
        name: 'aiUtils.ts: parseResponse should clean markdown JSON',
        fn: () => {
          const jsonStr = '```json\n{"key": "value"}\n```';
          const parsed = parseResponse(jsonStr);
          expect(parsed).toEqual({ key: "value" });
        }
      },
      {
        name: 'aiUtils.ts: parseResponse should handle plain JSON',
        fn: () => {
          const jsonStr = '{"key": "value"}';
          const parsed = parseResponse(jsonStr);
          expect(parsed).toEqual({ key: "value" });
        }
      },
      {
        name: 'aiUtils.ts: parseResponse should handle arrays',
        fn: () => {
          const jsonStr = '[{"key": "value"}]';
          const parsed = parseResponse(jsonStr);
          expect(parsed).toEqual([{ key: "value" }]);
        }
      },
      {
        name: 'Logic: Array cloning safety',
        fn: () => {
          const original = [1, 2, 3];
          const copy = [...original];
          copy.push(4);
          expect(original.length).toBe(3);
          expect(copy.length).toBe(4);
        }
      }
    ];

    const newResults: TestResult[] = [];

    for (const test of tests) {
      const start = performance.now();
      try {
        await test.fn();
        newResults.push({ 
          name: test.name, 
          status: 'pass', 
          duration: Math.round(performance.now() - start) 
        });
      } catch (e: any) {
        newResults.push({ 
          name: test.name, 
          status: 'fail', 
          error: e.message,
          duration: Math.round(performance.now() - start)
        });
      }
      // Small delay to visualize progress
      setResults([...newResults]);
      await new Promise(r => setTimeout(r, 100));
    }

    setIsRunning(false);
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-indigo-600">
          <ChevronLeft size={16} /> Tilbake til app
        </button>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Systemdiagnose & Tester</h1>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase mb-2">Sikkerhetsnett</h2>
          <p className="text-slate-400 text-sm font-medium">Kjør enhetstester for å verifisere kjernefunksjonalitet før refaktorering.</p>
        </div>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          <Play size={16} fill="currentColor" /> {isRunning ? 'Kjører...' : 'Kjør Tester'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 size={24}/></div>
          <div><p className="text-2xl font-black text-emerald-900">{passCount}</p><p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Bestått</p></div>
        </div>
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><XCircle size={24}/></div>
          <div><p className="text-2xl font-black text-red-900">{failCount}</p><p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Feilet</p></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black uppercase text-xs text-slate-500 tracking-widest">Testlogg</h3>
          {results.length > 0 && <span className="text-[10px] font-bold text-slate-400">{results.length} tester kjørt</span>}
        </div>
        <div className="divide-y divide-slate-50">
          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertTriangle className="mx-auto mb-4 opacity-50" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">Ingen tester kjørt ennå</p>
            </div>
          ) : (
            results.map((res, i) => (
              <div key={i} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`mt-1 ${res.status === 'pass' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {res.status === 'pass' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <p className={`text-sm font-bold ${res.status === 'pass' ? 'text-slate-700' : 'text-red-700'}`}>{res.name}</p>
                    <span className="text-[10px] font-mono text-slate-400">{res.duration}ms</span>
                  </div>
                  {res.error && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs font-mono text-red-600 border border-red-100">
                      {res.error}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
