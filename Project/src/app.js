// =================================================================
// I. QUẢN LÝ TRẠNG THÁI TOÀN CỤC (GLOBAL STATE)
// =================================================================


// --- Trạng thái điều hướng và giao diện chung ---
let currentPath = '/';
let mainContentMode = 'home'; // 'home', 'search', 'favorite', 'flash-sale'
let bookDetailTab = 'description'; // 'description' hoặc 'reviews'
let searchTerm = '';
let sortOrder = 'default';

// --- Trạng thái dữ liệu người dùng ---
let auth = { user: null }; // QUAN TRỌNG: Chỉ khai báo MỘT LẦN
let cartItems = [];
let selectedCartIds = []; // Mặc định rỗng, sẽ được đồng bộ từ DB
let userBills = [];
let orderFilterStatus = 'all'; // 'all', 'chờ xác nhận', 'đã xác nhận', 'đã giao', 'đã hủy'

// --- Trạng thái tương tác của người dùng ---
let selectedBook = null;
let selectedCategory = null;
let quantity = 1;
let selectedDiscountVoucher = null;
let selectedShippingVoucher = null;
let showVoucherList = false;
let currentBookReviews = []; // Lưu các review của sách đang xem

// --- Trạng thái tìm kiếm ---
let searchState = {
    name: '',
    author: '',
    category: '',
    minPrice: 0,
    maxPrice: 1000000,
    results: [],
    hasSearched: false
};

// --- Trạng thái cho các Modal (cửa sổ pop-up) ---
let reviewModalState = {
    isOpen: false,
    productId: null,
    productTitle: '',
    billId: null
};

let flashSaleModalState = {
    isOpen: false,
    product: null
};

// --- Trạng thái xác thực (Quên mật khẩu) ---
let forgotPasswordStep = 'verify'; // 'verify' hoặc 'reset'
let forgotUsername = '';
let forgotEmail = '';

// --- Trạng thái trang chủ ---
let categoryDisplayCounts = {}; // Lưu số lượng sách đang hiển thị cho từng danh mục


// =================================================================
// II. TRẠNG THÁI DÀNH RIÊNG CHO ADMIN
// =================================================================
let adminCurrentView = 'dashboard'; // 'dashboard', 'orders', 'inventory', 'revenue', etc.
let adminComments = [];
const now = new Date();
let adminRevenueFilterYear = now.getFullYear();
let adminRevenueFilterMonth = now.getMonth() + 1;

// --- Dữ liệu tổng hợp cho trang admin ---
let adminData = {
    stats: null,
    orders: null,
    revenue: null
};

// --- Trạng thái Modal của Admin ---
let isAddProductModalOpen = false;
let editProductModalState = { isOpen: false, product: null };
let isAddVoucherModalOpen = false;
let editVoucherModalState = { isOpen: false, voucher: null };
let isAddBannerModalOpen = false;
let editBannerModalState = { isOpen: false, banner: null };


// =================================================================
// III. DỮ LIỆU CỐ ĐỊNH VÀ TẢI DỮ LIỆU BAN ĐẦU (DATA & INITIAL LOAD)
// =================================================================
// Phần này chịu trách nhiệm lấy dữ liệu cốt lõi từ server khi ứng dụng khởi động.
// =================================================================

// --- Mảng lưu trữ dữ liệu chính từ server ---
let availableBooks = [];
let uniqueCategories = [];
let availableVouchers = [];
let availableBanners = [];

/**
 * [KHỞI TẠO] Tải danh sách sản phẩm (sách) từ server.
 * Chuyển đổi dữ liệu và lưu vào biến `availableBooks`.
 * Tự động tạo danh sách các thể loại sách `uniqueCategories`.
 */
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
        rating: Number(p.rating || 0),
        reviews: Number(p.reviews),
        image: p.image,
        fullDescription: p.description,
        stock: Number(p.stock),
        is_sale: p.is_sale,
        discount: p.discount,
        sale_end: p.sale_end
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

/**
 * [KHỞI TẠO] Tải danh sách các voucher có sẵn từ server.
 * Lưu vào biến `availableVouchers`.
 */
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
                start_date: v.start_date, // <- THÊM DÒNG NÀY
                expiration: v.end_date,
                description: v.description,
                voucher_type: v.voucher_type, // 'product' hoặc 'shipping'
                type: v.type, // 'fixed' hoặc 'percentage'
                isPercentage: v.type === 'percentage', // Giữ lại để tiện xử lý ở client
                maxDiscount: v.max_discount || null
            }));
            console.log("✅ Vouchers loaded:", availableVouchers);
        } else {
            console.error("❌ Lỗi khi lấy vouchers:", data.message);
        }
    } catch (err) {
        console.error("❌ Lỗi API khi lấy vouchers:", err);
    }
};

/**
 * [KHỞI TẠO] Tải danh sách các banner hiển thị ở trang chủ.
 * Chỉ lấy các banner đang được kích hoạt (`is_active`).
 */
const loadBanners = async () => {
    try {
        const res = await fetch("http://localhost:3000/admin/banners");
        const data = await res.json();
        if (res.ok) {
            availableBanners = data.filter(b => b.is_active);
            console.log("✅ Banners loaded:", availableBanners);
        } else {
            console.error("❌ Lỗi khi lấy banners:", data.message);
        }
    } catch (err) {
        console.error("❌ Lỗi API khi lấy banners:", err);
    }
};


// =================================================================
// IV. ĐIỀU HƯỚNG VÀ KHỞI TẠO TRANG (ROUTING & INITIALIZATION)
// =================================================================
// Bộ não điều khiển việc hiển thị trang nào và thực hiện các tác vụ cần thiết khi chuyển trang.
// =================================================================

/**
 * [CORE] Hàm điều hướng chính của ứng dụng.
 * Dựa vào `path` để thay đổi trạng thái và quyết định nội dung cần render.
 * @param {string} path - Đường dẫn của trang (ví dụ: '/', '/book', '/cart').
 * @param {object} [data] - Dữ liệu đi kèm, ví dụ: { id: 123 } khi xem chi tiết sách.
 */
const handleNavigate = async (path, data) => {
  // MODIFIED: Logic điều hướng cho tìm kiếm
  if (path === '/search') {
      currentPath = '/'; // Vẫn ở trang chủ
      mainContentMode = 'search'; // Chuyển sang chế độ xem tìm kiếm
      handleBookSearch(); // Thực hiện tìm kiếm ban đầu (có thể không có kết quả)
      return; // Dừng tại đây
  }

  if (path === '/favorite') {
      mainContentMode = 'favorite';
  }

  if (path === '/flash-sale') {
      mainContentMode = 'flash-sale';
  }

  if (path === '/') {
    mainContentMode = 'home'; // Khi bấm home, quay về chế độ xem mặc định
  }

  if (currentPath === '/cart' && path !== '/cart' && path !== '/checkout') {
    handleDeselectAllOnLeave();
  }
  currentPath = path;

  if (path === '/forgot-password') {
    forgotPasswordStep = 'verify';
    forgotUsername = '';
    forgotEmail = '';
  }

  if (path === '/admin') {
      if (!auth.user || !auth.user.role) {
          showMessage("Bạn không có quyền truy cập trang này.");
          currentPath = '/'; // Chuyển hướng về trang chủ
      } else {
          await loadAdminData(); // Tải dữ liệu admin
      }
  }

  // Tự động tải hóa đơn khi vào trang theo dõi
  if (path === '/order-tracking') {
      await loadUserBills();
  }

  if (path === '/book' && data) {
    selectedBook = availableBooks.find(b => b.id === data.id);
    selectedCategory = null;
    quantity = 1;
    await loadReviewsForProduct(selectedBook?.id); //load review
  } else if (path === '/' && data && data.category) {
    selectedCategory = data.category;
    selectedBook = null;
  } else {
    selectedCategory = null;
    selectedBook = null;
  }

  renderPage();
};

/**
 * [CORE] Hàm khởi tạo chính của ứng dụng.
 * Được gọi khi DOM đã tải xong.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Tải dữ liệu cơ bản của cửa hàng trước
    await loadProducts();
    await loadVouchers();
    await loadBanners();

    // KIỂM TRA VÀ KHÔI PHỤC PHIÊN ĐĂNG NHẬP
    const savedAuth = localStorage.getItem("auth");
    if (savedAuth) {
        try {
            auth.user = JSON.parse(savedAuth);
            console.log("✅ User session restored:", auth.user);

            // Nếu đã đăng nhập, tải dữ liệu của người dùng
            await syncCartWithDatabase();
            await loadUserBills();

        } catch (e) {
            console.error("Lỗi khi parse auth JSON từ localStorage", e);
            auth.user = null;
            localStorage.removeItem("auth");
        }
    }

    // Cuối cùng, render trang với trạng thái đúng
    renderPage();
});

// =================================================================
// V. CORE RENDERING ENGINE (BỘ MÁY KẾT XUẤT GIAO DIỆN)
// =================================================================
// Chịu trách nhiệm "vẽ" lại toàn bộ giao diện dựa trên trạng thái hiện tại.
// =================================================================

/**
 * [CORE] "Vẽ" lại toàn bộ trang dựa trên biến `currentPath` và các trạng thái khác.
 * Đây là hàm trung tâm, được gọi mỗi khi có sự thay đổi cần cập nhật giao diện.
 */
const renderPage = () => {
  const pageContainer = document.getElementById('page-container');
  const headerContainer = document.getElementById('header-container');

  // --- BẮT ĐẦU SỬA LỖI: Luôn dọn dẹp các modal cũ ---
  // Tìm và xóa các modal đang tồn tại khỏi DOM trước khi render lại
  const oldReviewModal = document.getElementById('review-modal');
  if (oldReviewModal) oldReviewModal.remove();

  const oldFlashSaleModal = document.getElementById('flash-sale-modal');
  if (oldFlashSaleModal) oldFlashSaleModal.remove();

  const oldVoucherModal = document.getElementById('voucher-modal');
  if (oldVoucherModal) oldVoucherModal.remove();
  // --- KẾT THÚC SỬA LỖI ---

  // Ẩn header ở các trang auth và admin
  const isSpecialPage = ['/login', '/register', '/forgot-password', '/admin'].includes(currentPath);
  headerContainer.innerHTML = isSpecialPage ? '' : createHeader();

  // Sau khi header vào DOM, gắn sự kiện menu
  if (!isSpecialPage) {
    setTimeout(initAccountMenu, 0);
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
      pageContent = createOrderSuccessPage();
      break;
    case '/favorite':
      pageContent = createFavoritePage();
      break;
    case '/flash-sale':
      pageContent = createFlashSalePage();
      break;
    case '/admin':
      pageContent = createAdminPage();
      break;
    default:
      pageContent = createHomePage();
      break;
  }

  pageContainer.innerHTML = pageContent;

  // Logic hiển thị modal mới nếu trạng thái là open
  if (reviewModalState.isOpen) {
      document.body.insertAdjacentHTML('beforeend', createReviewModal());
  }

  if (flashSaleModalState.isOpen) {
      document.body.insertAdjacentHTML('beforeend', createFlashSaleModal());
  }

  // Chạy các hàm khởi tạo sau khi DOM đã được cập nhật
  if (currentPath === '/favorite') {
    setTimeout(loadFavoriteBooks, 0);
  }

  if (currentPath === '/flash-sale') {
    setTimeout(loadFlashSaleProducts, 0);
  }

  setTimeout(() => {
    if (currentPath === "/" && mainContentMode === 'home') {
      initCarousel();
    }
    if (currentPath === "/" && mainContentMode === 'search') {
      initPriceSlider();
    }
  }, 0);
};

// =================================================================
// VI. CÁC THÀNH PHẦN GIAO DIỆN TÁI SỬ DỤNG (REUSABLE UI COMPONENTS)
// =================================================================
// Các hàm tạo ra các đoạn HTML nhỏ, được sử dụng ở nhiều nơi khác nhau.
// =================================================================

/**
 * [UI] Tạo HTML cho phần Header của trang.
 * Thay đổi tùy theo trạng thái đăng nhập của người dùng (khách, user, admin).
 * @returns {string} Chuỗi HTML của header.
 */
const createHeader = () => {
  const user = auth.user;
  const isLoggedIn = !!user;
  const cartItemCount = cartItems.reduce((t, i) => t + i.quantity, 0);

  if (isLoggedIn && user.role) {
    return `
    <div class="bg-white text-card-foreground shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <a href="#" onclick="handleNavigate('/admin')" class="flex items-center">
            <img src="./image/logo.png" alt="Hust Book Store" class="h-20 w-20 object-fill">
            <span class="ml-2 text-xl font-bold text-gray-800">Admin Panel</span>
          </a>
          <div class="flex items-center space-x-4 py-4">
            <div class="relative">
              <span class="text-base font-medium text-gray-600">Chào, ${user.username} (Admin)</span>
              <button onclick="logout()" class="ml-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold">Đăng xuất</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  return `
  <div class="bg-white text-card-foreground shadow-sm sticky top-0 z-50 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <img src="./image/logo.png" alt="Hust Book Store" class="h-20 w-20 object-fill">
        </div>
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
                  ${user.role ? `<a href="#" onclick="handleNavigate('/admin')" class="block px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-gray-100">Trang Admin</a>` : ''}
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

/**
 * [UI] Tạo HTML cho một danh sách các sản phẩm (sách).
 * Được dùng ở trang chủ, trang tìm kiếm, trang yêu thích.
 * @param {Array<object>} books - Mảng các đối tượng sách cần hiển thị.
 * @returns {string} Chuỗi HTML của lưới sản phẩm.
 */
const createBookList = (books) => {
  if (books.length === 0) {
    return `<p class="text-center text-gray-500 col-span-full mt-8">Không tìm thấy sách nào phù hợp.</p>`;
  }

  return `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    ${books.map(book => {
      const isOutOfStock = book.stock <= 0;
      // SỬA LỖI: Kiểm tra xem sản phẩm có đang trong Flash Sale không
      const isSale = book.is_sale && new Date(book.sale_end) > new Date();
      let priceHtml = '';
      let saleBadgeHtml = '';

      if (isSale) {
          const salePrice = Math.round(book.price * (1 - book.discount / 100));
          priceHtml = `
              <div class="flex items-baseline gap-2">
                  <p class="text-lg font-bold text-red-600">${salePrice.toLocaleString('vi-VN')}₫</p>
                  <p class="text-sm text-gray-400 line-through">${book.price.toLocaleString('vi-VN')}₫</p>
              </div>
          `;
          saleBadgeHtml = `<div class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold z-10">-${book.discount}%</div>`;
      } else {
          priceHtml = `<p class="text-lg font-bold text-red-600">${book.price.toLocaleString('vi-VN')}₫</p>`;
      }

      return `
      <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''} relative group flex flex-col" onclick="handleNavigate('/book', { id: ${book.id} })">
        <div class="product-image-wrapper relative">
          ${saleBadgeHtml}
          <img src="${book.image}" alt="${book.title}">
          ${isOutOfStock ? '<div class="stock-overlay">Hết hàng</div>' : ''}
        </div>
        <div class="p-4 flex flex-col flex-grow">
          <h2 class="text-md font-semibold mb-1 text-gray-800 flex-grow">${book.title}</h2>
          <p class="text-gray-500 text-sm mb-2">Tác giả: ${book.author}</p>
          <div class="flex items-center text-sm mb-2">
            ${getRatingStars(book.rating)}
            <span class="text-xs text-gray-500 ml-2">(${book.reviews} đánh giá)</span>
          </div>
          <div class="mb-3 mt-auto">
            ${priceHtml}
          </div>
          <div class="flex items-center justify-between">
            <button onclick="event.stopPropagation(); handleAddToCart(${book.id})"
                    class="flex items-center gap-1 bg-orange-500 text-white py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors"
                    ${isOutOfStock ? 'disabled' : ''}
                    title="Thêm vào giỏ hàng">
              <span class="text-xl">🛍️</span><span class="text-xl font-bold">+</span>
            </button>
            <button onclick="event.stopPropagation(); handleAddToFavorite(${book.id})"
                    class="flex items-center justify-center bg-white border border-pink-300 text-pink-500 py-2 px-3 rounded-lg hover:bg-pink-100 transition-colors"
                    title="Thêm vào yêu thích">
              <span class="text-xl">❤️️</span>
            </button>
          </div>
        </div>
      </div>
      `;
    }).join('')}
  </div>`;
};

/**
 * [UI] Khởi tạo sự kiện cho menu tài khoản người dùng (hiện/ẩn khi click).
 */
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

/**
 * [UI] Tạo HTML cho các ngôi sao đánh giá sản phẩm.
 * @param {number} rating - Điểm đánh giá (ví dụ: 4.5).
 * @returns {string} Chuỗi HTML chứa các icon sao.
 */
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

  // Sao phần trăm (hiển thị sao lẻ)
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

/**
 * [UI] Khởi tạo carousel (trình chiếu ảnh) ở trang chủ.
 */
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

/**
 * [UI] Khởi tạo thanh trượt giá trong phần tìm kiếm nâng cao.
 */
const initPriceSlider = () => {
    const slider = document.getElementById('price-slider');
    if (!slider || slider.noUiSlider) return; // Nếu không có slider hoặc đã khởi tạo thì thoát

    noUiSlider.create(slider, {
        start: [searchState.minPrice, searchState.maxPrice],
        connect: true,
        range: { 'min': 0, 'max': 1000000 },
        step: 10000,
        format: {
            to: value => Math.round(value),
            from: value => Number(value)
        }
    });

    slider.noUiSlider.on('update', (values) => {
        const [min, max] = values;
        document.getElementById('min-price-label').textContent = `${min.toLocaleString('vi-VN')}₫`;
        document.getElementById('max-price-label').textContent = `${max.toLocaleString('vi-VN')}₫`;
    });

    // Quan trọng: Chỉ cập nhật state khi người dùng dừng kéo
    slider.noUiSlider.on('change', (values) => {
        const [min, max] = values;
        searchState.minPrice = min;
        searchState.maxPrice = max;
        handleBookSearch(); // Tự động tìm kiếm khi thay đổi khoảng giá
    });
};


// =================================================================
// VII. CHỨC NĂNG VÀ GIAO DIỆN CHO NGƯỜI DÙNG (USER FEATURES & PAGES)
// =================================================================

// -----------------------------------------------------------------
// 7.1. Trang chủ, Tìm kiếm & Flash Sale
// -----------------------------------------------------------------

/**
 * [PAGE] Tạo HTML cho layout chính của trang người dùng (có sidebar).
 * Quyết định hiển thị nội dung trang chủ hay nội dung tìm kiếm.
 * @returns {string} Chuỗi HTML của toàn bộ trang.
 */
const createHomePage = () => {
  let mainContentHtml = '';

  if (mainContentMode === 'search') {
    mainContentHtml = createSearchView();
  } else {
    mainContentHtml = createDefaultHomeView();
  }

  return `
    <div class="flex min-h-screen">
      <aside class="w-64 bg-gradient-to-b from-orange-50 via-white to-orange-100 border-r border-gray-200 flex-col px-6 py-8 fixed left-0 h-full hidden md:flex"
        style="
          background-image: url('');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        ">
        <nav class="flex-1">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Khám phá</h3>
          <ul class="space-y-2 text-gray-700">
            <li>
              <a href="#" onclick="handleNavigate('/')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'home' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">🏠</span> <span>Trang chủ</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/search')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'search' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">🔍</span> <span>Tìm kiếm sách</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/favorite')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'favorite' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">❤️️</span> <span>Yêu thích</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/flash-sale')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'flash-sale' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">⚡</span> <span>Flash Sale</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="flex-1 ml-0 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen"
        style="
          background-image: url('https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/hinh-nen-trang-59.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        ">
        ${mainContentHtml}
      </main>
    </div>
  `;
};

/**
 * [UI] Tạo HTML cho phần nội dung mặc định của trang chủ (banner, gợi ý, danh mục).
 * @returns {string} Chuỗi HTML của nội dung trang chủ.
 */
const createDefaultHomeView = () => {
    // Banner slides
    const slides = availableBanners.length > 0
      ? availableBanners
      : [{ image_url: 'https://via.placeholder.com/1200x400?text=Hust+Book+Store', link: '#', alt: 'Default Banner' }];

    // Gợi ý cho bạn
    const recommendedBooks = [...availableBooks]
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 4);

    // Các thể loại sách
    const categorySections = uniqueCategories.map(category => {
    // Quản lý số lượng hiển thị riêng cho từng thể loại
        if (!categoryDisplayCounts[category]) categoryDisplayCounts[category] = 4;
        const booksInCategory = availableBooks.filter(b => b.category === category);
        const displayCount = categoryDisplayCounts[category];
        const booksToShow = booksInCategory.slice(0, displayCount);

        // Nếu có nhiều hơn 4 sách, hiển thị nút Xem toàn bộ hoặc Ẩn bớt
        let showMoreBtn = '';
        if (booksInCategory.length > 4) {
            if (displayCount < booksInCategory.length) {
                showMoreBtn = `<button onclick="handleShowMoreCategory('${category.replace(/'/g, "\\'")}')" class="mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition">Xem toàn bộ</button>`;
            } else {
                showMoreBtn = `<button onclick="handleShowLessCategory('${category.replace(/'/g, "\\'")}')" class="mt-4 px-4 py-2 rounded-lg bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition">Ẩn bớt</button>`;
            }
        }

        return `
            <div class="mb-12">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">${category}</h2>
                ${createBookList(booksToShow)}
                <div class="flex justify-center">${showMoreBtn}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="w-full mb-10">
          <div id="carousel-container" class="relative overflow-hidden rounded-xl shadow-lg" style="height: 400px;">
            <div id="carousel-track" class="flex transition-transform duration-500 ease-in-out h-full">
              ${slides.map(slide => `
                <a href="${slide.link || '#'}" class="flex-shrink-0 w-full h-full" onclick="return handleBannerClick(event, '${slide.link || '#'}')">
                  <img src="${slide.image_url}" alt="${slide.alt || 'Banner'}" class="w-full h-full object-cover" />
                </a>
              `).join('')}
            </div>
              <button id="prev-btn" class="absolute top-1/2 left-4 transform -translate-y-1/2 bg-transparent text-orange-500 rounded-full p-3 shadow-none hover:bg-orange-100 hover:bg-opacity-40 z-10 w-12 h-12 flex items-center justify-center transition">
                <i class="fas fa-chevron-left text-3xl"></i>
              </button>
              <button id="next-btn" class="absolute top-1/2 right-4 transform -translate-y-1/2 bg-transparent text-orange-500 rounded-full p-3 shadow-none hover:bg-orange-100 hover:bg-opacity-40 z-10 w-12 h-12 flex items-center justify-center transition">
                <i class="fas fa-chevron-right text-3xl"></i>
              </button>
          </div>

        <div class="mb-12">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Gợi ý cho bạn</h2>
            ${createBookList(recommendedBooks)}
        </div>

        ${categorySections}
    `;
};

function handleShowMoreCategory(category) {
    const booksInCategory = availableBooks.filter(b => b.category === category);
    categoryDisplayCounts[category] = booksInCategory.length;
    renderPage();
}

function handleShowLessCategory(category) {
    categoryDisplayCounts[category] = 4;
    renderPage();
}

// hàm xử lí click vào banner
function handleBannerClick(event, link) {
  if (!link || link === '#') return true; // Cho phép link ngoài hoặc không có link
  if (link.startsWith('/book?id=')) {
    event.preventDefault();
    // Lấy id sách từ link
    const id = Number(link.split('=')[1]);
    handleNavigate('/book', { id });
    return false;
  }

  if (link === '/flash-sale') {
        event.preventDefault();
        handleNavigate('/flash-sale');
        return false;
    }
  // Nếu là link ngoài, cho phép mặc định
  return true;
}


/**
 * [UI] Tạo HTML cho giao diện tìm kiếm nâng cao.
 * @returns {string} Chuỗi HTML của form tìm kiếm và khu vực kết quả.
 */
const createSearchView = () => {
    const categoryOptions = uniqueCategories.map(cat =>
        `<option value="${cat}" ${searchState.category === cat ? 'selected' : ''}>${cat}</option>`
    ).join('');

    return `
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h1 class="text-2xl font-bold mb-6 text-gray-800">Tìm kiếm nâng cao</h1>
            <form onsubmit="event.preventDefault(); handleBookSearch();" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div>
                    <label for="search-name" class="block text-sm font-medium text-gray-700 mb-1">Tên sách</label>
                    <input type="text" id="search-name" value="${searchState.name}" oninput="searchState.name = this.value" placeholder="Nhập tên sách..." class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                    <label for="search-author" class="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                    <input type="text" id="search-author" value="${searchState.author}" oninput="searchState.author = this.value" placeholder="Nhập tên tác giả..." class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                    <label for="search-category" class="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                    <select id="search-category" onchange="searchState.category = this.value" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">-- Tất cả --</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div>
                    <label for="sort-order" class="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
                    <select id="sort-order" onchange="handleSort(this.value)" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="default" ${sortOrder === 'default' ? 'selected' : ''}>Mặc định</option>
                        <option value="price_asc" ${sortOrder === 'price_asc' ? 'selected' : ''}>Giá: Thấp đến Cao</option>
                        <option value="price_desc" ${sortOrder === 'price_desc' ? 'selected' : ''}>Giá: Cao đến Thấp</option>
                        <option value="rating_desc" ${sortOrder === 'rating_desc' ? 'selected' : ''}>Đánh giá cao nhất</option>
                    </select>
                </div>
                <div class="md:col-span-2 lg:col-span-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
                    <div id="price-slider" class="mb-2"></div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span id="min-price-label">${searchState.minPrice.toLocaleString('vi-VN')}₫</span>
                        <span id="max-price-label">${searchState.maxPrice.toLocaleString('vi-VN')}₫</span>
                    </div>
                </div>
                <div class="lg:col-start-4">
                     <button type="submit" class="w-full px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">
                        Tìm kiếm
                    </button>
                </div>
            </form>
        </div>
        <div id="search-results">
            ${searchState.hasSearched ? createBookList(searchState.results) : '<p class="text-center text-gray-500">Nhập thông tin và nhấn tìm kiếm để xem kết quả.</p>'}
        </div>
    `;
};

const handleSort = (value) => {
  sortOrder = value;
  if (searchState.hasSearched) {
    handleBookSearch();
  }
};

/**
 * [USER] Xử lý sự kiện tìm kiếm sách dựa trên các tiêu chí trong `searchState`.
 * Cập nhật `searchState.results` và render lại trang.
 */
const handleBookSearch = () => {
  // Cập nhật giá trị từ các input (nếu chúng tồn tại)
  const nameInput = document.getElementById('search-name');
  if (nameInput) searchState.name = nameInput.value;
  
  const authorInput = document.getElementById('search-author');
  if (authorInput) searchState.author = authorInput.value;

  const categoryInput = document.getElementById('search-category');
  if (categoryInput) searchState.category = categoryInput.value;

  const name = searchState.name.trim().toLowerCase();
  const author = searchState.author.trim().toLowerCase();
  
  let filteredBooks = availableBooks.filter(book => {
    const matchName = !name || book.title.toLowerCase().includes(name);
    const matchAuthor = !author || book.author.toLowerCase().includes(author);
    const matchCategory = !searchState.category || book.category === searchState.category;
    const matchPrice = book.price >= searchState.minPrice && book.price <= searchState.maxPrice;
    return matchName && matchAuthor && matchCategory && matchPrice;
  });

  // Áp dụng logic sắp xếp
  switch (sortOrder) {
      case 'price_asc':
          filteredBooks.sort((a, b) => a.price - b.price);
          break;
      case 'price_desc':
          filteredBooks.sort((a, b) => b.price - a.price);
          break;
      case 'rating_desc':
          filteredBooks.sort((a, b) => b.rating - a.rating);
          break;
      default:
          // Không cần làm gì, giữ nguyên thứ tự mặc định
          break;
  }

  searchState.results = filteredBooks;
  searchState.hasSearched = true; // Đánh dấu đã tìm kiếm
  renderPage(); // Vẽ lại trang với kết quả mới
};

/**
 * [PAGE] Tạo HTML cho trang Flash Sale.
 * @returns {string} Chuỗi HTML của trang.
 */
function createFlashSalePage() {
  return `
    <div class="flex min-h-screen bg-gray-50">
      <aside class="w-64 bg-gradient-to-b from-orange-50 via-white to-orange-100 border-r border-gray-200 flex-col px-6 py-8 fixed left-0 h-full hidden md:flex" style="top: 88px;">
        <nav class="flex-1">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Điều hướng</h3>
          <ul class="space-y-2 text-gray-700">
            <li>
              <a href="#" onclick="handleNavigate('/')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'home' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">🏠</span> <span>Trang chủ</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/search')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'search' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">🔍</span> <span>Tìm kiếm sách</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/favorite')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'favorite' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">❤️️</span> <span>Yêu thích</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/flash-sale')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium bg-orange-100 text-orange-600">
                <span class="text-xl">⚡</span> <span>Flash Sale</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main class="flex-1 ml-0 md:ml-64 p-6 lg:p-8 min-h-screen"
        style="
          background-image: url('https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/hinh-nen-trang-59.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        ">
        <h1 class="text-3xl font-bold mb-8 text-orange-600 flex items-center gap-2">
          <span>⚡</span> Flash Sale
        </h1>
        <div id="flash-sale-list" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[400px]">
          </div>
      </main>
    </div>
  `;
}

/**
 * [USER] Tải danh sách sản phẩm đang trong chương trình Flash Sale và hiển thị.
 */
async function loadFlashSaleProducts() {
  try {
    const res = await fetch('http://localhost:3000/flash-sale');
    if (!res.ok) {
      throw new Error('Lỗi khi tải sản phẩm Flash Sale.');
    }
    const data = await res.json();
    const container = document.getElementById('flash-sale-list');

    if (container) {
      if (Array.isArray(data) && data.length > 0) {
        container.innerHTML = data.map(product => {
          const salePrice = Math.round(product.price * (1 - product.discount / 100));
          const endTime = new Date(product.sale_end);
          const now = new Date();
          const diff = Math.max(0, endTime - now);
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          return `
            <div class="product-card relative group flex flex-col" onclick="handleNavigate('/book', { id: ${product.id} })">
              <div class="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold z-10">-${product.discount}%</div>

              <div class="product-image-wrapper">
                  <img src="${product.image}" alt="${product.title}">
              </div>

              <div class="p-4 flex flex-col flex-grow">
                <h2 class="text-md font-semibold mb-1 text-gray-800 flex-grow">${product.title}</h2>
                <p class="text-gray-500 text-sm mb-2">Tác giả: ${product.author}</p>
                <div class="flex items-center text-sm mb-2">
                  ${getRatingStars(product.rating)}
                  <span class="text-xs text-gray-500 ml-2">(${product.reviews} đánh giá)</span>
                </div>

                <div class="flex items-baseline gap-2 mb-3">
                  <p class="text-lg font-bold text-red-600">${salePrice.toLocaleString('vi-VN')}₫</p>
                  <p class="text-sm text-gray-400 line-through">${product.price.toLocaleString('vi-VN')}₫</p>
                </div>

                <div class="mt-auto">
                    <div class="text-xs text-red-500 font-semibold flex items-center gap-1 mb-3">
                        <i class="fas fa-clock"></i>
                        <span id="timer-${product.id}">${hours}h ${minutes}m ${seconds}s</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <button onclick="handleAddToCart(${product.id})" class="flex items-center gap-1 bg-orange-500 text-white py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors" title="Thêm vào giỏ hàng">
                        <span class="text-xl">🛍️</span><span class="text-xl font-bold">+</span>
                        </button>
                        <button onclick="event.stopPropagation(); handleAddToFavorite(${product.id})"
                                class="flex items-center justify-center bg-white border border-pink-300 text-pink-500 py-2 px-3 rounded-lg hover:bg-pink-100 transition-colors"
                                title="Thêm vào yêu thích">
                        <span class="text-xl">❤️️</span>
                        </button>
                    </div>
                </div>

              </div>
            </div>
          `;
        }).join('');

        data.forEach(product => startFlashSaleTimer(product.id, product.sale_end));
      } else {
        container.innerHTML = `
            <div class="col-span-full flex justify-center items-center h-[400px]">
                <p class="text-xl text-center text-gray-800 font-bold">Hiện chưa có chương trình Flash Sale nào. Vui lòng quay lại sau!</p>
            </div>
        `;
      }
    }
  } catch (err) {
    console.error(err);
    const container = document.getElementById('flash-sale-list');
    if (container) {
      container.innerHTML = `<div class="col-span-full flex justify-center items-center h-[400px]"><p class="text-xl text-center text-red-500">Lỗi khi tải sản phẩm Flash Sale.</p></div>`;
    }
  }
}

/**
 * [USER] Bắt đầu đồng hồ đếm ngược cho một sản phẩm Flash Sale.
 * @param {number} id - ID sản phẩm.
 * @param {string} saleEnd - Thời gian kết thúc sale (chuỗi ngày tháng).
 */
function startFlashSaleTimer(id, saleEnd) {
  const timerEl = document.getElementById(`timer-${id}`);
  if (!timerEl) return;
  function updateTimer() {
    const endTime = new Date(saleEnd);
    const now = new Date();
    const diff = Math.max(0, endTime - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    timerEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    if (diff > 0) {
      setTimeout(updateTimer, 1000);
    } else {
      timerEl.textContent = "Đã kết thúc";
    }
  }
  updateTimer();
}

// -----------------------------------------------------------------
// 7.2. Trang Chi tiết sản phẩm
// -----------------------------------------------------------------

/**
 * [PAGE] Tạo HTML cho trang chi tiết một cuốn sách.
 * @returns {string} Chuỗi HTML của trang chi tiết.
 */
const createBookDetailPage = () => {
  if (!selectedBook) {
    return `<p class="text-gray-900">
      Không tìm thấy sách.
      <button onclick="handleNavigate('/')" class="text-orange-500 hover:underline">Về trang chủ</button>
    </p>`;
  }

  const isOutOfStock = selectedBook.stock <= 0;
  const isSale = selectedBook.is_sale && new Date(selectedBook.sale_end) > new Date();
  
  let priceHtml = '';
  let pricePerItem = selectedBook.price;

  if (isSale) {
      pricePerItem = Math.round(selectedBook.price * (1 - selectedBook.discount / 100));
      priceHtml = `
          <div class="flex items-baseline gap-2">
              <p class="text-2xl font-bold text-red-600">${pricePerItem.toLocaleString('vi-VN')}₫</p>
              <p class="text-lg text-gray-400 line-through">${selectedBook.price.toLocaleString('vi-VN')}₫</p>
          </div>
      `;
  } else {
      priceHtml = `<p class="text-2xl font-bold text-gray-800">${selectedBook.price.toLocaleString('vi-VN')}₫</p>`;
  }

  const totalPrice = pricePerItem * quantity;

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
            ${priceHtml}
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
          : `
            <div>
              ${currentBookReviews.length > 0
              ? currentBookReviews.map(review => `
                <div class="border-b py-4">
                  <div class="flex items-center mb-2">
                      <span class="font-bold mr-3">${review.username}</span>
                      <div class="flex items-center">
                          ${getRatingStars(review.rating)}
                      </div>
                  </div>
                  <p class="text-gray-500 text-sm mb-2">
                      ${new Date(review.review_date).toLocaleDateString('vi-VN')}
                  </p>
                  <p class="text-gray-800 mb-2">${review.comment}</p>
                  ${review.admin_reply || review.rep ? `
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2 rounded">
                      <span class="font-semibold text-blue-700">Phản hồi từ admin:</span>
                      <span class="text-gray-700">${review.admin_reply || review.rep}</span>
                    </div>
                  ` : ''}
                </div>
              `).join('')
              : `<p class="text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên để lại đánh giá cho cuốn sách này!</p>`
            }
            </div>
          `}
      </div>
    </div>
  </div>`;
};

/**
 * [USER] Tăng số lượng sản phẩm đang chọn.
 */
const increaseQuantity = () => {
  quantity++;
  const quantityInput = document.getElementById('book-quantity');
  if (quantityInput) quantityInput.value = quantity;
  updateQuantity(quantity);
};

/**
 * [USER] Giảm số lượng sản phẩm đang chọn.
 */
const decreaseQuantity = () => {
  if (quantity > 1) {
    quantity--;
    const quantityInput = document.getElementById('book-quantity');
    if (quantityInput) quantityInput.value = quantity;
    updateQuantity(quantity);
  }
};

/**
 * [USER] Cập nhật tổng giá tiền khi số lượng thay đổi.
 * @param {string|number} value - Giá trị số lượng mới.
 */
const updateQuantity = (value) => {
  const newQuantity = parseInt(value, 10);
  quantity = (!isNaN(newQuantity) && newQuantity >= 1) ? newQuantity : 1;

  const totalPriceElement = document.getElementById('total-price');
  if (totalPriceElement && selectedBook) {
    const isSale = selectedBook.is_sale && new Date(selectedBook.sale_end) > new Date();
    const pricePerItem = isSale ? Math.round(selectedBook.price * (1 - selectedBook.discount / 100)) : selectedBook.price;
    totalPriceElement.textContent = (pricePerItem * quantity).toLocaleString('vi-VN') + '₫';
  }
};

/**
 * [USER] Chuyển đổi tab giữa "Mô tả" và "Đánh giá" trên trang chi tiết.
 * @param {string} tab - Tên tab ('description' hoặc 'reviews').
 */
const setBookDetailTab = (tab) => {
  bookDetailTab = tab;
  renderPage();
};

// -----------------------------------------------------------------
// 7.3. Trang Yêu thích
// -----------------------------------------------------------------

/**
 * [PAGE] Tạo HTML cho trang danh sách yêu thích của người dùng.
 * @returns {string} Chuỗi HTML của trang.
 */
function createFavoritePage() {
  let mainContentHtml = '';
  if (!auth.user) {
    mainContentHtml = `<div class="max-w-5xl mx-auto py-10">
      <p class="text-center text-black-500 font-bold text-xl">Bạn cần đăng nhập để xem danh sách yêu thích</p>
    </div>`;
  } else {
    mainContentHtml = `<div class="max-w-5xl mx-auto py-10">
      <h1 class="text-2xl font-bold mb-6">Sách yêu thích của bạn</h1>
      <div id="favorite-books-list">
        <p class="text-center text-black-500">Bạn chưa có sách yêu thích nào.</p>
      </div>
    </div>`;
  }

  return `
    <div class="flex min-h-screen bg-gray-50">
      <aside class="w-64 bg-gradient-to-b from-orange-50 via-white to-orange-100 border-r border-gray-200 flex-col px-6 py-8 fixed left-0 h-full hidden md:flex" style="top: 88px;">
        <nav class="flex-1">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Điều hướng</h3>
          <ul class="space-y-2 text-gray-700">
            <li>
              <a href="#" onclick="handleNavigate('/')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'home' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">🏠</span> <span>Trang chủ</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/search')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'search' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">🔍</span> <span>Tìm kiếm sách</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/favorite')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium bg-orange-100 text-orange-600">
                <span class="text-xl">❤️️</span> <span>Yêu thích</span>
              </a>
            </li>
            <li>
              <a href="#" onclick="handleNavigate('/flash-sale')" class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${mainContentMode === 'flash-sale' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
                <span class="text-xl">⚡</span> <span>Flash Sale</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main class="flex-1 ml-0 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen"
        style="
          background-image: url('https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/hinh-nen-trang-59.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        ">
        ${mainContentHtml}
      </main>
    </div>
  `;
}

/**
 * [USER] Tải danh sách các sản phẩm yêu thích của người dùng từ server.
 */
async function loadFavoriteBooks() {
  if (!auth.user) return;
  try {
    const res = await fetch(`http://localhost:3000/favorites?user_id=${auth.user.user_id}`);
    const data = await res.json();
    const container = document.getElementById('favorite-books-list');
    if (container) {
      if (Array.isArray(data) && data.length > 0) {
        container.innerHTML = createBookList(data.map(f => ({
          ...f,
          id: f.book_id,
          title: f.title,
          author: f.author,
          category: f.category,
          price: f.price,
          description: f.description,
          rating: f.rating,
          reviews: f.reviews,
          image: f.image,
          stock: f.stock
        })));
      } else {
        container.innerHTML = `<p class="text-center text-gray-500">Không tìm thấy sách yêu thích nào.</p>`;
      }
    }
  } catch (err) {
    console.error("Lỗi khi tải sách yêu thích:", err);
    const container = document.getElementById('favorite-books-list');
    if (container) {
      container.innerHTML = `<p class="text-center text-red-500">Lỗi khi tải danh sách yêu thích. Vui lòng thử lại sau.</p>`;
    }
  }
}

/**
 * [USER] Xử lý thêm một sản phẩm vào danh sách yêu thích.
 * @param {number} bookId - ID của sách cần thêm.
 */
function handleAddToFavorite(bookId) {
  // Nếu chưa đăng nhập thì yêu cầu đăng nhập
  if (!auth.user) {
    showMessage("Vui lòng đăng nhập để thêm vào yêu thích!");
    handleNavigate("/login");
    return;
  }
  // Gọi API thêm vào bảng yêu thích (ví dụ /favorites)
  fetch("http://localhost:3000/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: auth.user.user_id, book_id: bookId })
  })
  .then(res => res.json())
  .then(data => {
    showMessage(data.message || "Đã thêm vào yêu thích!");
    // Nếu muốn cập nhật giao diện yêu thích, có thể gọi lại renderPage hoặc loadFavoriteBooks
  })
  .catch(err => {
    showMessage("Lỗi khi thêm vào yêu thích!");
    console.error(err);
  });
}

// -----------------------------------------------------------------
// 7.4. Giỏ hàng & Voucher
// -----------------------------------------------------------------

/**
 * [PAGE] Tạo HTML cho trang giỏ hàng.
 * @returns {string} Chuỗi HTML của trang giỏ hàng.
 */
const createCartPage = () => {
    const cartTotal = cartItems
      .filter(item => selectedCartIds.includes(item.book.id))
      .reduce((total, item) => {
          let price = item.book.price;
          // Kiểm tra nếu sản phẩm đang sale và chưa hết hạn
          if (item.book.is_sale && new Date(item.book.sale_end) > new Date()) {
              price = Math.round(item.book.price * (1 - item.book.discount / 100));
          }
          return total + (price * item.quantity);
      }, 0);

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

    const discountVouchers = availableVouchers.filter(v => v.voucher_type === 'product');
    const shippingVouchers = availableVouchers.filter(v => v.voucher_type === 'shipping');

    return `
    <div id="page-cart" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="mb-6 flex justify-start">
            <button onclick="handleNavigate('/')" class="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">
              Quay lại cửa hàng
            </button>
        </div>
        <h1 class="text-3xl font-bold mb-8 text-foreground">Giỏ hàng của bạn</h1>
        ${cartItems.length === 0
          ? `<p class="text-center text-muted-foreground">Giỏ hàng của bạn trống.</p>`
          : `
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 space-y-4">
              ${cartItems.map(item => {
                // SỬA LỖI TẠI ĐÂY: Tính giá hiển thị cho từng sản phẩm
                let displayPrice = item.book.price;
                if (item.book.is_sale && new Date(item.book.sale_end) > new Date()) {
                    displayPrice = Math.round(item.book.price * (1 - item.book.discount / 100));
                }
                const itemTotal = displayPrice * item.quantity;

                return `
                <div class="flex items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <input type="checkbox" ${selectedCartIds.includes(item.book.id) ? 'checked' : ''}
                    onchange="handleToggleCartItem(${item.book.id})" class="mr-4 w-5 h-5 accent-orange-500">
                  <img src="${item.book.image}" alt="${item.book.title}" class="w-20 h-20 rounded-lg object-cover mr-4 flex-shrink-0">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg">${item.book.title}</h3>
                    <p class="text-gray-500 text-sm mb-2">Tác giả: ${item.book.author}</p>
                    <p class="font-bold text-black-600">${itemTotal.toLocaleString('vi-VN')}₫</p>
                    ${item.book.is_sale && new Date(item.book.sale_end) > new Date() ? `
                        <span class="text-sm text-gray-500 line-through">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                    ` : ''}
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
              `}).join('')}
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
                <span>Giảm giá sản phẩm</span>
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
                <h4 class="text-lg font-semibold mb-2 mt-4">Mã miễn phí vận chuyển</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    ${shippingVouchers.map(voucher => {
                        const isUsable = cartTotal >= voucher.minPrice && voucher.remaining > 0 && shippingFee > 0;
                        const isSelected = selectedShippingVoucher && selectedShippingVoucher.code === voucher.code;
                        const isDisabled = !isUsable || (selectedShippingVoucher && !isSelected);

                        return `
                        <div class="p-4 border border-dashed rounded-lg flex flex-col justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}">
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
                            <div class="mt-3 text-right">
                            ${isSelected
                                ? `<button onclick="handleRemoveVoucher('${voucher.code}', 'shipping')" class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold">Xóa</button>`
                                : `<button onclick="handleApplyVoucher('${voucher.code}', 'shipping')" ${isDisabled ? 'disabled' : ''} class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'}">Áp dụng</button>`
                            }
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <h4 class="text-lg font-semibold mb-2 mt-4">Mã giảm giá sản phẩm</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div class="p-4 border border-dashed rounded-lg flex flex-col justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}">
                            <div>
                                <h4 class="font-semibold text-lg">${voucher.code}</h4>
                                <p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${voucher.minPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</p>
                                <p class="text-sm text-gray-700">${voucherDetail}</p>
                                <p class="text-xs text-red-500">
                                  HSD: ${new Date(voucher.expiration).toLocaleDateString('vi-VN')} | Còn lại: ${voucher.remaining} mã
                                </p>
                            </div>
                            <div class="mt-3 text-right">
                            ${isSelected
                                ? `<button onclick="handleRemoveVoucher('${voucher.code}', 'discount')" class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold">Xóa</button>`
                                : `<button onclick="handleApplyVoucher('${voucher.code}', 'discount')" ${isDisabled ? 'disabled' : ''} class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'}">Áp dụng</button>`
                            }
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
          </div>
        </div>
        ` :
        ''}
    </div>`;
};

/**
 * [USER] Lấy ID giỏ hàng của người dùng, nếu chưa có thì tạo mới.
 * @returns {Promise<number|null>} ID của giỏ hàng hoặc null nếu có lỗi.
 */
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

/**
 * [USER] Đồng bộ giỏ hàng local (`cartItems`) với dữ liệu từ database.
 */
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

/**
 * [USER] Xử lý thêm sản phẩm vào giỏ hàng.
 * @param {number} bookId - ID sản phẩm cần thêm.
 */
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

/**
 * [USER] Xử lý xóa một sản phẩm khỏi giỏ hàng.
 * @param {number} bookId - ID sản phẩm cần xóa.
 */
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

/**
 * [USER] Cập nhật số lượng của một sản phẩm trong giỏ hàng.
 * @param {number} bookId - ID sản phẩm.
 * @param {number} delta - Lượng thay đổi (+1 hoặc -1).
 */
async function handleUpdateCartItemQuantity(bookId, delta) {
  const item = cartItems.find(i => i.book.id === bookId);
  if (!item) return;

  const newQuantity = item.quantity + delta;
  if (newQuantity < 1) {
    // Nếu số lượng giảm xuống dưới 1, hãy hỏi người dùng có muốn xóa không
    if (confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      handleRemoveCartItem(bookId);
    }
    return;
  }

  // Cập nhật giao diện ngay lập tức
  item.quantity = newQuantity;
  renderPage();

  // Gửi yêu cầu cập nhật lên server
  try {
    const res = await fetch(`http://localhost:3000/cart/items/${item.cart_item_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQuantity })
    });
    if (!res.ok) {
      // Nếu lỗi, đồng bộ lại để đảm bảo dữ liệu chính xác
      throw new Error('Lỗi khi cập nhật số lượng trên server.');
    }
  } catch (err) {
    console.error(err);
    showMessage(err.message);
    await syncCartWithDatabase(); // Đồng bộ lại nếu có lỗi
  }
}

/**
 * [USER] Xử lý việc chọn/bỏ chọn một sản phẩm trong giỏ hàng.
 * @param {number} bookId - ID sản phẩm.
 */
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

/**
 * [USER] Tự động bỏ chọn tất cả sản phẩm khi người dùng rời khỏi trang giỏ hàng.
 */
const handleDeselectAllOnLeave = async () => {
    // Nếu không có sản phẩm nào đang được chọn thì không làm gì cả
    if (selectedCartIds.length === 0) {
        return;
    }

    const cartId = await getOrCreateCartId();
    if (!cartId) return;

    // Xóa ngay lập tức ở local để UI phản hồi nhanh
    selectedCartIds = [];
    selectedDiscountVoucher = null;
    selectedShippingVoucher = null;

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

/**
 * [USER] Hiển thị modal danh sách voucher.
 */
function handleShowVoucherList() {
  showVoucherList = true;
  document.body.classList.add('overflow-hidden');
  renderPage();
}

/**
 * [USER] Ẩn modal danh sách voucher.
 */
function handleHideVoucherList() {
  showVoucherList = false;
  document.body.classList.remove('overflow-hidden');
  renderPage();
}

/**
 * [USER] Áp dụng một mã voucher vào đơn hàng.
 * @param {string} code - Mã voucher.
 * @param {string} type - Loại voucher ('discount' hoặc 'shipping').
 */
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

/**
 * [USER] Gỡ bỏ một mã voucher đã áp dụng.
 * @param {string} code - Mã voucher.
 * @param {string} type - Loại voucher ('discount' hoặc 'shipping').
 */
const handleRemoveVoucher = (code, type) => {
    if (type === 'discount') {
        selectedDiscountVoucher = null;
    } else if (type === 'shipping') {
        selectedShippingVoucher = null;
    }
    showMessage('Đã xóa mã giảm giá');
    renderPage();
};

// -----------------------------------------------------------------
// 7.5. Thanh toán & Theo dõi đơn hàng
// -----------------------------------------------------------------

/**
 * [PAGE] Tạo HTML cho trang thanh toán.
 * @returns {string} Chuỗi HTML của trang thanh toán.
 */
const createCheckoutPage = () => {
  const itemsToCheckout = cartItems.filter(item => selectedCartIds.includes(item.book.id));
  if (itemsToCheckout.length === 0) {
    return `<p class="text-center">Không có sản phẩm nào để thanh toán.</p>`;
  }

  // SỬA ĐỔI: Tính toán tổng giỏ hàng dựa trên giá cuối cùng (đã bao gồm flash sale)
  const cartTotal = itemsToCheckout.reduce((total, item) => {
      const isSale = item.book.is_sale && new Date(item.book.sale_end) > new Date();
      const finalPrice = isSale ? Math.round(item.book.price * (1 - item.book.discount / 100)) : item.book.price;
      return total + (finalPrice * item.quantity);
  }, 0);

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
  const name = auth.user?.username || "";
  const address = auth.user?.address || "";
  const phone = auth.user?.phone_number || "";

  return `
    <div class="relative min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-cover bg-center"
          style="background-image: url('https://images.squarespace-cdn.com/content/v1/56497023e4b06a49bd376eb2/50869e1a-4091-4c05-9fa9-7b58e927485e/IMG_0979.jpg'); opacity: 0.15;">
      </div>

      <div class="relative max-w-3xl w-full p-6 bg-white rounded-xl shadow-lg my-8 z-10">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">Thanh toán đơn hàng</h1>

        <div class="space-y-4 mb-8">
          <h2 class="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Tóm tắt đơn hàng</h2>
          ${itemsToCheckout.map(item => {
            // SỬA ĐỔI: Tính giá cuối cùng cho từng sản phẩm để hiển thị
            const isSale = item.book.is_sale && new Date(item.book.sale_end) > new Date();
            const finalPrice = isSale ? Math.round(item.book.price * (1 - item.book.discount / 100)) : item.book.price;
            const itemTotal = finalPrice * item.quantity;

            return `
            <div class="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
              <div class="flex items-center space-x-4">
                <img src="${item.book.image}" class="w-12 h-12 object-cover rounded-md shadow-sm"/>
                <div class="flex flex-col">
                  <span class="font-medium text-gray-800">${item.book.title}</span>
                  <span class="text-sm text-gray-500">Số lượng: ${item.quantity}</span>
                </div>
              </div>
              <div class="text-right">
                <span class="font-semibold text-gray-800">${itemTotal.toLocaleString('vi-VN')}₫</span>
                ${isSale ? `<p class="text-xs text-gray-400 line-through">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</p>` : ''}
              </div>
            </div>
            `}).join("")}
        </div>

        <div class="mb-8 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Tổng sản phẩm:</span>
            <span class="font-medium text-gray-800">${cartTotal.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

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

          <div class="space-y-4">
            <label for="checkout-payment" class="block text-gray-700 font-medium">Phương thức thanh toán</label>
            <select id="checkout-payment" required
              class="w-full px-5 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200">
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            </select>
          </div>

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

/**
 * [PAGE] Tạo HTML cho trang theo dõi/lịch sử đơn hàng.
 * @returns {string} Chuỗi HTML của trang.
 */
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

  // Danh sách các trạng thái để tạo nút
  const statuses = [
    { key: 'all', label: 'Tất cả' },
    { key: 'chờ xác nhận', label: 'Chờ xác nhận' },
    { key: 'đã xác nhận', label: 'Đã xác nhận' },
    { key: 'đã giao', label: 'Đã giao' },
    { key: 'đã hủy', label: 'Đã hủy' },
  ];

  // Áp dụng bộ lọc
  const filteredBills = orderFilterStatus === 'all'
    ? userBills
    : userBills.filter(bill => bill.status === orderFilterStatus);

  return `
    <div class="max-w-4xl mx-auto py-10 px-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">Lịch sử đơn hàng</h1>

      <div class="flex flex-wrap justify-center gap-2 mb-8">
        ${statuses.map(s => `
          <button
            onclick="setOrderFilter('${s.key}')"
            class="py-2 px-4 rounded-full text-sm font-semibold transition-colors
                   ${orderFilterStatus === s.key
                     ? 'bg-orange-500 text-white shadow'
                     : 'bg-white text-gray-700 hover:bg-gray-100 border'
                   }">
            ${s.label}
          </button>
        `).join('')}
      </div>

      ${filteredBills.length === 0
        ? `<p class="text-center text-gray-500 mt-8">Không có đơn hàng nào ở trạng thái này.</p>`
        : `<div class="space-y-6">
            ${filteredBills.map(bill => {
                const orderDate = new Date(bill.purchase_date).toLocaleDateString("vi-VN");

                let statusClass = 'bg-yellow-100 text-yellow-700'; // Mặc định: chờ xác nhận
                if (bill.status === 'đã xác nhận') {
                  statusClass = 'bg-blue-100 text-blue-700';
                } else if (bill.status === 'đã giao') {
                  statusClass = 'bg-green-100 text-green-700';
                } else if (bill.status === 'đã hủy') {
                  statusClass = 'bg-red-100 text-red-700';
                }

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

                  <div class="space-y-4 mb-4">
                    ${bill.items && bill.items.map(item => `
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-md mr-4">
                            <div class="flex-1">
                              <p class="font-semibold">${item.title}</p>
                              <p class="text-sm text-gray-600">Số lượng: ${item.quantity} x ${Number(item.price_at_purchase).toLocaleString('vi-VN')}₫</p>
                            </div>
                        </div>

                        ${
                          bill.status === 'đã giao'
                            ? (
                                item.is_reviewed
                                  ? `<span class="text-sm font-medium text-green-600 py-1 px-3 rounded-full bg-green-100">Đã đánh giá</span>`
                                  : `<button
                                        onclick="openReviewModal(${item.product_id}, '${item.title.replace(/'/g, "\\'")}', ${bill.bill_id})"
                                        class="py-1 px-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors text-sm">
                                      Viết đánh giá
                                    </button>`
                              )
                            : ''
                        }
                      </div>
                    `).join('')}
                  </div>

                  <div class="border-t border-gray-200 pt-4 mt-4 space-y-2 text-sm">
                      <div class="flex justify-between">
                          <span class="text-gray-600">Tổng tiền hàng:</span>
                          <span class="font-medium">${Number(bill.subtotal || 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div class="flex justify-between">
                          <span class="text-gray-600">Phí vận chuyển:</span>
                          <span class="font-medium">${Number(bill.shipping_fee || 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div class="flex justify-between">
                          <span class="text-gray-600">Giảm giá:</span>
                          <span class="font-medium text-red-500">- ${Number(bill.discount_amount || 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div class="flex justify-between font-bold text-base pt-2 border-t mt-2">
                          <span>Thành tiền:</span>
                          <span class="text-red-600">${Number(bill.total_amount).toLocaleString('vi-VN')}₫</span>
                      </div>
                  </div>

                  ${bill.status === 'đã giao' && bill.invoice_pdf ? `
                  <div class="mt-2 flex justify-center">
                    <a href="http://localhost:3000/${bill.invoice_pdf}" target="_blank" class="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
                      Tải hóa đơn PDF
                    </a>
                  </div>
                ` : ''}

                  <div class="flex justify-end items-center mt-4 pt-4 border-t">
                    ${bill.status === 'chờ xác nhận' ? `
                        <button onclick="handleCancelOrder(${bill.bill_id})"
                                class="py-2 px-4 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm">
                          Hủy đơn hàng
                        </button>
                    ` : ''}

                    ${bill.status === 'đã xác nhận' && bill.expected_delivery_date ? `
                        <div class="text-sm text-gray-600">
                          <span class="font-semibold">Giao hàng dự kiến:</span>
                          <span class="font-bold text-blue-700 ml-1">${new Date(bill.expected_delivery_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                    ` : ''}
                    ${bill.status === 'đã hủy' && bill.cancellation_reason ? `
                        <div class="text-sm text-red-600 text-left w-full bg-red-50 p-3 rounded-lg">
                          <span class="font-bold">Lý do hủy:</span>
                          <p class="mt-1">${bill.cancellation_reason}</p>
                        </div>
                    ` : ''}
                  </div>
                </div>
              `
            }).join('')}
          </div>`
      }
    </div>
  `;
};

/**
 * [PAGE] Tạo HTML cho trang thông báo đặt hàng thành công.
 * @returns {string} Chuỗi HTML của trang.
 */
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

/**
 * [USER] Xử lý khi người dùng nhấn nút "Mua ngay".
 * Thêm sản phẩm vào giỏ, chỉ chọn sản phẩm đó và chuyển đến trang giỏ hàng.
 * @param {number} bookId - ID sản phẩm.
 */
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

/**
 * [USER] Chuyển người dùng đến trang thanh toán sau khi kiểm tra điều kiện.
 */
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

/**
 * [USER] Xử lý việc đặt hàng sau khi người dùng điền thông tin.
 * Gửi dữ liệu đơn hàng lên server.
 * @param {Event} event - Sự kiện submit form.
 */
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

    // SỬA ĐỔI: Tính tổng giỏ hàng dựa trên giá cuối cùng (đã tính flash sale)
    const cartTotal = itemsToCheckout.reduce((total, item) => {
        const isSale = item.book.is_sale && new Date(item.book.sale_end) > new Date();
        const finalPrice = isSale ? Math.round(item.book.price * (1 - item.book.discount / 100)) : item.book.price;
        return total + (finalPrice * item.quantity);
    }, 0);

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
        // SỬA ĐỔI QUAN TRỌNG: Gửi giá cuối cùng của từng sản phẩm
        items: itemsToCheckout.map(item => {
            const isSale = item.book.is_sale && new Date(item.book.sale_end) > new Date();
            const finalPrice = isSale ? Math.round(item.book.price * (1 - item.book.discount / 100)) : item.book.price;
            return {
                // Chỉ gửi những thông tin cần thiết
                book: {
                    id: item.book.id,
                    title: item.book.title,
                    price_at_purchase: finalPrice // Gửi giá tại thời điểm mua hàng
                },
                quantity: item.quantity
            };
        }),
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
/**
 * [USER] Tải danh sách các hóa đơn (đơn hàng) của người dùng đã đăng nhập.
 */
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

/**
 * [USER] Xử lý sự kiện khi người dùng hủy một đơn hàng đang ở trạng thái "chờ xác nhận".
 * @param {number} billId - ID của đơn hàng cần hủy.
 */
const handleCancelOrder = async (billId) => {
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng #${billId}?`)) {
        return;
    }

    if (!auth.user || !auth.user.user_id) {
        showMessage("Lỗi: Không tìm thấy thông tin người dùng.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/bills/${billId}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // Gửi user_id để backend xác thực quyền sở hữu đơn hàng
            body: JSON.stringify({ userId: auth.user.user_id })
        });

        const data = await res.json();

        if (res.ok) {
            showMessage("Hủy đơn hàng thành công!");
            await loadUserBills(); // Tải lại danh sách đơn hàng để cập nhật UI
            renderPage();
        } else {
            throw new Error(data.message || 'Hủy đơn hàng thất bại.');
        }
    } catch (err) {
        console.error("Lỗi khi hủy đơn hàng:", err);
        showMessage('Lỗi: ' + err.message);
    }
};

/**
 * [USER] Thiết lập bộ lọc trạng thái đơn hàng trên trang theo dõi.
 * @param {string} status - Trạng thái cần lọc.
 */
const setOrderFilter = (status) => {
    orderFilterStatus = status;
    renderPage();
};

// -----------------------------------------------------------------
// 7.6. Đánh giá sản phẩm (Reviews)
// -----------------------------------------------------------------

/**
 * [UI] Tạo HTML cho modal (pop-up) viết đánh giá sản phẩm.
 * @returns {string} Chuỗi HTML của modal.
 */
const createReviewModal = () => {
    if (!reviewModalState.isOpen) return '';

    return `
    <div id="review-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
        <div class="bg-white rounded-lg p-8 w-full max-w-md relative">
            <button onclick="closeReviewModal()" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800">&times;</button>
            <h2 class="text-2xl font-bold mb-2">Đánh giá sản phẩm</h2>
            <p class="text-gray-700 mb-6 font-semibold">${reviewModalState.productTitle}</p>

            <form onsubmit="handleReviewSubmit(event)">
                <div class="mb-6">
                    <label class="block text-lg font-medium mb-3">Chất lượng sản phẩm:</label>
                    <div class="flex flex-row-reverse justify-end items-center" id="star-rating">
                        <input type="radio" id="star5" name="rating" value="5" class="hidden"/><label for="star5" title="5 sao" class="star">&#9733;</label>
                        <input type="radio" id="star4" name="rating" value="4" class="hidden"/><label for="star4" title="4 sao" class="star">&#9733;</label>
                        <input type="radio" id="star3" name="rating" value="3" class="hidden"/><label for="star3" title="3 sao" class="star">&#9733;</label>
                        <input type="radio" id="star2" name="rating" value="2" class="hidden"/><label for="star2" title="2 sao" class="star">&#9733;</label>
                        <input type="radio" id="star1" name="rating" value="1" class="hidden"/><label for="star1" title="1 sao" class="star">&#9733;</label>
                    </div>
                </div>

                <div class="mb-6">
                    <label for="review-comment" class="block text-lg font-medium mb-2">Bình luận của bạn:</label>
                    <textarea id="review-comment" rows="4" placeholder="Sản phẩm này tuyệt vời..." class="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"></textarea>
                </div>

                <button type="submit" class="w-full py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">Gửi đánh giá</button>
            </form>
        </div>
    </div>
    `;
};

/**
 * [USER] Mở modal viết đánh giá.
 * @param {number} productId - ID sản phẩm.
 * @param {string} productTitle - Tên sản phẩm.
 * @param {number} billId - ID hóa đơn chứa sản phẩm đó.
 */
const openReviewModal = (productId, productTitle, billId) => {
    reviewModalState = { isOpen: true, productId, productTitle, billId };
    renderPage();
};

/**
 * [USER] Đóng modal viết đánh giá.
 */
const closeReviewModal = () => {
    reviewModalState.isOpen = false;
    renderPage();
};

/**
 * [USER] Xử lý gửi đánh giá lên server.
 * @param {Event} event - Sự kiện submit form.
 */
const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('review-comment').value;

    if (!rating) {
        showMessage("Vui lòng chọn số sao đánh giá.");
        return;
    }

    const { productId, billId } = reviewModalState;
    const userId = auth.user.user_id;

    try {
        const res = await fetch('http://localhost:3000/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                productId,
                billId,
                rating: parseInt(rating),
                comment
            })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message);
            closeReviewModal();
            await loadUserBills(); // Tải lại hóa đơn để cập nhật trạng thái nút
            await loadProducts();
            renderPage();
        } else {
            showMessage(`Lỗi: ${data.message}`);
        }
    } catch (err) {
        console.error("Lỗi API khi gửi review:", err);
        showMessage("Lỗi kết nối server khi gửi đánh giá.");
    }
};

/**
 * [USER] Tải tất cả các đánh giá của một sản phẩm cụ thể.
 * @param {number} productId - ID sản phẩm.
 */
const loadReviewsForProduct = async (productId) => {
    if (!productId) {
        currentBookReviews = [];
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/products/${productId}/reviews`);
        if (res.ok) {
            currentBookReviews = await res.json();
        } else {
            console.error("Lỗi khi tải reviews");
            currentBookReviews = [];
        }
    } catch (err) {
        console.error("Lỗi API khi tải reviews:", err);
        currentBookReviews = [];
    }
};

// -----------------------------------------------------------------
// 7.7. Xác thực & Hồ sơ người dùng (Authentication & Profile)
// -----------------------------------------------------------------

/**
 * [PAGE] Tạo HTML cho các trang xác thực (Đăng nhập, Đăng ký, Quên mật khẩu).
 * @param {string} mode - Chế độ ('login', 'register', 'forgot-password').
 * @returns {string} Chuỗi HTML của trang.
 */
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

/**
 * [PAGE] Tạo HTML cho trang hồ sơ cá nhân của người dùng.
 * @returns {string} Chuỗi HTML của trang.
 */
const createProfilePage = () => {
  if (!auth.user) {
    return `
      <div class="max-w-xl mx-auto p-6 bg-white shadow rounded-lg">
        <p>Bạn cần đăng nhập để chỉnh sửa hồ sơ.</p>
      </div>
    `;
  }

const u = auth.user;
return `
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center"
       style="background-image: url('...');">
    <div class="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-2xl relative z-10">
      <h1 class="text-2xl font-bold mb-6 text-center">Hồ sơ của tôi</h1>
      <form onsubmit="handleSaveProfile(event)">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
          <input id="profile-name" type="text" value="${u.username || ''}"
            class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500" disabled>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value="${u.email || ''}" disabled
            class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500">
        </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input id="profile-phone" type="text" value="${u.phone_number || ''}"
              class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input id="profile-address" type="text" value="${u.address || ''}"
              class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
            <input id="profile-password" type="password"
              class="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500" required>
          </div>

          <button type="submit"
            class="w-full px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105 shadow-md">
            Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  `;
};

/**
 * [USER] Xử lý submit form cho Đăng nhập, Đăng ký, và Quên mật khẩu.
 * @param {Event} e - Sự kiện submit form.
 * @param {string} mode - Chế độ form.
 */
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
                    auth.user = data.user || data;
                    localStorage.setItem("auth", JSON.stringify(auth.user));
                    showMessage("Đăng nhập thành công!");

                    // KIỂM TRA VAI TRÒ (ROLE)
                    if (auth.user.role) {
                      // Nếu là admin, chuyển đến trang admin
                      handleNavigate("/admin");
                    } else {
                      // Nếu là người dùng thường, đồng bộ giỏ hàng và về trang chủ
                      await syncCartWithDatabase();
                      await loadUserBills();
                      handleNavigate("/");
                    }
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
                    auth.user = data.user || data; // user mới được tạo trong DB
                    localStorage.setItem("auth", JSON.stringify(auth.user));
                    handleNavigate("/");
                    showMessage("Đăng ký thành công!");
                } else {
                    showMessage(data.message || "Đăng ký thất bại.");
                }
            } catch (err) {
                console.error(err);
                showMessage("Tài khoản hoặc email đã tồn tại");
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

/**
 * [USER] Xử lý lưu thông tin hồ sơ người dùng sau khi chỉnh sửa.
 * @param {Event} e - Sự kiện submit form.
 */
const handleSaveProfile = async (e) => {
  e.preventDefault();

  if (!auth.user || !auth.user.user_id) {
    showMessage("Lỗi: Không tìm thấy thông tin người dùng.");
    return;
  }

  // Lấy dữ liệu mới từ form
  const address = document.getElementById("profile-address").value;
  const phone = document.getElementById("profile-phone").value;
  const password = document.getElementById("profile-password").value;

  if (!password) {
    showMessage("Vui lòng nhập mật khẩu để xác nhận.");
    return;
  }

  // Gửi lên server để xác nhận mật khẩu trước khi cập nhật
  const updatedData = {
    address: address,
    phone_number: phone,
    email: auth.user.email,
    role: auth.user.role,
    password: password // gửi mật khẩu xác nhận
  };

  try {
    const res = await fetch(`http://localhost:3000/users/${auth.user.user_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const data = await res.json();

    if (res.ok) {
      auth.user = data;
      localStorage.setItem("auth", JSON.stringify(auth.user));
      showMessage("Cập nhật hồ sơ thành công!");
      handleNavigate("/");
    } else {
      showMessage(`Lỗi: ${data.message || 'Cập nhật thất bại.'}`);
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ:", error);
    showMessage("Lỗi kết nối đến server. Vui lòng thử lại.");
  }
};

/**
 * [USER] Xử lý đăng xuất người dùng.
 * Xóa dữ liệu local và reset trạng thái.
 */
function logout() {
  auth.user = null;
  localStorage.removeItem("auth");

  // Xóa toàn bộ giỏ hàng
  cartItems = [];
  selectedCartIds = [];

  handleNavigate("/");
  showMessage('Bạn đã đăng xuất');
}


// =================================================================
// VIII. CHỨC NĂNG VÀ GIAO DIỆN CHO ADMIN (ADMIN FEATURES & PAGES)
// =================================================================

// -----------------------------------------------------------------
// 8.1. Core Admin: Điều hướng, Tải dữ liệu
// -----------------------------------------------------------------

/**
 * [ADMIN] Tải tất cả dữ liệu cần thiết cho trang quản trị.
 * Bao gồm thống kê, đơn hàng, và doanh thu.
 */
const loadAdminData = async () => {
    try {
        // --- START: MODIFICATION ---
        // Thêm tham số year & month vào URL khi gọi API revenue
        const revenueUrl = `http://localhost:3000/admin/revenue?year=${adminRevenueFilterYear}&month=${adminRevenueFilterMonth}`;
        const [statsRes, ordersRes, revenueRes] = await Promise.all([
            fetch('http://localhost:3000/admin/stats'),
            fetch('http://localhost:3000/admin/orders'),
            fetch(revenueUrl) // Sử dụng URL mới
        ]);
        // --- END: MODIFICATION ---

        if (!statsRes.ok || !ordersRes.ok || !revenueRes.ok) {
            throw new Error('Failed to fetch admin data');
        }

        adminData.stats = await statsRes.json();
        adminData.orders = await ordersRes.json();
        adminData.revenue = await revenueRes.json();

        console.log("✅ Admin data loaded:", adminData);

    } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu admin:", err);
        showMessage("Không thể tải dữ liệu quản trị viên.");
        adminData = { stats: null, orders: null, revenue: null }; // Reset data on error
    }
};

// Tải bình luận từ server
async function loadAdminComments() {
    try {
        const res = await fetch('http://localhost:3000/admin/comments');
        if (!res.ok) throw new Error('Lỗi khi tải bình luận');
        adminComments = await res.json();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
        adminComments = [];
    }
};


/**
 * [ADMIN] Chuyển đổi giữa các màn hình trong trang Admin (Dashboard, Orders, etc.).
 * @param {string} view - Tên màn hình cần hiển thị.
 */
const setAdminView = async (view) => {
    adminCurrentView = view;
    if (view === 'comments') {
        await loadAdminComments();
    }
    renderPage();
};

/**
 * [PAGE] Tạo HTML cho layout chính của trang Admin (có sidebar).
 * @returns {string} Chuỗi HTML của trang Admin.
 */
const createAdminPage = () => {
    let content = '';
    switch (adminCurrentView) {
        case 'dashboard':
            content = renderAdminDashboard();
            break;
        case 'orders':
            content = renderAdminOrders();
            break;
        case 'inventory':
            content = renderAdminInventory();
            break;
        case 'revenue':
            content = renderAdminRevenue();
            break;
        case 'banners':
            content = renderAdminBanners();
            break;
        case 'vouchers':
            content = renderAdminVouchers();
            break;
        case 'flash-sale':
            content = renderAdminFlashSale();
            break;
        case 'comments':
            content = renderAdminComments();
            break;
        default:
            content = renderAdminDashboard();
    }

    return `
    <div class="bg-gray-100">
        <div class="flex h-screen">
            <aside class="w-64 bg-gray-800 text-white p-4 space-y-2 flex-shrink-0">
                <h2 class="text-2xl font-bold mb-6">Admin Panel</h2>
                <nav>
                    <button onclick="setAdminView('dashboard')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Bảng điều khiển</button>
                    <button onclick="setAdminView('orders')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'orders' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý đơn hàng</button>
                    <button onclick="setAdminView('inventory')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'inventory' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý kho</button>
                    <button onclick="setAdminView('revenue')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'revenue' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý doanh thu</button>
                    <button onclick="setAdminView('vouchers')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'vouchers' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý voucher</button>
                    <button onclick="setAdminView('banners')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'banners' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý banner</button>
                    <button onclick="setAdminView('flash-sale')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'flash-sale' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý Flash Sale</button>
                    <button onclick="setAdminView('comments')" class="w-full text-left px-4 py-2 rounded-lg ${adminCurrentView === 'comments' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý bình luận</button>
                    <button onclick="logout()" class="w-full text-left px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 mt-8 font-semibold">Đăng xuất</button>
                </nav>
            </aside>

            <main class="flex-1 p-8 overflow-y-auto">
                ${content}
            </main>
        </div>
        ${isAddProductModalOpen ? createAddProductModal() : ''}
        ${editProductModalState.isOpen ? createEditProductModal() : ''}
    </div>
    `;
};

// -----------------------------------------------------------------
// 8.2. Các màn hình con của Admin (Render Views)
// -----------------------------------------------------------------

/**
 * [ADMIN-UI] Render nội dung cho màn hình Bảng điều khiển (Dashboard).
 * @returns {string} Chuỗi HTML.
 */
const renderAdminDashboard = () => {
    if (!adminData.stats) return `<p>Đang tải dữ liệu...</p>`;
    const { totalUsers, totalProducts, pendingOrders, monthlyRevenue } = adminData.stats;
    return `
        <h1 class="text-3xl font-bold mb-6">Bảng điều khiển</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm font-medium">TỔNG SỐ TÀI KHOẢN</h3>
                <p class="text-3xl font-bold mt-2">${totalUsers-1 || 0}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm font-medium">DOANH THU THÁNG NÀY</h3>
                <p class="text-3xl font-bold mt-2">${Number(monthlyRevenue).toLocaleString('vi-VN')}₫</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm font-medium">ĐƠN HÀNG CHỜ XỬ LÝ</h3>
                <p class="text-3xl font-bold mt-2">${pendingOrders || 0}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm font-medium">TỔNG SỐ SẢN PHẨM</h3>
                <p class="text-3xl font-bold mt-2">${totalProducts || 0}</p>
            </div>
        </div>
    `;
};

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý đơn hàng.
 * @returns {string} Chuỗi HTML.
 */
const renderAdminOrders = () => {
    if (!adminData.orders) return `<p>Đang tải dữ liệu...</p>`;

    const getActionButtons = (order) => {
        switch (order.status) {
            case 'chờ xác nhận':
                return `<button onclick="handleUpdateOrderStatus(${order.bill_id}, 'đã xác nhận', 'Đã xác nhận')" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs">Xác nhận</button>`;

            case 'đã xác nhận':
                return `
                    <button onclick="handleUpdateOrderStatus(${order.bill_id}, 'đang giao hàng', 'Đang giao hàng')" class="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-xs">Bắt đầu giao</button>
                    <button onclick="handleAdminCancelOrder(${order.bill_id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs ml-2">Hủy đơn</button>
                `;

            case 'đang giao hàng':
                return `
                    <button onclick="handleUpdateOrderStatus(${order.bill_id}, 'đã giao', 'Đã giao')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs">Đã giao</button>
                    <button onclick="handleAdminCancelOrder(${order.bill_id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs ml-2">Hủy đơn</button>
                `;

            case 'đã giao':
                return `<span class="text-green-700 font-semibold">Hoàn thành</span>`;

            case 'đã hủy':
                return `<span class="text-red-700 font-semibold">Đã hủy</span>`;

            default:
                return '';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'chờ xác nhận': return 'bg-yellow-200 text-yellow-800';
            case 'đã xác nhận': return 'bg-blue-200 text-blue-800';
            case 'đang giao hàng': return 'bg-purple-200 text-purple-800';
            case 'đã giao': return 'bg-green-200 text-green-800';
            case 'đã hủy': return 'bg-red-200 text-red-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    }

    return `
        <h1 class="text-3xl font-bold mb-6">Quản lý đơn hàng</h1>
        <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="p-3">ID</th>
                        <th class="p-3">Khách hàng</th>
                        <th class="p-3">Ngày đặt</th>
                        <th class="p-3">Tổng tiền</th>
                        <th class="p-3">Trạng thái</th>
                        <th class="p-3 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    ${adminData.orders.map(order => `
                        <tr class="border-b">
                            <td class="p-3 font-medium">#${order.bill_id}</td>
                            <td class="p-3">${order.username}</td>
                            <td class="p-3">${new Date(order.purchase_date).toLocaleDateString('vi-VN')}</td>
                            <td class="p-3">${Number(order.total_amount).toLocaleString('vi-VN')}₫</td>
                            <td class="p-3">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                            <td class="p-3 text-center">
                                ${getActionButtons(order)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý kho (Sản phẩm).
 * @returns {string} Chuỗi HTML.
 */
const renderAdminInventory = () => {
    // THÊM BƯỚC KIỂM TRA AN TOÀN
    if (!availableBooks || !Array.isArray(availableBooks)) {
        return `
            <h1 class="text-3xl font-bold">Quản lý kho</h1>
            <p class="mt-4 text-gray-600">Đang tải dữ liệu sản phẩm hoặc đã có lỗi xảy ra...</p>
        `;
    }

    // Nếu dữ liệu đã sẵn sàng, hiển thị bảng như bình thường
    return `
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Quản lý kho</h1>
            <button onclick="openAddProductModal()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Thêm sản phẩm mới</button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
             <table class="w-full text-sm text-left">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="p-3">ID</th>
                        <th class="p-3">Tên sản phẩm</th>
                        <th class="p-3">Tồn kho</th>
                        <th class="p-3">Giá</th>
                        <th class="p-3">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    ${availableBooks.map(book => `
                         <tr class="border-b">
                            <td class="p-3 font-medium">${book.id}</td>
                            <td class="p-3">${book.title}</td>
                            <td class="p-3">${book.stock}</td>
                            <td class="p-3">${book.price.toLocaleString('vi-VN')}₫</td>
                            <td class="p-3 space-x-2">
                                <button onclick="openEditProductModal(${book.id})" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs">Sửa</button>
                                <button onclick="handleAddStock(${book.id}, ${book.stock})" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs">Thêm SL</button>
                                <button onclick="handleDeleteProduct(${book.id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý doanh thu.
 * @returns {string} Chuỗi HTML.
 */
const renderAdminRevenue = () => {
    if (!adminData.revenue) return `<p>Đang tải dữ liệu...</p>`;
    const { monthly, bestSellers } = adminData.revenue;

    // --- START: ADDITION ---
    // Tạo các tùy chọn cho năm (ví dụ: 5 năm gần nhất)
    let yearOptions = '';
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
        const year = currentYear - i;
        yearOptions += `<option value="${year}" ${adminRevenueFilterYear === year ? 'selected' : ''}>${year}</option>`;
    }

    // Tạo các tùy chọn cho tháng
    let monthOptions = '';
    for (let i = 1; i <= 12; i++) {
        monthOptions += `<option value="${i}" ${adminRevenueFilterMonth === i ? 'selected' : ''}>Tháng ${i}</option>`;
    }
    // --- END: ADDITION ---

    return `
        <h1 class="text-3xl font-bold mb-6">Quản lý doanh thu</h1>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-bold mb-4">Doanh thu theo tháng</h2>
                <table class="w-full text-sm text-left">
                     <thead class="bg-gray-50">
                        <tr>
                            <th class="p-3">Tháng</th>
                            <th class="p-3">Tổng đơn</th>
                            <th class="p-3">Doanh thu</th>
                            <th class="p-3">Lợi nhuận</th> </tr>
                    </thead>
                    <tbody>
                        ${monthly.map(row => `
                            <tr class="border-b">
                                <td class="p-3 font-medium">${row.month}</td>
                                <td class="p-3">${row.total_orders}</td>
                                <td class="p-3 font-semibold text-blue-600">${Number(row.total_revenue).toLocaleString('vi-VN')}₫</td>
                                <td class="p-3 font-semibold text-green-600">${Number(row.total_profit).toLocaleString('vi-VN')}₫</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="bg-white p-6 rounded-lg shadow" style="max-height: 600px; overflow-y: auto;">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Sản phẩm đã bán</h2>
                    <div class="flex space-x-2">
                        <select id="month-filter" onchange="handleRevenueFilterChange()" class="p-2 border rounded-md text-sm">
                            ${monthOptions}
                        </select>
                        <select id="year-filter" onchange="handleRevenueFilterChange()" class="p-2 border rounded-md text-sm">
                            ${yearOptions}
                        </select>
                    </div>
                </div>
                <table class="w-full text-sm text-left">
                     <thead class="bg-gray-50">
                        <tr>
                            <th class="p-3">Sản phẩm</th>
                            <th class="p-3">Đã bán</th>
                        </tr>
                    </thead>
                    <tbody>
                         ${bestSellers.map(item => `
                            <tr class="border-b">
                                <td class="p-3">${item.name}</td>
                                <td class="p-3 font-medium">${item.total_quantity_sold}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// Hàm xử lý sự kiện khi thay đổi bộ lọc doanh thu
const handleRevenueFilterChange = async () => {
    const year = document.getElementById('year-filter').value;
    const month = document.getElementById('month-filter').value;

    adminRevenueFilterYear = parseInt(year);
    adminRevenueFilterMonth = parseInt(month);
    
    // Tải lại dữ liệu admin với bộ lọc mới và render lại trang
    await loadAdminData();
    renderPage();
};

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý Voucher.
 * @returns {string} Chuỗi HTML.
 */
const renderAdminVouchers = () => {
    return `
    <h1 class="text-3xl font-bold mb-6">Quản lý Voucher</h1>
    <div class="mb-6 flex justify-end">
        <button onclick="openAddVoucherModal()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Thêm voucher mới</button>
    </div>
    <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-50">
                <tr>
                    <th class="p-3">ID</th>
                    <th class="p-3">Mã</th>
                    <th class="p-3">Loại Voucher</th>
                    <th class="p-3">Giá trị</th>
                    <th class="p-3">Giảm tối đa</th>
                    <th class="p-3">Đơn tối thiểu</th>
                    <th class="p-3">Còn lại</th>
                    <th class="p-3">Ngày bắt đầu</th>
                    <th class="p-3">Ngày kết thúc</th>
                    <th class="p-3">Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${availableVouchers.map(v => `
                    <tr class="border-b">
                        <td class="p-3 font-medium">${v.id}</td>
                        <td class="p-3">${v.code}</td>
                        <td class="p-3">${v.voucher_type === 'product' ? 'Sản phẩm' : 'Vận chuyển'}</td>
                        <td class="p-3">${v.isPercentage ? `${v.value}%` : `${Number(v.value).toLocaleString('vi-VN')}₫`}</td>
                        <td class="p-3">${v.maxDiscount ? Number(v.maxDiscount).toLocaleString('vi-VN') + '₫' : '-'}</td>
                        <td class="p-3">${Number(v.minPrice).toLocaleString('vi-VN')}₫</td>
                        <td class="p-3">${v.remaining}</td>
                        <td class="p-3">${v.start_date ? new Date(v.start_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td class="p-3">${v.expiration ? new Date(v.expiration).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td class="p-3 space-x-2">
                            <button onclick="openEditVoucherModal(${v.id})" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs">Sửa</button>
                            <button onclick="handleDeleteVoucher(${v.id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Xóa</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ${isAddVoucherModalOpen ? createAddVoucherModal() : ''}
    ${editVoucherModalState.isOpen ? createEditVoucherModal() : ''}
    `;
};

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý Banner.
 * @returns {string} Chuỗi HTML.
 */
const renderAdminBanners = () => {
    return `
    <h1 class="text-3xl font-bold mb-6">Quản lý Banner Trang chủ</h1>
    <div class="mb-6 flex justify-end">
        <button onclick="openAddBannerModal()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Thêm banner mới</button>
    </div>
    <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-50">
                <tr>
                    <th class="p-3">ID</th>
                    <th class="p-3">Ảnh</th>
                    <th class="p-3">Link</th>
                    <th class="p-3">Thứ tự</th>
                    <th class="p-3">Hiển thị</th>
                    <th class="p-3">Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${availableBanners.map(banner => `
                    <tr class="border-b">
                        <td class="p-3 font-medium">${banner.banner_id}</td>
                        <td class="p-3"><img src="${banner.image_url}" alt="Banner" class="h-16 rounded"/></td>
                        <td class="p-3"><a href="${banner.link}" target="_blank" class="text-blue-600 underline">${banner.link || ''}</a></td>
                        <td class="p-3">${banner.order}</td>
                        <td class="p-3">
                            <input type="checkbox" ${banner.is_active ? 'checked' : ''} onchange="handleToggleBannerActive(${banner.banner_id}, this.checked)">
                        </td>
                        <td class="p-3 space-x-2">
                            <button onclick="openEditBannerModal(${banner.banner_id})" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs">Sửa</button>
                            <button onclick="handleDeleteBanner(${banner.banner_id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Xóa</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ${isAddBannerModalOpen ? createAddBannerModal() : ''}
    ${editBannerModalState.isOpen ? createEditBannerModal() : ''}
    `;
};

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý Flash Sale.
 * @returns {string} Chuỗi HTML.
 */
function renderAdminFlashSale() {
    return `
    <h1 class="text-3xl font-bold mb-6">Quản lý Flash Sale</h1>
    <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-50">
                <tr>
                    <th class="p-3">ID</th>
                    <th class="p-3">Tên sản phẩm</th>
                    <th class="p-3">Giá gốc</th>
                    <th class="p-3">Giá sale</th>
                    <th class="p-3">Flash Sale</th>
                    <th class="p-3">Đang sale</th>
                    <th class="p-3 text-center">Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${availableBooks.map(book => `
                    <tr class="border-b">
                        <td class="p-3 font-medium">${book.id}</td>
                        <td class="p-3">${book.title}</td>
                        <td class="p-3">${book.price.toLocaleString('vi-VN')}₫</td>
                        <td class="p-3">${book.is_sale ? Math.round(book.price * (1 - book.discount / 100)).toLocaleString('vi-VN') + '₫' : '-'}</td>
                        <td class="p-3">
                            ${book.is_sale ? `
                              <div class="flex flex-col items-start">
                                <span class="inline-block bg-red-100 text-red-600 px-2 py-1 rounded font-semibold mb-1">-${book.discount}%</span>
                                <span class="inline-block bg-blue-100 text-blue-600 px-2 py-1 rounded font-semibold">HSD: ${book.sale_end ? new Date(book.sale_end).toLocaleDateString('vi-VN') : '-'}</span>
                              </div>
                            ` : '-'}
                        </td>
                        <td class="p-3 text-center">${book.is_sale ? '<span class="text-green-600 font-bold">SALE</span>' : ''}</td>
                        <td class="p-3 text-center">
                            <input type="checkbox"
                                ${book.is_sale && !(flashSaleModalState.isOpen && flashSaleModalState.product?.id === book.id) ? 'checked' : ''}
                                onchange="this.checked ? openFlashSaleModal(${book.id}) : handleStopSale(${book.id})"
                            >
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;
}

/**
 * [ADMIN-UI] Render nội dung cho màn hình Quản lý bình luận.
 * @returns {string} Chuỗi HTML.
 */
function renderAdminComments() {
    if (!adminComments || adminComments.length === 0) {
        return `<h1 class="text-3xl font-bold mb-6">Quản lý bình luận sản phẩm</h1>
                <p class="text-gray-500">Chưa có bình luận nào.</p>`;
    }
    return `
    <h1 class="text-3xl font-bold mb-6">Quản lý bình luận sản phẩm</h1>
    <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-50">
                <tr>
                    <th class="p-3">Sản phẩm</th>
                    <th class="p-3">Khách hàng</th>
                    <th class="p-3">Ngày</th>
                    <th class="p-3">Nội dung</th>
                    <th class="p-3">Trả lời của admin</th>
                    <th class="p-3">Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${adminComments.map(comment => `
                    <tr class="border-b">
                        <td class="p-3 font-medium">${comment.product_title}</td>
                        <td class="p-3">${comment.username}</td>
                        <td class="p-3">${new Date(comment.review_date).toLocaleDateString('vi-VN')}</td>
                        <td class="p-3">${comment.comment}</td>
                        <td class="p-3">${comment.admin_reply ? `<span class="text-green-600">${comment.admin_reply}</span>` : '<span class="text-gray-400">Chưa trả lời</span>'}</td>
                        <td class="p-3">
                            <form onsubmit="handleAdminReplyComment(event, ${comment.review_id})" class="flex gap-2">
                                <input type="text" name="admin_reply" placeholder="Nhập trả lời..." class="p-2 border rounded w-32" value="${comment.admin_reply || ''}">
                                <button type="submit" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs">Trả lời</button>
                            </form>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;
}

// -----------------------------------------------------------------
// 8.3. Hành động của Admin (Admin Actions)
// -----------------------------------------------------------------

/**
 * [ADMIN] Xử lý cập nhật trạng thái của một đơn hàng (xác nhận, giao hàng, v.v.).
 * @param {number} billId - ID đơn hàng.
 * @param {string} newStatus - Trạng thái mới.
 * @param {string} actionText - Mô tả hành động để xác nhận.
 */
const handleUpdateOrderStatus = async (billId, newStatus, actionText) => {
    if (!confirm(`Bạn có chắc muốn cập nhật đơn hàng #${billId} thành "${actionText}"?`)) return;

    // Tạo payload để gửi đi
    const payload = {
        newStatus: newStatus
    };

    // Nếu trạng thái mới là "đã giao", thêm ngày giao hàng thực tế vào payload
    if (newStatus === 'đã giao') {
        const today = new Date();
        // Định dạng ngày thành YYYY-MM-DD để gửi lên server
        payload.delivery_date = today.toISOString().split('T')[0];
    }

    try {
        const res = await fetch(`http://localhost:3000/api/bills/${billId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Gửi payload đã được cập nhật
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Cập nhật trạng thái thất bại');
        }
        showMessage(`Đã cập nhật đơn hàng #${billId} thành công!`);
        await loadAdminData(); // Tải lại dữ liệu
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};

/**
 * [ADMIN] Xử lý khi admin hủy một đơn hàng.
 * @param {number} billId - ID đơn hàng cần hủy.
 */
const handleAdminCancelOrder = async (billId) => {
    // ⭐ UPDATE: Dùng prompt để lấy lý do
    const reason = prompt(`Vui lòng nhập lý do hủy cho đơn hàng #${billId}:`);

    if (reason === null) { // Người dùng bấm "Cancel"
        return;
    }
    if (!reason) { // Người dùng không nhập gì và bấm "OK"
        showMessage("Lý do hủy không được để trống.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/admin/orders/${billId}/cancel`, {
            method: 'PATCH',
            // ⭐ UPDATE: Gửi lý do lên server
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason })
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Hủy đơn hàng thất bại');
        }
        showMessage(`Đã hủy đơn hàng #${billId} thành công!`);
        await loadAdminData();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

/**
 * [ADMIN] Xử lý thêm một sản phẩm mới vào kho.
 * @param {Event} event - Sự kiện submit form.
 */
const handleAddNewProduct = async (event) => {
    event.preventDefault();
    const newProduct = {
        name: document.getElementById('prod-name').value,
        author: document.getElementById('prod-author').value,
        category: document.getElementById('prod-category').value,
        import_price: document.getElementById('prod-import-price').value || null, // MỚI
        sell_price: document.getElementById('prod-price').value,
        stock: document.getElementById('prod-stock').value,
        pub_date: document.getElementById('prod-pub-date').value || null, // MỚI
        isbn: document.getElementById('prod-isbn').value || null, // MỚI
        image: document.getElementById('prod-image-url').value,
        description: document.getElementById('prod-description').value,
    };

    try {
        const pubDateInput = document.getElementById('prod-pub-date').value;
        newProduct.pub_date = pubDateInput ? convertDate(pubDateInput) : null;
        const res = await fetch('http://localhost:3000/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Thêm sản phẩm thất bại');
        }
        showMessage('Thêm sản phẩm thành công!');
        closeAddProductModal();
        await loadProducts(); // Tải lại danh sách sản phẩm chung
        renderPage();
    } catch (err) {
         showMessage('Lỗi: ' + err.message);
    }
};

/**
 * [ADMIN] Xử lý cập nhật thông tin một sản phẩm đã có.
 * @param {Event} event - Sự kiện submit form.
 * @param {number} productId - ID sản phẩm.
 */
const handleUpdateProduct = async (event, productId) => {
    event.preventDefault();
    const updatedProduct = {
        name: document.getElementById('edit-prod-name').value,
        author: document.getElementById('edit-prod-author').value,
        category: document.getElementById('edit-prod-category').value,
        sell_price: document.getElementById('edit-prod-price').value,
        stock: document.getElementById('edit-prod-stock').value,
        // Quan trọng: giữ lại ảnh cũ nếu không chọn ảnh mới
        image: document.getElementById('edit-prod-image-url').value,
        description: document.getElementById('edit-prod-description').value,
    };

    // Lưu ý: Phần xử lý upload file ảnh sẽ được giải thích ở mục dưới.
    // Hiện tại, chúng ta vẫn dùng URL.

    try {
        const res = await fetch(`http://localhost:3000/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });
        if (!res.ok) throw new Error('Cập nhật sản phẩm thất bại');
        showMessage('Cập nhật sản phẩm thành công!');
        closeEditProductModal();
        await loadProducts(); // Tải lại danh sách sản phẩm
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};

/**
 * [ADMIN] Xử lý thêm số lượng tồn kho cho một sản phẩm.
 * @param {number} productId - ID sản phẩm.
 * @param {number} currentStock - Số lượng tồn kho hiện tại.
 */
const handleAddStock = async (productId, currentStock) => {
    const amountToAdd = prompt(`Nhập số lượng cần thêm cho sản phẩm ID ${productId}:`, "10");
    if (amountToAdd === null || isNaN(parseInt(amountToAdd))) return;

    const bookToUpdate = availableBooks.find(b => b.id === productId);
    if (!bookToUpdate) return;

    // Tạo payload với đầy đủ thông tin để PUT
    const updatedData = {
        name: bookToUpdate.title,
        author: bookToUpdate.author,
        category: bookToUpdate.category,
        sell_price: bookToUpdate.price,
        description: bookToUpdate.description,
        image: bookToUpdate.image,
        stock: currentStock + parseInt(amountToAdd)
    };

    try {
         const res = await fetch(`http://localhost:3000/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!res.ok) throw new Error('Failed to update stock');
        showMessage('Cập nhật tồn kho thành công!');
        await loadProducts(); // Tải lại danh sách sản phẩm
        renderPage();
    } catch (err) {
         showMessage('Lỗi: ' + err.message);
    }
};

/**
 * [ADMIN] Xử lý xóa một sản phẩm khỏi hệ thống.
 * @param {number} productId - ID sản phẩm.
 */
const handleDeleteProduct = async (productId) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm ID ${productId}? Hành động này không thể hoàn tác.`)) return;

    try {
        const res = await fetch(`http://localhost:3000/admin/products/${productId}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showMessage(data.message);
        await loadProducts(); // Tải lại danh sách sản phẩm
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};

// -----------------------------------------------------------------
// 8.4. Modals và Handlers của Admin
// -----------------------------------------------------------------

// Modal thêm sản phẩm
const createAddProductModal = () => {
    return `
    <div id="add-product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-2xl">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Thêm sản phẩm mới</h2>
                <button onclick="closeAddProductModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleAddNewProduct(event)" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                
                <div>
                    <label class="block text-sm font-medium">Tên sách (name)</label>
                    <input type="text" id="prod-name" required class="w-full p-2 border rounded">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Tác giả (author)</label>
                        <input type="text" id="prod-author" required class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Thể loại (category)</label>
                        <input type="text" id="prod-category" required class="w-full p-2 border rounded">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Giá nhập (import_price)</label>
                        <input type="number" id="prod-import-price" step="1000" class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Giá bán (sell_price)</label>
                        <input type="number" id="prod-price" step="1000" required class="w-full p-2 border rounded">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label class="block text-sm font-medium">Tồn kho (stock)</label>
                        <input type="number" id="prod-stock" required class="w-full p-2 border rounded" value="0">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Ngày xuất bản (pub_date)</label>
                        <input type="text" id="prod-pub-date" placeholder="dd/mm/yyyy" class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Mã ISBN (isbn)</label>
                        <input type="text" id="prod-isbn" class="w-full p-2 border rounded">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium">URL Hình ảnh (image)</label>
                    <input type="text" id="prod-image-url" placeholder="https://example.com/image.png" required class="w-full p-2 border rounded" oninput="document.getElementById('add-image-preview').src = this.value">
                    <img id="add-image-preview" src="https://via.placeholder.com/150" alt="Xem trước ảnh" class="mt-2 h-24 w-auto rounded object-cover"/>
                </div>

                <div>
                    <label class="block text-sm font-medium">Mô tả (description)</label>
                    <textarea id="prod-description" rows="3" class="w-full p-2 border rounded"></textarea>
                </div>

                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="closeAddProductModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Lưu sản phẩm</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

// Modal sửa sản phẩm
const createEditProductModal = () => {
    if (!editProductModalState.isOpen) return '';
    const p = editProductModalState.product;

    return `
    <div id="edit-product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-2xl">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Chỉnh sửa sản phẩm #${p.id}</h2>
                <button onclick="closeEditProductModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleUpdateProduct(event, ${p.id})" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label class="block text-sm font-medium">Tên sách</label>
                    <input type="text" id="edit-prod-name" value="${p.title}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Tác giả</label>
                    <input type="text" id="edit-prod-author" value="${p.author}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Thể loại</label>
                    <input type="text" id="edit-prod-category" value="${p.category}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Giá bán</label>
                    <input type="number" id="edit-prod-price" value="${p.price}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Số lượng tồn kho</label>
                    <input type="number" id="edit-prod-stock" value="${p.stock}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">URL Hình ảnh (image)</label>
                    <input type="text" id="edit-prod-image-url" value="${p.image || ''}" placeholder="https://example.com/image.png" required class="w-full p-2 border rounded" oninput="document.getElementById('edit-image-preview').src = this.value">
                    <img id="edit-image-preview" src="${p.image || 'https://via.placeholder.com/150'}" alt="Xem trước ảnh" class="mt-2 h-24 w-auto rounded object-cover"/>
                </div>
                <div>
                    <label class="block text-sm font-medium">Mô tả</label>
                    <textarea id="edit-prod-description" rows="4" required class="w-full p-2 border rounded">${p.description}</textarea>
                </div>
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="closeEditProductModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Cập nhật</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

//hàm add voucher
const createAddVoucherModal = () => {
    return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-lg">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Thêm voucher mới</h2>
                <button onclick="closeAddVoucherModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleAddVoucher(event)" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label class="block text-sm font-medium">Mã voucher</label>
                  <input type="text" id="voucher-code" required class="w-full p-2 border rounded">
              </div>
              <div>
                  <label class="block text-sm font-medium">Loại voucher</label>
                  <select id="voucher-type" class="w-full p-2 border rounded">
                      <option value="product">Giảm giá sản phẩm</option> <option value="shipping">Miễn phí vận chuyển</option>
                  </select>
              </div>
              <div>
                  <label class="block text-sm font-medium">Loại giảm giá</label>
                  <select id="voucher-discount-type" class="w-full p-2 border rounded mt-2">
                      <option value="fixed">Số tiền cố định (VND)</option>
                      <option value="percentage">Phần trăm (%)</option>
                  </select>
              </div>
              <div>
                  <label class="block text-sm font-medium">Giá trị giảm</label>
                  <input type="number" id="voucher-value" required class="w-full p-2 border rounded" placeholder="Ví dụ: 10000 hoặc 15">
              </div>
              <div>
                  <label class="block text-sm font-medium">Giảm tối đa (chỉ cho loại %)</label>
                  <input type="number" id="voucher-max-discount" class="w-full p-2 border rounded">
              </div>
              <div>
                  <label class="block text-sm font-medium">Đơn hàng tối thiểu</label>
                  <input type="number" id="voucher-min-order" required class="w-full p-2 border rounded">
              </div>
              <div>
                  <label class="block text-sm font-medium">Số lượng phát hành</label>
                  <input type="number" id="voucher-remaining" required class="w-full p-2 border rounded">
              </div>
              <div>
                  <label class="block text-sm font-medium">Ngày bắt đầu</label>
                  <input type="text" id="voucher-start-date" placeholder="dd/mm/yyyy" required class="w-full p-2 border rounded">     
              </div>
              <div>
                  <label class="block text-sm font-medium">Ngày kết thúc</label>
                  <input type="text" id="voucher-end-date" placeholder="dd/mm/yyyy" required class="w-full p-2 border rounded">
              </div>
              <div class="md:col-span-2">
                  <label class="block text-sm font-medium">Mô tả</label>
                  <textarea id="voucher-description" rows="2" class="w-full p-2 border rounded"></textarea>
              </div>
              <div class="md:col-span-2 flex justify-end space-x-4 pt-4">
                  <button type="button" onclick="closeAddVoucherModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                  <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Lưu voucher</button>
              </div>
          </form>
        </div>
    </div>
    `;
};


//hàm sửa voucher
const createEditVoucherModal = () => {
    const v = editVoucherModalState.voucher;
    if (!v) return '';
    return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-lg">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Chỉnh sửa voucher #${v.id}</h2>
                <button onclick="closeEditVoucherModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleEditVoucher(event, ${v.id})" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium">Mã voucher</label>
                    <input type="text" id="edit-voucher-code" value="${v.code}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Loại voucher</label>
                    <select id="edit-voucher-type" class="w-full p-2 border rounded">
                        <option value="product" ${v.voucher_type === 'product' ? 'selected' : ''}>Giảm giá sản phẩm</option>
                        <option value="shipping" ${v.voucher_type === 'shipping' ? 'selected' : ''}>Miễn phí vận chuyển</option>
                    </select>
                </div>
                <div>
                  <label class="block text-sm font-medium">Loại giảm giá</label>
                  <select id="edit-voucher-discount-type" class="w-full p-2 border rounded mt-2">
                      <option value="fixed" ${v.type === 'fixed' ? 'selected' : ''}>Số tiền cố định (VND)</option>
                      <option value="percentage" ${v.type === 'percentage' ? 'selected' : ''}>Phần trăm (%)</option>
                  </select>
                </div>
                <div>
                    <label class="block text-sm font-medium">Giá trị giảm</label>
                    <input type="number" id="edit-voucher-value" value="${v.value}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Giảm tối đa (chỉ cho loại %)</label>
                    <input type="number" id="edit-voucher-max-discount" value="${v.maxDiscount || ''}" class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Đơn hàng tối thiểu</label>
                    <input type="number" id="edit-voucher-min-order" value="${v.minPrice}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Số lượng còn lại</label>
                    <input type="number" id="edit-voucher-remaining" value="${v.remaining}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Ngày bắt đầu</label>
                    <input type="text" id="edit-voucher-start-date" placeholder="dd/mm/yyyy" value="${formatDateForInput(v.start_date)}" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Ngày kết thúc</label>
                    <input type="text" id="edit-voucher-end-date" placeholder="dd/mm/yyyy" value="${formatDateForInput(v.expiration)}" required class="w-full p-2 border rounded">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Mô tả</label>
                    <textarea id="edit-voucher-description" rows="2" class="w-full p-2 border rounded">${v.description || ''}</textarea>
                </div>
                <div class="md:col-span-2 flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="closeEditVoucherModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Cập nhật voucher</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

// hàm thêm banner mới 
const createAddBannerModal = () => {
    return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-lg">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Thêm banner mới</h2>
                <button onclick="closeAddBannerModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleAddBanner(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium">URL Hình ảnh</label>
                    <input type="text" id="banner-image-url" required class="w-full p-2 border rounded" oninput="document.getElementById('banner-image-preview').src = this.value">
                    <img id="banner-image-preview" src="https://via.placeholder.com/300x80" alt="Xem trước ảnh" class="mt-2 h-20 w-auto rounded object-cover"/>
                </div>
                <div>
                    <label class="block text-sm font-medium">Link</label>
                    <input type="text" id="banner-link" class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Thứ tự hiển thị</label>
                    <input type="number" id="banner-order" value="0" class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Hiển thị</label>
                    <input type="checkbox" id="banner-active" checked>
                </div>
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="closeAddBannerModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Lưu banner</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

//modal sửa banner
const createEditBannerModal = () => {
    const b = editBannerModalState.banner;
    if (!b) return '';
    return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-lg">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Chỉnh sửa banner #${b.banner_id}</h2>
                <button onclick="closeEditBannerModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleEditBanner(event, ${b.banner_id})" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium">URL Hình ảnh</label>
                    <input type="text" id="edit-banner-image-url" value="${b.image_url}" required class="w-full p-2 border rounded" oninput="document.getElementById('edit-banner-image-preview').src = this.value">
                    <img id="edit-banner-image-preview" src="${b.image_url}" alt="Xem trước ảnh" class="mt-2 h-20 w-auto rounded object-cover"/>
                </div>
                <div>
                    <label class="block text-sm font-medium">Link</label>
                    <input type="text" id="edit-banner-link" value="${b.link || ''}" class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Thứ tự hiển thị</label>
                    <input type="number" id="edit-banner-order" value="${b.order}" class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Hiển thị</label>
                    <input type="checkbox" id="edit-banner-active" ${b.is_active ? 'checked' : ''}>
                </div>
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="closeEditBannerModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Cập nhật banner</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

// Hàm tạo Modal cho Flash Sale
const createFlashSaleModal = () => {
    if (!flashSaleModalState.isOpen) return '';
    const { product } = flashSaleModalState;

    return `
    <div id="flash-sale-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
        <div class="bg-white rounded-lg p-8 w-full max-w-md relative">
            <button onclick="closeFlashSaleModal()" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            <h2 class="text-2xl font-bold mb-2">Cài đặt Flash Sale</h2>
            <p class="text-gray-700 mb-6 font-semibold">${product.title}</p>
            
            <form onsubmit="handleSaveFlashSale(event, ${product.id})">
                <div class="mb-4">
                    <label for="sale-discount" class="block text-sm font-medium text-gray-700">Phần trăm giảm giá (%)</label>
                    <input type="number" id="sale-discount" min="1" max="99" required 
                           class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>

                <div class="mb-6">
                    <label for="sale-end-date" class="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                    <input type="text" id="sale-end-date" placeholder="dd/mm/yyyy" required 
                          class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                </div>

                <div class="flex justify-end space-x-4">
                    <button type="button" onclick="closeFlashSaleModal()" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Hủy</button>
                    <button type="submit" class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-semibold">Lưu cài đặt</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

// Handlers cho modal thêm sản phẩm
const openAddProductModal = () => { isAddProductModalOpen = true; renderPage(); };
const closeAddProductModal = () => { isAddProductModalOpen = false; renderPage(); };
const openEditProductModal = (productId) => {
    const productToEdit = availableBooks.find(b => b.id === productId);
    if (productToEdit) {
        editProductModalState = { isOpen: true, product: productToEdit };
        renderPage();
    }
};
const closeEditProductModal = () => {
    editProductModalState = { isOpen: false, product: null };
    renderPage();
};

//handlers cho modal voucher
function openAddVoucherModal() { isAddVoucherModalOpen = true; renderPage(); }
function closeAddVoucherModal() { isAddVoucherModalOpen = false; renderPage(); }
function openEditVoucherModal(voucherId) {
    const voucher = availableVouchers.find(v => v.id === voucherId);
    if (voucher) {
        editVoucherModalState = { isOpen: true, voucher };
        renderPage();
    }
}
function closeEditVoucherModal() {
    editVoucherModalState = { isOpen: false, voucher: null };
    renderPage();
}

// handlers cho modal banner
function openAddBannerModal() { isAddBannerModalOpen = true; renderPage(); }
function closeAddBannerModal() { isAddBannerModalOpen = false; renderPage(); }
function openEditBannerModal(bannerId) {
    const banner = availableBanners.find(b => b.banner_id === bannerId);
    if (banner) {
        editBannerModalState = { isOpen: true, banner };
        renderPage();
    }
}
function closeEditBannerModal() {
    editBannerModalState = { isOpen: false, banner: null };
    renderPage();
}

// Mở modal flashsale
const openFlashSaleModal = (productId) => {
    const product = availableBooks.find(b => b.id === productId);
    if (product) {
        flashSaleModalState = { isOpen: true, product };
        renderPage();
    }
};

// Đóng modal và render lại trang để checkbox trở về trạng thái cũ nếu người dùng hủy
const closeFlashSaleModal = () => {
    flashSaleModalState = { isOpen: false, product: null };
    renderPage(); // Render lại để xóa modal khỏi DOM
};

// -----------------------------------------------------------------
// 8.5. Hành động của Admin (Admin Actions)
// -----------------------------------------------------------------

// Voucher
async function handleAddVoucher(event) {
    event.preventDefault();

    // Lấy dữ liệu từ form
    const code = document.getElementById('voucher-code').value;
    const voucher_type = document.getElementById('voucher-type').value; // Sẽ là 'product' hoặc 'shipping'
    const discount_type = document.getElementById('voucher-discount-type').value; // Sẽ là 'fixed' hoặc 'percentage'
    const discount_value = Number(document.getElementById('voucher-value').value);
    const max_discount = Number(document.getElementById('voucher-max-discount').value) || null;
    const min_order_value = Number(document.getElementById('voucher-min-order').value);
    const remaining = Number(document.getElementById('voucher-remaining').value);
    const start_date_str = document.getElementById('voucher-start-date').value;
    const end_date_str = document.getElementById('voucher-end-date').value;
    const description = document.getElementById('voucher-description').value;

    // SỬA LỖI: Tạo payload chính xác để gửi lên server
    const payload = {
        code: code,
        voucher_type: voucher_type, // Đã đúng ('product' hoặc 'shipping')
        type: discount_type,        // SỬA LỖI 1: Gửi 'fixed' hoặc 'percentage'
        discount: discount_value,
        max_discount: discount_type === 'percentage' ? max_discount : null, // Chỉ gửi max_discount nếu là loại %
        min_order_value: min_order_value,
        remaining: remaining,
        start_date: convertDate(start_date_str), // SỬA LỖI 4: Chuyển đổi định dạng ngày
        end_date: convertDate(end_date_str),     // SỬA LỖI 4: Chuyển đổi định dạng ngày
        description: description,
    };
    // Lưu ý: Trường `isPercentage` đã được loại bỏ (SỬA LỖI 3)

    try {
        const res = await fetch('http://localhost:3000/admin/vouchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData.message || 'Thêm voucher thất bại');
        }
        showMessage('Thêm voucher thành công!');
        closeAddVoucherModal();
        await loadVouchers();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

async function handleEditVoucher(event, voucherId) {
    event.preventDefault();

    // Lấy dữ liệu từ form chỉnh sửa
    const code = document.getElementById('edit-voucher-code').value;
    const voucher_type = document.getElementById('edit-voucher-type').value;
    const discount_type = document.getElementById('edit-voucher-discount-type').value;
    const discount_value = Number(document.getElementById('edit-voucher-value').value);
    const max_discount = Number(document.getElementById('edit-voucher-max-discount').value) || null;
    const min_order_value = Number(document.getElementById('edit-voucher-min-order').value);
    const remaining = Number(document.getElementById('edit-voucher-remaining').value);
    const start_date_str = document.getElementById('edit-voucher-start-date').value;
    const end_date_str = document.getElementById('edit-voucher-end-date').value;
    const description = document.getElementById('edit-voucher-description').value;

    // Xây dựng payload chính xác
    const payload = {
        code: code,
        voucher_type: voucher_type,
        type: discount_type,
        discount: discount_value,
        max_discount: discount_type === 'percentage' ? max_discount : null,
        min_order_value: min_order_value,
        remaining: remaining,
        start_date: convertDate(start_date_str),
        end_date: convertDate(end_date_str),
        description: description,
    };

    try {
        const res = await fetch(`http://localhost:3000/admin/vouchers/${voucherId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Cập nhật voucher thất bại');
        }
        showMessage('Cập nhật voucher thành công!');
        closeEditVoucherModal();
        await loadVouchers();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

async function handleDeleteVoucher(voucherId) {
    if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;
    try {
        const res = await fetch(`http://localhost:3000/admin/vouchers/${voucherId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Xóa voucher thất bại');
        showMessage('Đã xóa voucher!');
        await loadVouchers();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

// quản lý banner
async function handleAddBanner(event) {
    event.preventDefault();
    const image_url = document.getElementById('banner-image-url').value;
    const link = document.getElementById('banner-link').value;
    const order = parseInt(document.getElementById('banner-order').value, 10) || 0;
    const is_active = document.getElementById('banner-active').checked;

    try {
        const res = await fetch('http://localhost:3000/admin/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url, link, order, is_active })
        });
        if (!res.ok) throw new Error('Thêm banner thất bại');
        showMessage('Thêm banner thành công!');
        closeAddBannerModal();
        await loadBanners();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

async function handleEditBanner(event, bannerId) {
    event.preventDefault();
    const image_url = document.getElementById('edit-banner-image-url').value;
    const link = document.getElementById('edit-banner-link').value;
    const order = parseInt(document.getElementById('edit-banner-order').value, 10) || 0;
    const is_active = document.getElementById('edit-banner-active').checked;

    try {
        const res = await fetch(`http://localhost:3000/admin/banners/${bannerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url, link, order, is_active })
        });
        if (!res.ok) throw new Error('Cập nhật banner thất bại');
        showMessage('Cập nhật banner thành công!');
        closeEditBannerModal();
        await loadBanners();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

async function handleDeleteBanner(bannerId) {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return;
    try {
        const res = await fetch(`http://localhost:3000/admin/banners/${bannerId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Xóa banner thất bại');
        showMessage('Đã xóa banner!');
        await loadBanners();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

async function handleToggleBannerActive(bannerId, isActive) {
    const banner = availableBanners.find(b => b.banner_id === bannerId);
    if (!banner) return;
    try {
        const res = await fetch(`http://localhost:3000/admin/banners/${bannerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...banner, is_active: isActive })
        });
        if (!res.ok) throw new Error('Cập nhật trạng thái banner thất bại');
        await loadBanners();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

// quản lý flash sale
// Xử lý khi bấm nút "Lưu" trong modal
const handleSaveFlashSale = async (event, productId) => {
    event.preventDefault();
    const discount = document.getElementById('sale-discount').value;
    const saleEnd = document.getElementById('sale-end-date').value;

    if (!discount || !saleEnd) {
        showMessage("Vui lòng nhập đầy đủ thông tin.");
        return;
    }

    const saleEndFormatted = convertDate(saleEnd);

    try {
        const res = await fetch(`http://localhost:3000/admin/products/${productId}/sale`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_sale: true, discount: Number(discount), sale_end: saleEndFormatted })
        });
        if (!res.ok) throw new Error('Cập nhật Flash Sale thất bại');
        
        showMessage('Đã bật Flash Sale cho sản phẩm!');
        await loadProducts();
        closeFlashSaleModal(); // <- Sẽ gọi renderPage để đóng modal
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};

// hàm tắt sale
const handleStopSale = async (productId) => {
    if (!confirm('Bạn có chắc muốn dừng Flash Sale cho sản phẩm này?')) {
        renderPage(); // Render lại để tick lại checkbox nếu người dùng hủy
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/admin/products/${productId}/sale`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_sale: false, discount: 0, sale_end: null })
        });
        if (!res.ok) throw new Error('Dừng Flash Sale thất bại');
        
        showMessage('Đã dừng Flash Sale cho sản phẩm!');
        await loadProducts();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};

// Xử lý trả lời bình luận
async function handleAdminReplyComment(event, reviewId) {
    event.preventDefault();
    const reply = event.target.admin_reply.value;
    try {
        const res = await fetch(`http://localhost:3000/admin/comments/${reviewId}/reply`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_reply: reply })
        });
        if (!res.ok) throw new Error('Lỗi khi gửi trả lời');
        showMessage('Đã trả lời bình luận!');
        await loadAdminComments();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
}

// =================================================================
// IX. Hàm tiện ích (UTILITY FUNCTIONS)
// =================================================================

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

// Chuyển đổi định dạng ngày từ dd/mm/yyyy sang yyyy-mm-dd
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

//helper function chuyển đổi ngày
function convertDate(inputDate) {
    // Chuyển từ dd/mm/yyyy sang yyyy-mm-dd
    const parts = inputDate.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return inputDate;
}