// =========================
// Trạng thái toàn cục (thay thế useState của React)
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
  { id: 9, title: 'Giết Con Chim Nhại (To Kill a Mockingbird)', author: 'Harper Lee', category: 'Sách nước ngoài', price: 105000, description: 'Tác phẩm kinh điển về công lý và sự ngây thơ bị đánh mất.', rating: 4.6, reviews: 54, image: 'https://upload.wikimedia.org/wikipedia/en/7/79/To_Kill_a_Mockingbird.JPG', fullDescription: 'Lấy bối cảnh miền Nam nước Mỹ thập niên 1930, phản ánh phân biệt chủng tộc và sự trưởng thành.' },
  { id: 10, title: 'Clean Code', author: 'Robert C. Martin', category: 'Học thuật', price: 250000, description: 'Cuốn sách kinh điển về nghệ thuật viết mã sạch.', rating: 4.8, reviews: 83, image: 'https://upload.wikimedia.org/wikipedia/en/0/0e/Clean_Code.jpg', fullDescription: 'Robert C. Martin đưa ra các nguyên tắc và thực tiễn tốt nhất để viết mã dễ đọc, dễ bảo trì.' },
  { id: 11, title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', category: 'Học thuật', price: 230000, description: 'Một trong những cuốn sách quan trọng nhất về lập trình.', rating: 4.5, reviews: 72, image: 'https://upload.wikimedia.org/wikipedia/en/8/8f/The_pragmatic_programmer.jpg', fullDescription: 'Hướng dẫn các kỹ năng và tư duy để trở thành lập trình viên giỏi hơn.' },
  { id: 12, title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen et al.', category: 'Học thuật', price: 450000, description: 'Cuốn giáo trình thuật toán nổi tiếng nhất thế giới.', rating: 4.7, reviews: 91, image: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Introduction_to_Algorithms_3rd_ed.jpg', fullDescription: 'Cung cấp phân tích chi tiết và ví dụ về các thuật toán, từ sắp xếp đến đồ thị.' },
  { id: 13, title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell & Peter Norvig', category: 'Học thuật', price: 480000, description: 'Giáo trình toàn diện nhất về AI.', rating: 4.4, reviews: 69, image: 'https://upload.wikimedia.org/wikipedia/en/8/8a/Artificial_Intelligence_A_Modern_Approach_3rd_ed.jpg', fullDescription: 'Bao quát các khái niệm cốt lõi của AI: tìm kiếm, suy luận, học máy, NLP, thị giác máy tính.' },
  { id: 14, title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', category: 'Học thuật', price: 500000, description: 'Sách nền tảng về Deep Learning.', rating: 4.3, reviews: 66, image: 'https://upload.wikimedia.org/wikipedia/en/3/3e/Deep_Learning_book_cover.jpg', fullDescription: 'Giới thiệu lý thuyết, toán học và ứng dụng của học sâu.' },
  { id: 15, title: 'Design Patterns', author: 'Erich Gamma et al.', category: 'Học thuật', price: 280000, description: 'Cuốn sách huyền thoại về các mẫu thiết kế phần mềm.', rating: 3.9, reviews: 47, image: 'https://upload.wikimedia.org/wikipedia/en/3/39/Design_Patterns_cover.jpg', fullDescription: 'Hệ thống hóa các mẫu thiết kế hướng đối tượng, giúp viết mã linh hoạt và dễ mở rộng.' },
  { id: 16, title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', category: 'Học thuật', price: 210000, description: 'Những bài học kinh điển về quản lý dự án phần mềm.', rating: 3.8, reviews: 33, image: 'https://upload.wikimedia.org/wikipedia/en/0/05/The_Mythical_Man-Month_%28book%29.jpg', fullDescription: 'Brooks chia sẻ kinh nghiệm từ dự án IBM System/360, bao gồm định luật nổi tiếng về quản lý phần mềm.' }
];

const uniqueCategories = [...new Set(availableBooks.map(book => book.category))];

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
// Header
// =========================
const createHeader = () => {
  const user = auth.user;
  const isLoggedIn = !!user;
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return `
  <div class="bg-white text-card-foreground shadow-sm sticky top-0 z-50 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-4">
        <div class="flex items-center space-x-6">
          <a href="#" onclick="handleNavigate('/')" class="text-2xl font-bold text-foreground">Book Store</a>
        </div>

        <div class="flex items-center space-x-4">
          <button onclick="handleNavigate('/cart')" class="relative text-gray-500 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            ${cartItemCount > 0 ? `<span class="absolute -top-1 -right-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold">${cartItemCount}</span>` : ''}
          </button>

          ${isLoggedIn ? `
            <div class="relative" id="user-menu-container">
              <button id="user-menu-trigger" class="text-base font-medium text-gray-500 hover:text-gray-900">
                Chào, ${user.username}
              </button>
              <div id="user-menu" class="dropdown-menu absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white text-gray-900 ring-1 ring-gray-200">
                <div class="py-1">
                  <a href="#" onclick="handleNavigate('/profile')" class="block px-4 py-2 text-sm hover:bg-gray-100">Hồ sơ</a>
                  <a href="#" onclick="logout()" class="block px-4 py-2 text-sm hover:bg-gray-100">Đăng xuất</a>
                </div>
              </div>
            </div>
          ` : `
            <div class="flex space-x-2">
              <a href="#" onclick="handleNavigate('/login')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold">Đăng nhập</a>
              <a href="#" onclick="handleNavigate('/register')" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold hidden sm:inline-block">Đăng ký</a>
            </div>
          `}
        </div>
      </div>
    </div>
  </div>`;
};

// =========================
// Danh sách sách
// =========================
const createBookList = (books) => {
  if (books.length === 0) {
    return `<p class="text-center text-gray-500 col-span-full mt-8">Không tìm thấy sách nào phù hợp.</p>`;
  }

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += `<svg class="w-5 h-5 text-yellow-400 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/></svg>`;
    }

    if (halfStar) {
      const gradId = `half-grad-${Math.random().toString(36).substr(2, 9)}`;
      stars += `
      <svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <defs>
          <linearGradient id="${gradId}">
            <stop offset="50%" stop-color="rgb(250 204 21)" />
            <stop offset="50%" stop-color="rgb(229 231 235)" />
          </linearGradient>
        </defs>
        <path fill="url(#${gradId})" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
    }

    for (let i = 0; i < emptyStars; i++) {
      stars += `<svg class="w-5 h-5 text-gray-300 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/></svg>`;
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
        <p class="text-sm font-bold text-blue-600 mb-2">${book.price.toLocaleString('vi-VN')}₫</p>
        <div class="product-actions flex space-x-2 mt-auto">
          <button onclick="handleNavigate('/book', { id: ${book.id} })" class="flex-1 bg-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-300">Chi tiết</button>
          <button onclick="handleAddToCart(${book.id})" class="flex-1 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600">+ Giỏ</button>
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

  if (searchTerm) {
    const termLower = searchTerm.toLowerCase();
    booksToDisplay = booksToDisplay.filter(book =>
      book.title.toLowerCase().includes(termLower) ||
      book.author.toLowerCase().includes(termLower)
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

  return `
  <div id="page-home" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
    <aside class="md:w-1/4 bg-white rounded-lg p-6 shadow-md h-fit hidden md:block">
      <h2 class="text-xl font-bold mb-4">Danh mục</h2>
      <ul class="space-y-2">
        <li>
          <button onclick="handleNavigate('/')" class="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 font-semibold ${!selectedCategory ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-900'}">
            Tất cả
          </button>
        </li>
        ${uniqueCategories.map(category => `
          <li>
            <button onclick="handleNavigate('/', { category: '${category}' })" class="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 ${selectedCategory === category ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-900'}">
              ${category}
            </button>
          </li>
        `).join('')}
      </ul>
    </aside>

    <section class="md:w-3/4">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div class="flex-grow w-full">
          <input type="text" id="search-input" oninput="handleSearch(this.value)" onkeydown="if(event.key === 'Enter') handleSearch(this.value, true)" placeholder="Tìm kiếm sách..." value="${searchTerm}" class="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="flex-shrink-0 w-full sm:w-auto">
          <select onchange="handleSort(this.value)" class="block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
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

      <h1 class="text-3xl font-bold mb-6 text-gray-900">${selectedCategory || 'Tất cả sách'}</h1>
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${createBookList(booksToDisplay)}
      </div>
    </section>
  </div>`;
};

// =========================
/** Trang chi tiết sách */
// =========================
const createBookDetailPage = () => {
  if (!selectedBook) {
    return `<p class="text-gray-900">
      Không tìm thấy sách. 
      <button onclick="handleNavigate('/')" class="text-blue-500 hover:underline">Về trang chủ</button>
    </p>`;
  }

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += `<svg class="w-5 h-5 text-yellow-400 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/></svg>`;
    }

    if (halfStar) {
      const gradId = `half-grad-${Math.random().toString(36).substr(2, 9)}`;
      stars += `
      <svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <defs>
          <linearGradient id="${gradId}">
            <stop offset="50%" stop-color="rgb(250 204 21)" />
            <stop offset="50%" stop-color="rgb(229 231 235)" />
          </linearGradient>
        </defs>
        <path fill="url(#${gradId})" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
      </svg>`;
    }

    for (let i = 0; i < emptyStars; i++) {
      stars += `<svg class="w-5 h-5 text-gray-300 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/></svg>`;
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
            <p class="text-xl font-bold text-red-500">${selectedBook.price.toLocaleString('vi-VN')}₫</p>
            <span class="text-sm text-gray-500 ml-2">(Giá mỗi cuốn)</span>
          </div>
          <div class="mt-2">
            <span class="font-semibold">Tổng: </span>
            <span id="total-price" class="text-lg text-blue-500 font-bold">${totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        <div class="mb-6">
          <span class="font-medium">Tình trạng: </span>
          <span class="font-semibold text-blue-500">Còn hàng</span>
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
                  class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600">
            + Thêm vào giỏ
          </button>
          <button onclick="handleNavigate('/cart')"
                  class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">
            Mua ngay
          </button>
        </div>
      </div>
    </div>

    <div class="mt-12">
      <div class="flex border-b">
        <button onclick="setBookDetailTab('description')"
          class="py-2 px-4 border-b-2 ${bookDetailTab === 'description' ? 'border-blue-500 text-blue-500 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'}">
          Mô tả
        </button>
        <button onclick="setBookDetailTab('reviews')"
          class="py-2 px-4 border-b-2 ${bookDetailTab === 'reviews' ? 'border-blue-500 text-blue-500 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'}">
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
  const existingMessage = document.querySelector('.toast-message');
  if (existingMessage) existingMessage.remove();

  const messageBox = document.createElement('div');
  messageBox.className = 'toast-message fixed bottom-4 right-4 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-xl z-[100] transition-transform transform translate-x-full';
  messageBox.textContent = message;

  document.body.appendChild(messageBox);
  
  setTimeout(() => {
    messageBox.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    messageBox.style.transform = 'translateX(150%)';
    messageBox.addEventListener('transitionend', () => {
      messageBox.remove();
    });
  }, 3000);
};

const handleAddToCart = (bookId) => {
  const bookToAdd = availableBooks.find(book => book.id === bookId);
  const itemInCart = cartItems.find(item => item.book.id === bookId);
  const quantityInput = document.getElementById('book-quantity');
  const bookQuantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

  if (itemInCart) {
    itemInCart.quantity += bookQuantity;
  } else {
    cartItems.push({ book: bookToAdd, quantity: bookQuantity });
  }

  showMessage('Sản phẩm đã được thêm vào giỏ hàng!');
  renderPage();
};


// =========================
// Search & Sort
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
    }, 500);
  }
};

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
            content = `<p class="text-muted-foreground text-center mb-6">Chào mừng bạn quay lại!</p>`;
            link = `<div class="links">
                        <a href="#" onclick="handleNavigate('/forgot-password')">Quên mật khẩu?</a>
                        <a href="#" onclick="handleNavigate('/register')">Đăng ký ngay</a>
                    </div>`;
            formContent = `
                <div>
                    <label for="login-username" class="block text-sm font-medium text-foreground">Tên đăng nhập</label>
                    <input type="text" id="login-username" required class="auth-form-container input">
                </div>
                <div>
                    <label for="login-password" class="block text-sm font-medium text-foreground">Mật khẩu</label>
                    <input type="password" id="login-password" required class="auth-form-container input">
                </div>
                <button type="submit" class="auth-form-container button login">Đăng nhập</button>
            `;
            break;

        case 'register':
            title = 'Đăng ký';
            content = `<p class="text-muted-foreground text-center mb-6">Tạo tài khoản mới để mua sắm dễ dàng!</p>`;
            link = `<div class="links mt-4 text-center text-sm">
                        <a href="#" onclick="handleNavigate('/login')">Đã có tài khoản? Đăng nhập</a>
                    </div>`;
            formContent = `
                <div>
                    <label for="register-username" class="block text-sm font-medium text-foreground">Tên đăng nhập</label>
                    <input type="text" id="register-username" required class="auth-form-container input">
                </div>
                <div>
                    <label for="register-password" class="block text-sm font-medium text-foreground">Mật khẩu</label>
                    <input type="password" id="register-password" required class="auth-form-container input">
                </div>
                <button type="submit" class="auth-form-container button register">Đăng ký</button>
            `;
            break;

        case 'forgot-password':
            title = 'Quên mật khẩu';
            content = `<p class="text-muted-foreground text-center mb-6">Nhập username để khôi phục tài khoản.</p>`;
            link = `<div class="links mt-4 text-center text-sm">
                        <a href="#" onclick="handleNavigate('/login')">Quay lại đăng nhập</a>
                    </div>`;
            formContent = `
                <div>
                    <label for="forgot-username" class="block text-sm font-medium text-foreground">Tên đăng nhập</label>
                    <input type="text" id="forgot-username" required class="auth-form-container input">
                </div>
                <div id="captcha-container" class="hidden mt-4">
                    <p class="text-sm mb-2 text-foreground">Xác nhận bạn không phải robot:</p>
                    <input type="text" id="captcha-input" placeholder="Nhập mã..." required 
                        class="auth-form-container input">
                </div>
                <button type="submit" id="forgot-button"
                    class="auth-form-container button login">
                    Gửi yêu cầu
                </button>
            `;
            break;
    }

    return `
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-form-container md:w-1/2">
                <a href="#" onclick="handleNavigate('/')" 
                class="absolute top-4 left-4 text-muted-foreground hover:text-foreground flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Quay lại cửa hàng</span>
                </a>

                <h1 class="text-3xl font-bold text-center mb-4 text-foreground">${title}</h1>
                ${content}
                <form class="space-y-4" onsubmit="handleAuthSubmit(event, '${mode}')">
                    ${formContent}
                </form>
                ${link}
            </div>
            <div class="auth-image-container md:w-1/2"></div>
        </div>
    </div>`;
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
        const forgotUsername = document.getElementById("forgot-username").value;
        const captchaInput = document.getElementById("captcha-input");

        if (!captchaInput) {
            document.getElementById("captcha-container").style.display = 'block';
            document.getElementById("forgot-button").textContent = 'Xác nhận';
            document.getElementById("forgot-button").classList.remove('login');
            document.getElementById("forgot-button").classList.add('register');
            generateCaptcha();
            showMessage(`Mã xác nhận: ${captchaCode}`);
        } else {
            if (captchaInput.value.toLowerCase() === captchaCode.toLowerCase()) {
                showMessage('Mật khẩu mới đã được gửi tới email của bạn.');
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
  handleNavigate("/");
  showMessage('Bạn đã đăng xuất!');
}

// =========================
/** Trang giỏ hàng */
// =========================
const createCartPage = () => {
  const cartTotal = cartItems.reduce((total, item) => total + (item.book.price * item.quantity), 0);

  return `
  <div id="page-cart" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-bold mb-8 text-foreground">Giỏ hàng của bạn</h1>

    ${cartItems.length === 0
      ? `<p class="text-center text-muted-foreground">Giỏ hàng của bạn trống.</p>`
      : `
      <div class="flex flex-col md:flex-row gap-8">
        <div class="flex-1 space-y-4">
          ${cartItems.map(item => `
            <div class="flex items-center border border-border rounded-lg p-4 bg-white shadow-sm">
              <img src="${item.book.image}" alt="${item.book.title}" class="w-20 h-20 rounded-lg object-cover mr-4 flex-shrink-0">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">${item.book.title}</h3>
                <p class="text-muted-foreground text-sm mb-2">Tác giả: ${item.book.author}</p>
                <p class="font-bold text-primary">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</p>
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
            <span>Tổng cộng (${cartItems.length} sản phẩm)</span>
            <span class="font-semibold">${cartTotal.toLocaleString('vi-VN')}₫</span>
          </div>
          <div class="flex justify-between mb-4 border-b border-gray-200 pb-4">
            <span>Phí vận chuyển</span>
            <span class="font-semibold text-blue-500">Miễn phí</span>
          </div>
          <div class="flex justify-between font-bold text-lg mb-6">
            <span>Tổng thanh toán</span>
            <span class="text-red-500">${cartTotal.toLocaleString('vi-VN')}₫</span>
          </div>
          <button class="w-full py-3 px-6 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors">
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    `}
    <div class="mt-8 text-center">
      <button onclick="handleNavigate('/')" class="text-blue-500 hover:underline">Tiếp tục mua sắm</button>
    </div>
  </div>`;
};

const handleUpdateCartItemQuantity = (bookId, delta) => {
  const item = cartItems.find(item => item.book.id === bookId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      handleRemoveCartItem(bookId);
      return;
    }
  }
  renderPage();
};

const handleRemoveCartItem = (bookId) => {
  cartItems = cartItems.filter(item => item.book.id !== bookId);
  renderPage();
};

// =========================
// Render
// =========================
const renderPage = () => {
  const pageContainer = document.getElementById('page-container');
  const headerContainer = document.getElementById('header-container');

  // Ẩn header ở các trang auth
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(currentPath);
  headerContainer.innerHTML = isAuthPage ? '' : createHeader();

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
    // QUAN TRỌNG: thêm route quên mật khẩu
    case '/forgot-password':
      pageContent = createAuthPages('forgot-password');
      break;
    default:
      pageContent = createHomePage();
      break;
  }

  pageContainer.innerHTML = pageContent;
};

// Đọc auth trước khi render lần đầu
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem("auth");
  if (saved) {
    try {
      auth.user = JSON.parse(saved);
    } catch (_) {
      auth.user = null;
    }
  }
  renderPage();
});