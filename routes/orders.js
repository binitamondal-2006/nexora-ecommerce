const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// POST /api/orders/create
router.post('/create', optionalAuthMiddleware, (req, res) => {
  try {
    const {
      items,
      shipping_address,
      payment_method,
      coupon_code,
      subtotal,
      discount,
      coupon_discount,
      delivery_fee,
      total_amount,
      upi_id,
      card_details
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    if (!shipping_address || !shipping_address.fullName || !shipping_address.street || !shipping_address.pincode) {
      return res.status(400).json({ error: 'Complete shipping address is required.' });
    }

    const validPaymentMethods = ['UPI', 'COD', 'Card', 'NetBanking'];
    if (!validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method selected. Must be UPI, COD, Card, or NetBanking.' });
    }

    const userId = req.user ? req.user.id : 'guest_' + Date.now();
    const userName = req.user ? req.user.name : shipping_address.fullName;
    const userEmail = req.user ? req.user.email : (shipping_address.email || 'customer@nexora.in');

    const orderPayload = {
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      items: items.map(item => ({
        product_id: item.id || item.productId,
        title: item.title,
        brand: item.brand,
        image: item.image,
        price: item.current_price || item.price,
        original_price: item.original_price,
        quantity: item.quantity
      })),
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      coupon_code: coupon_code || '',
      coupon_discount: Number(coupon_discount) || 0,
      delivery_fee: Number(delivery_fee) || 0,
      total_amount: Number(total_amount),
      shipping_address,
      payment_method,
      payment_details: {
        method: payment_method,
        upi_vpa: payment_method === 'UPI' ? (upi_id || 'shopper@upi') : null,
        transaction_id: payment_method === 'COD' ? 'COD_PENDING' : 'TXN_NEX_' + Date.now(),
        timestamp: new Date().toISOString()
      }
    };

    const createdOrder = db.createOrder(orderPayload);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: createdOrder
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order: ' + err.message });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authMiddleware, (req, res) => {
  try {
    const orders = db.getOrdersByUserId(req.user.id);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', optionalAuthMiddleware, (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve order: ' + err.message });
  }
});

module.exports = router;
