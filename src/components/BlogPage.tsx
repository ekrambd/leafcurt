import React from 'react';
import { BlogPost } from '../types';
import { BookOpen } from 'lucide-react';

interface BlogPageProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onNavigateHome: () => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'October 16, 2026';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return 'October 16, 2026';
  }
}

export default function BlogPage({ posts, onSelectPost, onNavigateHome }: BlogPageProps) {
  const publishedPosts = (posts || []).filter(p => p && p.isPublished !== false);

  if (publishedPosts.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mx-auto mb-4 border border-sky-100">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-2xl text-slate-900 mb-2">কোনো ব্লগ পোস্ট পাওয়া যায়নি</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          অ্যাডমিন প্যানেল থেকে নতুন ব্লগ আর্টিকেল পাবলিশ করা হলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
        </p>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          হোম পেজে ফিরুন
        </button>
      </div>
    );
  }

  // Find featured post (flagged isFeatured, or the first post)
  const featuredPost = publishedPosts.find(p => p.isFeatured) || publishedPosts[0];
  const gridPosts = publishedPosts.filter(p => p.id !== featuredPost.id);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* 1. Top Featured Hero Article */}
        {featuredPost && (
          <article
            onClick={() => onSelectPost(featuredPost)}
            className="group cursor-pointer bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 mb-10 sm:mb-14"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
              {/* Featured Cover Image */}
              <div className="relative w-full h-full min-h-[260px] sm:min-h-[340px] max-h-[420px] overflow-hidden bg-slate-100">
                {featuredPost.coverImage ? (
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                    <BookOpen className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Featured Content Right */}
              <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
                <span className="px-3 py-1 bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-md w-fit mb-4">
                  FEATURED
                </span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4 group-hover:text-[#0284c7] transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mb-5 line-clamp-3 sm:line-clamp-4">
                  {featuredPost.excerpt}
                </p>

                <div className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
                  {formatDate(featuredPost.createdAt)} • {featuredPost.readTime || '9 min read'}
                </div>

                <div className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  <span className="underline underline-offset-4">Read article</span>
                  <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* 2. Three-column Grid of Other Articles */}
        {gridPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Thumbnail Image */}
                <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-3.5 relative shadow-2xs">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h3>
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
