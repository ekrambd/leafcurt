import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, Ban, Search, CheckCircle, RefreshCw, AlertTriangle, Phone, Globe } from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import { BlacklistEntry } from '../types';

export default function AntiFraudManager() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'phone' | 'ip'>('all');

  // New entry modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newType, setNewType] = useState<'phone' | 'ip'>('phone');
  const [newValue, setNewValue] = useState('');
  const [newReason, setNewReason] = useState('Fake order / Repeated fake COD cancellation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getBlacklist();
      if (res.success && Array.isArray(res.data)) {
        setEntries(res.data);
      }
    } catch (err) {
      console.error('Failed to load blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await ApiClient.addBlacklist(newType, newValue.trim(), newReason.trim());
      if (res.success) {
        showToast(res.message);
        setNewValue('');
        setIsAddOpen(false);
        fetchBlacklist();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to add to blacklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string, value: string) => {
    if (!confirm(`Are you sure you want to unblock ${value}?`)) return;

    try {
      const res = await ApiClient.removeBlacklist(id);
      if (res.success) {
        showToast(`Unblocked ${value}`);
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to remove entry');
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.value.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.reason && e.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const phoneCount = entries.filter(e => e.type === 'phone').length;
  const ipCount = entries.filter(e => e.type === 'ip').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Anti-Fraud Shield (IP & Phone Blacklist)</h2>
              <p className="text-xs text-slate-500">Block fake customer phone numbers and spammer IP addresses automatically</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBlacklist}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Refresh Blacklist"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Block Phone or IP</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Blocked</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{entries.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            <Ban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase">Blocked Phones</span>
            <div className="text-2xl font-black text-rose-700 mt-0.5">{phoneCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold">
            <Phone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase">Blocked IPs</span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{ipCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by phone, IP or reason..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('phone')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                typeFilter === 'phone' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Phones ({phoneCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('ip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                typeFilter === 'ip' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              IPs ({ipCount})
            </button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              Loading anti-fraud blacklist...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                ✓
              </div>
              <p className="text-xs font-bold text-slate-700">No blocked records found</p>
              <p className="text-[11px] text-slate-400">Add phone numbers or IP addresses of abusive customers to prevent fake orders.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-24">Type</th>
                  <th className="py-2.5 px-4">Blocked Value</th>
                  <th className="py-2.5 px-4">Reason / Notes</th>
                  <th className="py-2.5 px-4 w-32">Date Blocked</th>
                  <th className="py-2.5 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      {item.type === 'phone' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Phone className="w-3 h-3" /> Phone
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Globe className="w-3 h-3" /> IP
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                      {item.value}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.reason || 'Spam / Fake order'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.value)}
                        className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 transition-colors font-bold text-[11px] cursor-pointer"
                        title="Unblock"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Add to Blacklist</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('phone')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      newType === 'phone' ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone Number</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('ip')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      newType === 'ip' ? 'bg-amber-50 border-amber-400 text-amber-700 ring-1 ring-amber-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>IP Address</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {newType === 'phone' ? 'Phone Number to Block *' : 'IP Address to Block *'}
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newType === 'phone' ? 'e.g. 01712345678' : 'e.g. 103.25.12.4'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Refused delivery twice / Fake COD"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  {isSubmitting ? 'Blocking...' : 'Block Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
