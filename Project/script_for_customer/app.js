// =========================
// Trạng thái toàn cục
// =========================
let currentPath = '/';
let selectedBook = null;
let selectedCategory = null;
let searchTerm = '';
let sortOrder = 'default';
let dropdownHideTimeout = null;
let cartItems = [];
let quantity = 1;
let bookDetailTab = 'description';
let captchaCode = '';
let selectedDiscountVoucher = null;
let selectedShippingVoucher = null;
let showVoucherList = false;
let selectedCartIds = cartItems.map(item => item.book.id); // mặc định chọn tất cả khi vào giỏ hàng

// Biến lưu trạng thái xác thực quên mật khẩu
let forgotPasswordStep = 'verify'; // 'verify' hoặc 'reset'
let forgotUsername = '';
let forgotEmail = '';

// QUAN TRỌNG: chỉ khai báo auth MỘT LẦN
let auth = { user: null };

// Biến để lưu trữ các hóa đơn (đơn hàng)
let userBills = [];

// =========================
// Data
// =========================
let availableBooks = [];         //mảng lưu sách
let uniqueCategories = [];       //mảng lưu thể loại sách để hiển thị danh mục
let availableVouchers = [];      //mảng lưu voucher

const loadProducts = async () => {
  try {
    const res = await fetch("http://localhost:3000/products");
    const data = await res.json();

    if (res.ok) {
      availableBooks = data.map(p => ({
        id: p.id,
        title: p.title,
        author: p.author,
        category: p.category,
        price: Number(p.price),
        description: p.description,
        rating: Number(p.avg_rating || p.rating || 0),
        reviews: Number(p.reviews),
        image: p.image,
        fullDescription: p.description,
        stock: Number(p.stock)
      }));
      console.log("✅ Books loaded:", availableBooks);

      uniqueCategories = [...new Set(availableBooks.map(book => book.category))];
      console.log("✅ Categories loaded:", uniqueCategories);

    } else {
      console.error("❌ Lỗi khi lấy products:", data.message);
    }
  } catch (err) {
    console.error("❌ API error:", err);
  }
};

//lấy voucher từ DB
const loadVouchers = async () => {
    try {
        const res = await fetch("http://localhost:3000/vouchers");
        const data = await res.json();

        if (res.ok) {
            availableVouchers = data.map(v => ({
                id: v.voucher_id,
                code: v.code,
                value: v.discount,
                remaining: v.remaining,
                minPrice: v.min_order_value,
                expiration: v.end_date,
                description: v.description,
                type: v.voucher_type, // 'product' hoặc 'shipping'
                isPercentage: v.type === 'percentage',
                maxDiscount: v.max_discount || null // Giả sử cột max_discount tồn tại nếu type là percentage
            }));
            console.log("✅ Vouchers loaded:", availableVouchers);
        } else {
            console.error("❌ Lỗi khi lấy vouchers:", data.message);
        }
    } catch (err) {
        console.error("❌ Lỗi API khi lấy vouchers:", err);
    }
};

// =========================
// Điều hướng
// =========================
const handleNavigate = async (path, data) => {
  if (currentPath === '/cart' && path !== '/cart' && path !== '/checkout') {
    handleDeselectAllOnLeave();
  }
  currentPath = path;

  if (path === '/forgot-password') {
    forgotPasswordStep = 'verify';
    forgotUsername = '';
    forgotEmail = '';
  }

  // Tự động tải hóa đơn khi vào trang theo dõi
  if (path === '/order-tracking') {
      await loadUserBills();
  }

  if (path === '/book' && data) {
    selectedBook = availableBooks.find(b => b.id === data.id);
    selectedCategory = null;
    quantity = 1;
  } else if (path === '/' && data && data.category) {
    selectedCategory = data.category;
    selectedBook = null;
  } else {
    selectedCategory = null;
    selectedBook = null;
  }

  renderPage();
};

// =========================
// Header (pure HTML string)
// =========================
const createHeader = () => {
  const user = auth.user;
  const isLoggedIn = !!user;
  const cartItemCount = cartItems.reduce((t, i) => t + i.quantity, 0);

  return `
  <div class="bg-white text-card-foreground shadow-sm sticky top-0 z-50 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <a href="#" onclick="handleNavigate('/')" class="flex items-center">
          <img src="./image/logo.png" alt="Hust Book Store" class="h-20 w-20 object-fill">
        </a>

        <!-- Search ở header -->
        <div class="flex-1 px-6 max-w-3xl mx-auto py-4">
          <input
            id="header-search"
            type="text"
            placeholder="Tìm kiếm sách..."
            value="${searchTerm}"
            oninput="handleSearchFromHeader(this.value)"
            onkeydown="if(event.key==='Enter') handleSearchFromHeader(this.value, true)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Cart + Auth -->
        <div class="flex items-center space-x-4 py-4">
          <button onclick="handleNavigate('/cart')" class="relative text-gray-500 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            ${cartItemCount > 0 ? `<span class="absolute -top-1 -right-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold">${cartItemCount}</span>` : ''}
          </button>

          ${isLoggedIn ? `
            <div class="relative" id="account-menu-container">
              <button id="account-menu-trigger" class="text-base font-medium text-gray-600 hover:text-gray-900" type="button">
                Chào, ${user.username}
              </button>
              <div id="account-menu" class="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white text-gray-900 ring-1 ring-gray-200 hidden">
                <div class="py-1">
                  <a href="#" onclick="handleNavigate('/profile')" class="block px-4 py-2 text-sm hover:bg-gray-100">Hồ sơ</a>
                  <a href="#" onclick="handleNavigate('/order-tracking')" class="block px-4 py-2 text-sm hover:bg-gray-100">Theo dõi đơn hàng</a>                  
                  <a href="#" onclick="logout()" class="block px-4 py-2 text-sm hover:bg-gray-100">Đăng xuất</a>
                </div>
              </div>
            </div>
          ` : `
            <div class="flex space-x-2">
              <a href="#" onclick="handleNavigate('/login')" class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold">Đăng nhập</a>
              <a href="#" onclick="handleNavigate('/register')" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold hidden sm:inline-block">Đăng ký</a>
            </div>
          `}
        </div>
      </div>
    </div>
  </div>`;
};


// =========================
// Gắn sự kiện menu (click)
// =========================
function initAccountMenu() {
  const trigger = document.getElementById("account-menu-trigger");
  const menu = document.getElementById("account-menu");
  const container = document.getElementById("account-menu-container");

  if (!trigger || !menu || !container) return;

  // Toggle khi bấm nút
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
  });

  // Đăng ký handler click-outside chỉ MỘT lần
  if (!window.__accountMenuOutsideHandler) {
    window.__accountMenuOutsideHandler = (e) => {
      const cont = document.getElementById("account-menu-container");
      const m = document.getElementById("account-menu");
      if (m && cont && !cont.contains(e.target)) {
        m.classList.add("hidden");
      }
    };
    document.addEventListener("click", window.__accountMenuOutsideHandler);
  }
}

// =========================
// Danh sách sách
// =========================
const createBookList = (books) => {
  if (books.length === 0) {
    return `<p class="text-center text-gray-500 col-span-full mt-8">Không tìm thấy sách nào phù hợp.</p>`;
  }

  const getRatingStars = (rating) => {
  const fullStars = Math.floor(rating);             // số sao đầy
  const fraction = rating - fullStars;              // phần thập phân (0 -> 1)
  const emptyStars = 5 - fullStars - (fraction > 0 ? 1 : 0);
  let stars = '';

  // Sao đầy
  for (let i = 0; i < fullStars; i++) {
    stars += `
      <svg class="w-5 h-5 text-yellow-400 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
  }

  // Sao phần trăm
  if (fraction > 0) {
    const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`;
    stars += `
      <svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <defs>
          <linearGradient id="${gradId}">
            <stop offset="${fraction * 100}%" stop-color="rgb(250 204 21)" />
            <stop offset="${fraction * 100}%" stop-color="rgb(229 231 235)" />
          </linearGradient>
        </defs>
        <path fill="url(#${gradId})" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
  }

  // Sao rỗng
  for (let i = 0; i < emptyStars; i++) {
    stars += `
      <svg class="w-5 h-5 text-gray-300 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
  }

  return stars;
};


  return books.map(book => {
    const isOutOfStock = book.stock <= 0;

    return `
    <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
      <div class="product-image-wrapper">
        <img src="${book.image}" alt="${book.title}">
        ${isOutOfStock ? '<div class="stock-overlay">Hết hàng</div>' : ''}
      </div>
      <div class="p-3 flex flex-col flex-1">
        <h2 class="text-sm font-semibold mb-1 text-gray-900">${book.title}</h2>
        <p class="text-gray-500 text-xs mb-1">Tác giả: ${book.author}</p>
        <div class="flex items-center text-xs mb-1">
          ${getRatingStars(book.rating)}
          <span class="text-xs text-gray-500 ml-1">(${book.reviews})</span>
        </div>
        <p class="text-sm font-bold text-black-600 mb-2">${book.price.toLocaleString('vi-VN')}₫</p>
        <div class="product-actions flex space-x-2 mt-auto">
          <button onclick="handleNavigate('/book', { id: ${book.id} })" class="flex-1 bg-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-300">Chi tiết</button>
          <button onclick="handleAddToCart(${book.id})" class="flex-1 bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600"
            ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Hết hàng' : '+ Giỏ'}
          </button>
        </div>
      </div>
    </div>
    `
  }).join('');
};

// =========================
// Trang chủ
// =========================
const createHomePage = () => {
  let booksToDisplay = [...availableBooks];

  if (selectedCategory) {
    booksToDisplay = booksToDisplay.filter(book => book.category === selectedCategory);
  }

  if (searchTerm && searchTerm.trim() !== "") {
    const lower = searchTerm.toLowerCase();
    booksToDisplay = booksToDisplay.filter(book =>
      book.title.toLowerCase().includes(lower) ||
      book.author.toLowerCase().includes(lower) ||
      book.category.toLowerCase().includes(lower)
    );
  }

  booksToDisplay.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));  //sản phẩm bị hết hàng thì đưa xuống dưới cùng

  if (sortOrder === 'best-selling') {
    booksToDisplay.sort((a, b) => b.reviews - a.reviews);
  } else if (sortOrder === 'rating') {
    booksToDisplay.sort((a, b) => b.rating - a.rating);
  } else if (sortOrder === 'price-asc') {
    booksToDisplay.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-desc') {
    booksToDisplay.sort((a, b) => b.price - a.price);
  } else if (sortOrder === 'name-asc') {
    booksToDisplay.sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));
  } else if (sortOrder === 'name-desc') {
    booksToDisplay.sort((a, b) => b.title.localeCompare(a.title, 'vi', { sensitivity: 'base' }));
  }
  
  // Dữ liệu cho các slide quảng cáo với đường link
  const slides = [
    { 
      src: 'https://static.wikia.nocookie.net/gensin-impact/images/1/12/Columbina_Introduction_Card.png/revision/latest?cb=20250722042053', 
      alt: 'Quảng cáo 1', 
      link: 'https://genshin-impact.fandom.com/wiki/Columbina' 
    },
    { 
      src: 'https://static.wikia.nocookie.net/gensin-impact/images/7/7f/Alice_Introduction_Card.png/revision/latest?cb=20250722041937', 
      alt: 'Quảng cáo 2',
      link: 'https://genshin-impact.fandom.com/wiki/Alice' 
    },
    { 
      src: 'https://static.wikia.nocookie.net/gensin-impact/images/a/a1/Nicole_Introduction_Card.png/revision/latest/scale-to-width-down/1200?cb=20250722041540', 
      alt: 'Quảng cáo 3',
      link: 'https://genshin-impact.fandom.com/wiki/Nicole' 
    },
    { 
      src: 'https://static.wikia.nocookie.net/gensin-impact/images/a/a0/Varka_Introduction_Card.png/revision/latest?cb=20250722041725', 
      alt: 'Quảng cáo 4',
      link: 'https://genshin-impact.fandom.com/wiki/Varka' 
    },
    { 
      src: 'https://static.wikia.nocookie.net/gensin-impact/images/b/b1/Durin_Introduction_Card.png/revision/latest/scale-to-width-down/1200?cb=20250722041941', 
      alt: 'Quảng cáo 5',
      link: 'https://genshin-impact.fandom.com/wiki/Durin' 
    },
  ];

return `
    <div id="page-home" class="max-w-7xl mx-auto px-1 sm:px-2 lg:px-2 py-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-16">
      <aside class="md:w-1/5 bg-white rounded-2xl px-2 py-6 shadow-lg h-fit hidden md:block self-start border border-gray-200" style="margin-left: -5rem;">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Danh mục</h2>
        <ul class="space-y-3">
          <li>
            <button onclick="handleNavigate('/')" 
              class="w-full text-left py-3 px-2 text-lg rounded-lg font-semibold transition-colors duration-200 
                ${!selectedCategory ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-800 hover:bg-gray-100'}">
              Tất cả
            </button>
          </li>
            ${uniqueCategories.map(category => `
              <li>
                <button onclick="handleNavigate('/', { category: '${category}' })"
                  class="w-full text-left py-3 px-1 text-lg rounded-lg font-medium transition-colors duration-200
                    ${selectedCategory === category ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-800 hover:bg-gray-100'}">
                  ${category}
                </button>
              </li>
            `).join('')}
        </ul>
      </aside>

      <section class="md:w-4/5">
        <div class="mb-6 flex justify-center"> <!-- giữ flex căn giữa container -->
          <div id="carousel-container" 
              class="relative overflow-hidden rounded-xl shadow-md" 
              style="width:750px;">

            <!-- Track chứa slide -->
            <div id="carousel-track" 
                class="flex transition-transform duration-500 ease-in-out">
              ${slides.map(slide => `
                <a href="${slide.link}" class="flex-shrink-0" style="width:750px;">
                  <img src="${slide.src}" alt="${slide.alt}" class="w-full h-80 object-cover" />
                </a>
              `).join('')}
            </div>

            <!-- Nút mũi tên trái (bám vào khung container) -->
            <button id="prev-btn" 
              class="absolute top-1/2 left-0 transform -translate-y-1/2 
                    bg-black bg-opacity-40 text-white rounded-r-lg p-3 hover:bg-opacity-70">
              ‹
            </button>

            <!-- Nút mũi tên phải (bám vào khung container) -->
            <button id="next-btn" 
              class="absolute top-1/2 right-0 transform -translate-y-1/2 
                    bg-black bg-opacity-40 text-white rounded-l-lg p-3 hover:bg-opacity-70">
              ›
            </button>
          </div>
        </div>


        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <!-- Tiêu đề danh mục -->
          <h1 class="text-3xl font-bold text-gray-900">
            ${selectedCategory || 'Tất cả sách'}
          </h1>

          <!-- Select sắp xếp -->
          <div class="flex-shrink-0 w-full sm:w-auto">
            <select onchange="handleSort(this.value)" 
              class="block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="default" ${sortOrder === 'default' ? 'selected' : ''}>Sắp xếp</option>
              <option value="best-selling" ${sortOrder === 'best-selling' ? 'selected' : ''}>Bán chạy nhất</option>
              <option value="rating" ${sortOrder === 'rating' ? 'selected' : ''}>Xếp theo đánh giá</option>
              <option value="price-asc" ${sortOrder === 'price-asc' ? 'selected' : ''}>Giá: Tăng dần</option>
              <option value="price-desc" ${sortOrder === 'price-desc' ? 'selected' : ''}>Giá: Giảm dần</option>
              <option value="name-asc" ${sortOrder === 'name-asc' ? 'selected' : ''}>Tên: A-Z</option>
              <option value="name-desc" ${sortOrder === 'name-desc' ? 'selected' : ''}>Tên: Z-A</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${createBookList(booksToDisplay)}
        </div>
      </section>
    </div>`;
};


// =========================
// Trang chi tiết sách
// =========================
const createBookDetailPage = () => {
  if (!selectedBook) {
    return `<p class="text-gray-900">
      Không tìm thấy sách. 
      <button onclick="handleNavigate('/')" class="text-orange-500 hover:underline">Về trang chủ</button>
    </p>`;
  }

  const getRatingStars = (rating) => {
  const fullStars = Math.floor(rating);             // số sao đầy
  const fraction = rating - fullStars;              // phần thập phân (0 -> 1)
  const emptyStars = 5 - fullStars - (fraction > 0 ? 1 : 0);
  let stars = '';

  // Sao đầy
  for (let i = 0; i < fullStars; i++) {
    stars += `
      <svg class="w-5 h-5 text-yellow-400 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
  }

  // Sao phần trăm
  if (fraction > 0) {
    const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`;
    stars += `
      <svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <defs>
          <linearGradient id="${gradId}">
            <stop offset="${fraction * 100}%" stop-color="rgb(250 204 21)" />
            <stop offset="${fraction * 100}%" stop-color="rgb(229 231 235)" />
          </linearGradient>
        </defs>
        <path fill="url(#${gradId})" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
  }

  // Sao rỗng
  for (let i = 0; i < emptyStars; i++) {
    stars += `
      <svg class="w-5 h-5 text-gray-300 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
  }

  return stars;
};

  const totalPrice = selectedBook.price * quantity;
  const isOutOfStock = selectedBook.stock <= 0;

  return `
  <div id="page-book-detail" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <nav class="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <ol class="inline-flex">
        <li><a href="#" onclick="handleNavigate('/')" class="hover:text-gray-900">Trang chủ</a><span class="mx-2">/</span></li>
        <li><a href="#" onclick="handleNavigate('/', { category: '${selectedBook.category}' })" class="hover:text-gray-900">${selectedBook.category}</a><span class="mx-2">/</span></li>
        <li class="text-gray-900 font-medium">${selectedBook.title}</li>
      </ol>
    </nav>

    <div class="flex flex-col md:flex-row bg-white rounded-lg p-6 shadow-md">
      <div class="md:w-1/2 flex justify-center items-start p-4">
        <div class="product-image-wrapper" style="width:300px;height:420px;">
          <img src="${selectedBook.image}" alt="${selectedBook.title}">
        </div>
      </div>

      <div class="md:w-1/2 p-4">
        <h1 class="text-3xl font-bold mb-2">${selectedBook.title}</h1>
        <p class="text-lg text-gray-500 mb-4">Tác giả: ${selectedBook.author}</p>

        <div class="flex items-center mb-4">
          <div class="mr-2">${getRatingStars(selectedBook.rating)}</div>
          <span class="text-sm font-medium">${selectedBook.rating}</span>
          <span class="text-sm text-gray-500 ml-2">(${selectedBook.reviews} đánh giá)</span>
        </div>

        <div class="flex flex-col mb-6">
          <div class="flex items-baseline">
            <p class="text-xl font-bold text-black-500">${selectedBook.price.toLocaleString('vi-VN')}₫</p>
            <span class="text-sm text-gray-500 ml-2">(Giá mỗi cuốn)</span>
          </div>
          <div class="mt-2">
            <span class="font-semibold">Tổng: </span>
            <span id="total-price" class="text-lg text-red-500 font-bold">${totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        <div class="mb-6">
          <span class="font-medium">Tình trạng: </span>
          <span class="font-semibold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}">
            ${isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
          </span>
        </div>

        <div class="flex items-center mb-8">
          <span class="mr-4">Số lượng:</span>
          <div class="flex items-center border rounded-lg">
            <button onclick="decreaseQuantity()" class="px-3" ${isOutOfStock ? 'disabled' : ''}>-</button>
            <input type="number" id="book-quantity" value="${quantity}" min="1" max="${selectedBook.stock}"
                   oninput="updateQuantity(this.value)"
                   class="w-12 text-center border-none focus:outline-none" ${isOutOfStock ? 'disabled' : ''}>
            <button onclick="increaseQuantity()" class="px-3" ${isOutOfStock ? 'disabled' : ''}>+</button>
          </div>
          ${!isOutOfStock ? `<span class="text-sm text-gray-500 ml-4">(${selectedBook.stock} sản phẩm có sẵn)</span>` : ''}
        </div>

        <div class="flex space-x-4 mb-8">
          <button onclick="handleAddToCart(${selectedBook.id})"
                  class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg font-semibold transition-colors
                  ${isOutOfStock ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}"
                  ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Hết hàng' : '+ Thêm vào giỏ'}
          </button>
          <button onclick="handleBuyNow(${selectedBook.id})"
                  class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg font-semibold transition-colors
                  ${isOutOfStock ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}"
                  ${isOutOfStock ? 'disabled' : ''}>
            Mua ngay
          </button>
        </div>
      </div>
    </div>

    <div class="mt-12">
      <div class="flex border-b">
        <button onclick="setBookDetailTab('description')"
          class="py-2 px-4 border-b-2 ${bookDetailTab === 'description' ? 'border-orange-500 text-orange-500 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'}">
          Mô tả
        </button>
        <button onclick="setBookDetailTab('reviews')"
          class="py-2 px-4 border-b-2 ${bookDetailTab === 'reviews' ? 'border-orange-500 text-orange-500 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'}">
          Đánh giá
        </button>
      </div>
      <div class="mt-6 text-gray-900">
        ${bookDetailTab === 'description'
          ? `<p>${selectedBook.fullDescription}</p>`
          : `<p class="text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên để lại đánh giá cho cuốn sách này!</p>`}
      </div>
    </div>
  </div>`;
};

const setBookDetailTab = (tab) => {
  bookDetailTab = tab;
  renderPage();
};

async function handleBuyNow(bookId) {
    const book = availableBooks.find(b => b.id === bookId);

    // --- KIỂM TRA TỒN KHO ---
    if (!book || book.stock <= 0) {
        showMessage('Sản phẩm này đã hết hàng!');
        return;
    }
    const cartId = await getOrCreateCartId();
    if (!cartId) return;
    if (!book) {
        showMessage('Lỗi: Không tìm thấy sản phẩm!');
        return;
    }

    const quantityInput = document.getElementById('book-quantity');
    const bookQuantity = quantityInput ? parseInt(quantityInput.value, 10) : quantity;

    try {
        // Check if item exists to decide between POST and PATCH
        const existingItemRes = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}&product_id=${book.id}`);
        const existingItem = (await existingItemRes.json())[0];

        let targetCartItem = null;
        if (existingItem) {
            const updateRes = await fetch(`http://localhost:3000/cart/items/${existingItem.cart_item_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: existingItem.quantity + bookQuantity })
            });
            if (updateRes.ok) {
                targetCartItem = await updateRes.json();
            } else {
                throw new Error('Lỗi khi cập nhật sản phẩm để mua ngay!');
            }
        } else {
            const addRes = await fetch('http://localhost:3000/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart_id: cartId,
                    product_id: book.id,
                    quantity: bookQuantity,
                    is_selected: true
                })
            });
            if (addRes.ok) {
                targetCartItem = await addRes.json();
            } else {
                throw new Error('Lỗi khi thêm sản phẩm để mua ngay!');
            }
        }

        // Now, set is_selected=false for all other items in the cart
        const allItemsRes = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}`);
        const allItems = await allItemsRes.json();

        const updates = allItems.map(item => {
            if (item.cart_item_id === targetCartItem.cart_item_id) {
                return { cart_item_id: item.cart_item_id, is_selected: true };
            } else {
                return { cart_item_id: item.cart_item_id, is_selected: false };
            }
        });

        // Use Promise.all to send all updates in parallel
        await Promise.all(updates.map(update =>
            fetch(`http://localhost:3000/cart/items/${update.cart_item_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_selected: update.is_selected })
            })
        ));

        // Sync local state and navigate
        await syncCartWithDatabase();
        handleNavigate('/cart');

    } catch (error) {
        console.error("❌ Lỗi API khi mua ngay:", error);
        showMessage('Lỗi: Không thể kết nối tới máy chủ hoặc thao tác thất bại!');
    }
}

// =========================
// Số lượng & giỏ
// =========================
const updateQuantity = (value) => {
  const newQuantity = parseInt(value, 10);
  quantity = (!isNaN(newQuantity) && newQuantity >= 1) ? newQuantity : 1;

  const totalPriceElement = document.getElementById('total-price');
  if (totalPriceElement && selectedBook) {
    totalPriceElement.textContent = (selectedBook.price * quantity).toLocaleString('vi-VN') + '₫';
  }
};

const decreaseQuantity = () => {
  if (quantity > 1) {
    quantity--;
    const quantityInput = document.getElementById('book-quantity');
    if (quantityInput) quantityInput.value = quantity;
    updateQuantity(quantity);
  }
};

const increaseQuantity = () => {
  quantity++;
  const quantityInput = document.getElementById('book-quantity');
  if (quantityInput) quantityInput.value = quantity;
  updateQuantity(quantity);
};

const showMessage = (message) => {
  // Xóa thông báo cũ nếu có
  const existingMessage = document.querySelector('.toast-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageBox = document.createElement('div');

  // 1. Thiết lập các class ban đầu
  // - Bắt đầu với 'translate-x-full' để nó nằm ngoài màn hình
  // - Thêm duration và easing để hiệu ứng mượt hơn (ví dụ: duration-300 ease-in-out)
  messageBox.className = 'toast-message fixed bottom-4 right-4 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-xl z-[100] transition-transform duration-300 ease-in-out transform translate-x-full';
  messageBox.textContent = message;

  document.body.appendChild(messageBox);

  // 2. Animate IN: Đẩy vào màn hình
  // Dùng setTimeout để đảm bảo trình duyệt đã render trạng thái ban đầu trước khi thay đổi
  setTimeout(() => {
    // Xóa class đẩy ra và thêm class đưa về vị trí 0
    messageBox.classList.remove('translate-x-full');
    messageBox.classList.add('translate-x-0');
  }, 10); // Một độ trễ nhỏ là rất quan trọng

  // 3. Animate OUT: Đẩy ra khỏi màn hình
  setTimeout(() => {
    // Làm ngược lại: xóa class vị trí 0 và thêm class đẩy ra ngoài
    messageBox.classList.remove('translate-x-0');
    messageBox.classList.add('translate-x-full');

    // Lắng nghe sự kiện transition kết thúc để xóa phần tử khỏi DOM
    // Thêm { once: true } để đảm bảo listener này tự hủy sau khi chạy 1 lần
    messageBox.addEventListener('transitionend', () => {
      messageBox.remove();
    }, { once: true });
  }, 3000); // Thời gian hiển thị thông báo
};

//=========================Cart==================================
// Đồng bộ giỏ hàng với database
const getOrCreateCartId = async () => {
    if (!auth.user) {
        showMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        handleNavigate('/login');
        return null;
    }
    const userId = auth.user.user_id;
    try {
      // Lấy giỏ hàng hiện tại
      const res = await fetch(`http://localhost:3000/cart?user_id=${userId}`);
      const carts = await res.json();
      if (Array.isArray(carts) && carts.length > 0 && carts[0].cart_id) {
        return carts[0].cart_id;
      }
      // Nếu chưa có thì tạo mới
      const createRes = await fetch('http://localhost:3000/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const result = await createRes.json();
      if (result && result.cart_id) {
        return result.cart_id;
      }
      throw new Error('Không thể lấy hoặc tạo cart_id');
    } catch (err) {
      console.error('❌ API error in getOrCreateCartId:', err);
      showMessage('Lỗi khi lấy giỏ hàng: ' + err.message);
      return null;
    }
};

const syncCartWithDatabase = async () => {
    if (!auth.user) {
        cartItems = [];
        renderPage();
        return;
    }

    const cartId = await getOrCreateCartId();
    if (!cartId) {
        cartItems = [];
        renderPage();
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}`);
        if (res.ok) {
            const data = await res.json();
            cartItems = data.map(item => ({
                cart_item_id: item.cart_item_id,
                book: availableBooks.find(b => b.id === item.product_id),
                quantity: item.quantity,
                is_selected: item.is_selected
            })).filter(item => item.book);

            //Đồng bộ lại selectedCartIds từ dữ liệu is_selected mới nhất
            selectedCartIds = cartItems
                .filter(item => item.is_selected)
                .map(item => item.book.id);

            console.log("✅ Cart synced with database:", cartItems);
            renderPage();
        } else {
            console.error("❌ Lỗi khi đồng bộ giỏ hàng:", await res.json());
            showMessage("Lỗi: Không thể đồng bộ giỏ hàng!");
        }
    } catch (error) {
        console.error("❌ Lỗi API khi đồng bộ giỏ hàng:", error);
        showMessage("Lỗi: Không thể kết nối tới máy chủ!");
    }
};


// xử lí add vào giỏ hàng
const handleAddToCart = async (bookId) => {
    const bookToAdd = availableBooks.find(book => book.id === bookId);
    
    // --- KIỂM TRA TỒN KHO ---
    if (!bookToAdd || bookToAdd.stock <= 0) {
        showMessage('Sản phẩm này đã hết hàng!');
        return;
    }

    const cartId = await getOrCreateCartId();
    if (!cartId) return;

    const quantityInput = document.getElementById('book-quantity');
    const bookQuantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    if (!bookToAdd) {
        console.error("❌ Không tìm thấy sách để thêm vào giỏ hàng.");
        showMessage('Lỗi: Không tìm thấy sản phẩm!');
        return;
    }

    try {
        // Check if the product already exists in the cart
        const existingItemRes = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}&product_id=${bookToAdd.id}`);
        const existingItem = (await existingItemRes.json())[0];

        if (existingItem) {
            // Update quantity if item exists
            const newQuantity = existingItem.quantity + bookQuantity;
            const updateRes = await fetch(`http://localhost:3000/cart/items/${existingItem.cart_item_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });
            if (updateRes.ok) {
                showMessage('Đã cập nhật số lượng sản phẩm trong giỏ hàng!');
            } else {
                showMessage('Lỗi khi cập nhật sản phẩm!');
            }
        } else {
            // Add new item if it doesn't exist
            const addRes = await fetch('http://localhost:3000/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart_id: cartId,
                    product_id: bookToAdd.id,
                    quantity: bookQuantity,
                    is_selected: true // Default to selected when added
                })
            });
            if (addRes.ok) {
                showMessage('Sản phẩm đã được thêm vào giỏ hàng!');
            } else {
                showMessage('Lỗi khi thêm sản phẩm vào giỏ!');
            }
        }
        await syncCartWithDatabase();
    } catch (error) {
        console.error("❌ Lỗi API khi thêm vào giỏ hàng:", error);
        showMessage('Lỗi: Không thể kết nối tới máy chủ!');
    }
};

// Hàm bỏ chọn tất cả sản phẩm khi rời khỏi trang giỏ hàng
const handleDeselectAllOnLeave = async () => {
    // Nếu không có sản phẩm nào đang được chọn thì không làm gì cả
    if (selectedCartIds.length === 0) {
        return;
    }

    const cartId = await getOrCreateCartId();
    if (!cartId) return;

    // Xóa ngay lập tức ở local để UI phản hồi nhanh
    selectedCartIds = [];

    try {
        // Gửi yêu cầu lên server để cập nhật DB trong nền
        const res = await fetch('http://localhost:3000/cart/deselect-all', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId })
        });

        if (!res.ok) {
            console.error('Lỗi khi bỏ chọn sản phẩm trên server.');
            // Nếu lỗi, đồng bộ lại để khôi phục trạng thái đúng từ DB
            await syncCartWithDatabase();
        }
    } catch (error) {
        console.error('Lỗi API khi bỏ chọn sản phẩm:', error);
        await syncCartWithDatabase();
    }
};

// =========================
let debounceTimeout = null;

//hàm trễ giúp khi nhập chữ trên dòng search không bị reload liên tục
const handleSearch = (value, immediate = false) => {
  clearTimeout(debounceTimeout);
  searchTerm = value;
  if (immediate) {
    renderPage();
  } else {
    debounceTimeout = setTimeout(() => {
      renderPage();
    }, 3000);
  }
};

function handleSearchFromHeader(value, immediate = false) {
  // Bảo đảm luôn tìm trên trang chủ
  if (currentPath !== '/') currentPath = '/';
  handleSearch(value, immediate);
}


const handleSort = (value) => {
  sortOrder = value;
  renderPage();
};

// =========================
// Auth Pages (login/register/forgot)
// =========================
// const generateCaptcha = () => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   for (let i = 0; i < 6; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   captchaCode = result;
//   return captchaCode;
// };

const createAuthPages = (mode) => {
    let title = '';
    let content = '';
    let link = '';
    let formContent = '';

    switch (mode) {
        case 'login':
            title = 'Đăng nhập';
            content = `<p class="text-gray-500 text-center mb-6">Chào mừng bạn đến với Hust Book Store!</p>`;
            link = `<div class="links flex justify-between text-sm text-orange-600 mt-4">
                        <a href="#" onclick="handleNavigate('/forgot-password')" class="hover:underline">Quên mật khẩu?</a>
                        <a href="#" onclick="handleNavigate('/register')" class="hover:underline">Đăng ký ngay</a>
                    </div>`;
            formContent = `
                <div>
                    <label for="login-username" class="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                    <input type="text" id="login-username" required 
                      class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>
                <div>
                    <label for="login-password" class="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <input type="password" id="login-password" required 
                        class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>
                <button type="submit" 
                    class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">Đăng nhập</button>
            `;
            break;

        case 'register':
            title = 'Đăng ký';
            content = `<p class="text-gray-500 text-center mb-6">Tạo tài khoản mới để mua sắm dễ dàng!</p>`;
            link = `<div class="links mt-4 text-center text-sm">
                        <a href="#" onclick="handleNavigate('/login')" class="text-orange-600 hover:underline">Đã có tài khoản? Đăng nhập</a>
                    </div>`;
            formContent = `
                <div>
                  <label for="register-email" class="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" id="register-email" required
                        class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>
                <div>
                    <label for="register-username" class="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                    <input type="text" id="register-username" required 
                        class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>
                <div>
                    <label for="register-password" class="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <input type="password" id="register-password" required 
                        class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>
                <div>
                    <label for="register-confirm" class="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                    <input type="password" id="register-confirm" required 
                        class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>
                <button type="submit" 
                    class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">Đăng ký</button>
            `;
            break;

        case 'forgot-password':
title = 'Quên mật khẩu';
    link = `<div class="links mt-4 text-center text-sm">
              <a href="#" onclick="handleNavigate('/login')" class="text-orange-600 hover:underline">Quay lại đăng nhập</a>
            </div>`;
    if (forgotPasswordStep === 'verify') {
      formContent = `
        <div>
          <label for="forgot-username" class="block text-sm font-medium text-foreground">Tên đăng nhập</label>
          <input type="text" id="forgot-username" required class="auth-form-container input">
        </div>
        <div class="mt-4">
          <label for="forgot-email" class="block text-sm font-medium text-foreground">Email</label>
          <input type="email" id="forgot-email" required class="auth-form-container input">
        </div>
        <button type="submit" id="forgot-button"
          class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition mt-6">
          Xác thực
        </button>
      `;
    } else if (forgotPasswordStep === 'reset') {
      formContent = `
        <div>
          <label for="new-password" class="block text-sm font-medium text-foreground">Mật khẩu mới</label>
          <input type="password" id="new-password" required class="auth-form-container input">
        </div>
        <div class="mt-4">
          <label for="confirm-password" class="block text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
          <input type="password" id="confirm-password" required class="auth-form-container input">
        </div>
        <button type="submit" id="reset-button"
          class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition mt-6">
          Đặt lại mật khẩu
        </button>
      `;
    }
    content = `<p class="text-gray-500 text-center mb-6">Nhập thông tin để đặt lại mật khẩu.</p>`;
    }

    return `
    <div class="auth-container min-h-screen flex items-center justify-center bg-cover bg-center" 
         style="background-image: url('https://freight.cargo.site/t/original/i/9e5708691e64a1e33d917b7303eb44b6187904ee192962ed2e8ee0ff73b9c996/daikanyama_2016_001.jpg');">
      <div class="auth-card flex flex-col md:flex-row bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-4xl relative">
        <a href="javascript:void(0)" 
          onclick="handleNavigate('/')" 
          class="absolute top-4 left-4 z-50 text-muted-foreground hover:text-foreground flex items-center cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span>Quay lại cửa hàng</span>
        </a>
        <div class="auth-form-container md:w-full p-8 bg-white/90 backdrop-blur-sm relative"
            style="background-image: url('./image/auth.jpg'); background-size: cover; background-position: center;">
          <div class="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
          <div class="relative z-10">
            <h1 class="text-3xl font-bold text-center mb-4 text-gray-800">${title}</h1>
            ${content}
            <form class="space-y-4" onsubmit="handleAuthSubmit(event, '${mode}')">
              ${formContent}
            </form>
            ${link}
          </div>
        </div>
      </div>
    </div>`;
};


//trang hiển thị hồ sơ - lấy thông tin từ dtb
const createProfilePage = () => {
  if (!auth.user) {
    showMessage("Vui lòng đăng nhập để xem hồ sơ.");
    handleNavigate("/login");
    return "";
  }

  // Link ảnh nền bạn yêu cầu
  const backgroundImageUrl = 'https://png.pngtree.com/background/20250102/original/pngtree-sophisticated-white-texture-for-a-stunning-background-design-picture-image_15289420.jpg';

  return `
  <div class="min-h-screen bg-cover bg-center flex items-center justify-center p-4" 
       style="background-image: url('${backgroundImageUrl}');">
    <div class="relative max-w-lg w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
        <a href="javascript:void(0)" 
          onclick="handleNavigate('/')" 
          class="absolute top-4 left-4 text-gray-500 hover:text-gray-800 flex items-center cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span>Quay lại</span>
        </a>

      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Hồ sơ của tôi</h1>
        <p class="text-gray-600 mt-2">Cập nhật thông tin cá nhân của bạn.</p>
      </div>
      <form onsubmit="handleSaveProfile(event)" class="space-y-6">
        <div>
          <label for="profile-username" class="block mb-2 text-sm font-semibold text-gray-700">Tên người dùng</label>
          <input type="text" id="profile-username" value="${auth.user.username || ''}" required 
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"/>
        </div>
        <div>
          <label for="profile-address" class="block mb-2 text-sm font-semibold text-gray-700">Địa chỉ</label>
          <input type="text" id="profile-address" value="${auth.user.address || ''}" required 
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"/>
        </div>
        <div>
          <label for="profile-phone" class="block mb-2 text-sm font-semibold text-gray-700">Số điện thoại</label>
          <input type="tel" id="profile-phone" value="${auth.user.phone_number || ''}" required 
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"/>
        </div>
        <button type="submit" class="w-full px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105 shadow-md">
          Lưu thay đổi
        </button>
      </form>
    </div>
  </div>`;
};


const handleSaveProfile = async (e) => {
  e.preventDefault();
  
  if (!auth.user || !auth.user.user_id) {
    showMessage("Lỗi: Không tìm thấy thông tin người dùng.");
    return;
  }

  // 1. Lấy dữ liệu mới từ form
  const name = document.getElementById("profile-name").value;
  const address = document.getElementById("profile-address").value;
  const phone = document.getElementById("profile-phone").value;

  // Dữ liệu cần gửi lên server.
  // Lưu ý: Gửi cả những thông tin không đổi (như email, role) để tránh bị ghi đè thành null
  const updatedData = {
    username: name,
    address: address,
    phone_number: phone,
    email: auth.user.email, // Giữ lại email cũ
    role: auth.user.role    // Giữ lại vai trò cũ
  };

  try {
    // 2. Gửi yêu cầu PUT đến server để cập nhật database
    const res = await fetch(`http://localhost:3000/users/${auth.user.user_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const data = await res.json();

    if (res.ok) {
      // 3. Nếu thành công, cập nhật lại auth.user và localStorage với dữ liệu mới từ server
      auth.user = data;
      localStorage.setItem("auth", JSON.stringify(auth.user));
      
      showMessage("Cập nhật hồ sơ thành công!");
      handleNavigate("/"); // Chuyển về trang chủ
    } else {
      showMessage(`Lỗi: ${data.message || 'Cập nhật thất bại.'}`);
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ:", error);
    showMessage("Lỗi kết nối đến server. Vui lòng thử lại.");
  }
};

// =========================
// Trang theo dõi đơn hàng
// =========================
const createOrderTrackingPage = () => {
  if (!auth.user) {
    return `
      <div class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-lg">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Vui lòng đăng nhập</h1>
          <p class="text-gray-600 mb-6">Bạn cần đăng nhập để xem lịch sử và theo dõi đơn hàng của mình.</p>
          <button onclick="handleNavigate('/login')" class="py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">
            Đi đến trang đăng nhập
          </button>
        </div>
      </div>
    `;
  }

  if (userBills.length === 0) {
    return `
      <div class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-lg">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Bạn chưa có đơn hàng nào</h1>
          <p class="text-gray-600 mb-6">Hãy mua sắm để trải nghiệm dịch vụ của chúng tôi.</p>
          <button onclick="handleNavigate('/')" class="py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">Tiếp tục mua hàng</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="max-w-4xl mx-auto py-10 px-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Lịch sử đơn hàng</h1>
      <div class="space-y-6">
        ${userBills.map(bill => {
            const orderDate = new Date(bill.purchase_date).toLocaleDateString("vi-VN");
            const statusClass = bill.status === 'đã hủy' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
            
            return `
            <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-4">
                <div>
                  <h2 class="font-bold text-lg">Đơn hàng #${bill.bill_id}</h2>
                  <p class="text-sm text-gray-500">Ngày đặt: ${orderDate}</p>
                </div>
                <div class="flex items-center space-x-4 mt-2 sm:mt-0">
                    <span class="text-lg font-bold text-red-600">${Number(bill.total_amount).toLocaleString('vi-VN')}₫</span>
                    <span class="text-sm font-semibold capitalize px-3 py-1 rounded-full ${statusClass}">
                      ${bill.status}
                    </span>
                </div>
              </div>

              <div class="space-y-3 mb-4">
                ${bill.items && bill.items.map(item => `
                  <div class="flex items-center">
                    <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-md mr-4">
                    <div class="flex-1">
                      <p class="font-semibold">${item.title}</p>
                      <p class="text-sm text-gray-600">Số lượng: ${item.quantity} x ${Number(item.price_at_purchase).toLocaleString('vi-VN')}₫</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              ${bill.status === 'chờ xác nhận' ? `
                <div class="flex justify-end">
                  <button onclick="handleCancelOrder(${bill.bill_id})" 
                          class="py-2 px-4 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm">
                    Hủy đơn hàng
                  </button>
                </div>
              ` : ''}
            </div>
          `
        }).join('')}
      </div>
    </div>
  `;
};

// =========================
// Auth handlers
// =========================
const handleAuthSubmit = async (e, mode) => {
    e.preventDefault();

    if (mode === 'login') {
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        if (username && password) {
            try {
                const res = await fetch("http://localhost:3000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (res.ok) {
                    auth.user = data.user;  // user lấy từ DB
                    localStorage.setItem("auth", JSON.stringify(auth.user));
                    await syncCartWithDatabase(); //lấy thông tin giỏ hàng
                    handleNavigate("/");
                    showMessage("Đăng nhập thành công!");
                } else {
                    showMessage(data.message || "Sai tài khoản hoặc mật khẩu.");
                }
            } catch (err) {
                console.error(err);
                showMessage("Không thể kết nối tới server.");
            }
        } else {
            showMessage("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
        }

    } else if (mode === 'register') {
        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;

        if (username && email && password) {
            try {
                const res = await fetch("http://localhost:3000/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    auth.user = data; // user mới được tạo trong DB
                    localStorage.setItem("auth", JSON.stringify(auth.user));
                    handleNavigate("/");
                    showMessage("Đăng ký thành công!");
                } else {
                    showMessage(data.message || "Đăng ký thất bại.");
                }
            } catch (err) {
                console.error(err);
                showMessage("Không thể kết nối tới server.");
            }
        } else {
            showMessage("Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.");
        }

    } else if (mode === 'forgot-password') {
      if (forgotPasswordStep === 'verify') {
        const username = document.getElementById('forgot-username').value;
        const email = document.getElementById('forgot-email').value;
        if (!username || !email) {
          showMessage('Vui lòng nhập đầy đủ tên đăng nhập và email.');
          return;
        }
        try {
          const res = await fetch("http://localhost:3000/api/forgot-password", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
          });
          const data = await res.json();
          if (res.ok) {
            showMessage('Xác thực thành công! Vui lòng đặt lại mật khẩu.');
            forgotPasswordStep = 'reset';
            forgotUsername = username;
            forgotEmail = email;
            renderPage();
          } else {
            showMessage(data.message || 'Tên đăng nhập hoặc email không chính xác.');
          }
        } catch (err) {
          showMessage('Lỗi kết nối server. Vui lòng thử lại sau.');
          console.error('Lỗi khi gửi yêu cầu quên mật khẩu:', err);
        }
      } else if (forgotPasswordStep === 'reset') {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (!newPassword || !confirmPassword) {
          showMessage('Vui lòng nhập đầy đủ mật khẩu mới.');
          return;
        }
        if (newPassword !== confirmPassword) {
          showMessage('Mật khẩu xác nhận không khớp.');
          return;
        }
        try {
          const res = await fetch("http://localhost:3000/api/reset-password", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: forgotUsername,
              email: forgotEmail,
              newPassword
            })
          });
          const data = await res.json();
          if (res.ok) {
            showMessage('Đặt lại mật khẩu thành công!');
            forgotPasswordStep = 'verify';
            forgotUsername = '';
            forgotEmail = '';
            handleNavigate('/login');
          } else {
            showMessage(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
          }
        } catch (err) {
          showMessage('Lỗi kết nối server. Vui lòng thử lại sau.');
          console.error('Lỗi khi gửi yêu cầu đặt lại mật khẩu:', err);
        }
      }
    }
};

function logout() {
  auth.user = null;
  localStorage.removeItem("auth");

  // Xóa toàn bộ giỏ hàng
  cartItems = [];
  selectedCartIds = [];

  handleNavigate("/");
  showMessage('Bạn đã đăng xuất và giỏ hàng đã được xóa!');
}


// =========================
// Trang giỏ hàng
// =========================
const createCartPage = () => {
    const cartTotal = cartItems
      .filter(item => selectedCartIds.includes(item.book.id))
      .reduce((total, item) => total + (item.book.price * item.quantity), 0);
    
    let shippingFee = 0;
    if (selectedCartIds.length > 0) {
      if (cartTotal < 200000) {
        shippingFee = 40000;
      } else if (cartTotal < 500000) {
        shippingFee = 25000;
      }
    }

    let finalDiscount = 0;
    let finalShippingFee = shippingFee;

    if (selectedDiscountVoucher) {
        if (selectedDiscountVoucher.isPercentage) {
            let calculatedDiscount = cartTotal * (selectedDiscountVoucher.value / 100);
            finalDiscount = Math.min(calculatedDiscount, selectedDiscountVoucher.maxDiscount);
        } else {
            finalDiscount = selectedDiscountVoucher.value;
        }
    }

    if (selectedShippingVoucher) {
        finalShippingFee = Math.max(0, shippingFee - selectedShippingVoucher.value);
    }
    
    const finalTotal = cartTotal - finalDiscount + finalShippingFee;
    
    const discountVouchers = availableVouchers.filter(v => v.type === 'discount');
    const shippingVouchers = availableVouchers.filter(v => v.type === 'shipping');

    return `
    <div id="page-cart" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-bold mb-8 text-foreground">Giỏ hàng của bạn</h1>
        ${cartItems.length > 0 && !showVoucherList ? `
          <div class="mb-6 flex justify-start">
            <button onclick="handleNavigate('/')" class="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">
              Tiếp tục mua hàng
            </button>
          </div>
        ` : ''}

        ${cartItems.length === 0
          ? `<p class="text-center text-muted-foreground">Giỏ hàng của bạn trống.</p>`
          : `
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 space-y-4">
              ${cartItems.map(item => `
                <div class="flex items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <input type="checkbox" ${selectedCartIds.includes(item.book.id) ? 'checked' : ''} 
                    onchange="handleToggleCartItem(${item.book.id})" class="mr-4 w-5 h-5 accent-orange-500">
                  <img src="${item.book.image}" alt="${item.book.title}" class="w-20 h-20 rounded-lg object-cover mr-4 flex-shrink-0">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg">${item.book.title}</h3>
                    <p class="text-gray-500 text-sm mb-2">Tác giả: ${item.book.author}</p>
                    <p class="font-bold text-black-600">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button onclick="handleUpdateCartItemQuantity(${item.book.id}, -1)" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300">-</button>
                    <span class="font-medium w-6 text-center">${item.quantity}</span>
                    <button onclick="handleUpdateCartItemQuantity(${item.book.id}, 1)" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300">+</button>
                  </div>
                  <button onclick="handleRemoveCartItem(${item.book.id})" class="ml-4 text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
            
            <div class="md:w-1/3 bg-white rounded-lg p-6 shadow-md h-fit">
              <h2 class="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
              
              <div class="flex justify-between mb-2">
                <span>Tổng tiền sản phẩm</span>
                <span class="font-semibold">${cartTotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div class="flex justify-between mb-4 border-b border-gray-200 pb-4">
                <span>Phí vận chuyển</span>
                <span class="font-semibold">${shippingFee.toLocaleString('vi-VN')}₫</span>
              </div>
              <div class="flex justify-between mb-4">
                <span>Giảm giá phí vận chuyển</span>
                <span class="font-semibold text-green-600">- ${(selectedShippingVoucher ? selectedShippingVoucher.value : 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span>
              </div>
              <div class="flex justify-between mb-4">
                <span>Giảm giá</span>
                <span class="font-semibold text-red-500">- ${(finalDiscount || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span>
              </div>
              <div class="flex justify-between font-bold text-lg mb-6">
                <span>Tổng thanh toán</span>
                <span class="text-red-500">${finalTotal.toLocaleString('vi-VN')}₫</span>
              </div>
              
              <button onclick="handleShowVoucherList()" class="w-full py-2 px-4 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors mb-4">
                ${selectedDiscountVoucher || selectedShippingVoucher ? 'Đã áp dụng mã giảm giá' : 'Áp dụng mã giảm giá'}
              </button>

              <button onclick="handleCheckout()" 
                class="w-full py-3 px-6 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                ${selectedCartIds.length === 0 ? 'disabled' : ''}>
                Tiến hành thanh toán (${selectedCartIds.length} sản phẩm)
              </button>
            </div>
          </div>
        `}
        
        ${showVoucherList ? `
        <div id="voucher-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg p-6 w-full" style="max-width: 600px;">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold">Chọn mã giảm giá</h3>
              <button onclick="handleHideVoucherList()" class="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div class="overflow-y-auto" style="max-height: calc(70vh - 80px);">
            
            <div class="overflow-y-auto" style="max-height: calc(70vh - 80px);">
                <h4 class="text-lg font-semibold mb-2 mt-4">Mã miễn phí vận chuyển</h4>
                <div class="space-y-4 mb-6">
                    ${shippingVouchers.map(voucher => {
                        const isUsable = cartTotal >= voucher.minPrice && voucher.remaining > 0 && shippingFee > 0;
                        const isSelected = selectedShippingVoucher && selectedShippingVoucher.code === voucher.code;
                        const isDisabled = !isUsable || (selectedShippingVoucher && !isSelected);

                        return `
                        <div class="p-4 border border-dashed rounded-lg flex items-center justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}">
                            <div>
                                <h4 class="font-semibold text-lg">${voucher.code}</h4>
                                <p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${voucher.minPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</p>
                                <p class="text-sm text-gray-700">
                                  Giảm <span class="font-bold">${voucher.value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span> phí vận chuyển
                                </p>
                                <p class="text-xs text-red-500">
                                  HSD: ${new Date(voucher.expiration).toLocaleDateString('vi-VN')} | Còn lại: ${voucher.remaining} mã
                                </p>
                            </div>
                            ${isSelected
                                ? `<button onclick="handleRemoveVoucher('${voucher.code}', 'shipping')" class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold">Xóa</button>`
                                : `<button onclick="handleApplyVoucher('${voucher.code}', 'shipping')" ${isDisabled ? 'disabled' : ''} class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'}">Áp dụng</button>`
                            }
                        </div>
                        `;
                    }).join('')}
                </div>

                <h4 class="text-lg font-semibold mb-2 mt-4">Mã giảm giá sản phẩm</h4>
                <div class="space-y-4">
                    ${discountVouchers.map(voucher => {
                        const isUsable = cartTotal >= voucher.minPrice && voucher.remaining > 0;
                        const isSelected = selectedDiscountVoucher && selectedDiscountVoucher.code === voucher.code;
                        const isDisabled = !isUsable || (selectedDiscountVoucher && !isSelected);

                        let voucherDetail = '';
                        if (voucher.isPercentage) {
                          voucherDetail = `Giảm <span class="font-bold">${voucher.value}%</span> tối đa <span class="font-bold">${voucher.maxDiscount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span>`;
                        } else {
                          voucherDetail = `Giảm <span class="font-bold">${voucher.value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span>`;
                        }
                        
                        return `
                        <div class="p-4 border border-dashed rounded-lg flex items-center justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}">
                            <div>
                                <h4 class="font-semibold text-lg">${voucher.code}</h4>
                                <p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${voucher.minPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</p>
                                <p class="text-sm text-gray-700">${voucherDetail}</p>
                                <p class="text-xs text-red-500">
                                  HSD: ${new Date(voucher.expiration).toLocaleDateString('vi-VN')} | Còn lại: ${voucher.remaining} mã
                                </p>
                            ${isSelected
                                ? `<button onclick="handleRemoveVoucher('${voucher.code}', 'discount')" class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold">Xóa</button>`
                                : `<button onclick="handleApplyVoucher('${voucher.code}', 'discount')" ${isDisabled ? 'disabled' : ''} class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'}">Áp dụng</button>`
                            }
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
          </div>
        </div>
        ` : ''}
    </div>`;
};

const handleToggleCartItem = async (bookId) => {
  // Xác định trạng thái lựa chọn hiện tại
  const isCurrentlySelected = selectedCartIds.includes(bookId);
  const newSelectedState = !isCurrentlySelected; // Trạng thái mới sẽ là ngược lại

  // 1. Cập nhật trạng thái ở local ngay lập tức để UI phản hồi nhanh
  if (isCurrentlySelected) {
    selectedCartIds = selectedCartIds.filter(id => id !== bookId);
  } else {
    selectedCartIds.push(bookId);
  }
  // Vẽ lại giao diện ngay lập tức với trạng thái mới
  renderPage();

  // 2. Gửi yêu cầu cập nhật lên server trong nền
  // Tìm cart_item_id tương ứng với bookId vì API cần nó để cập nhật
  const itemToUpdate = cartItems.find(item => item.book.id === bookId);
  if (!itemToUpdate) {
    console.error("Lỗi: Không tìm thấy sản phẩm trong giỏ hàng để cập nhật.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/cart/items/${itemToUpdate.cart_item_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_selected: newSelectedState }) // Gửi trạng thái mới lên server
    });

    if (!res.ok) {
      console.error('Lỗi khi cập nhật trạng thái lựa chọn trên server.');
      // Nếu có lỗi, đồng bộ lại toàn bộ giỏ hàng để đảm bảo UI khớp với DB
      await syncCartWithDatabase();
    }
  } catch (error) {
    console.error('Lỗi API khi cập nhật lựa chọn:', error);
    await syncCartWithDatabase();
  }
};

// Khi mở modal
function handleShowVoucherList() {
  showVoucherList = true;
  document.body.classList.add('overflow-hidden');
  renderPage();
}

// Khi đóng modal
function handleHideVoucherList() {
  showVoucherList = false;
  document.body.classList.remove('overflow-hidden');
  renderPage();
}

const handleApplyVoucher = (code, type) => {
    const voucherToApply = availableVouchers.find(v => v.code === code);
    if (voucherToApply) {
        if (type === 'discount') {
            selectedDiscountVoucher = voucherToApply;
        } else if (type === 'shipping') {
            selectedShippingVoucher = voucherToApply;
        }
        showMessage(`Đã áp dụng mã giảm giá ${code}`);
    }
    renderPage();
};

const handleRemoveVoucher = (code, type) => {
    if (type === 'discount') {
        selectedDiscountVoucher = null;
    } else if (type === 'shipping') {
        selectedShippingVoucher = null;
    }
    showMessage('Đã xóa mã giảm giá');
    renderPage();
};

function handleUpdateCartItemQuantity(bookId, delta) {
  const item = cartItems.find(i => i.book.id === bookId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  renderPage();
}

// hàm xóa sản phẩm trong giỏ hàng
function handleRemoveCartItem(bookId) {
  const item = cartItems.find(i => i.book.id === bookId);
  if (!item) return;

  // Gọi API xóa trên database
  getOrCreateCartId().then(cartId => {
    if (!cartId) return;
    fetch('http://localhost:3000/cart/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_id: cartId,
        product_id: bookId
      })
    })
    .then(res => res.json())
    .then(data => {
      showMessage(data.message || 'Đã xóa sản phẩm khỏi giỏ hàng!');
      // Đồng bộ lại giỏ hàng từ DB
      syncCartWithDatabase();
    })
    .catch(err => {
      console.error("❌ Lỗi API khi xóa sản phẩm khỏi giỏ hàng:", err);
      showMessage('Lỗi: Không thể kết nối tới máy chủ!');
    });
  });
}

//hàm kiểm tra thanh toán
function handleCheckout() {
  if (!auth.user) {
    showMessage("Vui lòng đăng nhập để thanh toán.");
    handleNavigate("/login");
    return;
  }
  if (selectedCartIds.length === 0) {
    showMessage("Bạn chưa chọn sản phẩm nào để thanh toán.");
    return;
  }
  handleNavigate("/checkout");
}

//====================================
//Trang thanh toán
const createCheckoutPage = () => {
  const itemsToCheckout = cartItems.filter(item => selectedCartIds.includes(item.book.id));
  if (itemsToCheckout.length === 0) {
    return `<p class="text-center">Không có sản phẩm nào để thanh toán.</p>`;
  }

  const cartTotal = itemsToCheckout.reduce((t, i) => t + i.book.price * i.quantity, 0);
  let shippingFee = itemsToCheckout.length > 0
    ? (cartTotal < 200000 ? 40000 : (cartTotal < 500000 ? 25000 : 0))
    : 0;
  let discount = selectedDiscountVoucher 
    ? (selectedDiscountVoucher.isPercentage
        ? Math.min(cartTotal * selectedDiscountVoucher.value / 100, selectedDiscountVoucher.maxDiscount || Infinity)
        : selectedDiscountVoucher.value)
    : 0;
  if (selectedShippingVoucher) {
    shippingFee = Math.max(0, shippingFee - selectedShippingVoucher.value);
  }
  const finalTotal = cartTotal - discount + shippingFee;

  // Lấy dữ liệu từ hồ sơ (nếu có)
  const name = auth.user?.name || "";
  const address = auth.user?.address || "";
  const phone = auth.user?.phone || "";

  return `
    <div class="relative min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-cover bg-center" 
          style="background-image: url('https://images.squarespace-cdn.com/content/v1/56497023e4b06a49bd376eb2/50869e1a-4091-4c05-9fa9-7b58e927485e/IMG_0979.jpg'); opacity: 0.15;">
      </div>
      
      <div class="relative max-w-3xl w-full p-6 bg-white rounded-xl shadow-lg my-8 z-10">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">Thanh toán đơn hàng</h1>

        <!-- Tóm tắt đơn hàng -->
        <div class="space-y-4 mb-8">
          <h2 class="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Tóm tắt đơn hàng</h2>
          ${itemsToCheckout.map(item => `
          <div class="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
            <div class="flex items-center space-x-4">
              <img src="${item.book.image}" class="w-12 h-12 object-cover rounded-md shadow-sm"/>
              <div class="flex flex-col">
                <span class="font-medium text-gray-800">${item.book.title}</span>
                <span class="text-sm text-gray-500">Số lượng: ${item.quantity}</span>
              </div>
            </div>
            <span class="font-semibold text-gray-800">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</span>
          </div>
          `).join("")}
        </div>

        <!-- Tổng cộng -->
        <div class="mb-8 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Tổng sản phẩm:</span>
            <span class="font-medium text-gray-800">${cartTotal.toLocaleString('vi-VN')}₫</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Giảm giá:</span>
            <span class="font-medium text-green-600">- ${discount.toLocaleString('vi-VN')}₫</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-gray-600">Phí ship:</span>
            <span class="font-medium text-gray-800">${shippingFee.toLocaleString('vi-VN')}₫</span>
          </div>
          <div class="flex justify-between items-center pt-4 text-xl font-bold">
            <span class="text-gray-800">Tổng cộng:</span>
            <span class="text-red-600">${finalTotal.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        <!-- Form giao hàng -->
        <h2 class="text-xl font-semibold text-gray-700 mb-6">Thông tin giao hàng</h2>
        <form onsubmit="handlePlaceOrder(event)" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" id="checkout-name" value="${name}" placeholder="Họ và tên" required
              class="w-full px-5 py-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"/>

            <input type="tel" id="checkout-phone" value="${phone}" placeholder="Số điện thoại" required
              class="w-full px-5 py-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"/>
          </div>

          <input type="text" id="checkout-address" value="${address}" placeholder="Địa chỉ" required
            class="w-full px-5 py-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"/>

          <!-- Phương thức thanh toán -->
          <div class="space-y-4">
            <label for="checkout-payment" class="block text-gray-700 font-medium">Phương thức thanh toán</label>
            <select id="checkout-payment" required
              class="w-full px-5 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200">
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            </select>
          </div>

          <!-- Nút hành động -->
          <div class="flex flex-col sm:flex-row gap-4 mt-8">
            <button type="submit" 
              class="flex-1 min-w-[140px] py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors duration-300 shadow-md text-center">
              Đặt hàng
            </button>
            <button type="button" onclick="handleNavigate('/cart')" 
              class="flex-1 min-w-[140px] py-3 px-6 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors duration-300 shadow-md text-center">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>

  `;
};

// Hàm để tải hóa đơn từ server
const loadUserBills = async () => {
    if (!auth.user) {
        userBills = [];
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/bills/user/${auth.user.user_id}`);
        if (res.ok) {
            userBills = await res.json();
            console.log("✅ Bills loaded:", userBills);
        } else {
            console.error("❌ Lỗi khi tải hóa đơn");
            userBills = [];
        }
    } catch (err) {
        console.error("❌ Lỗi API khi tải hóa đơn:", err);
        userBills = [];
    }
};


//xử lí thanh toán, đặt hàng trừ voucher và stock product, hủy thì hoàn
async function handlePlaceOrder(event) {
    event.preventDefault();

    const itemsToCheckout = cartItems.filter(item => selectedCartIds.includes(item.book.id));
    if (itemsToCheckout.length === 0) {
        showMessage("Không có sản phẩm để đặt hàng.");
        return;
    }

    // 1. Thu thập dữ liệu
    const shippingDetails = {
        name: document.getElementById("checkout-name").value,
        phone: document.getElementById("checkout-phone").value,
        address: document.getElementById("checkout-address").value,
    };
    
    const cartTotal = itemsToCheckout.reduce((t, i) => t + i.book.price * i.quantity, 0);
    let baseShippingFee = cartTotal < 200000 ? 40000 : (cartTotal < 500000 ? 25000 : 0);
    let finalShippingFee = baseShippingFee;
    
    let discount = 0;
    if (selectedDiscountVoucher) {
        discount = selectedDiscountVoucher.isPercentage
            ? Math.min(cartTotal * selectedDiscountVoucher.value / 100, selectedDiscountVoucher.maxDiscount || Infinity)
            : selectedDiscountVoucher.value;
    }

    if (selectedShippingVoucher) {
        finalShippingFee = Math.max(0, baseShippingFee - selectedShippingVoucher.value);
    }

    const finalTotal = cartTotal - discount + finalShippingFee;

    // 2. Tạo payload gửi lên server
    const payload = {
        userId: auth.user.user_id,
        items: itemsToCheckout,
        shippingDetails: shippingDetails,
        totals: {
            cartTotal,
            shippingFee: finalShippingFee,
            discount,
            finalTotal,
        },
        usedVoucherCode: selectedDiscountVoucher ? selectedDiscountVoucher.code : null,
        usedShippingVoucherCode: selectedShippingVoucher ? selectedShippingVoucher.code : null,
    };

    // 3. Gửi yêu cầu POST đến /bills
    try {
        const res = await fetch("http://localhost:3000/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
            showMessage("Đặt hàng thành công!");
            
            selectedCartIds = [];
            selectedDiscountVoucher = null;
            selectedShippingVoucher = null;

            await syncCartWithDatabase(); 
            handleNavigate("/order-tracking");
        } else {
            showMessage(`Đặt hàng thất bại: ${data.message}`);
        }
    } catch (err) {
        console.error("Lỗi khi đặt hàng:", err);
        showMessage("Lỗi kết nối. Không thể đặt hàng.");
    }
}

// Hủy đơn hàng, hoàn lại voucher
async function handleCancelOrder(billId) {
    // Hỏi người dùng để xác nhận
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/bills/${billId}/cancel`, {
            method: 'PATCH',
        });

        const data = await res.json();

        if (res.ok) {
            showMessage(data.message || 'Hủy đơn hàng thành công!');
            // Tải lại danh sách hóa đơn để cập nhật trạng thái
            await loadUserBills();
            // Vẽ lại trang
            renderPage();
        } else {
            showMessage(`Lỗi: ${data.message}`);
        }
    } catch (err) {
        console.error('Lỗi khi hủy đơn hàng:', err);
        showMessage('Lỗi kết nối. Không thể hủy đơn hàng.');
    }
}


// =========================
// Trang đặt hàng thành công
// =========================
const createOrderSuccessPage = () => {
  return `
    <div class="relative min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-cover bg-center" 
           style="background-image: url('https://source.unsplash.com/random/1600x900/?books,library'); opacity: 0.1;">
      </div>

      <div class="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-10 z-10 flex flex-col items-center text-center">
        <div class="bg-green-100 rounded-full p-6 mb-6">
          <svg class="text-green-600 w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 
              00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 
              00-1.414 1.414l2 2a1 1 0 
              001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Đặt hàng thành công!</h1>
        <p class="text-lg text-gray-600 mb-2">Cảm ơn bạn đã mua hàng tại 
          <span class="font-semibold text-orange-500">Hust Book Store</span>.
        </p>
        <p class="text-base text-gray-500 mb-8">Đơn hàng của bạn đang được xử lý và sẽ sớm được giao.</p>

        <div class="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-8 w-full md:w-2/3">
          <h2 class="text-lg font-semibold text-blue-700 mb-2">Thông tin giao hàng dự kiến</h2>
          <p id="delivery-date" class="text-2xl font-bold text-blue-800">30/08/2025</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <a href="/" 
             class="flex-1 sm:flex-none py-3 px-8 rounded-lg bg-orange-500 text-white text-lg font-semibold hover:bg-orange-600 transition-colors duration-300 shadow-md">
             Tiếp tục mua sắm
          </a>
          <a href="/order-tracking" 
             class="flex-1 sm:flex-none py-3 px-8 rounded-lg bg-gray-200 text-gray-700 text-lg font-semibold hover:bg-gray-300 transition-colors duration-300 shadow-md">
             Theo dõi đơn hàng
          </a>
        </div>
      </div>
    </div>
  `;
};


// =========================
// Khởi tạo Carousel
// =========================
const initCarousel = () => {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Thoát sớm nếu không tìm thấy các phần tử cần thiết
  if (!track || !prevBtn || !nextBtn) {
    return;
  }

  const slides = Array.from(track.children);
  // Kiểm tra nếu không có slide thì không cần chạy
  if (slides.length === 0) {
    return;
  }
  
  const totalSlides = slides.length;
  let currentSlide = 0;
  let intervalId = null;
  const intervalTime = 3000; // 3 giây

  const updateSlide = () => {
    const slideWidth = slides[0].offsetWidth;
    const offset = -slideWidth * currentSlide;
    track.style.transform = `translateX(${offset}px)`;
  };

  const showNextSlide = () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlide();
  };

  const showPrevSlide = () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlide();
  };
  
  // Dọn dẹp interval cũ trước khi tạo cái mới
  // Điều này quan trọng để tránh nhiều interval chạy cùng lúc khi render lại trang
  if (window.carouselIntervalId) {
    clearInterval(window.carouselIntervalId);
  }

  const startAutoSlide = () => {
    intervalId = setInterval(showNextSlide, intervalTime);
    window.carouselIntervalId = intervalId; // Lưu lại ID để có thể xóa
  };

  const resetAutoSlide = () => {
    clearInterval(intervalId);
    startAutoSlide();
  };

  // Gắn sự kiện cho nút
  nextBtn.addEventListener("click", () => {
    showNextSlide();
    resetAutoSlide();
  });

  prevBtn.addEventListener("click", () => {
    showPrevSlide();
    resetAutoSlide();
  });

  // Tự động chạy
  if (totalSlides > 1) {
    startAutoSlide();
  }
};

// render page
const renderPage = () => {
  const pageContainer = document.getElementById('page-container');
  const headerContainer = document.getElementById('header-container');

  // Ẩn header ở các trang auth
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(currentPath);
  headerContainer.innerHTML = isAuthPage ? '' : createHeader();

  // Sau khi header vào DOM, gắn sự kiện menu
  if (!isAuthPage) {
    initAccountMenu();
  }

  let pageContent = '';
  switch (currentPath) {
    case '/':
      pageContent = createHomePage();
      break;
    case '/book':
      pageContent = createBookDetailPage();
      break;
    case '/cart':
      pageContent = createCartPage();
      break;
    case '/login':
      pageContent = createAuthPages('login');
      break;
    case '/register':
      pageContent = createAuthPages('register');
      break;
    case '/forgot-password':
      pageContent = createAuthPages('forgot-password');
      break;
    case '/profile':
      pageContent = createProfilePage();
      break;
    case '/checkout':
      pageContent = createCheckoutPage();
      break;
    case '/order-tracking':
      pageContent = createOrderTrackingPage(); 
      break;
    case '/order-success':
      app.innerHTML = createHeader() + createOrderSuccessPage();
      break;
    default:
      pageContent = createHomePage();
      break;
  }

  pageContainer.innerHTML = pageContent;

  // GỌI KHỞI TẠO CAROUSEL SAU KHI RENDER TRANG CHỦ
  if (currentPath === "/") {
    initCarousel(); 
    // bạn không cần initCategoryMenu() ở đây nữa vì nó không tồn tại trong code
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Đọc auth trước khi render lần đầu
  const saved = localStorage.getItem("auth");
  if (saved) {
    try {
      auth.user = JSON.parse(saved);
    } catch (_) {
      auth.user = null;
    }
  }
  // Nếu có thông tin user, gọi lên server để lấy dữ liệu mới nhất.
  if (auth.user && auth.user.user_id) {
    try {
      const res = await fetch(`http://localhost:3000/users/${auth.user.user_id}`);
      if (res.ok) {
        const freshUserData = await res.json();
        // Cập nhật lại state và localStorage với dữ liệu mới nhất từ DB
        auth.user = freshUserData;
        localStorage.setItem("auth", JSON.stringify(auth.user));
        console.log("✅ Đồng bộ thông tin người dùng thành công!");
      } else {
        // Nếu user không còn tồn tại trên DB, tự động đăng xuất
        console.warn("Người dùng không tồn tại, tự động đăng xuất.");
        logout();
      }
    } catch (err) {
      console.error("❌ Lỗi khi đồng bộ lại thông tin người dùng:", err);
      // Nếu server lỗi, tạm thời vẫn dùng dữ liệu cũ trong localStorage
    }
  }
  await loadProducts();
  await loadVouchers(); 
  if (auth.user) {
    await syncCartWithDatabase();
  }

  // Render trang, chèn HTML của carousel vào DOM
  renderPage();
});

