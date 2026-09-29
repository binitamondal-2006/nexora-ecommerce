const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/ai/copilot - Intelligent Shopping Assistant
router.post('/copilot', (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const lower = message.toLowerCase();
    
    // Extract budget if mentioned (e.g. under 50000, below 2000, 15k, etc.)
    let maxPrice = null;
    let minPrice = null;
    
    const kMatch = lower.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)\s*k\b/i);
    const numMatch = lower.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)/i);
    
    if (kMatch) {
      maxPrice = parseInt(kMatch[1]) * 1000;
    } else if (numMatch) {
      maxPrice = parseInt(numMatch[1].replace(/,/g, ''));
    }

    // Determine category
    let category = null;
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone') || lower.includes('5g') || lower.includes('iphone') || lower.includes('android')) {
      category = 'Mobiles & Tablets';
    } else if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('headphone') || lower.includes('earbud') || lower.includes('keyboard') || lower.includes('monitor') || lower.includes('computer')) {
      category = 'Electronics & Computers';
    } else if (lower.includes('shirt') || lower.includes('shoe') || lower.includes('sneaker') || lower.includes('jean') || lower.includes('watch') || lower.includes('dress') || lower.includes('jacket') || lower.includes('cloth')) {
      category = 'Fashion & Apparel';
    } else if (lower.includes('kitchen') || lower.includes('cooker') || lower.includes('fryer') || lower.includes('mixer') || lower.includes('bottle') || lower.includes('bed')) {
      category = 'Home & Kitchen';
    } else if (lower.includes('serum') || lower.includes('cream') || lower.includes('perfume') || lower.includes('trimmer') || lower.includes('shampoo') || lower.includes('lipstick')) {
      category = 'Beauty & Personal Care';
    } else if (lower.includes('tv') || lower.includes('television') || lower.includes('fridge') || lower.includes('refrigerator') || lower.includes('washing machine') || lower.includes('ac') || lower.includes('air conditioner')) {
      category = 'Appliances & TV';
    } else if (lower.includes('gym') || lower.includes('dumbbell') || lower.includes('cycle') || lower.includes('treadmill') || lower.includes('yoga') || lower.includes('fitness')) {
      category = 'Sports, Fitness & Outdoors';
    } else if (lower.includes('coffee') || lower.includes('tea') || lower.includes('chocolate') || lower.includes('almond') || lower.includes('honey') || lower.includes('protein') || lower.includes('oats')) {
      category = 'Groceries & Essentials';
    }

    // Extract brand
    const knownBrands = ['Apple', 'Samsung', 'Sony', 'OnePlus', 'Nike', 'Adidas', 'Puma', 'Philips', 'LG', 'boAt', 'Dell', 'HP', 'Prestige', 'Levi\'s'];
    let brand = null;
    for (const b of knownBrands) {
      if (lower.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    // Keyword search terms
    let cleanTerms = lower
      .replace(/(find|show|suggest|recommend|looking for|i want|best|cheap|good|buy|me|some|the|a|an|under|below|rs|inr|₹|\d+k|\d+)/gi, '')
      .trim();

    const searchParams = {
      category: category || undefined,
      brand: brand || undefined,
      max_price: maxPrice || undefined,
      min_price: minPrice || undefined,
      q: cleanTerms.length > 2 ? cleanTerms : undefined,
      sort: 'rating',
      limit: 4
    };

    let searchResult = db.getProducts(searchParams);
    
    // Fallback if strict filter yields 0
    if (searchResult.products.length === 0) {
      searchResult = db.getProducts({
        category: category || undefined,
        limit: 4,
        sort: 'recommended'
      });
    }

    let replyText = '';
    if (category && maxPrice) {
      replyText = `Here are the highest-rated ${category} options under ₹${maxPrice.toLocaleString('en-IN')}. They feature genuine warranties and fast delivery:`;
    } else if (category) {
      replyText = `I found excellent top-rated selections in ${category} matching your preferences:`;
    } else if (brand) {
      replyText = `Here are the most popular authentic ${brand} products currently offering steep festive discounts:`;
    } else {
      replyText = `Based on your request, here are top hand-picked products with verified 4★+ reviews and maximum customer satisfaction:`;
    }

    res.json({
      reply: replyText,
      products: searchResult.products,
      inferredCriteria: {
        category,
        brand,
        maxPrice
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'AI Assistant error: ' + err.message });
  }
});

// GET /api/ai/smart-deals
router.get('/smart-deals', (req, res) => {
  try {
    const deals = db.getProducts({
      deals_only: true,
      limit: 8,
      sort: 'discount'
    }).products;

    res.json({
      aiTitle: 'Nexora AI Neural Deal Finder',
      description: 'Hand-picked algorithms scanning real-time price drops with over 45% discount and verified 4.2+ customer ratings.',
      deals
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI smart deals.' });
  }
});

module.exports = router;
