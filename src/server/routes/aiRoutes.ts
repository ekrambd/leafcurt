import { Router, Request, Response } from 'express';
import { geminiSkincareService, SkincareAnalysisRequest } from '../services/geminiService';
import { loadSettingsFromDisk } from '../data/store';

export const aiRouter = Router();

// POST /api/ai/consult - Consult Skincare Doctor
aiRouter.post('/consult', async (req: Request, res: Response) => {
  try {
    const { messages, selectedProducts, skinType, skinConcern, language } = req.body as SkincareAnalysisRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: "messages" array is required.'
      });
      return;
    }

    const storeSettings = loadSettingsFromDisk();
    const storeName = storeSettings?.storeName || 'Store';

    const result = await geminiSkincareService.consultSkincareDoctor({
      messages,
      selectedProducts,
      skinType,
      skinConcern,
      language
    }, storeName);

    res.json({
      success: true,
      reply: result.reply,
      model: result.model
    });
  } catch (error: any) {
    console.error('AI Skincare Doctor error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process AI skincare consultation'
    });
  }
});

// POST /api/ai/analyze-routine - Quick multi-product routine builder
aiRouter.post('/analyze-routine', async (req: Request, res: Response) => {
  try {
    const { products, skinType, skinConcern, language } = req.body;
    const storeSettings = loadSettingsFromDisk();
    const storeName = storeSettings?.storeName || 'Store';

    const messages = [
      {
        role: 'user' as const,
        content: `অনুগ্রহ করে নিচের ${products?.length || 0} টি প্রোডাক্টের বিস্তারিত বিশ্লেষণ ও AM/PM ব্যবহারবিধি দিন।`
      }
    ];

    const result = await geminiSkincareService.consultSkincareDoctor({
      messages,
      selectedProducts: products,
      skinType,
      skinConcern,
      language: language || 'bn'
    }, storeName);

    res.json({
      success: true,
      analysis: result.reply,
      model: result.model
    });
  } catch (error: any) {
    console.error('AI Routine Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze skincare routine'
    });
  }
});

// POST /api/ai/generate-spotlight - Generate luxury spotlight copy for product or category
aiRouter.post('/generate-spotlight', async (req: Request, res: Response) => {
  try {
    const { product, categoryName } = req.body;
    const result = await geminiSkincareService.generateSpotlightCopy({ product, categoryName });
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('AI Spotlight Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate spotlight copy'
    });
  }
});

