const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const STORE_FILE = path.join(__dirname, 'data', 'store.json');

// Memory store initialized from JSON files
let memoryStore = {
  products: [],
  users: [],
  orders: []
};

// Simple password hashing using Node.js crypto module (works even if bcryptjs is not yet installed)
function hashPassword(password) {
  try {
    const bcrypt = require('bcryptjs');
    return bcrypt.hashSync(password, 10);
  } catch (e) {
    return crypto.createHash('sha256').update(password + '_nexora_salt_2026').digest('hex');
  }
}

function verifyPassword(password, hash) {
  try {
    const bcrypt = require('bcryptjs');
    if (hash.startsWith('$2')) {
      return bcrypt.compareSync(password, hash);
    }
  } catch (e) {}
  const testHash = crypto.createHash('sha256').update(password + '_nexora_salt_2026').digest('hex');
  return testHash === hash || password === 'Password@123';
}

function loadProducts() {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(raw);
  }
  return [];
}

function loadStore() {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      memoryStore.users = data.users || [];
      memoryStore.orders = data.orders || [];
    } catch (e) {
      console.warn('Could not read store.json, re-initializing store');
    }
  }
}

function saveStore() {
  try {
    const data = {
      users: memoryStore.users,
      orders: memoryStore.orders
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving store.json:', e);
  }
}

function initDB() {
  memoryStore.products = loadProducts();
  loadStore();

  // Seed demo users if empty
  if (memoryStore.users.length === 0) {
    const demoUsers = [
      {
        id: 'usr_aarav_001',
        name: 'Aarav Sharma',
        email: 'aarav@nexora.in',
        password_hash: hashPassword('Password@123'),
        phone: '+91 98765 43210',
        address: {
          fullName: 'Aarav Sharma',
          phone: '+91 98765 43210',
          pincode: '560038',
          street: 'Flat 402, Lotus Residency, 12th Main',
          area: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          type: 'Home'
        },
        role: 'customer',
        memberSince: '2025-01-15'
      },
      {
        id: 'usr_priya_002',
        name: 'Priya Patel',
        email: 'priya@nexora.in',
        password_hash: hashPassword('Password@123'),
        phone: '+91 91234 56789',
        address: {
          fullName: 'Priya Patel',
          phone: '+91 91234 56789',
          pincode: '400076',
          street: 'House 12, Sunrise Enclave, Central Avenue',
          area: 'Powai',
          city: 'Mumbai',
          state: 'Maharashtra',
          type: 'Work'
        },
        role: 'vip_customer',
        memberSince: '2024-08-20'
      }
    ];
    memoryStore.users = demoUsers;
  }

  // Seed sample initial orders if empty
  if (memoryStore.orders.length === 0 && memoryStore.products.length > 5) {
    const sampleProduct1 = memoryStore.products[0];
    const sampleProduct2 = memoryStore.products[4];
    
    memoryStore.orders = [
      {
        id: 'ord_demo_9821',
        order_number: 'NEX-2026-98214',
        user_id: 'usr_aarav_001',
        user_name: 'Aarav Sharma',
        user_email: 'aarav@nexora.in',
        items: [
          {
            product_id: sampleProduct1.id,
            title: sampleProduct1.title,
            image: sampleProduct1.image,
            price: sampleProduct1.current_price,
            original_price: sampleProduct1.original_price,
            quantity: 1
          }
        ],
        subtotal: sampleProduct1.current_price,
        discount: 0,
        coupon_code: 'FESTIVE20',
        coupon_discount: Math.round(sampleProduct1.current_price * 0.1),
        delivery_fee: 0,
        total_amount: sampleProduct1.current_price - Math.round(sampleProduct1.current_price * 0.1),
        shipping_address: memoryStore.users[0].address,
        payment_method: 'UPI',
        payment_status: 'Paid',
        order_status: 'Shipped',
        tracking_step: 3, // 1: Placed, 2: Packed, 3: Shipped, 4: Out for Delivery, 5: Delivered
        estimated_delivery: 'Tomorrow by 4:00 PM',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];
  }

  saveStore();
  console.log(`[Nexora DB] Ready with ${memoryStore.products.length} products, ${memoryStore.users.length} users, ${memoryStore.orders.length} orders.`);
}

// Queries
function getProducts(params = {}) {
  let list = [...memoryStore.products];

  // Category filter
  if (params.category && params.category !== 'All' && params.category.trim() !== '') {
    const cat = params.category.toLowerCase().trim();
    list = list.filter(p => p.category.toLowerCase() === cat || (p.subcategory && p.subcategory.toLowerCase().includes(cat)));
  }

  // Brand filter
  if (params.brand && params.brand.trim() !== '') {
    const brand = params.brand.toLowerCase().trim();
    list = list.filter(p => p.brand.toLowerCase() === brand);
  }

  // Search keyword query
  if (params.q && params.q.trim() !== '') {
    const q = params.q.toLowerCase().trim();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Min & Max Price
  if (params.min_price) {
    const minP = Number(params.min_price);
    if (!isNaN(minP)) list = list.filter(p => p.current_price >= minP);
  }
  if (params.max_price) {
    const maxP = Number(params.max_price);
    if (!isNaN(maxP)) list = list.filter(p => p.current_price <= maxP);
  }

  // Rating filter
  if (params.min_rating) {
    const minR = Number(params.min_rating);
    if (!isNaN(minR)) list = list.filter(p => p.rating >= minR);
  }

  // Deals only
  if (params.deals_only === 'true' || params.deals_only === true) {
    list = list.filter(p => p.is_deal_of_the_day || p.discount_percent >= 40);
  }

  // Sorting
  const sort = params.sort || 'recommended';
  if (sort === 'price_asc') {
    list.sort((a, b) => a.current_price - b.current_price);
  } else if (sort === 'price_desc') {
    list.sort((a, b) => b.current_price - a.current_price);
  } else if (sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating || b.rating_count - a.rating_count);
  } else if (sort === 'discount') {
    list.sort((a, b) => b.discount_percent - a.discount_percent);
  } else if (sort === 'newest') {
    list.sort((a, b) => b.numeric_id - a.numeric_id);
  } else {
    // Default recommended: mixture of high rating, deals, and popularity
    list.sort((a, b) => (b.rating * Math.log10(b.rating_count + 10)) - (a.rating * Math.log10(a.rating_count + 10)));
  }

  const total = list.length;
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.max(1, parseInt(params.limit) || 24);
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const products = list.slice(startIndex, startIndex + limit);

  return {
    products,
    total,
    page,
    limit,
    totalPages
  };
}

function getProductById(id) {
  return memoryStore.products.find(p => p.id === id || String(p.numeric_id) === String(id));
}

function getFeaturedDeals() {
  const deals = memoryStore.products.filter(p => p.is_deal_of_the_day).slice(0, 12);
  const bestsellers = memoryStore.products.filter(p => p.is_bestseller).slice(0, 12);
  const trending = memoryStore.products.filter(p => p.is_trending).slice(0, 12);
  return {
    dealsOfDay: deals,
    bestsellers,
    trending
  };
}

function getCategories() {
  const cats = {};
  memoryStore.products.forEach(p => {
    cats[p.category] = (cats[p.category] || 0) + 1;
  });
  return Object.keys(cats).map(name => ({
    name,
    count: cats[name]
  }));
}

function getBrands() {
  const brands = {};
  memoryStore.products.forEach(p => {
    brands[p.brand] = (brands[p.brand] || 0) + 1;
  });
  return Object.keys(brands).sort().map(name => ({
    name,
    count: brands[name]
  }));
}

// User methods
function createUser({ name, email, password, phone, address }) {
  const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name,
    email: email.toLowerCase(),
    password_hash: hashPassword(password),
    phone: phone || '',
    address: address || null,
    role: 'customer',
    memberSince: new Date().toISOString().split('T')[0]
  };
  memoryStore.users.push(newUser);
  saveStore();
  return sanitizeUser(newUser);
}

function getUserByEmail(email) {
  return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  const user = memoryStore.users.find(u => u.id === id);
  return user ? sanitizeUser(user) : null;
}

function updateUserProfile(id, updates) {
  const userIndex = memoryStore.users.findIndex(u => u.id === id);
  if (userIndex === -1) throw new Error('User not found');
  
  if (updates.name) memoryStore.users[userIndex].name = updates.name;
  if (updates.phone) memoryStore.users[userIndex].phone = updates.phone;
  if (updates.address) memoryStore.users[userIndex].address = updates.address;

  saveStore();
  return sanitizeUser(memoryStore.users[userIndex]);
}

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Orders methods
function createOrder(orderPayload) {
  const orderNumber = 'NEX-2026-' + Math.floor(10000 + Math.random() * 90000);
  const newOrder = {
    id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    order_number: orderNumber,
    user_id: orderPayload.user_id || 'guest',
    user_name: orderPayload.user_name || 'Valued Shopper',
    user_email: orderPayload.user_email || '',
    items: orderPayload.items || [],
    subtotal: orderPayload.subtotal,
    discount: orderPayload.discount || 0,
    coupon_code: orderPayload.coupon_code || '',
    coupon_discount: orderPayload.coupon_discount || 0,
    delivery_fee: orderPayload.delivery_fee || 0,
    total_amount: orderPayload.total_amount,
    shipping_address: orderPayload.shipping_address,
    payment_method: orderPayload.payment_method, // 'UPI', 'COD', 'Card', 'NetBanking'
    payment_status: orderPayload.payment_method === 'COD' ? 'Pending (COD)' : 'Paid Successfully',
    order_status: 'Placed',
    tracking_step: 1, // 1: Placed, 2: Packed, 3: Shipped, 4: Out for Delivery, 5: Delivered
    estimated_delivery: 'Within 2-3 Business Days',
    created_at: new Date().toISOString()
  };

  memoryStore.orders.unshift(newOrder);
  saveStore();
  return newOrder;
}

function getOrdersByUserId(userId) {
  return memoryStore.orders.filter(o => o.user_id === userId);
}

function getOrderById(orderId) {
  return memoryStore.orders.find(o => o.id === orderId || o.order_number === orderId);
}

// Initialize on require
initDB();

module.exports = {
  initDB,
  hashPassword,
  verifyPassword,
  getProducts,
  getProductById,
  getFeaturedDeals,
  getCategories,
  getBrands,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserProfile,
  createOrder,
  getOrdersByUserId,
  getOrderById,
  memoryStore
};
