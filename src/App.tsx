import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { initPixelAndGtm, trackEvent } from './lib/pixelGtmService';
import { ErrorBoundary } from './components/ErrorBoundary';

const LoginPage = lazy(() => import('./components/LoginPage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const loadBookLandingPage = () => import('./components/BookLandingPage');
const BookLandingPage = lazy(loadBookLandingPage);
const StorefrontPage = lazy(() => import('./components/StorefrontPage'));

// Fix: Only preload landing page chunk if visiting a known landing path
if (typeof window !== 'undefined') {
  const path = window.location.pathname;
  if (path.startsWith('/book') || path.startsWith('/landing') || path === '/boi' || path === '/smart-land-survey-book') {
    loadBookLandingPage();
  }
}


function GlobalBrandingFix() {
  return null;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminEmail, setAdminEmail, logoutAdmin } = useAppStore();
  const [pixelId, setPixelId] = useState<string>(() => {
    return (typeof window !== 'undefined' && (window as any).__META_PIXEL_ID__) || (import.meta as any).env.VITE_META_PIXEL_ID || '';
  });
  const [gtmId, setGtmId] = useState<string>(() => {
    return (typeof window !== 'undefined' && (window as any).__GTM_ID__) || (import.meta as any).env.VITE_GTM_ID || '';
  });
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Dynamically fetch from /api/settings if not yet available
    if (!pixelId) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data?.pixelId) setPixelId(data.pixelId);
          if (data?.gtmId) setGtmId(data.gtmId);
        })
        .catch(() => {});
    }
  }, [pixelId]);

  useEffect(() => {
    if (pixelId || gtmId) {
      initPixelAndGtm(pixelId, gtmId);
    }
  }, [pixelId, gtmId]);

  useEffect(() => {
    // Avoid double firing on first SSR mount if already tracked by base HTML script
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Track PageView on SPA route change
    trackEvent('PageView', {
      page_path: location.pathname,
      page_location: window.location.href,
      page_title: document.title
    });
  }, [location.pathname]);

  useEffect(() => {
    // Check initial cached admin session
    const storedEmail = localStorage.getItem('noor_admin_session_email');
    if (storedEmail && !adminEmail) {
      setAdminEmail(storedEmail);
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    // Native background auth check
    const timer = setTimeout(() => {
      void import('./lib/authService').then(({ authService }) => {
        if (cancelled) return;
        unsubscribe = authService.onAuthStateChanged((user) => {
          if (cancelled) return;
          if (user) {
            localStorage.setItem('noor_admin_session_email', user.email || '');
            setAdminEmail(user.email);
          } else {
            const email = localStorage.getItem('noor_admin_session_email');
            setAdminEmail(email || null);
          }
        });
      }).catch((error) => {
        console.warn('Background admin auth check completed:', error);
      });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [adminEmail, setAdminEmail]);

  useEffect(() => {
    // Defer session visitor ping so initial paint & load finish first
    let sessionId = sessionStorage.getItem('noor_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('noor_session_id', sessionId);
    }
    
    let isPinging = false;
    const ping = async () => {
      if (isPinging) return;
      isPinging = true;
      try {
        const { dbService } = await import('./lib/dbService');
        await dbService.pingLiveVisitor(sessionId!, window.location.pathname);
      } catch (err) {
        // fail silently
      } finally {
        isPinging = false;
      }
    };

    // Initial ping after 3 seconds idle, then every 30s
    const initTimer = setTimeout(() => {
      void ping();
    }, 3000);
    const interval = setInterval(ping, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const handleAdminLoginSuccess = (email: string) => {
    localStorage.setItem('noor_admin_session_email', email);
    setAdminEmail(email);
    navigate('/admin/dashboard');
  };

  const handleCustomerLoginSuccess = (identifier: string) => {
    if (identifier.includes('@') && !identifier.startsWith('+') && !identifier.startsWith('01')) {
      handleAdminLoginSuccess(identifier);
      return;
    }
    const cleanPhone = identifier.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
    localStorage.setItem('customer_session_phone', cleanPhone);
    window.dispatchEvent(new Event('customer-auth-changed'));
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      const { authService } = await import('./lib/authService');
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('noor_admin_session_email');
      localStorage.removeItem('admin_token');
      logoutAdmin();
      navigate('/');
    }
  };

  return (
    <div className="bg-[#faf9f6] min-h-screen text-slate-900">
      <Suspense fallback={
        <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#111827] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={
              <StorefrontPage
                onGoToLogin={() => navigate('/login')}
                onGoToLanding={() => navigate('/book')}
              />
            } />
            
            {/* Proper SEO setup: Core app sections continue rendering the app */}
            <Route path="/shop" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/contact" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/about" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/quiz" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/checkout" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blog" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blog/:slug" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blogs" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blogs/news" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blogs/news/:slug" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blogs/blog/:slug" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/blogs/:slug" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/product/:id" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/product/:slug/:id" element={<StorefrontPage onGoToLogin={() => navigate('/login')} onGoToLanding={() => navigate('/book')} />} />
            <Route path="/fantine" element={<Navigate to="/" replace />} />
            
            {/* Fix Duplicate Content: Canonical Redirects for legacy .html routes */}
            <Route path="/store" element={<Navigate to="/shop" replace />} />
            <Route path="/news" element={<Navigate to="/blogs/news" replace />} />
            <Route path="/shop.html" element={<Navigate to="/shop" replace />} />
            <Route path="/contact.html" element={<Navigate to="/contact" replace />} />
            <Route path="/product_385231.html" element={<Navigate to="/product/rapid-acne-treatment-toner/product_385231" replace />} />
            <Route path="/product_*.html" element={<Navigate to="/shop" replace />} />

            {/* Customer Account & Order Tracking */}
            <Route path="/track-order" element={
              <LoginPage 
                onLoginSuccess={handleCustomerLoginSuccess}
                onNavigateHome={() => navigate('/')}
              />
            } />
            <Route path="/my-orders" element={
              <LoginPage 
                onLoginSuccess={handleCustomerLoginSuccess}
                onNavigateHome={() => navigate('/')}
              />
            } />
            
            <Route path="/book" element={
              <BookLandingPage 
                onNavigateHome={() => navigate('/')}
                onNavigateToLogin={() => navigate('/login')}
              />
            } />
            <Route path="/boi" element={<Navigate to="/book" replace />} />
            <Route path="/smart-land-survey-book" element={<Navigate to="/book" replace />} />
            
            <Route path="/login" element={
              <LoginPage 
                onLoginSuccess={handleCustomerLoginSuccess}
                onNavigateHome={() => navigate('/')}
              />
            } />
            <Route path="/admin" element={
              <LoginPage 
                onLoginSuccess={handleAdminLoginSuccess}
                onNavigateHome={() => navigate('/')}
              />
            } />
            
            <Route path="/admin/dashboard" element={
              adminEmail ? (
                <AdminDashboard 
                  adminEmail={adminEmail}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            
            {/* Landing Page Routes */}
            <Route path="/landing/:slug" element={
              <BookLandingPage 
                onNavigateHome={() => navigate('/')}
                onNavigateToLogin={() => navigate('/login')}
              />
            } />

            {/* Direct Product Landing Route (Only catches 1-level deep unrecognized slugs) */}
            <Route path="/:slug" element={
              <BookLandingPage 
                onNavigateHome={() => navigate('/')}
                onNavigateToLogin={() => navigate('/login')}
              />
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <GlobalBrandingFix />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
