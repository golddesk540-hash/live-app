'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  FileCheck2,
  Smartphone,
  Apple,
  Layers,
  User,
  Timer,
  ChevronRight,
  X
} from 'lucide-react';
import { TestCaseRecord, TestResult, ReleasePlatform } from './releaseTypes';
import { ReleaseEmptyStates } from './ReleaseEmptyStates';

interface QualityAssuranceViewProps {
  testCases: TestCaseRecord[];
  onUpdateTestResult?: (id: string, result: TestResult) => void;
}

export const QualityAssuranceView: React.FC<QualityAssuranceViewProps> = ({
  testCases,
  onUpdateTestResult
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedResult, setSelectedResult] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTestCase, setActiveTestCase] = useState<TestCaseRecord | null>(null);

  const categories = [
    'All',
    'Functional Testing',
    'UI Testing',
    'Navigation Testing',
    'Authentication Testing',
    'Live Streaming Testing',
    'Wallet Interface Testing',
    'Notification Testing',
    'Responsive Testing',
    'Regression Testing'
  ];

  const filteredTests = testCases.filter((tc) => {
    const matchesCategory = selectedCategory === 'All' || tc.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'All' || tc.platform === selectedPlatform;
    const matchesResult = selectedResult === 'All' || tc.result === selectedResult;
    const matchesSearch =
      tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.reviewer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPlatform && matchesResult && matchesSearch;
  });

  const totalCount = testCases.length;
  const passedCount = testCases.filter((t) => t.result === 'Passed').length;
  const failedCount = testCases.filter((t) => t.result === 'Failed').length;
  const pendingCount = testCases.filter((t) => t.result === 'Pending').length;
  const blockedCount = testCases.filter((t) => t.result === 'Blocked').length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const getResultBadge = (result: TestResult) => {
    switch (result) {
      case 'Passed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30 font-bold';
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Blocked':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* QA Header & Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono mt-1">{passRate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{passedCount} of {totalCount} verified</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Passed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{passedCount}</div>
          <div className="text-[11px] text-emerald-500/70 mt-0.5">Automated + manual</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Failed</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono mt-1">{failedCount}</div>
          <div className="text-[11px] text-red-400/70 mt-0.5">Defect logged in triage</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-400/70 mt-0.5">Awaiting regression run</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Blocked</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono mt-1">{blockedCount}</div>
          <div className="text-[11px] text-purple-400/70 mt-0.5">External dependency</div>
        </div>
      </div>

      {/* Main Filter & Action Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Quality Assurance Test Matrix
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                  32 Test Suites Registered
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Functional, UI, audio/video streaming, wallet transactions, push notifications, and regression suites.
              </p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name (TC-401), notes, reviewer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-purple-800/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5 text-purple-400" /> Result:
                {['All', 'Passed', 'Failed', 'Pending', 'Blocked'].map((res) => (
                  <button
                    key={res}
                    onClick={() => setSelectedResult(res)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      selectedResult === res
                        ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40'
                        : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tests Table */}
      {filteredTests.length === 0 ? (
        <ReleaseEmptyStates
          kind="no_test_records"
          onAction={() => {
            setSelectedCategory('All');
            setSelectedPlatform('All');
            setSelectedResult('All');
            setSearchQuery('');
          }}
          actionLabel="Clear Filters"
        />
      ) : (
        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 text-slate-400 uppercase tracking-wider border-b border-purple-800/30">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Test ID & Title</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Result</th>
                  <th className="py-3.5 px-4 font-semibold">Execution</th>
                  <th className="py-3.5 px-4 font-semibold">Reviewer</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-800/20 text-slate-300">
                {filteredTests.map((tc) => (
                  <tr key={tc.id} className="hover:bg-purple-900/20 transition group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-cyan-400 font-bold">
                          {tc.id}
                        </span>
                        <span className="font-bold text-white text-xs group-hover:text-emerald-300 transition">
                          {tc.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {tc.notes}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-purple-950/70 border border-purple-800/30 text-purple-300">
                        {tc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {tc.platform === 'Android' && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
                        {tc.platform === 'iOS' && <Apple className="w-3.5 h-3.5 text-cyan-400" />}
                        {tc.platform === 'Cross-Platform' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
                        <span>{tc.platform}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getResultBadge(tc.result)}`}>
                        {tc.result}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-slate-500" />
                        <span>{tc.executionDuration}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{tc.stepsCount} steps</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-purple-400" />
                        <span>{tc.reviewer}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{tc.testDate}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setActiveTestCase(tc)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-emerald-900/40 text-slate-300 hover:text-emerald-300 border border-slate-700/40 text-xs font-medium transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Case Details Modal */}
      {activeTestCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-700/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveTestCase(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {activeTestCase.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {activeTestCase.id} • {activeTestCase.category} • {activeTestCase.platform}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Test Outcome</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] border ${getResultBadge(activeTestCase.result)}`}>
                    {activeTestCase.result}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned QA Reviewer</span>
                  <span className="text-white font-medium mt-1 block">
                    {activeTestCase.reviewer}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Execution Time</span>
                  <span className="text-white font-mono font-bold mt-1 block">
                    {activeTestCase.executionDuration} ({activeTestCase.stepsCount} steps)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Execution Date</span>
                  <span className="text-slate-300 font-mono mt-1 block">
                    {activeTestCase.testDate}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-purple-800/30">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                  Verification Notes & Assertion Log
                </span>
                <p className="text-slate-200 leading-relaxed">{activeTestCase.notes}</p>
              </div>

              {onUpdateTestResult && (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/30">
                  <span className="text-slate-300 block text-xs font-semibold mb-2">
                    Override / Re-evaluate Test Result:
                  </span>
                  <div className="flex items-center gap-2">
                    {(['Passed', 'Failed', 'Pending', 'Blocked'] as TestResult[]).map((res) => (
                      <button
                        key={res}
                        onClick={() => {
                          onUpdateTestResult(activeTestCase.id, res);
                          setActiveTestCase({ ...activeTestCase, result: res });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          activeTestCase.result === res
                            ? getResultBadge(res)
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-800/30">
                <button
                  onClick={() => setActiveTestCase(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
