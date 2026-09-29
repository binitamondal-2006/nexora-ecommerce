const express = require('express');
const router = express.Router();
const db = require('../db');

// Mock verified reviews generator
function generateProductReviews(product) {
  const reviewerNames = [
    'Rohan Kulkarni', 'Ananya Sengupta', 'Vikramaditya Rao', 'Deepika Nair',
    'Mohit Chawla', 'Kavita Joshi', 'Arjun Nambiar', 'Pooja Verma',
    'Siddharth Kapoor', 'Swati Deshmukh'
  ];
  
  const positiveSnippets = [
    'Phenomenal build quality and lightning-fast delivery! Nexora packaged it with extreme care.',
    'Exceeded my expectations for the price. The finish and functionality are top notch.',
    'Genuine authentic product. I cross-checked the serial number on the manufacturer website.',
    'Super fast dispatch, arrived in less than 24 hours. Battery/performance is rock solid.',
    'Best deal I found across Amazon and Flipkart. Saved over ₹2,000 using the festive coupon!'
  ];

  const reviewList = [];
  const count = Math.min(5, Math.max(3, Math.floor(product.rating)));
  for (let i = 0; i < count; i++) {
    const rScore = i === 0 ? 5 : (product.rating >= 4.2 ? (i % 2 === 0 ? 5 : 4) : 4);
    reviewList.push({
      id: `rev_${product.id}_${i}`,
      author: reviewerNames[(product.numeric_id + i * 3) % reviewerNames.length],
      rating: rScore,
      title: rScore === 5 ? 'Exceptional Value & Quality' : 'Very Good Purchase, Value for Money',
      comment: positiveSnippets[(product.numeric_id + i) % positiveSnippets.length],
      verifiedPurchase: true,
      helpfulCount: (product.numeric_id * (i + 1)) % 145 + 12,
      date: new Date(Date.now() - (i * 7 + 2) * 86400000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    });
  }

  return reviewList;
}

// GET /api/products
router.get('/', (req, res) => {
  try {
    const result = db.getProducts(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products: ' + err.message });
  }
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get categories.' });
  }
});

// GET /api/products/brands
router.get('/brands', (req, res) => {
  try {
    const brands = db.getBrands();
    res.json({ brands });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get brands.' });
  }
});

// GET /api/products/deals
router.get('/deals', (req, res) => {
  try {
    const featured = db.getFeaturedDeals();
    res.json(featured);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get featured deals.' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.id || req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Related products from same category
    const related = db.getProducts({
      category: product.category,
      limit: 6
    }).products.filter(p => p.id !== product.id).slice(0, 4);

    const reviews = generateProductReviews(product);

    // AI sentiment breakdown
    const aiInsight = {
      score: Math.round(product.rating * 20),
      verdict: product.ai_verdict,
      pros: [
        'Superior performance within its segment',
        'High build quality and premium material finish',
        'Verified authentic unit with official manufacturer warranty',
        'Consistently rated 4+ stars across thousands of verified buyers'
      ],
      cons: [
        'High demand; limited flash sale stock remaining',
        'Color options sell out quickly during sale events'
      ],
      priceDropLikelihood: product.discount_percent > 40 ? 'Lowest price in 30 days (Strong Buy)' : 'Fair market price with active coupons'
    };

    res.json({
      product,
      reviews,
      related,
      aiInsight
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get product details: ' + err.message });
  }
});

module.exports = router;
