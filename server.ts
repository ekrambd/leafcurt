import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import zlib from "zlib";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { app } from "./src/server/app";
import { storeProducts, loadSettingsFromDisk } from "./src/server/data/store";

const httpServer = http.createServer(app);

function injectServerMeta(html: string, reqPath: string, host: string, proto: string): string {
  const settings = loadSettingsFromDisk();
  const storeName = settings?.storeName || settings?.headerSettings?.brandName || "Store";
  const defaultDesc = settings?.footerDescription || settings?.storeTagline || `Welcome to ${storeName} - Authentic online shopping with Cash on Delivery across Bangladesh.`;
  const defaultLogo = settings?.storeLogo || settings?.headerSettings?.logoUrl || "";
  let title = `${storeName} - Official Online Store`;
  let description = defaultDesc;
  let image = defaultLogo ? (defaultLogo.startsWith('http') ? defaultLogo : `https://${host}${defaultLogo}`) : `https://${host}/favicon.ico`;
  const fullUrl = `${proto}://${host}${reqPath}`;

  const schemas: any[] = [];
  let matchedProduct: any = null;

  if (reqPath.startsWith('/product')) {
    const pathLower = reqPath.toLowerCase();
    matchedProduct = storeProducts.find(p => {
      const pId = p.id.toLowerCase();
      const pSlug = (p.title || '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return pathLower.includes(pId) || (pSlug.length > 3 && pathLower.includes(pSlug));
    });

    if (matchedProduct) {
      title = `${matchedProduct.title} | ${storeName}`;
      description = matchedProduct.description || matchedProduct.subtitle || description;
      image = matchedProduct.coverImage || matchedProduct.image || image;

      // Product Schema for Google Search & AI Engines (AEO/GEO)
      schemas.push({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": matchedProduct.title,
        "image": image.startsWith('http') ? image : `https://${host}${image}`,
        "description": description,
        "sku": matchedProduct.id,
        "brand": {
          "@type": "Brand",
          "name": matchedProduct.brand || storeName
        },
        "offers": {
          "@type": "Offer",
          "url": fullUrl,
          "priceCurrency": "BDT",
          "price": matchedProduct.price || matchedProduct.regularPrice || 0,
          "availability": (matchedProduct.stockQuantity && matchedProduct.stockQuantity > 0) || matchedProduct.isAvailable !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition",
          "priceValidUntil": "2027-12-31",
          "seller": {
            "@type": "Organization",
            "name": storeName
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "BD",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 7,
            "returnMethod": "https://schema.org/ReturnByMail"
          },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": settings?.deliveryChargeInsideDhaka ?? 60,
              "currency": "BDT"
            },
            "shippingDestination": {
              "@type": "DefinedRegion",
              "addressCountry": "BD"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
              "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" }
            }
          }
        }
      });
    }
  } else if (reqPath.startsWith('/shop')) {
    title = `Shop Catalog | ${storeName}`;
    description = `Explore our complete collection and products on ${storeName}.`;
  } else if (reqPath.startsWith('/about')) {
    title = `About Us | ${storeName}`;
    description = `Learn about ${storeName}, our story, values, and commitment to quality.`;
  } else if (reqPath.startsWith('/contact')) {
    title = `Contact Us & Customer Support | ${storeName}`;
    description = `Reach out to the ${storeName} team via WhatsApp, phone, or email for customer support and order inquiries.`;
  } else if (reqPath.startsWith('/quiz')) {
    title = `Personalized Product Quiz | ${storeName}`;
    description = `Take the 1-minute quiz to find your personalized recommendations on ${storeName}.`;
  } else {
    return html;
  }

  // BreadcrumbList Structured Data
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://${host}/` },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": `https://${host}/shop` },
      ...(matchedProduct ? [{ "@type": "ListItem", "position": 3, "name": matchedProduct.title, "item": fullUrl }] : [])
    ]
  });

  // Direct Q&A FAQPage Schema for AI Answer Engine Optimization (AEO/GEO)
  schemas.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Cash on Delivery available for this in Bangladesh?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Cash on Delivery (COD) is available across all 64 districts in Bangladesh with 24-48 hour delivery inside Dhaka and 48-72 hours outside Dhaka via Steadfast and Pathao couriers."
        }
      },
      {
        "@type": "Question",
        "name": `Are products on ${storeName} 100% authentic?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, all items sold on ${storeName} are 100% authentic, verified for quality, and backed by our customer satisfaction guarantee.`
        }
      }
    ]
  });

  let modified = html;
  // Replace Title
  modified = modified.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

  // Replace Meta Description
  modified = modified.replace(/<meta name="description" content=".*?"\s*\/?>/i, `<meta name="description" content="${description}" />`);

  // Replace OpenGraph tags
  modified = modified.replace(/<meta property="og:title" content=".*?"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  modified = modified.replace(/<meta property="og:description" content=".*?"\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
  modified = modified.replace(/<meta property="og:image" content=".*?"\s*\/?>/i, `<meta property="og:image" content="${image}" />`);
  modified = modified.replace(/<meta property="og:url" content=".*?"\s*\/?>/i, `<meta property="og:url" content="${fullUrl}" />`);

  // Replace Twitter card tags
  modified = modified.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
  modified = modified.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);
  modified = modified.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${image}" />`);

  // Canonical link tag injection
  const canonicalTag = `<link rel="canonical" href="${fullUrl}" />`;
  const schemaScript = `<script type="application/ld+json" id="server-seo-schemas">${JSON.stringify(schemas)}</script>`;

  if (modified.includes('</head>')) {
    modified = modified.replace('</head>', `  ${canonicalTag}\n  ${schemaScript}\n</head>`);
  }

  return modified;
}

// Vercel injects production variables. Local development reads the ignored file.
dotenv.config({ path: '.env.local' });

function injectTrackingScripts(html: string): string {
  const pixelId = (process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || '').trim();
  if (!pixelId) return html;

  const trackingSnippet = `
    <!-- Meta Pixel Code -->
    <script id="fb-pixel-script">
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
      window.__META_PIXEL_ID__ = '${pixelId}';
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel Code -->
  `;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${trackingSnippet}\n</head>`);
  }
  return html + trackingSnippet;
}

const PORT = Number(process.env.PORT) || 3004;

// Native HTTP Gzip/Deflate Compression Middleware (Zero dependency)
app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
    return next();
  }

  const originalSend = res.send.bind(res);
  res.send = (body: any) => {
    // Only compress text, json, and html payloads larger than 1KB
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      const contentType = (res.getHeader('Content-Type') as string) || '';
      const isCompressible = contentType.includes('text') || contentType.includes('json') || contentType.includes('javascript') || contentType.includes('xml');

      if (isCompressible && (typeof body === 'string' ? Buffer.byteLength(body) : body.length) > 1024) {
        if (acceptEncoding.includes('gzip')) {
          res.setHeader('Content-Encoding', 'gzip');
          res.removeHeader('Content-Length');
          return zlib.gzip(body, (err, compressed) => {
            if (err) return originalSend(body);
            originalSend(compressed);
          });
        }
      }
    }
    return originalSend(body);
  };
  next();
});

// ==================== VITE / STATIC SERVER ====================
async function startServer() {
  const isDev = 
    process.env.npm_lifecycle_event === 'dev' || 
    process.argv.includes('--dev') || 
    process.env.NODE_ENV === 'development' || 
    !fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
        watch: {
          ignored: [
            '**/prisma/**',
            '**/*.db',
            '**/*.db-*',
            '**/*.sqlite*',
            '**/*.json',
            '**/.backups/**',
            '**/.agents/**',
            '**/dist/**',
            '**/public/uploads/**',
            '**/.git/**',
            '**/node_modules/**'
          ]
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/cdn') || url.startsWith('/uploads')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Static Assets Cache (Immutable 1-year cache for fingerprinted JS/CSS/Images, disable auto index.html to allow dynamic SSR injection)
    app.use(express.static(distPath, {
      index: false,
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));

    // Fallback static files directly from public directory
    app.use(express.static(path.join(process.cwd(), 'public'), { index: false }));

    const getIndexHtml = () => {
      let filePath = path.join(distPath, 'index.html');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), 'index.html');
      }
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, 'utf-8');
        const etag = `"${crypto.createHash('md5').update(html).digest('hex')}"`;
        return { html, etag };
      }
      return { html: null, etag: null };
    };

    // SPA Page Route Handler with Dynamic Server-side Meta & Tracking Script Injection
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/cdn') || req.path.startsWith('/uploads')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      // Never serve index.html for static script/asset requests to avoid MIME type errors
      if (/\.(js|mjs|cjs|ts|tsx|css|map|wasm|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i.test(req.path)) {
        return res.status(404).type('text/plain').send('Asset not found');
      }

      const { html } = getIndexHtml();
      if (!html) {
        return res.sendFile(path.join(process.cwd(), 'index.html'));
      }

      const host = req.headers.host || 'store.com';
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const isDynamicRoute = req.path.startsWith('/product') || req.path.startsWith('/shop') || req.path.startsWith('/about') || req.path.startsWith('/contact') || req.path.startsWith('/quiz');

      let pageHtml = html;
      if (isDynamicRoute) {
        pageHtml = injectServerMeta(html, req.path, host, proto);
      }
      pageHtml = injectTrackingScripts(pageHtml);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(pageHtml);
    });
  }

  httpServer.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Run the following command in terminal to free port ${PORT}:`);
      console.error(`   lsof -ti :${PORT} | xargs kill -9\n`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Noor E-Commerce Architecture active on http://localhost:${PORT}`);
  });
}

startServer();
