import React, { useState, useEffect } from 'react';
import { ProductUnit } from '../types';
import { dbService } from '../lib/dbService';
import { 
  Scale, Plus, Trash2, Edit3, Save, RefreshCw, Check, X, Search,
  CheckCircle2, Sparkles, HelpCircle
} from 'lucide-react';
import { FeedbackDialog } from './ui/FeedbackDialog';

export default function UnitManager() {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirm modal state
  const [deletingUnit, setDeletingUnit] = useState<ProductUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback dialog
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const loadUnits = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getUnits();
      setUnits(data || []);
    } catch (err: any) {
      console.error('Error loading units:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load measurement units.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
    const handleUnitsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setUnits(e.detail);
      } else {
        loadUnits();
      }
    };
    window.addEventListener('units-updated', handleUnitsUpdated);
    return () => window.removeEventListener('units-updated', handleUnitsUpdated);
  }, []);

  const openCreateModal = () => {
    setEditingUnit(null);
    setName('');
    setCode('');
    setDescription('');
    setIsDefault(false);
    setIsModalOpen(true);
  };

  const openEditModal = (unit: ProductUnit) => {
    setEditingUnit(unit);
    setName(unit.name);
    setCode(unit.code);
    setDescription(unit.description || '');
    setIsDefault(Boolean(unit.isDefault));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Required Fields',
        message: 'Please provide both Unit Name and Short Code (e.g. Kilogram & kg).'
      });
      return;
    }

    setIsSaving(true);
    try {
      const unitData: ProductUnit = {
        id: editingUnit ? editingUnit.id : `unit-${Date.now()}`,
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        isDefault
      };

      await dbService.saveUnit(unitData);
      await loadUnits();

      setIsModalOpen(false);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: editingUnit ? 'Unit Updated' : 'Unit Created',
        message: `Unit "${unitData.name} (${unitData.code})" has been successfully saved to database.`
      });
    } catch (err: any) {
      console.error('Save unit failed:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to save unit.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;
    setIsDeleting(true);
    try {
      await dbService.deleteUnit(deletingUnit.id);
      await loadUnits();
      setDeletingUnit(null);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Unit Deleted',
        message: `Unit "${deletingUnit.name}" has been removed.`
      });
    } catch (err: any) {
      console.error('Delete unit error:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not remove this unit.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.description && u.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Unit Management
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100/70 text-teal-800">
                  {units.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Define measurement units (pcs, kg, g, L, ml, box, etc.) for products and inventory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUnits}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Unit
          </button>
        </div>
      </div>

      {/* Search Bar & Quick Info */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search unit by name or code (kg, pcs, L)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
        </div>
        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 px-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Pre-loaded standard ecommerce units available & ready to assign in products</span>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Unit Name</th>
                <th className="py-3.5 px-4">Code / Shortcode</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Loading units...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No units found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 text-xs font-black">
                          {unit.code.slice(0, 2).toUpperCase()}
                        </span>
                        <span>{unit.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 font-mono text-[11px] font-bold text-slate-700 rounded-md border border-slate-200">
                        {unit.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {unit.description || <span className="text-slate-300 italic">None</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {unit.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Default
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Unit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUnit(unit)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-600" />
                {editingUnit ? 'Edit Unit' : 'Add New Unit'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit Name * <span className="font-normal text-slate-400">(e.g. Kilogram, Pieces, Liter)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kilogram"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Code / Shortcode * <span className="font-normal text-slate-400">(e.g. kg, pcs, L, g, box)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kg"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold font-mono text-teal-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Note <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Standard mass unit for groceries & spices"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-normal text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unit-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="unit-default" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as default product unit
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editingUnit ? 'Update Unit' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Delete Unit?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove unit <strong className="text-slate-800">{deletingUnit.name} ({deletingUnit.code})</strong>? Existing products with this unit will keep their text.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUnit(null)}
                className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackDialog
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
      />
    </div>
  );
}
