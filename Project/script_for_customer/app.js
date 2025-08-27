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

// QUAN TRỌNG: chỉ khai báo auth MỘT LẦN
let auth = { user: null };

// =========================
// Data
// =========================
const availableBooks = [
  { id: 1, title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', category: 'Phát triển bản thân', price: 99000, description: 'Một cuốn sách kinh điển về cách đối nhân xử thế.', rating: 4.2, reviews: 58, image: 'https://noithatbn.vn/image/cache/catalog/dac-nhan-tam/1123-1493801476304-1400x875.jpg', fullDescription: 'Đắc nhân tâm là một trong những cuốn sách bán chạy nhất mọi thời đại, giúp bạn hiểu và áp dụng các nguyên tắc để gây thiện cảm và xây dựng các mối quan hệ thành công.' },
  { id: 2, title: 'Nhà Giả Kim', author: 'Paulo Coelho', category: 'Tiểu thuyết', price: 85000, description: 'Hành trình của chàng chăn cừu đi tìm kho báu.', rating: 4.5, reviews: 73, image: 'https://diendaniso.com/wp-content/uploads/2023/11/Review-s%C3%A1ch-Nh%C3%A0-gi%E1%BA%A3-kim-Paulo-Coelho.jpg', fullDescription: 'Một câu chuyện ẩn dụ về hành trình tìm kiếm vận mệnh của mình. Cuốn sách nhấn mạnh tầm quan trọng của việc theo đuổi ước mơ và lắng nghe trái tim.' },
  { id: 3, title: '1984', author: 'George Orwell', category: 'Sách nước ngoài', price: 120000, description: 'Tiểu thuyết phản địa đàng nổi tiếng về xã hội toàn trị.', rating: 4.7, reviews: 92, image: 'https://static.oreka.vn/800-800_a711de6a-c6fe-4570-a5c4-9517e9681b33', fullDescription: '1984 khắc họa một xã hội bị kiểm soát toàn diện, nơi sự thật bị bóp méo và tự do cá nhân bị xóa bỏ.' },
  { id: 4, title: 'Những Người Khốn Khổ', author: 'Victor Hugo', category: 'Văn học', price: 150000, description: 'Kiệt tác văn học Pháp về công lý và sự cứu rỗi.', rating: 4.9, reviews: 88, image: 'https://sachchon.com/uploads/2021/07/19/nhung-nguoi-khon-kho.jpg', fullDescription: 'Tác phẩm theo chân Jean Valjean trong hành trình tìm kiếm sự cứu chuộc giữa xã hội đầy bất công.' },
  { id: 5, title: 'Sapiens: Lược Sử Loài Người', author: 'Yuval Noah Harari', category: 'Lịch sử', price: 180000, description: 'Khám phá quá trình phát triển của loài người.', rating: 4.3, reviews: 65, image: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/435/244/products/sg11134201221202ucumy8655kvff-e77f3ab8-38e3-4fd5-8470-0f8d19a9ba9b.jpg?v=1672971355547', fullDescription: 'Harari đưa người đọc qua hành trình lịch sử loài người từ Homo sapiens đến thế giới hiện đại.' },
  { id: 6, title: '7 Thói Quen Hiệu Quả', author: 'Stephen R. Covey', category: 'Phát triển bản thân', price: 110000, description: 'Cuốn sách kỹ năng sống kinh điển giúp nâng cao hiệu quả cá nhân.', rating: 3.9, reviews: 42, image: 'https://pos.nvncdn.com/fd5775-40602/ps/20240329_LRErpdCwzC.jpeg', fullDescription: 'Stephen Covey trình bày 7 thói quen nền tảng giúp thay đổi cách suy nghĩ và hành động để đạt thành công.' },
  { id: 7, title: 'Dune', author: 'Frank Herbert', category: 'Tiểu thuyết', price: 210000, description: 'Tiểu thuyết khoa học viễn tưởng nổi tiếng nhất mọi thời đại.', rating: 4.4, reviews: 77, image: 'http://bizweb.dktcdn.net/thumb/1024x1024/100/363/455/products/xucatbiamembia.jpg?v=1705552591840', fullDescription: 'Lấy bối cảnh hành tinh sa mạc Arrakis, nơi duy nhất sản xuất gia vị quý giá nhất vũ trụ.' },
  { id: 8, title: 'Harry Potter và Hòn Đá Phù Thủy', author: 'J.K. Rowling', category: 'Tiểu thuyết', price: 135000, description: 'Cuốn đầu tiên trong series Harry Potter.', rating: 5.0, reviews: 95, image: 'https://www.nxbtre.com.vn/Images/Book/nxbtre_full_21042022_030444.jpg', fullDescription: 'Cuốn mở đầu cho hành trình của Harry Potter tại Trường Phù thủy Hogwarts.' },
  { id: 9, title: 'Giết Con Chim Nhại (To Kill a Mockingbird)', author: 'Harper Lee', category: 'Sách nước ngoài', price: 105000, description: 'Tác phẩm kinh điển về công lý và sự ngây thơ bị đánh mất.', rating: 4.6, reviews: 54, image: 'https://sachxanhxanh.com/wp-content/uploads/2023/03/giet-con-chim-nhai-1-1024x768.png', fullDescription: 'Lấy bối cảnh miền Nam nước Mỹ thập niên 1930, phản ánh phân biệt chủng tộc và sự trưởng thành.' },
  { id: 10, title: 'Clean Code', author: 'Robert C. Martin', category: 'Học thuật', price: 250000, description: 'Cuốn sách kinh điển về nghệ thuật viết mã sạch.', rating: 4.8, reviews: 83, image: 'https://cdn1.fahasa.com/media/catalog/product/8/9/8936107813361.jpg', fullDescription: 'Robert C. Martin đưa ra các nguyên tắc và thực tiễn tốt nhất để viết mã dễ đọc, dễ bảo trì.' },
  { id: 11, title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', category: 'Học thuật', price: 230000, description: 'Một trong những cuốn sách quan trọng nhất về lập trình.', rating: 4.5, reviews: 72, image: 'https://upload.wikimedia.org/wikipedia/en/8/8f/The_pragmatic_programmer.jpg', fullDescription: 'Hướng dẫn các kỹ năng và tư duy để trở thành lập trình viên giỏi hơn.' },
  { id: 12, title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen et al.', category: 'Học thuật', price: 450000, description: 'Cuốn giáo trình thuật toán nổi tiếng nhất thế giới.', rating: 4.7, reviews: 91, image: 'https://img.pchome.com.tw/cs/items/DJBQ3HD900FKLF1/000001_1663935457.jpg', fullDescription: 'Cung cấp phân tích chi tiết và ví dụ về các thuật toán, từ sắp xếp đến đồ thị.' },
  { id: 13, title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell & Peter Norvig', category: 'Học thuật', price: 480000, description: 'Giáo trình toàn diện nhất về AI.', rating: 4.4, reviews: 69, image: 'https://m.media-amazon.com/images/I/61-6TTTBZeL.jpg', fullDescription: 'Bao quát các khái niệm cốt lõi của AI: tìm kiếm, suy luận, học máy, NLP, thị giác máy tính.' },
  { id: 14, title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', category: 'Học thuật', price: 500000, description: 'Sách nền tảng về Deep Learning.', rating: 4.3, reviews: 66, image: 'https://img.drz.lazcdn.com/static/mm/p/9e4ace86579ba80bec0cd49558b5e12a.jpg_720x720q80.jpg', fullDescription: 'Giới thiệu lý thuyết, toán học và ứng dụng của học sâu.' },
  { id: 15, title: 'Design Patterns', author: 'Erich Gamma et al.', category: 'Học thuật', price: 280000, description: 'Cuốn sách huyền thoại về các mẫu thiết kế phần mềm.', rating: 3.9, reviews: 47, image: 'https://prodimage.images-bn.com/pimages/9780201633610_p1_v4_s600x595.jpg', fullDescription: 'Hệ thống hóa các mẫu thiết kế hướng đối tượng, giúp viết mã linh hoạt và dễ mở rộng.' },
  { id: 16, title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', category: 'Học thuật', price: 210000, description: 'Những bài học kinh điển về quản lý dự án phần mềm.', rating: 3.8, reviews: 33, image: 'https://www.tigosolutions.com/Uploads/the-mythical-man-month11032024032721.jpg', fullDescription: 'Brooks chia sẻ kinh nghiệm từ dự án IBM System/360, bao gồm định luật nổi tiếng về quản lý phần mềm.' }
];

const uniqueCategories = [...new Set(availableBooks.map(book => book.category))];

//test voucher, sau này sẽ lấy dữ liệu trong backend
const vouchers = [
    { code: 'SHIPFREE25', type: 'shipping', value: 25000, remaining: 50, minPrice: 0, expiration: '2025-12-31', description: 'Giảm 25K phí vận chuyển' },
    { code: 'SHIPFREE10', type: 'shipping', value: 10000, remaining: 20, minPrice: 100000, expiration: '2025-12-31', description: 'Giảm 10K phí vận chuyển' },
    { code: 'FREESHIPXMAS', type: 'shipping', value: 15000, remaining: 10, minPrice: 50000, expiration: '2025-12-25', description: 'Giảm 15K phí vận chuyển' },
    { code: 'SHIP50K', type: 'shipping', value: 50000, remaining: 5, minPrice: 300000, expiration: '2025-11-01', description: 'Miễn phí vận chuyển lên đến 50K' },
    { code: 'GIAM10K', type: 'discount', value: 10000, remaining: 100, minPrice: 150000, expiration: '2025-11-30', description: 'Giảm 10K cho đơn hàng từ 150K' },
    { code: 'SALE20', type: 'discount', value: 20, isPercentage: true, maxDiscount: 50000, remaining: 30, minPrice: 300000, expiration: '2025-10-31', description: 'Giảm 20% tối đa 50K cho đơn hàng từ 300K' },
    { code: 'GIAM50K', type: 'discount', value: 50000, remaining: 15, minPrice: 500000, expiration: '2025-09-30', description: 'Giảm 50K cho đơn hàng từ 500K' },
    { code: 'SALE15', type: 'discount', value: 15, isPercentage: true, maxDiscount: 30000, remaining: 25, minPrice: 200000, expiration: '2025-12-15', description: 'Giảm 15% tối đa 30K' },
    { code: 'BOOKSALE', type: 'discount', value: 30000, remaining: 40, minPrice: 250000, expiration: '2026-01-31', description: 'Giảm 30K cho sách' },
    { code: 'SPECIAL10', type: 'discount', value: 10000, remaining: 60, minPrice: 100000, expiration: '2025-11-15', description: 'Giảm 10K cho mọi đơn hàng' }
];

// =========================
// Điều hướng
// =========================
const handleNavigate = (path, data) => {
  currentPath = path;

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


  return books.map(book => `
    <div class="product-card">
      <div class="product-image-wrapper">
        <img src="${book.image}" alt="${book.title}">
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
          <button onclick="handleAddToCart(${book.id})" class="flex-1 bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600">+ Giỏ</button>
        </div>
      </div>
    </div>
  `).join('');
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
          <span class="font-semibold text-red-500">Còn hàng</span>
        </div>

        <div class="flex items-center mb-8">
          <span class="mr-4">Số lượng:</span>
          <div class="flex items-center border rounded-lg">
            <button onclick="decreaseQuantity()" class="px-3">-</button>
            <input type="number" id="book-quantity" value="${quantity}" min="1"
                   oninput="updateQuantity(this.value)"
                   class="w-12 text-center border-none focus:outline-none">
            <button onclick="increaseQuantity()" class="px-3">+</button>
          </div>
        </div>

        <div class="flex space-x-4 mb-8">
          <button onclick="handleAddToCart(${selectedBook.id})"
                  class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">
            + Thêm vào giỏ
          </button>
          <button onclick="handleBuyNow(${selectedBook.id})"
                  class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">
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

function handleBuyNow(bookId) {
  const quantityInput = document.getElementById('book-quantity');
  const bookQuantity = quantityInput ? parseInt(quantityInput.value, 10) : quantity;
  const book = availableBooks.find(b => b.id === bookId);

  if (!book) return;

  // Nếu sản phẩm đã có trong giỏ thì cập nhật số lượng, nếu chưa thì thêm mới
  const itemInCart = cartItems.find(item => item.book.id === bookId);
  if (itemInCart) {
    itemInCart.quantity = bookQuantity;
  } else {
    cartItems.push({ book, quantity: bookQuantity });
  }

  // Tự động chỉ chọn sản phẩm vừa mua để thanh toán, các sản phẩm khác vẫn giữ nguyên trong giỏ
  selectedCartIds = [bookId];

  // Chuyển đến trang giỏ hàng/thanh toán
  handleNavigate('/cart');
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

// xử lí add vào giỏ hàng
const handleAddToCart = (bookId) => {
  // Bước 1: Kiểm tra ngay xem sản phẩm đã có trong giỏ hàng chưa
  const itemInCart = cartItems.find(item => item.book.id === bookId);

  // Nếu đã tồn tại, hiển thị thông báo và kết thúc hàm
  if (itemInCart) {
    showMessage('Sản phẩm này đã có trong giỏ hàng!');
    return; // Dừng hàm tại đây
  }

  // Bước 2: Nếu không tồn tại, tiếp tục logic thêm mới như cũ
  const bookToAdd = availableBooks.find(book => book.id === bookId);
  const quantityInput = document.getElementById('book-quantity');
  const bookQuantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

  cartItems.push({ book: bookToAdd, quantity: bookQuantity });

  showMessage('Sản phẩm đã được thêm vào giỏ hàng!');
  renderPage();
};

// =========================
let debounceTimeout = null;

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
const generateCaptcha = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  captchaCode = result;
  return captchaCode;
};

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
            content = `<p class="text-gray-500 text-center mb-6">Nhập Email để xác thực để khôi phục tài khoản.</p>`;
            link = `<div class="links mt-4 text-center text-sm">
                        <a href="#" onclick="handleNavigate('/login')" class="text-orange-600 hover:underline">Quay lại đăng nhập</a>
                    </div>`;
            formContent = `
                <div>
                    <label for="forgot-email" class="block text-sm font-medium text-foreground">
                        Email
                    </label>
                    <input type="email" id="forgot-email" required class="auth-form-container input">
                </div>
                <div id="captcha-container" class="hidden mt-4">
                    <p class="text-sm mb-2 text-gray-700">Xác nhận bạn không phải robot:</p>
                    <div class="flex items-center space-x-2">
                        <span id="captcha-code" class="px-3 py-2 bg-gray-100 rounded-lg font-mono font-bold"></span>
                        <input type="text" id="captcha-input" placeholder="Nhập mã..." required 
                            class="flex-1 px-3 py-2 border rounded-lg outline-none focus:border-orange-500">
                    </div>
                </div>
                <button type="submit" id="forgot-button"
                    class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
                    Gửi yêu cầu
                </button>
            `;
            break;
    }

    return `
    <div class="auth-container min-h-screen flex items-center justify-center bg-cover bg-center" 
         style="background-image: url('https://freight.cargo.site/t/original/i/9e5708691e64a1e33d917b7303eb44b6187904ee192962ed2e8ee0ff73b9c996/daikanyama_2016_001.jpg');">
        <div class="auth-card flex flex-col md:flex-row bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-4xl relative">
            
            <!-- Nút quay lại -->
            <a href="javascript:void(0)" 
              onclick="handleNavigate('/')" 
              class="absolute top-4 left-4 z-50 text-muted-foreground hover:text-foreground flex items-center cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              <span>Quay lại cửa hàng</span>
            </a>

            <!-- Form -->
            <div class="auth-form-container md:w-full p-8 bg-white/90 backdrop-blur-sm relative"
                style="background-image: url('./image/auth.jpg'); background-size: cover; background-position: center;">
                <div class="absolute inset-0 bg-white/80 backdrop-blur-sm"></div> <!-- Lớp phủ làm mờ ảnh -->
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

//trang hiển thị hồ sơ
const createProfilePage = () => {
  if (!auth.user) {
    showMessage("Vui lòng đăng nhập để xem hồ sơ.");
    handleNavigate("/login");
    return "";
  }

  return `
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Hồ sơ của tôi</h1>
    <form onsubmit="handleSaveProfile(event)" class="space-y-4">
      <div>
        <label class="block mb-1 font-medium">Tên đầy đủ</label>
        <input type="text" id="profile-name" value="${auth.user.name || ''}" required 
          class="w-full px-4 py-2 border rounded-lg"/>
      </div>
      <div>
        <label class="block mb-1 font-medium">Địa chỉ</label>
        <input type="text" id="profile-address" value="${auth.user.address || ''}" required 
          class="w-full px-4 py-2 border rounded-lg"/>
      </div>
      <div>
        <label class="block mb-1 font-medium">Số điện thoại</label>
        <input type="tel" id="profile-phone" value="${auth.user.phone || ''}" required 
          class="w-full px-4 py-2 border rounded-lg"/>
      </div>
      <button type="submit" class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Lưu</button>
    </form>
  </div>`;
};

function handleSaveProfile(e) {
  e.preventDefault();
  auth.user.name = document.getElementById("profile-name").value;
  auth.user.address = document.getElementById("profile-address").value;
  auth.user.phone = document.getElementById("profile-phone").value;

  localStorage.setItem("auth", JSON.stringify(auth.user));
  showMessage("Cập nhật hồ sơ thành công!");
  handleNavigate("/");
}

// =========================
// Trang theo dõi đơn hàng
// =========================
const createOrderTrackingPage = () => {
  // === FIX: Kiểm tra trạng thái đăng nhập trước khi hiển thị ===
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

  let orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Trường hợp chưa có đơn hàng nào
  if (orders.length === 0) {
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

  // Lấy đơn hàng mới nhất
  const order = orders[orders.length - 1];
  
  // === FIX: Sử dụng ngày giao hàng đã lưu trong đơn hàng ===
  const estimatedDelivery = order.estimatedDelivery || 'Đang cập nhật...';

  return `
    <div class="relative min-h-screen bg-gray-100 py-10 px-6 flex justify-center items-center">
      <div class="absolute inset-0 bg-cover bg-center" 
           style="background-image: url('https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1887&auto=format&fit=crop'); opacity: 0.1;">
      </div>

      <div class="relative max-w-3xl w-full bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">Theo dõi đơn hàng</h1>
        
        <div class="mb-6 border-b pb-4">
          <p class="text-gray-600 text-lg">Mã đơn hàng: <span class="font-semibold text-gray-900">#${order.id}</span></p>
          <p class="text-gray-600 text-lg">Ngày đặt: <span class="font-semibold text-gray-900">${order.date}</span></p>
        </div>

        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8 text-center">
          <h2 class="text-lg font-semibold text-blue-800 mb-1">Ngày giao hàng dự kiến</h2>
          <p class="text-2xl font-bold text-blue-900">${estimatedDelivery}</p>
        </div>

        <h3 class="text-xl font-semibold text-gray-700 mb-4">Lịch trình đơn hàng</h3>
        <ol class="relative border-l-2 border-orange-300">
          <li class="mb-10 ml-10"> <span class="absolute flex items-center justify-center w-6 h-6 bg-green-200 rounded-full -left-3 ring-8 ring-white">
              <svg class="w-3 h-3 text-green-700" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            </span>
            <h3 class="text-lg font-semibold text-gray-900">Đơn hàng đã được đặt</h3>
            <time class="block mb-2 text-sm font-normal leading-none text-gray-500">${order.date}</time>
            <p class="text-base font-normal text-gray-600">Chúng tôi đã nhận được đơn hàng của bạn.</p>
          </li>
          <li class="mb-10 ml-10"> <span class="absolute flex items-center justify-center w-6 h-6 ${order.status === 'processing' || order.status === 'shipped' ? 'bg-green-200' : 'bg-gray-200'} rounded-full -left-3 ring-8 ring-white">
              <svg class="w-3 h-3 ${order.status === 'processing' || order.status === 'shipped' ? 'text-green-700' : 'text-gray-700'}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
            </span>
            <h3 class="text-lg font-semibold text-gray-900">Đơn hàng đang được chuẩn bị</h3>
            <p class="text-base font-normal text-gray-600">Sản phẩm đang được đóng gói và sớm bàn giao cho đơn vị vận chuyển.</p>
          </li>
          <li class="ml-10"> <span class="absolute flex items-center justify-center w-6 h-6 ${order.status === 'shipped' ? 'bg-green-200' : 'bg-gray-200'} rounded-full -left-3 ring-8 ring-white">
               <svg class="w-3 h-3 ${order.status === 'shipped' ? 'text-green-700' : 'text-gray-700'}" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v5a1 1 0 001 1h2.05a2.5 2.5 0 014.9 0H21a1 1 0 001-1V8a1 1 0 00-1-1h-7z"></path></svg>
            </span>
            <h3 class="text-lg font-semibold text-gray-900">Đơn hàng đang vận chuyển</h3>
            <p class="text-base font-normal text-gray-600">Đơn hàng sẽ được giao đến bạn trong thời gian sớm nhất.</p>
          </li>
        </ol>

        <div class="mt-10 text-center">
          <button onclick="handleNavigate('/')" class="py-3 px-8 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-md text-lg">
            Tiếp tục mua hàng
          </button>
        </div>
      </div>
    </div>
  `;
};


// =========================
// Auth handlers
// =========================
const handleAuthSubmit = (e, mode) => {
    e.preventDefault();
    if (mode === 'login') {
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
        if (username && password) {
            auth.user = { username };
            localStorage.setItem("auth", JSON.stringify(auth.user));
            handleNavigate("/");
            showMessage('Đăng nhập thành công!');
        } else {
            showMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
        }
    } else if (mode === 'register') {
        const username = document.getElementById("register-username").value;
        const password = document.getElementById("register-password").value;
        if (username && password) {
            auth.user = { username };
            localStorage.setItem("auth", JSON.stringify(auth.user));
            handleNavigate("/");
            showMessage('Đăng ký thành công!');
        } else {
            showMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
        }
    } else if (mode === 'forgot-password') {
        const forgotEmail = document.getElementById("forgot-email").value;
        const captchaInput = document.getElementById("captcha-input");

        if (!forgotEmail) {
            showMessage("Vui lòng nhập email.");
            return;
        }

        if (!captchaInput) {
            document.getElementById("captcha-container").style.display = 'block';
            document.getElementById("forgot-button").textContent = 'Xác nhận';
            document.getElementById("forgot-button").classList.remove('login');
            document.getElementById("forgot-button").classList.add('register');
            generateCaptcha();
            showMessage(`Mã xác nhận: ${captchaCode}`);
        } else {
            if (captchaInput.value.toLowerCase() === captchaCode.toLowerCase()) {
                showMessage(`Liên kết đặt lại mật khẩu đã được gửi tới ${forgotEmail}.`);
                handleNavigate('/');
            } else {
                showMessage('Mã xác nhận không đúng. Vui lòng thử lại!');
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
    if (cartTotal < 100000) {
        shippingFee = 25000;
    } else if (cartTotal < 200000) {
        shippingFee = 10000;
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
    
    const discountVouchers = vouchers.filter(v => v.type === 'discount');
    const shippingVouchers = vouchers.filter(v => v.type === 'shipping');

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
              
              <div class="flex justify-between mb-2">
                <span>Giảm giá</span>
                <span class="font-semibold text-red-500">- ${finalDiscount.toLocaleString('vi-VN')}₫</span>
              </div>
              
              <div class="flex justify-between mb-4 border-b border-gray-200 pb-4">
                <span>Phí vận chuyển</span>
                <span class="font-semibold">${finalShippingFee.toLocaleString('vi-VN')}₫</span>
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
                                <p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${voucher.minPrice.toLocaleString('vi-VN')}₫</p>
                                <p class="text-sm text-gray-700">Giảm **${voucher.value.toLocaleString('vi-VN')}₫** phí vận chuyển</p>
                                <p class="text-xs text-red-500">HSD: ${voucher.expiration} | Còn lại: ${voucher.remaining} mã</p>
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
                            voucherDetail = `Giảm ${voucher.value}% tối đa ${voucher.maxDiscount.toLocaleString('vi-VN')}₫`;
                        } else {
                            voucherDetail = `Giảm ${voucher.value.toLocaleString('vi-VN')}₫`;
                        }
                        
                        return `
                        <div class="p-4 border border-dashed rounded-lg flex items-center justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}">
                            <div>
                                <h4 class="font-semibold text-lg">${voucher.code}</h4>
                                <p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${voucher.minPrice.toLocaleString('vi-VN')}₫</p>
                                <p class="text-sm text-gray-700">${voucherDetail}</p>
                                <p class="text-xs text-red-500">HSD: ${voucher.expiration} | Còn lại: ${voucher.remaining} mã</p>
                            </div>
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

function handleToggleCartItem(bookId) {
  if (selectedCartIds.includes(bookId)) {
    selectedCartIds = selectedCartIds.filter(id => id !== bookId);
  } else {
    selectedCartIds.push(bookId);
  }
  renderPage();
}

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
    const voucherToApply = vouchers.find(v => v.code === code);
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

function handleRemoveCartItem(bookId) {
  cartItems = cartItems.filter(item => item.book.id !== bookId);
  renderPage();
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
  let shippingFee = cartTotal < 100000 ? 25000 : (cartTotal < 200000 ? 10000 : 0);
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


function handlePlaceOrder(event) {
  event.preventDefault();

  // Giảm số lượng của voucher giảm giá nếu có
  if (selectedDiscountVoucher) {
    const usedVoucher = vouchers.find(v => v.code === selectedDiscountVoucher.code);
    if (usedVoucher && usedVoucher.remaining > 0) {
      usedVoucher.remaining--;
    }
  }

  // Giảm số lượng của voucher vận chuyển nếu có
  if (selectedShippingVoucher) {
    const usedVoucher = vouchers.find(v => v.code === selectedShippingVoucher.code);
    if (usedVoucher && usedVoucher.remaining > 0) {
      usedVoucher.remaining--;
    }
  }
  
  // === FIX: Tính và lưu ngày giao hàng dự kiến MỘT LẦN ===
  const calculateDeliveryDate = () => {
    const deliveryDate = new Date();
    const randomDays = Math.floor(Math.random() * 4) + 2; // Số ngẫu nhiên từ 2 đến 5
    deliveryDate.setDate(deliveryDate.getDate() + randomDays);
    return deliveryDate.toLocaleDateString("vi-VN");
  };

  // Tạo object đơn hàng
  const newOrder = {
    id: Date.now(),
    date: new Date().toLocaleDateString("vi-VN"),
    status: "processing",
    items: [...cartItems.filter(item => selectedCartIds.includes(item.book.id))],
    estimatedDelivery: calculateDeliveryDate() // <-- Lưu ngày giao hàng vào đơn hàng
  };

  // Lưu vào localStorage
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));

  // Clear giỏ hàng và các mục đã chọn
  cartItems = cartItems.filter(item => !selectedCartIds.includes(item.book.id));
  selectedCartIds = [];

  // Reset các voucher đã chọn về trạng thái ban đầu
  selectedDiscountVoucher = null;
  selectedShippingVoucher = null;

  // Chuyển sang trang theo dõi đơn hàng
  handleNavigate("/order-tracking");
  showMessage("Đặt hàng thành công!");
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

document.addEventListener('DOMContentLoaded', () => {
  // Đọc auth trước khi render lần đầu
  const saved = localStorage.getItem("auth");
  if (saved) {
    try {
      auth.user = JSON.parse(saved);
    } catch (_) {
      auth.user = null;
    }
  }

  // Render trang, chèn HTML của carousel vào DOM
  renderPage();
});

