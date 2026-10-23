import React from 'react';
import { BlogPost } from '../types';
import { ArrowLeft, ArrowRight, Share2, Facebook, Twitter, ArrowUp, BookOpen } from 'lucide-react';
import { formatArticleHtml } from '../lib/blogFormatter';

interface BlogPostPageProps {
  post: BlogPost;
  allPosts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onNavigateBlog: () => void;
  onNavigateHome: () => void;
}

export default function BlogPostPage({
  post,
  allPosts,
  onSelectPost,
  onNavigateBlog,
  onNavigateHome
}: BlogPostPageProps) {
  const publishedPosts = (allPosts || []).filter(p => p && p.isPublished !== false);
  const currentIndex = publishedPosts.findIndex(p => p.id === post.id);

  const prevPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < publishedPosts.length - 1 ? publishedPosts[currentIndex + 1] : null;

  const relatedPosts = publishedPosts.filter(p => p.id !== post.id).slice(0, 3);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = encodeURIComponent(post.title);

  return (
    <article className="min-h-screen bg-white">
      {/* Header Container */}
      <div className="pt-10 sm:pt-16 pb-8 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Category Pill */}
        <button
          onClick={onNavigateBlog}
          className="text-[11px] font-bold tracking-widest text-slate-500 uppercase hover:text-purple-700 transition cursor-pointer mb-4 inline-block"
        >
          BLOG
        </button>

        {/* Title */}
        <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-8">
          {post.title}
        </h1>

        {/* Cover Image / Infographic */}
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-50 max-w-3xl mx-auto">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[550px]"
            />
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div 
          className="blog-article-content"
          dangerouslySetInnerHTML={{ 
            __html: formatArticleHtml(post.content || post.excerpt || '') 
          }} 
        />

        {/* Share Section */}
        <div className="pt-10 mt-10 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-600">
          <span>Share:</span>
          <div className="flex items-center gap-2">
            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Facebook className="w-4 h-4" />
            </a>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <span className="font-bold text-xs">𝕏</span>
            </a>

            {/* Pinterest */}
            <a
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(post.coverImage || '')}&description=${shareTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Pinterest"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer font-serif font-black text-xs"
            >
              P
            </a>
          </div>
        </div>

        {/* Previous & Next Article Navigation Bar */}
        <div className="pt-8 mt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start text-left">
          
          {/* Previous Post */}
          <div>
            {prevPost ? (
              <button
                type="button"
                onClick={() => onSelectPost(prevPost)}
                className="group flex flex-col text-left cursor-pointer"
              >
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-1 group-hover:text-purple-700 transition">
                  <ArrowLeft className="w-3 h-3" />
                  PREVIOUS
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-purple-700 transition line-clamp-2">
                  {prevPost.title}
                </span>
              </button>
            ) : <div />}
          </div>

          {/* Next Post */}
          <div className="sm:text-right">
            {nextPost ? (
              <button
                type="button"
                onClick={() => onSelectPost(nextPost)}
                className="group flex flex-col sm:items-end text-left sm:text-right cursor-pointer"
              >
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-1 group-hover:text-purple-700 transition">
                  NEXT
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-purple-700 transition line-clamp-2">
                  {nextPost.title}
                </span>
              </button>
            ) : <div />}
          </div>

        </div>
      </div>

      {/* Related Articles Section */}
      {relatedPosts.length > 0 && (
        <section className="py-14 sm:py-20 border-t border-slate-100 bg-slate-50/50 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-center mb-10 sm:mb-12">
              Related Articles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedPosts.map((rel) => (
                <article
                  key={rel.id}
                  onClick={() => onSelectPost(rel)}
                  className="group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-4 relative">
                      {rel.coverImage ? (
                        <img
                          src={rel.coverImage}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors leading-snug mb-2">
                      {rel.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal line-clamp-2 mb-3">
                      {rel.excerpt}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 underline underline-offset-4 transition-colors">
                    Read more
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floating Back to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-all active:scale-95"
        title="Back to Top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </article>
  );
}
