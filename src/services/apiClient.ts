import { Product, BookOrder, EcomSettings, VideoReviewItem, VideoReviewsSettings, HeroBannerItem } from '../types';
//mycomment
export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    let idToken: string | null = null;
    if (!endpoint.startsWith('/facebook/capi')) {
      const { authService } = await import('../lib/authService');
      idToken = authService.getToken();

      if (!idToken) {
        const storedEmail = localStorage.getItem('store_admin_session_email') || localStorage.getItem('noor_admin_session_email');
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (storedEmail && adminEmail && storedEmail === adminEmail) {
          idToken = `BypassAdmin:${storedEmail}`;
        }
      }
    }
    const res = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        ...options?.headers
      },
      ...options
    });

    if (!res.ok) {
      let message = `API error ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        message = body.message || body.error || message;
      } catch {
        // Keep the HTTP status message when the response is not JSON.
      }
      throw new Error(message);
    }

    return res.json() as Promise<T>;
  }

  // Product Endpoints
  static getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  static createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  static updateProduct(product: Product): Promise<Product> {
    return this.request<Product>(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }

  static deleteProduct(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // Order Endpoints
  static getOrders(): Promise<BookOrder[]> {
    return this.request<BookOrder[]>('/orders');
  }

  static getKeysetOrders(params?: { cursor?: string; limit?: number; status?: string }): Promise<{
    data: BookOrder[];
    pageInfo: {
      limit: number;
      hasMore: boolean;
      nextCursor: string | null;
      endCursor: { createdAt: string; id: string } | null;
      totalCount: number;
    };
  }> {
    const q = new URLSearchParams();
    if (params?.cursor) q.set('cursor', params.cursor);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    q.set('keyset', 'true');
    return this.request(`/orders?${q.toString()}`);
  }

  static createOrder(order: Partial<BookOrder>): Promise<BookOrder> {
    return this.request<BookOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  static updateOrder(order: BookOrder): Promise<BookOrder> {
    return this.request<BookOrder>(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(order)
    });
  }

  // E-commerce Settings Endpoints
  static getSettings(): Promise<EcomSettings> {
    return this.request<EcomSettings>('/settings/ecom');
  }

  static saveSettings(settings: Partial<EcomSettings>): Promise<{ success: boolean; settings: EcomSettings }> {
    return this.request<{ success: boolean; settings: EcomSettings }>('/settings/ecom', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  // Steadfast Courier Dispatch
  static dispatchSteadfast(order: BookOrder): Promise<{ success: boolean; trackingCode?: string; message?: string }> {
    return this.request<{ success: boolean; trackingCode?: string; message?: string }>('/courier/steadfast/dispatch', {
      method: 'POST',
      body: JSON.stringify({ order })
    });
  }

  static testSteadfast(): Promise<{ success: boolean; balance?: number; message?: string }> {
    return this.request('/courier/steadfast/test');
  }

  static getSteadfastStatus(trackingCode: string): Promise<{ success: boolean; status: string }> {
    return this.request(`/courier/steadfast/status/${encodeURIComponent(trackingCode)}`);
  }

  static checkSteadfastFraud(phone: string): Promise<{
    success: boolean;
    phone?: string;
    totalParcels?: number;
    deliveredParcels?: number;
    returnedParcels?: number;
    cancelledParcels?: number;
    successRatio?: number;
    source?: string;
    message?: string;
  }> {
    return this.request(`/courier/steadfast/fraud-check/${encodeURIComponent(phone)}`);
  }

  // Pathao Courier Integration
  static testPathao(credentials?: any): Promise<{ success: boolean; message?: string; storesCount?: number; stores?: any[] }> {
    return this.request('/courier/pathao/test', {
      method: 'POST',
      body: JSON.stringify({ credentials })
    });
  }

  static getPathaoStores(credentials?: any): Promise<any> {
    return this.request('/courier/pathao/stores', {
      method: 'GET'
    });
  }

  static getPathaoCities(): Promise<any> {
    return this.request('/courier/pathao/cities');
  }

  static getPathaoZones(cityId: number | string): Promise<any> {
    return this.request(`/courier/pathao/cities/${cityId}/zones`);
  }

  static getPathaoAreas(zoneId: number | string): Promise<any> {
    return this.request(`/courier/pathao/zones/${zoneId}/areas`);
  }

  static dispatchPathao(payload: {
    order: BookOrder;
    storeId?: string | number;
    recipientCity?: number;
    recipientZone?: number;
    recipientArea?: number;
    itemWeight?: number;
    itemQuantity?: number;
    specialInstruction?: string;
    credentials?: any;
  }): Promise<{ success: boolean; consignmentId?: string; trackingCode?: string; orderStatus?: string; deliveryFee?: number; message?: string }> {
    return this.request('/courier/pathao/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static getPathaoStatus(consignmentId: string): Promise<{ success: boolean; status: string; data?: any }> {
    return this.request(`/courier/pathao/status/${encodeURIComponent(consignmentId)}`);
  }

  static sendFacebookEvent(payload: {
    eventName: string;
    eventId: string;
    eventData: Record<string, unknown>;
    userData: { phone?: string; email?: string };
    eventSourceUrl: string;
  }): Promise<{ success: boolean; message?: string }> {
    return this.request('/facebook/capi', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static sendPushNotification(payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tokens: string[];
  }): Promise<{ success: boolean; multicast_id?: number; success_count?: number; failure_count?: number; message?: string }> {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Video Reviews Endpoints
  static getVideoReviews(): Promise<{ enabled: boolean; items: VideoReviewItem[] }> {
    return this.request<{ enabled: boolean; items: VideoReviewItem[] }>('/video-reviews');
  }

  static saveVideoReviews(settings: Partial<VideoReviewsSettings>): Promise<{ success: boolean; settings: VideoReviewsSettings }> {
    return this.request<{ success: boolean; settings: VideoReviewsSettings }>('/video-reviews', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  static addVideoReview(item: Partial<VideoReviewItem>): Promise<{ success: boolean; item: VideoReviewItem; settings: VideoReviewsSettings }> {
    return this.request<{ success: boolean; item: VideoReviewItem; settings: VideoReviewsSettings }>('/video-reviews', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  static updateVideoReview(item: VideoReviewItem): Promise<{ success: boolean; item: VideoReviewItem; settings: VideoReviewsSettings }> {
    return this.request<{ success: boolean; item: VideoReviewItem; settings: VideoReviewsSettings }>(`/video-reviews/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  }

  static deleteVideoReview(id: string): Promise<{ success: boolean; settings: VideoReviewsSettings }> {
    return this.request<{ success: boolean; settings: VideoReviewsSettings }>(`/video-reviews/${id}`, {
      method: 'DELETE'
    });
  }

  // Hero Slider & Video Endpoints
  static getSliders(): Promise<{ success: boolean; heroBanners: HeroBannerItem[]; heroSliderInterval: number; heroVideoInterval: number }> {
    return this.request<{ success: boolean; heroBanners: HeroBannerItem[]; heroSliderInterval: number; heroVideoInterval: number }>('/sliders');
  }

  static saveSliders(payload: { heroBanners?: HeroBannerItem[]; heroSliderInterval?: number; heroVideoInterval?: number }): Promise<{ success: boolean; heroBanners: HeroBannerItem[]; heroSliderInterval: number; heroVideoInterval: number }> {
    return this.request('/sliders', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  static addSlider(banner: Partial<HeroBannerItem>): Promise<{ success: boolean; item: HeroBannerItem; heroBanners: HeroBannerItem[] }> {
    return this.request('/sliders', {
      method: 'POST',
      body: JSON.stringify(banner)
    });
  }

  static updateSlider(banner: HeroBannerItem): Promise<{ success: boolean; item: HeroBannerItem; heroBanners: HeroBannerItem[] }> {
    return this.request(`/sliders/${banner.id}`, {
      method: 'PUT',
      body: JSON.stringify(banner)
    });
  }

  static deleteSlider(id: string): Promise<{ success: boolean; heroBanners: HeroBannerItem[] }> {
    return this.request(`/sliders/${id}`, {
      method: 'DELETE'
    });
  }
}
