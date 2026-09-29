const express = require('express');
const router = express.Router();
const db = require('../db');

const AVAILABLE_COUPONS = {
  'NEXORA50': {
    code: 'NEXORA50',
    type: 'flat',
    value: 500,
    minOrder: 2499,
    description: 'Flat ₹500 OFF on orders above ₹2,499'
  },
  'FESTIVE20': {
    code: 'FESTIVE20',
    type: 'percentage',
    percentage: 20,
    maxDiscount: 1200,
    minOrder: 1499,
    description: '20% OFF (up to ₹1,200) on festive purchases above ₹1,499'
  },
  'WELCOME100': {
    code: 'WELCOME100',
    type: 'flat',
    value: 100,
    minOrder: 499,
    description: 'Flat ₹100 instant cashback discount on orders above ₹499'
  },
  'FREESHIP': {
    code: 'FREESHIP',
    type: 'shipping',
    value: 40,
    minOrder: 0,
    description: '100% Free Express Delivery with zero minimum threshold'
  }
};

// GET /api/cart/coupons - list available coupons
router.get('/coupons', (req, res) => {
  res.json({ coupons: Object.values(AVAILABLE_COUPONS) });
});

// POST /api/cart/calculate
router.post('/calculate', (req, res) => {
  try {
    const { items, couponCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        items: [],
        totalMrp: 0,
        totalSellingPrice: 0,
        productDiscount: 0,
        couponDiscount: 0,
        couponApplied: null,
        deliveryFee: 0,
        platformFee: 0,
        finalPayable: 0,
        totalSavings: 0
      });
    }

    let totalMrp = 0;
    let totalSellingPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.getProductById(item.productId || item.id);
      if (!product) continue;
      const qty = Math.max(1, Math.min(10, parseInt(item.quantity) || 1));
      const itemMrp = product.original_price * qty;
      const itemSelling = product.current_price * qty;

      totalMrp += itemMrp;
      totalSellingPrice += itemSelling;

      validatedItems.push({
        id: product.id,
        title: product.title,
        brand: product.brand,
        image: product.image,
        category: product.category,
        original_price: product.original_price,
        current_price: product.current_price,
        discount_percent: product.discount_percent,
        quantity: qty,
        itemMrp,
        itemSelling,
        stock: product.stock
      });
    }

    const productDiscount = totalMrp - totalSellingPrice;

    // Delivery calculation: Free if >= 499, otherwise 40
    let deliveryFee = totalSellingPrice >= 499 ? 0 : 40;
    const platformFee = totalSellingPrice > 0 ? 3 : 0;

    // Coupon evaluation
    let couponDiscount = 0;
    let couponApplied = null;
    let couponMessage = '';

    if (couponCode && typeof couponCode === 'string') {
      const codeUpper = couponCode.trim().toUpperCase();
      const coupon = AVAILABLE_COUPONS[codeUpper];
      if (coupon) {
        if (totalSellingPrice < coupon.minOrder) {
          couponMessage = `Add ₹${coupon.minOrder - totalSellingPrice} more to activate coupon ${codeUpper}.`;
        } else {
          couponApplied = coupon;
          if (coupon.type === 'flat') {
            couponDiscount = coupon.value;
          } else if (coupon.type === 'percentage') {
            couponDiscount = Math.min(coupon.maxDiscount, Math.round((totalSellingPrice * coupon.percentage) / 100));
          } else if (coupon.type === 'shipping') {
            couponDiscount = deliveryFee;
            deliveryFee = 0;
          }
          couponMessage = `Promo code ${codeUpper} applied successfully! You saved ₹${couponDiscount}.`;
        }
      } else {
        couponMessage = 'Invalid promo coupon code.';
      }
    }

    const finalPayable = Math.max(0, totalSellingPrice - couponDiscount + deliveryFee + platformFee);
    const totalSavings = productDiscount + couponDiscount + (totalSellingPrice >= 499 ? 40 : 0);

    res.json({
      items: validatedItems,
      totalMrp,
      totalSellingPrice,
      productDiscount,
      couponDiscount,
      couponApplied,
      couponMessage,
      deliveryFee,
      platformFee,
      finalPayable,
      totalSavings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate cart: ' + err.message });
  }
});

module.exports = router;
