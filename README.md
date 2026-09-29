# ⚡️ Nexora — India's Premier Online Mega Marketplace

A modern, high-speed, zero-lag full-stack e-commerce web platform engineered with **Express.js (Node.js)**, **SQLite**, and modern **HTML5/CSS3/ES6+ JavaScript**. Designed with the visual polish, feature depth, and customer confidence of **Amazon and Flipkart**, Nexora features an expansive catalog of **over 1,000+ products**, live lightning deals, multi-factor payment support (**UPI QR / VPA & Cash on Delivery**), an interactive shopping cart with coupon engine, multi-step checkout with tax invoice printing, order tracking, and a built-in **Nexora AI Shopping Copilot**.

---

## 🌟 Key Features

### 1. 🛍️ Massive 1,000+ Products Catalog Across 8 Departments
- **1,065+ realistic, high-quality products** categorized across:
  - 📱 **Mobiles & Tablets** (Flagship 5G phones, tablets, power banks, fast chargers, wearables)
  - 💻 **Electronics & Computers** (Laptops, 4K curved monitors, noise-cancelling headphones, mechanical keyboards)
  - 👗 **Fashion & Apparel** (Nike, Adidas, Levi's, formal wear, streetwear sneakers, watches, sunglasses)
  - 🏠 **Home & Kitchen** (Pressure cookers, air fryers, mixer grinders, smart lamps, orthopedic bedding)
  - ✨ **Beauty & Personal Care** (Niacinamide serums, perfumes, grooming trimmers, hair care, cosmetics)
  - 📺 **Appliances & TV** (Smart 4K Google TVs, frost-free refrigerators, front load washing machines, inverter ACs)
  - 🚴 **Sports & Fitness** (Motorized treadmills, adjustable dumbbells, mountain cycles, yoga mats)
  - 🥑 **Groceries & Essentials** (Organic dry fruits, specialty coffees, pure cow ghee, oats, chocolates)
- Dynamic search with real-time autocomplete suggestions.
- Multi-dimensional filters: Category hierarchy, price range slider (₹100 to ₹1,50,000), brand checkboxes, customer star rating (4★+, 3.5★+), and discount filters.
- Advanced sorting: Recommended, Price Low to High, Price High to Low, Customer Rating, Discount %, and Newest Arrivals.
- Zero-lag pagination with 24 products per page.

### 2. ⚡ Flash Deals & Flipkart/Amazon Style Homepage
- **Deals of the Day**: Dedicated flash sales section with live countdown clock (`Ends in: HH:MM:SS`).
- **Interactive Hero Carousel Banner**: Showcasing festive mega bonanzas, bank partner offers, and brand discounts.
- **Trust Badges Strip**: Free Express Delivery over ₹499, 100% Genuine Authenticity guarantee, 7-Day Doorstep Replacement, and 24x7 Support.
- **Partner Bank Offers Strip**: Highlighting 10% instant discounts with HDFC/SBI, No Cost EMI, and UPI cashback.

### 3. 🔍 Comprehensive Product Details Page
- High-resolution product image gallery with zoom view.
- Dual pricing breakdown: Deal price, M.R.P. struck through, and total savings in green.
- **PIN Code Delivery Checker**: Real-time validation for 6-digit Indian PIN codes showing estimated arrival date and COD availability.
- Technical Specifications table with warranty, return policy, and verified authenticity badge.
- Verified customer reviews with star ratings and helpful votes.
- **Nexora AI Sentiment & Buyer Verdict**: Automatically analyzes ratings and specs to provide "Top Highlights", "Important Notes", and a 100-point AI confidence score.

### 4. 🛒 Dynamic Shopping Cart Drawer & Coupon Engine
- Slide-over drawer with smooth animations and item quantity increment/decrement.
- **Active Promotional Coupons**:
  - `NEXORA50`: Flat ₹500 OFF on orders above ₹2,499.
  - `FESTIVE20`: 20% OFF (up to ₹1,200) on festive purchases above ₹1,499.
  - `WELCOME100`: Flat ₹100 instant cashback on orders above ₹499.
  - `FREESHIP`: 100% Free Express Delivery with zero minimum threshold.
- Live price calculation: Total M.R.P., product discount, coupon savings, shipping fee, platform fee, and total savings notice.

### 5. 💳 Multi-Step Checkout & Payment Processing
- **Step 1: Delivery Address**:
  - Saved address selector or manual address form (Full Name, Phone, Pincode, Flat/House, Area, City, State, Type: Home/Work).
- **Step 2: Flexible Payment Methods**:
  - ⚡ **UPI**: Displays an authentic scan-and-pay UPI QR code + custom UPI VPA ID verification (GPay, PhonePe, Paytm, BHIM).
  - 💵 **Cash on Delivery (COD)**: Doorstep payment option with zero surcharge.
  - 💳 **Credit / Debit Cards**: Visa, MasterCard, RuPay with bank discount simulation.
  - 🏦 **Net Banking**: All major Indian banks (SBI, HDFC, ICICI, Axis, PNB).
- **Step 3: Order Review**: Final inspection of items, delivery destination, and payment terms.
- **Step 4: Order Confirmation & GST Tax Invoice**:
  - Confetti celebration animation and unique Order Number (`NEX-2026-XXXXX`).
  - 4-stage tracking progress tracker: Ordered → Packed → Shipped → Delivered.
  - **1-Click Printable Tax Invoice**: Formats an official GST-compliant tax invoice ready for download or printing!

### 6. 👤 User Authentication & Accounts
- JWT-based authentication with encrypted password hashing.
- Sign In & Account Registration with instant validation.
- **1-Click Demo Accounts**:
  - `Aarav Sharma`: `aarav@nexora.in` / `Password@123` (Regular shopper with Bengaluru address and past order history)
  - `Priya Patel`: `priya@nexora.in` / `Password@123` (VIP Gold Member with Mumbai address)
- My Orders screen with past order records, delivery status, and re-tracking.

### 7. 🤖 Nexora AI Shopping Copilot
- Floating conversational assistant widget in the bottom-right corner.
- Natural language intent parser: understands categories, brands, and budget constraints (e.g. *"Show 5G phones under ₹20,000"*, *"Best noise cancelling headphones"*, *"Gifts under ₹1,500"*).
- Returns AI advice and interactive, clickable product recommendation cards directly in the chat.

---

## 🏗️ Project Architecture

```
nexora-ecommerce/
├── data/
│   └── products.json         # 1,065+ realistic seeded products
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── routes/
│   ├── auth.js               # Registration, Login, Demo accounts
│   ├── products.js           # Catalog retrieval, search, categories, reviews
│   ├── cart.js               # Price calculation, coupon validation
│   ├── orders.js             # Order processing, status tracking
│   └── ai.js                 # AI Shopping Copilot & deal finder
├── public/
│   ├── index.html            # Main responsive single-page application
│   ├── style.css             # Amazon/Flipkart inspired modern styling
│   └── app.js                # ES6+ client controller & state manager
├── db.js                     # SQLite3 & in-memory dual database engine
├── server.js                 # Express server & static asset handler
├── render.yaml               # 1-Click Render blueprint configuration
├── Dockerfile                # Production container specification
├── package.json              # Project dependencies & startup scripts
└── README.md                 # Full documentation & deployment guide
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Run
1. Unzip the project folder:
   ```bash
   unzip nexora-ecommerce.zip
   cd nexora-ecommerce
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 📦 How to Push to Your GitHub Repository

1. Initialize git in the project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Nexora e-commerce platform with 1000+ products"
   ```
2. Create a new repository on your GitHub account (e.g. `nexora-megastore`).
3. Link your remote repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

---

## 🌐 How to Deploy to Render

Nexora includes a pre-configured `render.yaml` blueprint and `Dockerfile` for effortless deployment:

### Option A: 1-Click Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Apply** to launch!

### Option B: Manual Web Service
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Set the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your_random_secret_string`
5. Click **Create Web Service**. Your store will be live with a free SSL certificate!
