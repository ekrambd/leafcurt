import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, 
  Upload, Image as ImageIcon, CheckCircle2, AlertCircle, 
  Search, ArrowRight, Calendar, User, Tag
} from 'lucide-react';
import { BlogPost, EcomSettings } from '../types';
import { dbService } from '../lib/dbService';
import { uploadFileToStorage } from '../lib/storageService';
import { formatArticleHtml } from '../lib/blogFormatter';

export default function BlogManager() {
  const [settings, setSettings] = useState<EcomSettings | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal / Drawer state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load settings and blog posts
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const s = await dbService.getEcomSettings();
        setSettings(s);
        setPosts(s.blogPosts || []);
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenNew = () => {
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setCoverImage('');
    setExcerpt('');
    setContent('');
    setAuthor(settings?.storeName || 'Admin');
    setIsPublished(true);
    setEditorMode('write');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setCoverImage(post.coverImage || '');
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');
    setAuthor(post.author || settings?.storeName || 'Admin');
    setIsPublished(post.isPublished !== false);
    setEditorMode('write');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const dest = `blog/cover-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const url = await uploadFileToStorage(file, dest);
      setCoverImage(url);
    } catch (err) {
      console.error('Failed to upload blog cover image:', err);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePost = async () => {
    if (!title.trim()) return;

    const finalSlug = slug.trim() ? generateSlug(slug) : generateSlug(title);
    const newPost: BlogPost = {
      id: editingPostId || `blog-${Date.now()}`,
      title: title.trim(),
      slug: finalSlug || `article-${Date.now()}`,
      coverImage: coverImage.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      author: author.trim() || settings?.storeName || 'Admin',
      createdAt: editingPostId 
        ? (posts.find(p => p.id === editingPostId)?.createdAt || new Date().toISOString()) 
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished
    };

    let updatedPosts: BlogPost[];
    if (editingPostId) {
      updatedPosts = posts.map(p => (p.id === editingPostId ? newPost : p));
    } else {
      updatedPosts = [newPost, ...posts];
    }

    setPosts(updatedPosts);
    setIsModalOpen(false);

    // Save to DB
    await savePostsToDb(updatedPosts);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog article?')) return;
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    await savePostsToDb(updated);
  };

  const handleTogglePublish = async (id: string) => {
    const updated = posts.map(p => {
      if (p.id === id) {
        return { ...p, isPublished: p.isPublished === false ? true : false };
      }
      return p;
    });
    setPosts(updated);
    await savePostsToDb(updated);
  };

  const savePostsToDb = async (updatedList: BlogPost[]) => {
    setSaving(true);
    try {
      await dbService.updateEcomSettings({
        blogPosts: updatedList
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed saving blog posts:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span>Blog Articles & Care Guides</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your storefront blog articles, guides, and customer care tips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved Successfully!
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Article</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles by title or excerpt..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Total Articles: <strong className="text-slate-900">{posts.length}</strong>
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
            Published: <strong>{posts.filter(p => p.isPublished !== false).length}</strong>
          </span>
        </div>
      </div>

      {/* Articles Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 font-medium">
          Loading blog articles...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Blog Articles Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No articles match your search filter.' : 'Click "Add New Article" to write your first blog post or care guide.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenNew}
              className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              + Create First Post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden border-b border-slate-100">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {post.isPublished !== false ? (
                      <span className="px-2.5 py-1 bg-emerald-600/90 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase shadow-xs backdrop-blur-xs">
                        Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/90 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase shadow-xs backdrop-blur-xs">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate block max-w-full">
                    /blog/{post.slug}
                  </span>

                  <h3 className="font-sans font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(post.id)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    post.isPublished !== false 
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={post.isPublished !== false ? 'Unpublish (Mark as Draft)' : 'Publish to Storefront'}
                >
                  {post.isPublished !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(post)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                    title="Edit Article"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>{editingPostId ? 'Edit Blog Article' : 'Write New Blog Article'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              
              {/* Title */}
              <div>
                <label className="block mb-1 font-bold">Article Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingPostId) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="e.g. The Secret to Keeping White Clothes Bright"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Slug URL */}
              <div>
                <label className="block mb-1 font-bold">URL Slug (e.g. /blog/my-article-slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="e.g. secret-to-white-clothes"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Cover Image Upload / URL */}
              <div>
                <label className="block mb-1 font-bold">Cover Image / Infographic</label>
                <div className="flex items-center gap-3">
                  {coverImage ? (
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full cursor-pointer shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-300 shrink-0 bg-slate-50">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-bold rounded-xl cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingImage ? 'Uploading...' : 'Upload Cover'}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block mb-1 font-bold">Short Excerpt (Displayed on blog grid) *</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief 1-2 sentence preview of the article..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 text-xs">
                    Full Article Content (NeuAura Editorial Spacing) *
                  </label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setEditorMode('write')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${editorMode === 'write' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Write Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('preview')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${editorMode === 'preview' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>

                {editorMode === 'write' ? (
                  <div className="space-y-2">
                    {/* Quick Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/90 rounded-xl border border-slate-200/80 text-[11px]">
                      <span className="text-slate-500 font-bold px-1 text-[10px] uppercase">Formatting:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setContent(prev => prev + (prev.endsWith('\n\n') ? '' : '\n\n') + '## Main Section Heading\n\n');
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Add Section Heading (H2 - Large font with 48px top gap)"
                      >
                        H2 Section
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContent(prev => prev + (prev.endsWith('\n\n') ? '' : '\n\n') + '### Subheading Title\n\n');
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Add Subheading (H3 - Medium font with 40px top gap)"
                      >
                        H3 Subheading
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContent(prev => prev + (prev.endsWith('\n\n') ? '' : '\n\n'));
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Add Paragraph Break"
                      >
                        ↵ Paragraph Break
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContent(prev => prev + '**Bold Text**');
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Bold Text"
                      >
                        <strong>B</strong> Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '- Bullet point 1\n- Bullet point 2\n');
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Bullet List"
                      >
                        • List
                      </button>
                    </div>

                    <textarea
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type or paste your article text here. Leave an empty line between paragraphs for clean spacing..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500">
                      💡 <strong>Spacing Tip:</strong> Just press Enter twice (leaving a blank line) between paragraphs for generous 24px spacing like NeuAura. Headings and lists are auto-formatted.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 min-h-[220px] max-h-[380px] overflow-y-auto">
                    {content.trim() ? (
                      <div 
                        className="blog-article-content"
                        dangerouslySetInnerHTML={{ __html: formatArticleHtml(content) }}
                      />
                    ) : (
                      <div className="text-center py-12 text-xs text-slate-400">
                        No content entered yet. Switch to "Write Editor" to type or paste text.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Author & Published Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block mb-1 font-bold">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Editorial Team"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-slate-800 text-xs">Publish to Storefront</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!title.trim() || saving}
                onClick={handleSavePost}
                className="px-5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Article</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
