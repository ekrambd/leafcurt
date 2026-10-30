import React, { useState, useEffect } from 'react';
import { ProductAttribute, ProductAttributeValue } from '../types';
import { dbService } from '../lib/dbService';
import { 
  Sliders, Plus, Trash2, Edit3, Save, RefreshCw, Check, X, Search,
  Tag, Palette, Sparkles, AlertCircle
} from 'lucide-react';
import { FeedbackDialog } from './ui/FeedbackDialog';

export default function AttributeManager() {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<ProductAttribute | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'color' | 'select'>('select');
  const [description, setDescription] = useState('');
  const [values, setValues] = useState<ProductAttributeValue[]>([]);
  const [newValueName, setNewValueName] = useState('');
  const [newValueCode, setNewValueCode] = useState('#000000');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingAttr, setDeletingAttr] = useState<ProductAttribute | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback State
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

  const loadAttributes = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAttributes();
      setAttributes(data || []);
    } catch (err: any) {
      console.error('Error loading attributes:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load attributes.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
    const handleAttrsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAttributes(e.detail);
      } else {
        loadAttributes();
      }
    };
    window.addEventListener('attributes-updated', handleAttrsUpdated);
    return () => window.removeEventListener('attributes-updated', handleAttrsUpdated);
  }, []);

  const openCreateModal = () => {
    setEditingAttr(null);
    setName('');
    setType('select');
    setDescription('');
    setValues([]);
    setNewValueName('');
    setNewValueCode('#000000');
    setIsModalOpen(true);
  };

  const openEditModal = (attr: ProductAttribute) => {
    setEditingAttr(attr);
    setName(attr.name);
    setType(attr.type || 'select');
    setDescription(attr.description || '');
    setValues(attr.values || []);
    setNewValueName('');
    setNewValueCode('#000000');
    setIsModalOpen(true);
  };

  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValueName.trim()) return;

    const trimmed = newValueName.trim();
    if (values.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    const newVal: ProductAttributeValue = {
      id: `val-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: trimmed,
      code: type === 'color' ? newValueCode : undefined
    };

    setValues([...values, newVal]);
    setNewValueName('');
  };

  const handleRemoveValue = (valId: string) => {
    setValues(values.filter(v => v.id !== valId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Required Field',
        message: 'Attribute name is required (e.g. Size, Color, Weight, Pattern).'
      });
      return;
    }

    if (values.length === 0) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Values Required',
        message: 'Please add at least one value for this attribute.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const attrData: ProductAttribute = {
        id: editingAttr ? editingAttr.id : `attr-${Date.now()}`,
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        values
      };

      await dbService.saveAttribute(attrData);
      await loadAttributes();

      setIsModalOpen(false);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: editingAttr ? 'Attribute Updated' : 'Attribute Created',
        message: `Attribute "${attrData.name}" with ${values.length} values has been saved.`
      });
    } catch (err: any) {
      console.error('Save attribute failed:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save attribute.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAttr) return;
    setIsDeleting(true);
    try {
      await dbService.deleteAttribute(deletingAttr.id);
      await loadAttributes();
      setDeletingAttr(null);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Attribute Deleted',
        message: `Attribute "${deletingAttr.name}" removed.`
      });
    } catch (err: any) {
      console.error('Delete attribute error:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not remove attribute.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAttrs = attributes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.values && a.values.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Attribute Management
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {attributes.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Manage product variation attributes (Size, Color, Weight, Pattern, Fabric) for variant generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAttributes}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Attribute
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attribute (Size, Color, Weight, Pattern)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
        </div>
        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 px-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Pre-loaded with Size, Color, Weight (0.5kg, 1kg), Pattern & Material</span>
        </div>
      </div>

      {/* Attributes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
            Loading attributes...
          </div>
        ) : filteredAttrs.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No attributes found matching "{searchTerm}".
          </div>
        ) : (
          filteredAttrs.map((attr) => (
            <div 
              key={attr.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700 font-bold text-xs">
                      {attr.type === 'color' ? <Palette className="w-4 h-4 text-pink-600" /> : <Tag className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{attr.name}</h3>
                      <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        {attr.type || 'select'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(attr)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Attribute"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAttr(attr)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Attribute"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {attr.description && (
                  <p className="text-xs text-slate-500 mb-3">{attr.description}</p>
                )}

                {/* Values pills */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Available Values ({attr.values?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {attr.values?.map((val) => (
                      <span
                        key={val.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {val.code && (
                          <span 
                            className="w-3 h-3 rounded-full border border-slate-300 shrink-0" 
                            style={{ backgroundColor: val.code }}
                          />
                        )}
                        <span>{val.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Attribute Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                {editingAttr ? 'Edit Attribute' : 'Create Attribute'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attribute Name * <span className="font-normal text-slate-400">(e.g. Size, Color, Weight)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weight"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attribute Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  >
                    <option value="select">Select / Text Dropdown</option>
                    <option value="color">Color Swatch (Hex code)</option>
                    <option value="text">Custom Text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Note <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spices & Grocery weight variations"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-normal text-slate-800 outline-none"
                />
              </div>

              {/* Add Values Box */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Attribute Values * <span className="font-normal text-slate-400">(e.g. 0.5 kg, 1 kg, Red, XL)</span>
                  </label>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full">
                    {values.length} values
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={type === 'color' ? 'Color name (e.g. Navy Blue)' : 'Value name (e.g. 0.5 kg or XL)'}
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddValue(e as any);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-purple-500 rounded-lg text-xs font-medium text-slate-800 outline-none"
                  />

                  {type === 'color' && (
                    <input
                      type="color"
                      value={newValueCode}
                      onChange={(e) => setNewValueCode(e.target.value)}
                      className="w-10 h-8 p-0.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
                      title="Choose color hex"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleAddValue}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Values list preview */}
                <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 bg-white rounded-lg border border-slate-200">
                  {values.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No values added yet. Type above and click Add.</span>
                  ) : (
                    values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-900 group"
                      >
                        {v.code && (
                          <span 
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: v.code }}
                          />
                        )}
                        <span>{v.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(v.id)}
                          className="text-purple-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editingAttr ? 'Update Attribute' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAttr && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Delete Attribute?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{deletingAttr.name}</strong>? Existing products will preserve their saved variants.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAttr(null)}
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
