/**
 * Nexora Megastore — High-Speed, Zero-Lag E-Commerce Application
 * Vanilla ES6+ JavaScript client architecture
 */

const app = {
  // State
  state: {
    user: null,
    token: null,
    cart: [],
    cartCalculation: null,
    appliedCoupon: 'NEXORA50',
    currentCategory: 'All',
    currentBrand: '',
    searchQuery: '',
    maxPrice: 150000,
    minRating: 0,
    minDiscount: 0,
    sortBy: 'recommended',
    currentPage: 1,
    dealsOnly: false,
    pincode: '560038',
    pincodeCity: 'Bengaluru',
    checkoutStep: 1,
    checkoutShipping: null,
    selectedPaymentMethod: 'UPI',
    categories: [],
    brands: [],
    currentProductDetails: null
  },

  // Initialize
  init() {
    this.loadPersistedState();
    this.bindEvents();
    this.initCarousel();
    this.initCountdownTimer();
    this.initAiWidget();
    this.fetchCategories();
    this.fetchBrands();
    this.fetchDeals();
    this.fetchProducts();
    this.calculateCart();
    this.updateUserUI();
  },

  loadPersistedState() {
    try {
      const savedUser = localStorage.getItem('nexora_user');
      const savedToken = localStorage.getItem('nexora_token');
      const savedCart = localStorage.getItem('nexora_cart');
      const savedPin = localStorage.getItem('nexora_pincode');

      if (savedUser && savedToken) {
        this.state.user = JSON.parse(savedUser);
        this.state.token = savedToken;
      }
      if (savedCart) {
        this.state.cart = JSON.parse(savedCart);
      }
      if (savedPin) {
        this.state.pincode = savedPin;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  },

  savePersistedState() {
    try {
      if (this.state.user && this.state.token) {
        localStorage.setItem('nexora_user', JSON.stringify(this.state.user));
        localStorage.setItem('nexora_token', this.state.token);
      } else {
        localStorage.removeItem('nexora_user');
        localStorage.removeItem('nexora_token');
      }
      localStorage.setItem('nexora_cart', JSON.stringify(this.state.cart));
      localStorage.setItem('nexora_pincode', this.state.pincode);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  bindEvents() {
    // Brand Logo home click
    document.getElementById('brandLogo').addEventListener('click', (e) => {
      e.preventDefault();
      this.resetAllFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Global Search
    const searchInput = document.getElementById('globalSearchInput');
    const searchBtn = document.getElementById('btnGlobalSearch');
    const clearBtn = document.getElementById('btnClearSearch');
    const catSelect = document.getElementById('searchCategorySelect');

    const triggerSearch = () => {
      this.state.searchQuery = searchInput.value.trim();
      this.state.currentPage = 1;
      this.fetchProducts();
      document.getElementById('searchSuggestions').style.display = 'none';
      const catalogEl = document.getElementById('catalogSection');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    };

    searchBtn.addEventListener('click', triggerSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });

    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      clearBtn.style.display = val ? 'block' : 'none';
      this.handleSearchAutocomplete(val);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      this.state.searchQuery = '';
      this.fetchProducts();
      document.getElementById('searchSuggestions').style.display = 'none';
    });

    catSelect.addEventListener('change', (e) => {
      this.filterByCategory(e.target.value);
    });

    // Category Nav links
    document.querySelectorAll('.cat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const cat = e.target.dataset.category;
        if (cat) this.filterByCategory(cat);
      });
    });

    // Deals nav button
    document.getElementById('navDealsBtn').addEventListener('click', () => {
      this.state.dealsOnly = true;
      this.state.currentPage = 1;
      this.fetchProducts();
      document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
    });

    // AI Nav button
    document.getElementById('navAiBtn').addEventListener('click', () => {
      this.toggleAiChat(true);
    });

    // Cart Button
    document.getElementById('btnOpenCart').addEventListener('click', () => {
      this.toggleCartDrawer(true);
    });

    // Orders Button
    document.getElementById('btnMyOrders').addEventListener('click', () => {
      this.openMyOrders();
    });

    // User Menu Trigger
    document.getElementById('btnUserMenu').addEventListener('click', () => {
      if (!this.state.user) {
        this.openAuthModal('login');
      }
    });

    // Location Picker
    document.getElementById('btnLocationPicker').addEventListener('click', () => {
      this.openModal('pincodeModal');
    });

    // Clear Filters Button
    document.getElementById('btnClearFilters').addEventListener('click', () => {
      this.resetAllFilters();
    });

    // Price Range Slider
    const priceSlider = document.getElementById('priceRangeSlider');
    const priceLabel = document.getElementById('priceRangeLabel');
    priceSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      priceLabel.textContent = `₹${val.toLocaleString('en-IN')}`;
    });
    priceSlider.addEventListener('change', (e) => {
      this.state.maxPrice = Number(e.target.value);
      this.state.currentPage = 1;
      this.fetchProducts();
    });

    // Sort By Selector
    document.getElementById('sortBySelect').addEventListener('change', (e) => {
      this.state.sortBy = e.target.value;
      this.state.currentPage = 1;
      this.fetchProducts();
    });

    // View All Deals button in flash sale
    document.getElementById('btnViewAllDeals').addEventListener('click', () => {
      this.state.dealsOnly = true;
      this.state.currentPage = 1;
      this.fetchProducts();
      document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });

    // Close drawer on backdrop click
    document.getElementById('cartDrawerBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'cartDrawerBackdrop') {
        this.toggleCartDrawer(false);
      }
    });
  },

  // ---------------- Catalog API & Rendering ----------------
  async fetchProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; font-weight:600; color:#666;">⚡ Searching catalog of 1,000+ products...</div>';

    const params = new URLSearchParams({
      page: this.state.currentPage,
      limit: 24,
      sort: this.state.sortBy,
      max_price: this.state.maxPrice
    });

    if (this.state.currentCategory && this.state.currentCategory !== 'All') {
      params.append('category', this.state.currentCategory);
    }
    if (this.state.currentBrand) {
      params.append('brand', this.state.currentBrand);
    }
    if (this.state.searchQuery) {
      params.append('q', this.state.searchQuery);
    }
    if (this.state.minRating > 0) {
      params.append('min_rating', this.state.minRating);
    }
    if (this.state.dealsOnly) {
      params.append('deals_only', 'true');
    }

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      this.renderProducts(data.products, data.total, data.page, data.totalPages);
    } catch (err) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#d32f2f;">Failed to load products. Please check connection.</div>';
    }
  },

  renderProducts(products, total, page, totalPages) {
    const grid = document.getElementById('productsGrid');
    const countLabel = document.getElementById('catalogResultsCount');

    countLabel.textContent = `Showing ${products.length > 0 ? (page - 1) * 24 + 1 : 0}–${Math.min(page * 24, total)} of ${total.toLocaleString('en-IN')} products`;
    this.renderActiveFilterChips();

    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background:#fff; border-radius:8px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 18px; margin-bottom: 8px;">No matching products found</h3>
          <p style="color: #666; font-size: 14px; margin-bottom: 16px;">Try adjusting your keywords, price slider, or clearing active filters.</p>
          <button class="btn btn-primary" onclick="app.resetAllFilters()">Clear All Filters</button>
        </div>
      `;
      document.getElementById('paginationWrapper').innerHTML = '';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card" onclick="app.viewProduct('${p.id}')">
        <div class="card-top-badges">
          ${p.discount_percent >= 30 ? `<span class="badge-discount">${p.discount_percent}% OFF</span>` : ''}
          ${p.is_bestseller ? `<span class="badge-bestseller">BESTSELLER</span>` : ''}
        </div>
        <div class="card-img-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </div>
        <span class="card-brand">${p.brand}</span>
        <h3 class="card-title" title="${p.title}">${p.title}</h3>
        
        <div class="card-rating-row">
          <span class="rating-chip">${p.rating} ★</span>
          <span class="rating-count">(${p.rating_count.toLocaleString('en-IN')})</span>
          <span class="f-assured-badge">Nexora Assured</span>
        </div>

        <div class="card-price-row">
          <span class="card-current-price">₹${p.current_price.toLocaleString('en-IN')}</span>
          <span class="card-mrp">₹${p.original_price.toLocaleString('en-IN')}</span>
          <span class="card-savings">${p.discount_percent}% off</span>
        </div>

        <div class="card-delivery">
          <strong>${p.delivery_estimate.includes('Tomorrow') ? 'FREE Delivery Tomorrow' : 'Standard Delivery'}</strong>
        </div>

        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-card-cart" onclick="app.addToCart('${p.id}', 1, true)">
            🛒 Add to Cart
          </button>
          <button class="btn-card-quick" title="Quick View" onclick="app.viewProduct('${p.id}')">
            👁
          </button>
        </div>
      </div>
    `).join('');

    this.renderPagination(page, totalPages);
  },

  renderPagination(currentPage, totalPages) {
    const wrap = document.getElementById('paginationWrapper');
    if (totalPages <= 1) {
      wrap.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="app.goToPage(${currentPage - 1})">
        ‹ Previous
      </button>
    `;

    // Window of pages
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      html += `<button class="page-btn" onclick="app.goToPage(1)">1</button>`;
      if (startPage > 2) html += `<span style="padding: 0 4px; color:#888;">...</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `
        <button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="app.goToPage(${p})">
          ${p}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span style="padding: 0 4px; color:#888;">...</span>`;
      html += `<button class="page-btn" onclick="app.goToPage(${totalPages})">${totalPages}</button>`;
    }

    html += `
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="app.goToPage(${currentPage + 1})">
        Next ›
      </button>
    `;

    wrap.innerHTML = html;
  },

  goToPage(page) {
    this.state.currentPage = page;
    this.fetchProducts();
    document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
  },

  renderActiveFilterChips() {
    const container = document.getElementById('activeFilterChips');
    let chips = [];

    if (this.state.currentCategory && this.state.currentCategory !== 'All') {
      chips.push(`Category: ${this.state.currentCategory} <button onclick="app.filterByCategory('All')">✕</button>`);
    }
    if (this.state.currentBrand) {
      chips.push(`Brand: ${this.state.currentBrand} <button onclick="app.filterByBrand('')">✕</button>`);
    }
    if (this.state.searchQuery) {
      chips.push(`Keyword: "${this.state.searchQuery}" <button onclick="app.clearSearch()">✕</button>`);
    }
    if (this.state.maxPrice < 150000) {
      chips.push(`Under ₹${this.state.maxPrice.toLocaleString('en-IN')} <button onclick="app.resetPriceFilter()">✕</button>`);
    }
    if (this.state.minRating > 0) {
      chips.push(`${this.state.minRating}★ & above <button onclick="app.filterByRating(0)">✕</button>`);
    }
    if (this.state.dealsOnly) {
      chips.push(`Lightning Deals Only <button onclick="app.toggleDealsOnly(false)">✕</button>`);
    }

    container.innerHTML = chips.map(c => `<span class="chip-tag">${c}</span>`).join('');
  },

  // ---------------- Category & Brand Filters ----------------
  async fetchCategories() {
    try {
      const res = await fetch('/api/products/categories');
      const data = await res.json();
      this.state.categories = data.categories;
      this.renderCategorySidebar(data.categories);
    } catch (e) {
      console.warn('Error fetching categories:', e);
    }
  },

  renderCategorySidebar(categories) {
    const listEl = document.getElementById('categoryFilterList');
    listEl.innerHTML = `
      <button class="cat-filter-btn ${this.state.currentCategory === 'All' ? 'active' : ''}" onclick="app.filterByCategory('All')">
        <span>All Categories</span>
      </button>
      ${categories.map(c => `
        <button class="cat-filter-btn ${this.state.currentCategory === c.name ? 'active' : ''}" onclick="app.filterByCategory('${c.name}')">
          <span>${c.name}</span>
          <span class="cat-filter-count">(${c.count})</span>
        </button>
      `).join('')}
    `;
  },

  async fetchBrands() {
    try {
      const res = await fetch('/api/products/brands');
      const data = await res.json();
      this.state.brands = data.brands;
      this.renderBrandSidebar(data.brands);
    } catch (e) {
      console.warn('Error fetching brands:', e);
    }
  },

  renderBrandSidebar(brands) {
    const listEl = document.getElementById('brandFilterList');
    listEl.innerHTML = brands.slice(0, 15).map(b => `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="brandFilter" value="${b.name}" ${this.state.currentBrand === b.name ? 'checked' : ''} onchange="app.filterByBrand(this.checked ? '${b.name}' : '')">
        <span>${b.name} (${b.count})</span>
      </label>
    `).join('');
  },

  filterByCategory(cat) {
    this.state.currentCategory = cat;
    this.state.currentPage = 1;
    document.getElementById('searchCategorySelect').value = cat === 'All' ? 'All' : cat;
    
    // Update navbar active state
    document.querySelectorAll('.cat-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });

    this.renderCategorySidebar(this.state.categories);
    this.fetchProducts();
    document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
  },

  filterByBrand(brand) {
    this.state.currentBrand = brand;
    this.state.currentPage = 1;
    this.fetchProducts();
  },

  filterByRating(rating) {
    this.state.minRating = Number(rating);
    this.state.currentPage = 1;
    this.fetchProducts();
  },

  filterByDiscount(discount) {
    this.state.minDiscount = Number(discount);
    this.state.currentPage = 1;
    this.fetchProducts();
  },

  resetPriceFilter() {
    this.state.maxPrice = 150000;
    document.getElementById('priceRangeSlider').value = 150000;
    document.getElementById('priceRangeLabel').textContent = '₹1,50,000';
    this.state.currentPage = 1;
    this.fetchProducts();
  },

  clearSearch() {
    this.state.searchQuery = '';
    document.getElementById('globalSearchInput').value = '';
    document.getElementById('btnClearSearch').style.display = 'none';
    this.state.currentPage = 1;
    this.fetchProducts();
  },

  toggleDealsOnly(val) {
    this.state.dealsOnly = val;
    this.state.currentPage = 1;
    this.fetchProducts();
  },

  resetAllFilters() {
    this.state.currentCategory = 'All';
    this.state.currentBrand = '';
    this.state.searchQuery = '';
    this.state.maxPrice = 150000;
    this.state.minRating = 0;
    this.state.minDiscount = 0;
    this.state.dealsOnly = false;
    this.state.currentPage = 1;
    this.state.sortBy = 'recommended';

    document.getElementById('globalSearchInput').value = '';
    document.getElementById('btnClearSearch').style.display = 'none';
    document.getElementById('searchCategorySelect').value = 'All';
    document.getElementById('priceRangeSlider').value = 150000;
    document.getElementById('priceRangeLabel').textContent = '₹1,50,000';
    document.getElementById('sortBySelect').value = 'recommended';

    // Uncheck radios
    document.querySelectorAll('input[name="ratingFilter"]').forEach(r => r.checked = r.value === '0');
    document.querySelectorAll('input[name="discountFilter"]').forEach(r => r.checked = r.value === '0');

    this.renderCategorySidebar(this.state.categories);
    this.renderBrandSidebar(this.state.brands);
    this.fetchProducts();
  },

  // ---------------- Autocomplete ----------------
  async handleSearchAutocomplete(query) {
    const box = document.getElementById('searchSuggestions');
    if (!query || query.length < 2) {
      box.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (!data.products || data.products.length === 0) {
        box.style.display = 'none';
        return;
      }

      box.innerHTML = data.products.map(p => `
        <div class="suggestion-item" onclick="app.viewProduct('${p.id}')">
          <img src="${p.image}" class="suggestion-img" alt="${p.title}">
          <div class="suggestion-text">
            <span class="suggestion-title">${p.title}</span>
            <span class="suggestion-meta">in ${p.category} • ${p.brand}</span>
          </div>
          <span class="suggestion-price">₹${p.current_price.toLocaleString('en-IN')}</span>
        </div>
      `).join('');
      box.style.display = 'block';
    } catch (e) {
      box.style.display = 'none';
    }
  },

  // ---------------- Flash Deals Section ----------------
  async fetchDeals() {
    try {
      const res = await fetch('/api/products/deals');
      const data = await res.json();
      this.renderDealsCarousel(data.dealsOfDay);
    } catch (e) {
      console.warn('Deals fetch error:', e);
    }
  },

  renderDealsCarousel(deals) {
    const container = document.getElementById('dealsCarousel');
    if (!deals || deals.length === 0) return;

    container.innerHTML = deals.slice(0, 6).map(p => `
      <div class="deal-card" onclick="app.viewProduct('${p.id}')">
        <span class="deal-badge">${p.discount_percent}% OFF</span>
        <div class="deal-img-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </div>
        <h4 class="deal-title">${p.title}</h4>
        <div class="deal-price-row">
          <span class="deal-current-price">₹${p.current_price.toLocaleString('en-IN')}</span>
          <span class="deal-mrp">₹${p.original_price.toLocaleString('en-IN')}</span>
        </div>
        <button class="deal-btn-add" onclick="event.stopPropagation(); app.addToCart('${p.id}', 1, true)">
          Grab Deal
        </button>
      </div>
    `).join('');
  },

  initCountdownTimer() {
    let secondsLeft = 5 * 3600 + 42 * 60 + 19;
    const hEl = document.getElementById('timerHours');
    const mEl = document.getElementById('timerMinutes');
    const sEl = document.getElementById('timerSeconds');

    setInterval(() => {
      if (secondsLeft > 0) secondsLeft--;
      const hours = Math.floor(secondsLeft / 3600);
      const mins = Math.floor((secondsLeft % 3600) / 60);
      const secs = secondsLeft % 60;

      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }, 1000);
  },

  // ---------------- Carousel Hero Slider ----------------
  initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-indicators .dot');
    let currentSlide = 0;
    let timer = null;

    const showSlide = (idx) => {
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      currentSlide = idx;
    };

    const nextSlide = () => {
      const next = (currentSlide + 1) % slides.length;
      showSlide(next);
    };

    const prevSlide = () => {
      const prev = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(prev);
    };

    document.getElementById('carouselNext').addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });

    document.getElementById('carouselPrev').addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        showSlide(i);
        resetAutoplay();
      });
    });

    const startAutoplay = () => {
      timer = setInterval(nextSlide, 5000);
    };

    const resetAutoplay = () => {
      clearInterval(timer);
      startAutoplay();
    };

    startAutoplay();
  },

  // ---------------- Product Details Modal ----------------
  async viewProduct(productId) {
    const modalBody = document.getElementById('productModalBody');
    modalBody.innerHTML = '<div style="text-align:center; padding: 60px;">⚡ Loading full product specifications...</div>';
    this.openModal('productModal');

    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      const p = data.product;
      this.state.currentProductDetails = p;

      const specsRows = Object.entries(p.specs || {}).map(([k, v]) => `
        <tr>
          <td>${k}</td>
          <td>${v}</td>
        </tr>
      `).join('');

      modalBody.innerHTML = `
        <div class="product-details-grid">
          <!-- Gallery & Actions -->
          <div class="product-gallery">
            <div class="gallery-main-img">
              <img src="${p.image}" alt="${p.title}" id="modalMainImage">
            </div>
            <div class="modal-cta-buttons">
              <button class="btn-modal-cart" onclick="app.addToCart('${p.id}', 1, true)">
                🛒 Add to Cart
              </button>
              <button class="btn-buy-now" onclick="app.buyNow('${p.id}')">
                ⚡ Buy Now
              </button>
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-info-col">
            <span style="font-size: 13px; font-weight: 700; color: #666; text-transform:uppercase;">
              ${p.brand} • ${p.category}
            </span>
            <h1>${p.title}</h1>

            <div class="card-rating-row" style="margin: 8px 0 14px;">
              <span class="rating-chip">${p.rating} ★</span>
              <span class="rating-count">${p.rating_count.toLocaleString('en-IN')} Ratings & ${p.review_count.toLocaleString('en-IN')} Reviews</span>
              <span class="f-assured-badge">100% Genuine</span>
            </div>

            <!-- Price Box -->
            <div class="modal-price-box">
              <span class="special-price-tag">⚡ Special Festive Price</span>
              <div class="price-flex">
                <span class="big-price">₹${p.current_price.toLocaleString('en-IN')}</span>
                <span class="big-mrp">₹${p.original_price.toLocaleString('en-IN')}</span>
                <span class="big-discount">${p.discount_percent}% off</span>
              </div>
              <p style="font-size: 12px; color: #388e3c; margin-top: 4px; font-weight:600;">
                You save ₹${(p.original_price - p.current_price).toLocaleString('en-IN')} on this purchase!
              </p>
            </div>

            <!-- Available Offers -->
            <div style="margin: 14px 0; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 12px;">
              <h4 style="font-size: 13px; font-weight: 800; color: #f57f17; margin-bottom: 6px;">Available Bank & Payment Offers:</h4>
              <ul style="font-size: 12px; color: #333; padding-left: 18px; line-height: 1.6;">
                <li><strong>Bank Offer:</strong> 10% Instant Discount on HDFC & SBI Credit Cards up to ₹1,500</li>
                <li><strong>UPI Cashback:</strong> Flat ₹100 Instant Discount with code <strong>WELCOME100</strong></li>
                <li><strong>No Cost EMI:</strong> Available from ₹${Math.round(p.current_price / 6).toLocaleString('en-IN')}/month</li>
                <li><strong>Nexora Protect:</strong> 1 Year Free Screen / Physical Damage Shield included</li>
              </ul>
            </div>

            <!-- Delivery & Pin code Checker -->
            <div class="pincode-delivery-checker">
              <span>Delivery to:</span>
              <input type="text" id="modalPincodeInput" value="${this.state.pincode}" maxlength="6">
              <button onclick="app.checkModalPincode()">Check</button>
              <span id="pincodeStatusText" style="font-size: 12px; font-weight: 700; color: #388e3c;">
                ✓ Available for Free Delivery by Tomorrow
              </span>
            </div>

            <!-- AI Sentiment Summary -->
            <div class="ai-sentiment-box">
              <div class="ai-sentiment-header">
                <span>🤖 Nexora AI Insights & Buyer Verdict</span>
                <span style="margin-left: auto; font-size: 11px; background: #4338ca; color:#fff; padding: 2px 6px; border-radius: 4px;">
                  Score: ${data.aiInsight.score}/100
                </span>
              </div>
              <p>${data.aiInsight.verdict}</p>
              <div class="ai-pros-cons">
                <div class="ai-pros">
                  <strong>✓ Top Highlights:</strong>
                  <ul style="padding-left: 16px; margin-top: 4px;">
                    ${data.aiInsight.pros.slice(0, 2).map(pro => `<li>${pro}</li>`).join('')}
                  </ul>
                </div>
                <div class="ai-cons">
                  <strong>! Important Note:</strong>
                  <ul style="padding-left: 16px; margin-top: 4px;">
                    ${data.aiInsight.cons.slice(0, 1).map(con => `<li>${con}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>

            <!-- Product Description -->
            <div style="margin: 16px 0;">
              <h3 style="font-size: 15px; font-weight: 800; margin-bottom: 6px;">Product Overview</h3>
              <p style="font-size: 13px; color: #444; line-height: 1.6;">${p.description}</p>
            </div>

            <!-- Specifications Table -->
            <div style="margin: 16px 0;">
              <h3 style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">Specifications</h3>
              <table class="specs-table">
                <tbody>
                  ${specsRows}
                </tbody>
              </table>
            </div>

            <!-- Customer Reviews Section -->
            <div class="reviews-section">
              <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px;">Customer Ratings & Verified Reviews</h3>
              <div class="reviews-list">
                ${data.reviews.map(r => `
                  <div class="review-item">
                    <div class="review-header">
                      <span class="rating-chip">${r.rating} ★</span>
                      <strong class="review-title">${r.title}</strong>
                    </div>
                    <p class="review-comment">${r.comment}</p>
                    <span class="review-author">${r.author} • Verified Purchase • ${r.date}</span>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        </div>
      `;
    } catch (e) {
      modalBody.innerHTML = '<div style="text-align:center; padding: 40px; color:#d32f2f;">Failed to load product details.</div>';
    }
  },

  checkModalPincode() {
    const input = document.getElementById('modalPincodeInput');
    const status = document.getElementById('pincodeStatusText');
    const pin = input.value.trim();
    if (/^[1-9][0-9]{5}$/.test(pin)) {
      this.state.pincode = pin;
      this.savePersistedState();
      status.textContent = '✓ Express Delivery & Cash on Delivery Available';
      status.style.color = '#388e3c';
      this.showToast(`Delivery location set to PIN ${pin}`, 'success');
    } else {
      status.textContent = '✕ Please enter a valid 6-digit PIN code';
      status.style.color = '#d32f2f';
    }
  },

  buyNow(productId) {
    this.addToCart(productId, 1, false);
    this.closeModal('productModal');
    this.openCheckout();
  },

  // ---------------- Cart Logic & Drawer ----------------
  async addToCart(productId, quantity = 1, openDrawer = true) {
    const existing = this.state.cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.state.cart.push({ productId, quantity });
    }

    this.savePersistedState();
    await this.calculateCart();
    this.showToast('Item added to your shopping cart!', 'success');

    if (openDrawer) {
      this.toggleCartDrawer(true);
    }
  },

  async updateCartItemQty(productId, delta) {
    const item = this.state.cart.find(i => i.productId === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.state.cart = this.state.cart.filter(i => i.productId !== productId);
    }

    this.savePersistedState();
    await this.calculateCart();
  },

  async removeCartItem(productId) {
    this.state.cart = this.state.cart.filter(i => i.productId !== productId);
    this.savePersistedState();
    await this.calculateCart();
    this.showToast('Item removed from cart', 'info');
  },

  async calculateCart() {
    if (this.state.cart.length === 0) {
      this.state.cartCalculation = {
        items: [],
        totalMrp: 0,
        totalSellingPrice: 0,
        productDiscount: 0,
        couponDiscount: 0,
        deliveryFee: 0,
        finalPayable: 0
      };
      this.updateCartBadges(0, 0);
      this.renderCartDrawer();
      return;
    }

    try {
      const res = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: this.state.cart,
          couponCode: this.state.appliedCoupon
        })
      });
      const data = await res.json();
      this.state.cartCalculation = data;
      this.updateCartBadges(this.state.cart.length, data.finalPayable);
      this.renderCartDrawer();
    } catch (e) {
      console.warn('Cart calculation error:', e);
    }
  },

  updateCartBadges(count, total) {
    document.getElementById('cartBadgeCount').textContent = count;
    document.getElementById('headerCartTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
    const drawerCount = document.getElementById('cartDrawerCount');
    if (drawerCount) drawerCount.textContent = count;
  },

  toggleCartDrawer(show) {
    const backdrop = document.getElementById('cartDrawerBackdrop');
    backdrop.style.display = show ? 'flex' : 'none';
    if (show) this.renderCartDrawer();
  },

  renderCartDrawer() {
    const content = document.getElementById('cartDrawerContent');
    const footer = document.getElementById('cartDrawerFooter');
    const calc = this.state.cartCalculation;

    if (!calc || !calc.items || calc.items.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding: 60px 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🛒</div>
          <h4 style="font-size: 16px; margin-bottom: 6px;">Your Cart is Empty</h4>
          <p style="font-size: 13px; color: #777; margin-bottom: 16px;">Explore 1,000+ top items and add your favorites!</p>
          <button class="btn btn-primary" onclick="app.toggleCartDrawer(false)">Start Shopping</button>
        </div>
      `;
      footer.innerHTML = '';
      return;
    }

    content.innerHTML = `
      <!-- Coupon Section -->
      <div class="coupon-box">
        <div class="coupon-input-group">
          <input type="text" id="cartCouponInput" placeholder="Enter Promo Code" value="${this.state.appliedCoupon || ''}">
          <button class="btn-apply-coupon" onclick="app.handleApplyCoupon()">Apply</button>
        </div>
        <div class="coupon-chips-list">
          <span class="coupon-chip-item" onclick="app.setQuickCoupon('NEXORA50')">⚡ NEXORA50 (₹500 OFF)</span>
          <span class="coupon-chip-item" onclick="app.setQuickCoupon('FESTIVE20')">🎉 FESTIVE20 (20% OFF)</span>
          <span class="coupon-chip-item" onclick="app.setQuickCoupon('FREESHIP')">🚚 FREESHIP</span>
        </div>
        ${calc.couponMessage ? `<div style="font-size:11px; margin-top:6px; color:${calc.couponApplied ? '#388e3c' : '#d32f2f'}; font-weight:700;">${calc.couponMessage}</div>` : ''}
      </div>

      <!-- Items List -->
      <div class="cart-items-list">
        ${calc.items.map(item => `
          <div class="cart-item-row">
            <img src="${item.image}" class="cart-item-img" alt="${item.title}">
            <div class="cart-item-details">
              <span class="cart-item-title">${item.title}</span>
              <div class="cart-item-price-row">
                <strong style="font-size: 14px;">₹${item.current_price.toLocaleString('en-IN')}</strong>
                <span style="font-size: 12px; color: #888; text-decoration: line-through;">₹${item.original_price.toLocaleString('en-IN')}</span>
                <span style="font-size: 11px; color: #388e3c; font-weight: 700;">${item.discount_percent}% OFF</span>
              </div>
              <div class="cart-item-qty-row">
                <div class="qty-stepper">
                  <button onclick="app.updateCartItemQty('${item.id}', -1)">−</button>
                  <span>${item.quantity}</span>
                  <button onclick="app.updateCartItemQty('${item.id}', 1)">+</button>
                </div>
                <button class="btn-cart-remove" onclick="app.removeCartItem('${item.id}')">Remove</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    footer.innerHTML = `
      <div class="price-breakdown-row">
        <span>Price (${calc.items.length} items)</span>
        <span>₹${calc.totalMrp.toLocaleString('en-IN')}</span>
      </div>
      <div class="price-breakdown-row">
        <span>Product Discount</span>
        <span class="savings-highlight">−₹${calc.productDiscount.toLocaleString('en-IN')}</span>
      </div>
      ${calc.couponDiscount > 0 ? `
        <div class="price-breakdown-row">
          <span>Coupon Savings (${this.state.appliedCoupon})</span>
          <span class="savings-highlight">−₹${calc.couponDiscount.toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      <div class="price-breakdown-row">
        <span>Delivery Fee</span>
        <span>${calc.deliveryFee === 0 ? '<strong style="color:#388e3c">FREE</strong>' : '₹' + calc.deliveryFee}</span>
      </div>
      <div class="price-breakdown-row total-row">
        <span>Total Amount</span>
        <span>₹${calc.finalPayable.toLocaleString('en-IN')}</span>
      </div>
      <p style="font-size: 12px; color: #388e3c; font-weight: 700; margin-top: 4px;">
        You will save ₹${calc.totalSavings.toLocaleString('en-IN')} on this order!
      </p>
      <button class="btn-checkout" onclick="app.openCheckout()">
        Proceed to Buy (${calc.items.length} items)
      </button>
    `;
  },

  handleApplyCoupon() {
    const input = document.getElementById('cartCouponInput');
    this.state.appliedCoupon = input.value.trim().toUpperCase();
    this.calculateCart();
  },

  setQuickCoupon(code) {
    this.state.appliedCoupon = code;
    this.calculateCart();
  },

  // ---------------- Multi-step Checkout ----------------
  openCheckout() {
    if (!this.state.cartCalculation || this.state.cartCalculation.items.length === 0) {
      this.showToast('Your cart is empty!', 'danger');
      return;
    }

    this.toggleCartDrawer(false);
    this.state.checkoutStep = 1;

    // Prefill shipping address
    if (this.state.user && this.state.user.address) {
      this.state.checkoutShipping = { ...this.state.user.address };
    } else {
      this.state.checkoutShipping = {
        fullName: this.state.user ? this.state.user.name : 'Aarav Sharma',
        phone: this.state.user ? this.state.user.phone : '+91 98765 43210',
        pincode: this.state.pincode,
        street: 'Flat 402, Lotus Residency, 12th Main',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Home'
      };
    }

    this.renderCheckoutStep();
    this.openModal('checkoutModal');
  },

  renderCheckoutStep() {
    const body = document.getElementById('checkoutModalBody');
    const calc = this.state.cartCalculation;

    document.getElementById('step1Indicator').classList.toggle('active', this.state.checkoutStep >= 1);
    document.getElementById('step2Indicator').classList.toggle('active', this.state.checkoutStep >= 2);
    document.getElementById('step3Indicator').classList.toggle('active', this.state.checkoutStep >= 3);

    if (this.state.checkoutStep === 1) {
      // Step 1: Address
      const addr = this.state.checkoutShipping;
      body.innerHTML = `
        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;">Select or Enter Delivery Address</h3>
        <form onsubmit="app.handleAddressSubmit(event)">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" id="shipName" class="form-control" value="${addr.fullName || ''}" required>
            </div>
            <div class="form-group">
              <label>10-Digit Mobile Number *</label>
              <input type="tel" id="shipPhone" class="form-control" value="${addr.phone || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>PIN Code *</label>
              <input type="text" id="shipPincode" class="form-control" value="${addr.pincode || ''}" maxlength="6" required>
            </div>
            <div class="form-group">
              <label>City / District *</label>
              <input type="text" id="shipCity" class="form-control" value="${addr.city || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label>Flat, House no., Building, Apartment *</label>
            <input type="text" id="shipStreet" class="form-control" value="${addr.street || ''}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Area, Colony, Street, Sector</label>
              <input type="text" id="shipArea" class="form-control" value="${addr.area || ''}">
            </div>
            <div class="form-group">
              <label>State *</label>
              <input type="text" id="shipState" class="form-control" value="${addr.state || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label>Address Type</label>
            <div style="display:flex; gap: 14px; margin-top:4px;">
              <label class="filter-radio-label">
                <input type="radio" name="addrType" value="Home" ${addr.type !== 'Work' ? 'checked' : ''}> Home (All day delivery)
              </label>
              <label class="filter-radio-label">
                <input type="radio" name="addrType" value="Work" ${addr.type === 'Work' ? 'checked' : ''}> Work (10 AM - 5 PM)
              </label>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="width:100%; padding:12px; font-weight:800; font-size:15px; margin-top:10px;">
            Deliver to This Address →
          </button>
        </form>
      `;
    } else if (this.state.checkoutStep === 2) {
      // Step 2: Payment
      body.innerHTML = `
        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px;">Choose Payment Option</h3>
        <p style="font-size: 13px; color: #555; margin-bottom: 14px;">Total Payable: <strong>₹${calc.finalPayable.toLocaleString('en-IN')}</strong></p>

        <div class="payment-methods-grid">
          <!-- UPI -->
          <div class="payment-option-card ${this.state.selectedPaymentMethod === 'UPI' ? 'active' : ''}" onclick="app.selectPaymentMethod('UPI')">
            <input type="radio" name="payMethod" value="UPI" ${this.state.selectedPaymentMethod === 'UPI' ? 'checked' : ''}>
            <div class="pay-card-details">
              <h4>⚡ UPI (Google Pay, PhonePe, Paytm, BHIM)</h4>
              <p>Instant contactless payment with QR Code or UPI VPA</p>
              ${this.state.selectedPaymentMethod === 'UPI' ? `
                <div class="upi-qr-box">
                  <div class="upi-qr-svg">
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                      <rect width="100" height="100" fill="#ffffff"/>
                      <path d="M10 10h25v25h-25z M15 15h15v15h-15z M65 10h25v25h-25z M70 15h15v15h-15z M10 65h25v25h-25z M15 70h15v15h-15z M45 10h10v10h-10z M45 30h10v10h-10z M10 45h10v10h-10z M30 45h20v10h-20z M60 45h10v20h-10z M45 65h10v25h-10z M65 65h25v10h-25z M80 80h10v10h-10z" fill="#0f172a"/>
                      <circle cx="50" cy="50" r="8" fill="#2563eb"/>
                    </svg>
                  </div>
                  <span style="font-size: 11px; font-weight: 700; color: #444; display:block;">Scan with any UPI app to pay ₹${calc.finalPayable.toLocaleString('en-IN')}</span>
                  <div style="margin-top: 10px; display:flex; gap: 6px;">
                    <input type="text" id="upiVpaInput" class="form-control" placeholder="Enter UPI ID (e.g. name@okhdfcbank)" value="shopper@upi">
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Cash on Delivery -->
          <div class="payment-option-card ${this.state.selectedPaymentMethod === 'COD' ? 'active' : ''}" onclick="app.selectPaymentMethod('COD')">
            <input type="radio" name="payMethod" value="COD" ${this.state.selectedPaymentMethod === 'COD' ? 'checked' : ''}>
            <div class="pay-card-details">
              <h4>💵 Cash on Delivery (COD)</h4>
              <p>Pay with cash or UPI to delivery executive at your doorstep</p>
              ${this.state.selectedPaymentMethod === 'COD' ? `
                <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:6px; margin-top:8px;">
                  <span style="font-size:12px; color:#2e7d32; font-weight:700;">✓ COD is available for PIN ${this.state.pincode} with zero extra surcharge.</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Cards -->
          <div class="payment-option-card ${this.state.selectedPaymentMethod === 'Card' ? 'active' : ''}" onclick="app.selectPaymentMethod('Card')">
            <input type="radio" name="payMethod" value="Card" ${this.state.selectedPaymentMethod === 'Card' ? 'checked' : ''}>
            <div class="pay-card-details">
              <h4>💳 Credit / Debit Card (Visa, RuPay, MasterCard)</h4>
              <p>10% Instant discount on HDFC and SBI cards</p>
            </div>
          </div>

          <!-- Net Banking -->
          <div class="payment-option-card ${this.state.selectedPaymentMethod === 'NetBanking' ? 'active' : ''}" onclick="app.selectPaymentMethod('NetBanking')">
            <input type="radio" name="payMethod" value="NetBanking" ${this.state.selectedPaymentMethod === 'NetBanking' ? 'checked' : ''}>
            <div class="pay-card-details">
              <h4>🏦 Net Banking</h4>
              <p>All major Indian banks: SBI, HDFC, ICICI, Axis, PNB</p>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <button class="btn btn-outline" onclick="app.goToCheckoutStep(1)">← Back to Address</button>
          <button class="btn btn-primary" onclick="app.goToCheckoutStep(3)">Continue to Review →</button>
        </div>
      `;
    } else if (this.state.checkoutStep === 3) {
      // Step 3: Review & Place Order
      const addr = this.state.checkoutShipping;
      body.innerHTML = `
        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px;">Review Order & Confirm</h3>
        
        <div style="background:#f8f9fa; border:1px solid #eee; border-radius:8px; padding:12px; margin-bottom:14px;">
          <strong style="font-size:13px; color:#333;">Delivering to:</strong>
          <p style="font-size:13px; color:#555; margin-top:2px;">
            ${addr.fullName} (${addr.phone})<br>
            ${addr.street}, ${addr.area ? addr.area + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}
          </p>
          <button style="font-size:12px; color:var(--primary); font-weight:700; margin-top:4px;" onclick="app.goToCheckoutStep(1)">Change Address</button>
        </div>

        <div style="background:#f8f9fa; border:1px solid #eee; border-radius:8px; padding:12px; margin-bottom:14px;">
          <strong style="font-size:13px; color:#333;">Payment Method:</strong>
          <p style="font-size:13px; color:#555; margin-top:2px;">
            ${this.state.selectedPaymentMethod === 'UPI' ? '⚡ UPI Instant Payment' : this.state.selectedPaymentMethod === 'COD' ? '💵 Cash on Delivery (Doorstep)' : this.state.selectedPaymentMethod}
          </p>
          <button style="font-size:12px; color:var(--primary); font-weight:700; margin-top:4px;" onclick="app.goToCheckoutStep(2)">Change Payment</button>
        </div>

        <div style="max-height:160px; overflow-y:auto; border:1px solid #eee; border-radius:8px; padding:10px; margin-bottom:14px;">
          ${calc.items.map(i => `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
              <span>${i.title.substring(0, 42)}... × ${i.quantity}</span>
              <strong>₹${i.itemSelling.toLocaleString('en-IN')}</strong>
            </div>
          `).join('')}
        </div>

        <div class="price-breakdown-row total-row" style="font-size:17px; margin-bottom:16px;">
          <span>Final Amount to Pay:</span>
          <span style="color:var(--secondary)">₹${calc.finalPayable.toLocaleString('en-IN')}</span>
        </div>

        <button class="btn btn-checkout" onclick="app.placeOrder()">
          Confirm & Place Order (₹${calc.finalPayable.toLocaleString('en-IN')})
        </button>
      `;
    }
  },

  handleAddressSubmit(e) {
    e.preventDefault();
    this.state.checkoutShipping = {
      fullName: document.getElementById('shipName').value.trim(),
      phone: document.getElementById('shipPhone').value.trim(),
      pincode: document.getElementById('shipPincode').value.trim(),
      city: document.getElementById('shipCity').value.trim(),
      street: document.getElementById('shipStreet').value.trim(),
      area: document.getElementById('shipArea').value.trim(),
      state: document.getElementById('shipState').value.trim(),
      type: document.querySelector('input[name="addrType"]:checked').value
    };
    this.state.pincode = this.state.checkoutShipping.pincode;
    this.savePersistedState();
    this.goToCheckoutStep(2);
  },

  selectPaymentMethod(method) {
    this.state.selectedPaymentMethod = method;
    this.renderCheckoutStep();
  },

  goToCheckoutStep(step) {
    this.state.checkoutStep = step;
    this.renderCheckoutStep();
  },

  async placeOrder() {
    const calc = this.state.cartCalculation;
    const body = {
      items: calc.items,
      shipping_address: this.state.checkoutShipping,
      payment_method: this.state.selectedPaymentMethod,
      coupon_code: this.state.appliedCoupon,
      subtotal: calc.totalSellingPrice,
      discount: calc.productDiscount,
      coupon_discount: calc.couponDiscount,
      delivery_fee: calc.deliveryFee,
      total_amount: calc.finalPayable,
      upi_id: this.state.selectedPaymentMethod === 'UPI' ? 'shopper@upi' : null
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.state.token) headers['Authorization'] = `Bearer ${this.state.token}`;

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      // Clear cart
      this.state.cart = [];
      this.savePersistedState();
      this.calculateCart();

      this.closeModal('checkoutModal');
      this.showOrderSuccess(data.order);
    } catch (e) {
      this.showToast(e.message, 'danger');
    }
  },

  showOrderSuccess(order) {
    const body = document.getElementById('orderSuccessBody');
    body.innerHTML = `
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:12px; color:#15803d; font-weight:700;">ORDER NUMBER:</span>
          <strong style="font-size:14px; font-family:monospace; color:#166534;">${order.order_number}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:#15803d;">Estimated Delivery:</span>
          <strong style="font-size:13px; color:#166534;">${order.estimated_delivery}</strong>
        </div>
      </div>

      <!-- Live Tracking Stages -->
      <div class="order-tracking-steps">
        <div class="track-step done">
          <div class="track-dot">✓</div>
          <span>Ordered</span>
        </div>
        <div class="track-step">
          <div class="track-dot">2</div>
          <span>Packed</span>
        </div>
        <div class="track-step">
          <div class="track-dot">3</div>
          <span>Shipped</span>
        </div>
        <div class="track-step">
          <div class="track-dot">4</div>
          <span>Delivered</span>
        </div>
      </div>

      <div style="margin: 16px 0;">
        <h4 style="font-size:13px; font-weight:800; margin-bottom:6px;">Delivering To:</h4>
        <p style="font-size:13px; color:#555;">
          ${order.shipping_address.fullName}, ${order.shipping_address.street}, ${order.shipping_address.city} - ${order.shipping_address.pincode}
        </p>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px;">
        <button class="btn btn-outline" onclick="app.printInvoice('${order.order_number}')">
          📄 Download Tax Invoice
        </button>
        <button class="btn btn-primary" onclick="app.closeModal('orderSuccessModal')">
          Continue Shopping
        </button>
      </div>
    `;

    this.openModal('orderSuccessModal');
  },

  // ---------------- Tax Invoice Generator ----------------
  printInvoice(orderNumber) {
    const calc = this.state.cartCalculation;
    const addr = this.state.checkoutShipping || {};
    const invoiceWin = window.open('', '_blank');
    invoiceWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${orderNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 30px; color: #333; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2874f0; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2874f0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Nexora Megastore</div>
            <p>GSTIN: 29AABCN9821K1ZM<br>CIN: U51109KA2026PTC066107</p>
          </div>
          <div style="text-align:right;">
            <h2>TAX INVOICE</h2>
            <p><strong>Order ID:</strong> ${orderNumber}<br><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div>
          <h3>Bill To / Ship To:</h3>
          <p>${addr.fullName || 'Customer'}<br>${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Taxable Amount</th>
              <th>GST (18%)</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nexora Megastore Verified Items</td>
              <td>1</td>
              <td>₹${((calc.finalPayable || 2499) / 1.18).toFixed(2)}</td>
              <td>₹${((calc.finalPayable || 2499) * 0.18 / 1.18).toFixed(2)}</td>
              <td><strong>₹${(calc.finalPayable || 2499).toLocaleString('en-IN')}</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="text-align:right; font-size:18px;"><strong>Total Paid: ₹${(calc.finalPayable || 2499).toLocaleString('en-IN')}</strong></p>
        <p style="margin-top:40px; font-size:12px; color:#777;">This is a computer-generated tax invoice and requires no physical signature.</p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    invoiceWin.document.close();
  },

  // ---------------- My Orders List ----------------
  async openMyOrders() {
    const body = document.getElementById('myOrdersModalBody');
    body.innerHTML = '<div style="text-align:center; padding:40px;">⚡ Retrieving your orders...</div>';
    this.openModal('myOrdersModal');

    try {
      const headers = {};
      if (this.state.token) headers['Authorization'] = `Bearer ${this.state.token}`;

      const res = await fetch('/api/orders/my-orders', { headers });
      const data = await res.json();
      const orders = data.orders || [];

      if (orders.length === 0) {
        body.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <p style="font-size:16px; color:#666;">No past orders found in your account.</p>
          </div>
        `;
        return;
      }

      body.innerHTML = orders.map(ord => `
        <div style="border:1px solid #e0e0e0; border-radius:8px; padding:16px; margin-bottom:14px; background:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding-bottom:8px; margin-bottom:10px;">
            <div>
              <span style="font-size:11px; color:#888;">ORDER PLACED</span><br>
              <strong>${new Date(ord.created_at).toLocaleDateString('en-IN')}</strong>
            </div>
            <div>
              <span style="font-size:11px; color:#888;">TOTAL</span><br>
              <strong>₹${ord.total_amount.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span style="font-size:11px; color:#888;">ORDER # ${ord.order_number}</span><br>
              <span style="color:#2e7d32; font-weight:700; font-size:13px;">● ${ord.order_status}</span>
            </div>
          </div>
          <div style="display:flex; gap:12px; align-items:center;">
            <img src="${ord.items[0]?.image || ''}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">
            <div>
              <h4 style="font-size:14px; font-weight:700;">${ord.items[0]?.title || 'Products'}</h4>
              <p style="font-size:12px; color:#666;">Payment: ${ord.payment_method} (${ord.payment_status})</p>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      body.innerHTML = '<div style="text-align:center; padding:40px; color:#d32f2f;">Failed to fetch orders.</div>';
    }
  },

  // ---------------- Auth (Login, Register, Demo) ----------------
  updateUserUI() {
    const greeting = document.getElementById('userGreetingText');
    const nameText = document.getElementById('userNameText');
    const dropdown = document.getElementById('userDropdown');

    if (this.state.user) {
      greeting.textContent = `Hello, ${this.state.user.name.split(' ')[0]}`;
      nameText.textContent = 'My Account ▾';
      dropdown.innerHTML = `
        <div class="user-dropdown-header">
          <strong>${this.state.user.name}</strong>
          <span>${this.state.user.email}</span>
        </div>
        <button class="dropdown-link" onclick="app.openMyOrders()">📦 My Orders</button>
        <button class="dropdown-link" onclick="app.toggleCartDrawer(true)">🛒 Shopping Cart</button>
        <button class="dropdown-link" onclick="app.openModal('pincodeModal')">📍 Delivery Location</button>
        <button class="dropdown-link" style="color:#d32f2f;" onclick="app.logout()">🚪 Sign Out</button>
      `;
    } else {
      greeting.textContent = 'Hello, Sign In';
      nameText.textContent = 'My Account ▾';
      dropdown.innerHTML = `
        <div style="padding: 10px 0; text-align:center;">
          <button class="btn btn-primary" style="width:100%; margin-bottom:8px;" onclick="app.openAuthModal('login')">Sign In</button>
          <span style="font-size:12px; color:#777;">New customer? <a href="#" style="color:var(--primary); font-weight:700;" onclick="app.openAuthModal('register')">Start here</a></span>
        </div>
      `;
    }
  },

  openAuthModal(tab = 'login') {
    this.switchAuthTab(tab);
    this.openModal('authModal');
  },

  switchAuthTab(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    const formWrap = document.getElementById('authFormWrap');

    if (tab === 'login') {
      formWrap.innerHTML = `
        <form onsubmit="app.handleLoginSubmit(event)">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="loginEmail" class="form-control" required placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="loginPassword" class="form-control" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="width:100%; padding:12px; font-weight:800;">
            Sign In
          </button>
        </form>
      `;
    } else {
      formWrap.innerHTML = `
        <form onsubmit="app.handleRegisterSubmit(event)">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="regName" class="form-control" required placeholder="e.g. Aarav Sharma">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="regEmail" class="form-control" required placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="tel" id="regPhone" class="form-control" placeholder="+91 98765 43210">
          </div>
          <div class="form-group">
            <label>Password (min 6 characters)</label>
            <input type="password" id="regPassword" class="form-control" required minlength="6" placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="width:100%; padding:12px; font-weight:800;">
            Create Your Nexora Account
          </button>
        </form>
      `;
    }
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      this.state.user = data.user;
      this.state.token = data.token;
      this.savePersistedState();
      this.updateUserUI();
      this.closeModal('authModal');
      this.showToast(`Welcome back, ${data.user.name}!`, 'success');
    } catch (err) {
      this.showToast(err.message, 'danger');
    }
  },

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      this.state.user = data.user;
      this.state.token = data.token;
      this.savePersistedState();
      this.updateUserUI();
      this.closeModal('authModal');
      this.showToast('Account created successfully!', 'success');
    } catch (err) {
      this.showToast(err.message, 'danger');
    }
  },

  loginDemo(email) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = 'Password@123';
    document.querySelector('#authFormWrap form').dispatchEvent(new Event('submit'));
  },

  logout() {
    this.state.user = null;
    this.state.token = null;
    this.savePersistedState();
    this.updateUserUI();
    this.showToast('You have signed out.', 'info');
  },

  // ---------------- Location PIN Handling ----------------
  handlePincodeSubmit(e) {
    e.preventDefault();
    const pin = document.getElementById('inputPincode').value.trim();
    if (/^[1-9][0-9]{5}$/.test(pin)) {
      this.state.pincode = pin;
      document.getElementById('currentLocationText').textContent = `PIN ${pin}`;
      this.savePersistedState();
      this.closeModal('pincodeModal');
      this.showToast(`Delivery location set to PIN ${pin}`, 'success');
    }
  },

  // ---------------- Nexora AI Shopping Assistant ----------------
  initAiWidget() {
    document.getElementById('btnToggleAiChat').addEventListener('click', () => {
      this.toggleAiChat();
    });
    document.getElementById('btnCloseAiChat').addEventListener('click', () => {
      this.toggleAiChat(false);
    });
  },

  toggleAiChat(forceOpen) {
    const win = document.getElementById('aiChatWindow');
    const isVisible = win.style.display !== 'none';
    win.style.display = forceOpen !== undefined ? (forceOpen ? 'flex' : 'none') : (isVisible ? 'none' : 'flex');
  },

  sendAiPrompt(promptText) {
    document.getElementById('aiInputText').value = promptText;
    document.getElementById('aiChatForm').dispatchEvent(new Event('submit'));
  },

  async handleAiSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('aiInputText');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const messages = document.getElementById('aiMessagesArea');

    // Add User Bubble
    messages.innerHTML += `
      <div class="ai-msg user">
        <div class="msg-bubble">${text}</div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    // Add Thinking Bubble
    const thinkingId = 'aiThinking_' + Date.now();
    messages.innerHTML += `
      <div class="ai-msg bot" id="${thinkingId}">
        <div class="msg-bubble">🤖 Analyzing 1,000+ catalog items...</div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      const thinkEl = document.getElementById(thinkingId);
      if (thinkEl) thinkEl.remove();

      let prodsHtml = '';
      if (data.products && data.products.length > 0) {
        prodsHtml = data.products.map(p => `
          <div class="ai-product-card-small" onclick="app.viewProduct('${p.id}')">
            <img src="${p.image}" class="ai-prod-thumb" alt="${p.title}">
            <div class="ai-prod-details">
              <span class="ai-prod-title">${p.title.substring(0, 36)}...</span>
              <span class="ai-prod-price">₹${p.current_price.toLocaleString('en-IN')} <span style="font-size:10px; color:#388e3c">(${p.discount_percent}% off)</span></span>
            </div>
            <button style="background:var(--primary); color:#fff; font-size:11px; padding:4px 8px; border-radius:4px;" onclick="event.stopPropagation(); app.addToCart('${p.id}', 1, true)">
              + Cart
            </button>
          </div>
        `).join('');
      }

      messages.innerHTML += `
        <div class="ai-msg bot">
          <div class="msg-bubble">
            ${data.reply}
            ${prodsHtml}
          </div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      const thinkEl = document.getElementById(thinkingId);
      if (thinkEl) thinkEl.remove();
      messages.innerHTML += `
        <div class="ai-msg bot">
          <div class="msg-bubble" style="color:#d32f2f;">
            Sorry, I encountered a temporary connection issue. Please try again.
          </div>
        </div>
      `;
    }
  },

  // ---------------- Modals & Toast Helpers ----------------
  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
