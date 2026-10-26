import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, LogOut, Menu, X, Check, ShoppingBag, ShoppingCart, ClipboardList, Package, LayoutDashboard, User, Code, Truck, CreditCard, Tag, Boxes, Store, Globe, Layout, Layers, Bell, Coins, Send, Sparkles, Eye, Bookmark, Camera, HeartHandshake, Zap, Mail, Award, BookOpen, Video
} from 'lucide-react';
import { dbService, subscribeToOrders } from '../lib/dbService';
import { ApiClient } from '../services/apiClient';
import { BookOrder, ActiveTab, Product, Customer, EcomSettings } from '../types';
import DashboardOverview from './DashboardOverview';
import ProfileSettings from './ProfileSettings';
import { lazy, Suspense } from 'react';
const OrderManager = lazy(() => import('./OrderManager'));
const ProductManager = lazy(() => import('./ProductManager'));
const CustomerManager = lazy(() => import('./CustomerManager'));
const AbandonedCartManager = lazy(() => import('./AbandonedCartManager'));
const CouponManager = lazy(() => import('./CouponManager'));
const ContactMessagesManager = lazy(() => import('./ContactMessagesManager'));
const StockInventoryManager = lazy(() => import('./StockInventoryManager'));
const CategoryManager = lazy(() => import('./CategoryManager'));
const BrandManager = lazy(() => import('./BrandManager'));
const LandingPageManager = lazy(() => import('./LandingPageManager'));
const PixelSettingsManager = lazy(() => import('./PixelSettingsManager'));
const CourierSettingsManager = lazy(() => import('./CourierSettingsManager'));
const PaymentSettingsManager = lazy(() => import('./PaymentSettingsManager'));
const DeliverySettingsManager = lazy(() => import('./DeliverySettingsManager'));
const AboutUsManager = lazy(() => import('./AboutUsManager'));
const FlashSaleManager = lazy(() => import('./FlashSaleManager'));
const HighlightSpotlightManager = lazy(() => import('./HighlightSpotlightManager'));
const BlogManager = lazy(() => import('./BlogManager'));
const SliderManager = lazy(() => import('./SliderManager'));
const VideoReviewsManager = lazy(() => import('./VideoReviewsManager'));
import { TabContentSkeleton } from './LoadingSkeleton';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
}

export default function AdminDashboard({ adminEmail, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // App States
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [abandonedCount, setAbandonedCount] = useState<number>(0);
  const [storeSettings, setStoreSettings] = useState<EcomSettings | null>(null);
  const [viewsOverview, setViewsOverview] = useState<{ websiteViews: number; landingViews: number; totalProductViews: number }>({ websiteViews: 0, landingViews: 0, totalProductViews: 0 });
  const [loading, setLoading] = useState(true);

  // Helper to deduplicate orders by ID
  const deduplicateOrders = (list: BookOrder[]): BookOrder[] => {
    const seen = new Set<string>();
    return list.filter(o => {
      if (!o.id) return true;
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  };

  // New order toast state
  const [newOrderToast, setNewOrderToast] = useState<BookOrder | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio not available
    }
  }, []);

  // Load initial data then subscribe to real-time orders
  useEffect(() => {
    async function loadInitial() {
      try {
        const [orderList, prodList, custList, settings] = await Promise.all([
          dbService.getBookOrders(),
          dbService.getProducts(),
          dbService.getCustomers(),
          dbService.getEcomSettings()
        ]);
        
        // Update Favicon based on settings
        if (settings.storeLogo) {
          let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.storeLogo;
        }

        // Seed known IDs from initial fetch (no toast for these)
        const uniqueOrders = deduplicateOrders(orderList);
        uniqueOrders.forEach(o => knownOrderIds.current.add(o.id));
        setOrders(uniqueOrders);
        setProducts(prodList);
        setCustomers(custList);
        setStoreSettings(settings);
        dbService.getAbandonedCarts('abandoned').then(res => setAbandonedCount(res.metrics?.totalAbandoned || 0)).catch(() => {});

        // Run auto-sync of Steadfast courier status in the background
        setTimeout(async () => {
          try {
            const inTransit = orderList.filter(o => o.steadfastTrackingCode && o.status !== 'Delivered' && o.status !== 'Cancelled');
            if (inTransit.length > 0) {
              const settings = await dbService.getEcomSettings();
              const earnRate = settings.pointsEarnRate || 10;
              
              for (const order of inTransit) {
                try {
                  const result = await ApiClient.getSteadfastStatus(order.steadfastTrackingCode!);
                  const normalized = result.status.toLowerCase();
                  const newStatus = normalized === 'delivered'
                    ? 'Delivered'
                    : normalized.includes('cancelled')
                      ? 'Cancelled'
                      : order.status;

                  if (newStatus !== order.status) {
                    await dbService.updateBookOrder({ 
                      ...order, 
                      status: newStatus, 
                      steadfastStatus: result.status 
                    });

                    if (settings.pointsEnabled) {
                      const earnedPoints = Math.floor(((order.price || 0) * earnRate) / 100);
                      if (earnedPoints > 0) {
                        const customer = custList.find(c => c.id === order.phone || c.phone === order.phone);
                        if (customer) {
                          let newPoints = customer.points || 0;
                          if (newStatus === 'Delivered') {
                            newPoints += earnedPoints;
                          }
                          await dbService.saveCustomer({
                            ...customer,
                            points: newPoints
                          });
                        }
                      }
                    }
                  }
                } catch (singleErr) {
                  console.warn('Auto steadfast sync failed for order:', order.id, singleErr);
                }
              }
            }
          } catch (syncErr) {
            console.error('Error running steadfast auto-sync:', syncErr);
          }
        }, 1500);
        dbService.getGlobalViews().then(setViewsOverview).catch(() => {});
        document.title = 'E-commerce Admin | Watch Store';
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
    loadInitial();

    const handleSettingsUpdate = async () => {
      try {
        const settings = await dbService.getEcomSettings();
        setStoreSettings(settings);
        if (settings.storeName) {
          document.title = `E-commerce Admin | ${settings.storeName}`;
        }
        dbService.getGlobalViews().then(setViewsOverview).catch(() => {});
        if (settings.storeLogo) {
          let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.storeLogo;
        }
      } catch (e) {}
    };

    window.addEventListener('ecom-settings-updated', handleSettingsUpdate);

    // Real-time Firestore listener for orders
    const unsubOrders = subscribeToOrders((liveOrders) => {
      if (isFirstLoad.current) return; // skip during initial load
      const uniqueOrders = deduplicateOrders(liveOrders);
      setOrders(uniqueOrders);

      // Detect brand-new orders
      uniqueOrders.forEach(o => {
        if (!knownOrderIds.current.has(o.id)) {
          knownOrderIds.current.add(o.id);
          // Show toast for the newest order
          setNewOrderToast(o);
          playNotificationSound();
          // Auto-dismiss after 6 seconds
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setNewOrderToast(null), 6000);
        }
      });
    });

    const handleSync = () => {
      dbService.getProducts().then(setProducts);
      dbService.getCustomers().then(setCustomers);
    };
    window.addEventListener('ecom-products-updated', handleSync);

    const handleAbandonedSync = () => {
      dbService.getAbandonedCarts('abandoned').then(res => setAbandonedCount(res.metrics?.totalAbandoned || 0)).catch(() => {});
    };
    window.addEventListener('abandoned-carts-updated', handleAbandonedSync);

    return () => {
      unsubOrders();
      window.removeEventListener('ecom-products-updated', handleSync);
      window.removeEventListener('abandoned-carts-updated', handleAbandonedSync);
      window.removeEventListener('ecom-settings-updated', handleSettingsUpdate);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [playNotificationSound]);

  // Handlers for products
  const handleAddProduct = async (product: Product) => {
    const added = await dbService.addProduct(product);
    setProducts(prev => [added, ...prev.filter(p => p.id !== added.id)]);
  };

  const handleUpdateProduct = async (product: Product) => {
    const updated = await dbService.updateProduct(product);
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProduct = async (id: string) => {
    await dbService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Handlers for book order management
  const handleAddOrder = async (order: BookOrder) => {
    const added = await dbService.addBookOrder(order);
    setOrders(prev => [added, ...prev.filter(o => o.id !== added.id)]);
    const updatedCust = await dbService.getCustomers();
    setCustomers(updatedCust);
  };

  const handleUpdateOrder = async (order: BookOrder) => {
    const oldOrder = orders.find(o => o.id === order.id);
    const wasDelivered = oldOrder?.status === 'Delivered';
    const isNowDelivered = order.status === 'Delivered';

    const updated = await dbService.updateBookOrder(order);

    try {
      const settings = await dbService.getEcomSettings();
      if (settings.pointsEnabled) {
        const earnRate = settings.pointsEarnRate || 10;
        const earnedPoints = Math.floor(((order.price || 0) * earnRate) / 100);
        
        if (earnedPoints > 0) {
          const cleanPhone = order.phone.trim();
          const customersList = await dbService.getCustomers();
          const customer = customersList.find(c => c.id === cleanPhone || c.phone === cleanPhone);

          if (customer) {
            let newPoints = customer.points || 0;
            if (isNowDelivered && !wasDelivered) {
              newPoints += earnedPoints;
            } else if (wasDelivered && !isNowDelivered) {
              newPoints = Math.max(0, newPoints - earnedPoints);
            }

            if (newPoints !== (customer.points || 0)) {
              await dbService.saveCustomer({
                ...customer,
                points: newPoints
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error updating customer points:', err);
    }

    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    const updatedCust = await dbService.getCustomers();
    setCustomers(updatedCust);
  };

  const handleDeleteOrder = async (id: string) => {
    await dbService.deleteBookOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    const updatedCust = await dbService.getCustomers();
    setCustomers(updatedCust);
  };

  const menuItems = [
    // --- Group 1: Overview & Stock ---
    { id: 'header_overview' as any, isHeader: true, label: 'Overview' },
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory' as const, label: 'Inventory', icon: Boxes },

    // --- Group 2: Orders & Customers ---
    { id: 'header_sales' as any, isHeader: true, label: 'Orders & Sales' },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
    { id: 'abandoned_carts' as const, label: 'Abandoned Cart', icon: ShoppingCart },
    { id: 'customers' as const, label: 'Customers', icon: Users },
    { id: 'contact_messages' as const, label: 'Messages', icon: Mail },

    // --- Group 3: Products & Catalog ---
    { id: 'header_catalog' as any, isHeader: true, label: 'Catalog' },
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'category_management' as const, label: 'Categories', icon: Layers },
    { id: 'brand_management' as const, label: 'Brands', icon: Bookmark },

    // --- Group 4: Marketing & Content ---
    { id: 'header_marketing' as any, isHeader: true, label: 'Marketing' },
    { id: 'coupons' as const, label: 'Coupons', icon: Tag },
    { id: 'flash_sale' as const, label: 'Flash Sale', icon: Zap },
    { id: 'highlight_spotlight' as const, label: 'Highlights', icon: Sparkles },
    { id: 'video_reviews' as const, label: 'Video Reviews', icon: Video },
    { id: 'landing_setup' as const, label: 'Landing Pages', icon: Globe },
    { id: 'slider_management' as const, label: 'Hero Slider', icon: Layout },
    { id: 'blog_manager' as const, label: 'Blog Articles', icon: BookOpen },

    // --- Group 5: Settings & Setup ---
    { id: 'header_settings' as any, isHeader: true, label: 'Settings' },
    { id: 'delivery_settings' as const, label: 'Delivery', icon: Truck },
    { id: 'courier_settings' as const, label: 'Courier', icon: Send },
    { id: 'payment_settings' as const, label: 'Payments', icon: CreditCard },
    { id: 'pixel_settings' as const, label: 'Pixel & GTM', icon: Code },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="admin-scope min-h-screen bg-slate-50 flex font-sans text-slate-800">

      {/* ===== New Order Toast Notification ===== */}
      <AnimatePresence>
        {newOrderToast && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-[9999] w-80 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/40 border border-slate-700 overflow-hidden"
          >
            {/* Progress bar */}
            <motion.div
              className="h-1 bg-teal-400"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6, ease: 'linear' }}
            />
            <div className="p-4 flex items-start gap-3">
              <div className="p-2 bg-teal-500/20 rounded-xl shrink-0 mt-0.5">
                <Bell className="h-5 w-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-teal-400 mb-0.5">🎉 New Order Received!</p>
                <p className="text-sm font-bold text-white truncate">{newOrderToast.customerName || 'Unknown Customer'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{newOrderToast.id} · Tk.{((newOrderToast as any).orderTotal ?? newOrderToast.price ?? 0).toLocaleString()}</p>
                <button
                  onClick={() => { setActiveTab('orders'); setNewOrderToast(null); }}
                  className="mt-2 text-[11px] font-bold text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  View Order →
                </button>
              </div>
              <button
                onClick={() => setNewOrderToast(null)}
                className="text-slate-500 hover:text-white cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex lg:flex-col lg:w-52 bg-[#0279c7] text-white/90 border-r border-[#0269ad] shrink-0 sticky top-0 h-screen shadow-lg select-none">
        {/* Title / Header */}
        <div className="h-16 flex items-center px-4 border-b border-[#0269ad] space-x-2.5 text-white">
          {storeSettings?.storeLogo ? (
            <div className="h-9 w-9 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-xs border border-white/20">
              <img 
                src={storeSettings.storeLogo} 
                alt={storeSettings.storeName || 'Store'} 
                className="h-full w-full object-contain" 
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xs font-black leading-tight text-white truncate tracking-tight">
              {storeSettings?.storeName || 'E-commerce Admin'}
            </h1>
            <span className="text-[10px] text-blue-100 font-semibold block truncate">Control Panel</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.isHeader) {
              return (
                <div key={item.id} className="pt-3 pb-1 px-3">
                  <span className="text-[10px] font-black text-blue-100/75 uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-white text-[#0279c7] shadow-sm font-bold' 
                    : 'text-white/90 hover:bg-[#0269ad] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 mr-2.5 shrink-0 ${isActive ? 'text-[#0279c7]' : 'text-blue-100'}`} />
                <span className="truncate flex-1 text-left">{item.label}</span>
                {item.id === 'abandoned_carts' && abandonedCount > 0 && (
                  <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                    isActive ? 'bg-[#0279c7] text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {abandonedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="relative flex flex-col w-52 bg-[#0279c7] text-white/90 border-r border-[#0269ad] h-full shadow-2xl select-none"
            >
              <div className="absolute top-3.5 right-3">
                <button onClick={() => setSidebarOpen(false)} className="text-white/80 hover:text-white p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="h-16 flex items-center px-4 border-b border-[#0269ad] space-x-2.5 text-white">
                {storeSettings?.storeLogo ? (
                  <div className="h-9 w-9 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-xs border border-white/20">
                    <img 
                      src={storeSettings.storeLogo} 
                      alt={storeSettings.storeName || 'Store'} 
                      className="h-full w-full object-contain" 
                    />
                  </div>
                ) : (
                  <ShoppingBag className="h-6 w-6 text-white shrink-0" />
                )}
                <div className="min-w-0 pr-6">
                  <h1 className="text-xs font-black leading-tight text-white truncate tracking-tight">
                    {storeSettings?.storeName || 'E-commerce Admin'}
                  </h1>
                  <span className="text-[10px] text-blue-100 font-semibold block truncate">Control Panel</span>
                </div>
              </div>

              <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  if (item.isHeader) {
                    return (
                      <div key={item.id} className="pt-3 pb-1 px-3">
                        <span className="text-[10px] font-black text-blue-100/75 uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  const Icon = item.icon!;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-white text-[#0279c7] shadow-sm font-bold' 
                          : 'text-white/90 hover:bg-[#0269ad] hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 mr-2.5 shrink-0 ${isActive ? 'text-[#0279c7]' : 'text-blue-100'}`} />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.id === 'abandoned_carts' && abandonedCount > 0 && (
                        <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                          isActive ? 'bg-[#0279c7] text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {abandonedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Core Body Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl lg:hidden cursor-pointer"
              title="Open the menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="font-extrabold text-slate-900 text-sm sm:text-base lg:text-lg lg:ml-2">
              {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition-all text-xs font-bold cursor-pointer shadow-2xs group"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-slate-500 group-hover:text-rose-600 transition-colors" />
              <span className="hidden sm:inline font-bold">Logout</span>
            </button>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-full">
          {loading ? (
            <TabContentSkeleton />
          ) : (
            <Suspense fallback={<TabContentSkeleton />}>
              <div className="min-h-full">
                {activeTab === 'dashboard' && (
                  <DashboardOverview 
                    products={products}
                    orders={orders}
                    customers={customers}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}
                {activeTab === 'products' && (
                  <ProductManager 
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                  />
                )}
                {activeTab === 'orders' && (
                  <OrderManager 
                    orders={orders}
                    onAddOrder={handleAddOrder}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}
                {activeTab === 'abandoned_carts' && (
                  <AbandonedCartManager />
                )}
                {activeTab === 'inventory' && (
                  <StockInventoryManager />
                )}
                {activeTab === 'customers' && (
                  <CustomerManager 
                    customers={customers}
                  />
                )}
                {activeTab === 'coupons' && (
                  <CouponManager />
                )}
                {activeTab === 'blog_manager' && (
                  <BlogManager />
                )}
                {activeTab === 'contact_messages' && (
                  <ContactMessagesManager />
                )}
                {activeTab === 'category_management' && (
                  <CategoryManager />
                )}
                {activeTab === 'brand_management' && (
                  <BrandManager />
                )}
                {activeTab === 'slider_management' && (
                  <SliderManager />
                )}
                {activeTab === 'video_reviews' && (
                  <VideoReviewsManager />
                )}
                {activeTab === 'flash_sale' && (
                  <FlashSaleManager 
                    products={products}
                  />
                )}
                {activeTab === 'highlight_spotlight' && (
                  <HighlightSpotlightManager 
                    products={products}
                  />
                )}
                {activeTab === 'about_settings' && (
                  <AboutUsManager />
                )}
                {activeTab === 'landing_setup' && (
                  <LandingPageManager />
                )}
                {activeTab === 'payment_settings' && (
                  <PaymentSettingsManager />
                )}
                {activeTab === 'delivery_settings' && (
                  <DeliverySettingsManager />
                )}
                {activeTab === 'pixel_settings' && (
                  <PixelSettingsManager />
                )}
                {activeTab === 'courier_settings' && (
                  <CourierSettingsManager />
                )}
                {activeTab === 'profile' && (
                  <ProfileSettings 
                    adminEmail={adminEmail}
                  />
                )}
              </div>
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
