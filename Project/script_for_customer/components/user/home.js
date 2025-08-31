import { availableBooks, uniqueCategories, selectedCategory, searchTerm, sortOrder } from '../../state.js';
import { setAvailableBooks, setUniqueCategories, setAvailableVouchers } from '../../state.js';
import { getRatingStars } from '../../utils.js';
import { handleNavigate, handleSort } from '../../navigation.js';
import { handleAddToCart } from './cart.js';

export const loadProducts = async () => {
  try {
    const res = await fetch("http://localhost:3000/products");
    const data = await res.json();
    if (res.ok) {
      const books = data.map(p => ({
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
      setAvailableBooks(books);
      console.log("✅ Books loaded:", books);
      const categories = [...new Set(books.map(book => book.category))];
      setUniqueCategories(categories);
      console.log("✅ Categories loaded:", categories);
    } else {
      console.error("❌ Lỗi khi lấy products:", data.message);
    }
  } catch (err) {
    console.error("❌ API error:", err);
  }
};

export const loadVouchers = async () => {
    try {
        const res = await fetch("http://localhost:3000/vouchers");
        const data = await res.json();
        if (res.ok) {
            const vouchers = data.map(v => ({
                id: v.voucher_id,
                code: v.code,
                value: v.discount,
                remaining: v.remaining,
                minPrice: v.min_order_value,
                expiration: v.end_date,
                description: v.description,
                type: v.voucher_type,
                isPercentage: v.type === 'percentage',
                maxDiscount: v.max_discount || null
            }));
            setAvailableVouchers(vouchers);
            console.log("✅ Vouchers loaded:", vouchers);
        } else {
            console.error("❌ Lỗi khi lấy vouchers:", data.message);
        }
    } catch (err) {
        console.error("❌ Lỗi API khi lấy vouchers:", err);
    }
};

export const createBookList = (books) => {
  if (books.length === 0) {
    return `<p class="text-center text-gray-500 col-span-full mt-8">Không tìm thấy sách nào phù hợp.</p>`;
  }
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
          <button onclick="handleAddToCart(${book.id})" class="flex-1 bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600" ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Hết hàng' : '+ Giỏ'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
};

export const createHomePage = () => {
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

  booksToDisplay.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));

  if (sortOrder === 'best-selling') booksToDisplay.sort((a, b) => b.reviews - a.reviews);
  else if (sortOrder === 'rating') booksToDisplay.sort((a, b) => b.rating - a.rating);
  else if (sortOrder === 'price-asc') booksToDisplay.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'price-desc') booksToDisplay.sort((a, b) => b.price - a.price);
  else if (sortOrder === 'name-asc') booksToDisplay.sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));
  else if (sortOrder === 'name-desc') booksToDisplay.sort((a, b) => b.title.localeCompare(a.title, 'vi', { sensitivity: 'base' }));
  
  const slides = [
    { src: 'https://static.wikia.nocookie.net/gensin-impact/images/1/12/Columbina_Introduction_Card.png/revision/latest?cb=20250722042053', alt: 'Quảng cáo 1', link: 'https://genshin-impact.fandom.com/wiki/Columbina' },
    { src: 'https://static.wikia.nocookie.net/gensin-impact/images/7/7f/Alice_Introduction_Card.png/revision/latest?cb=20250722041937', alt: 'Quảng cáo 2', link: 'https://genshin-impact.fandom.com/wiki/Alice' },
    { src: 'https://static.wikia.nocookie.net/gensin-impact/images/a/a1/Nicole_Introduction_Card.png/revision/latest/scale-to-width-down/1200?cb=20250722041540', alt: 'Quảng cáo 3', link: 'https://genshin-impact.fandom.com/wiki/Nicole' },
    { src: 'https://static.wikia.nocookie.net/gensin-impact/images/a/a0/Varka_Introduction_Card.png/revision/latest?cb=20250722041725', alt: 'Quảng cáo 4', link: 'https://genshin-impact.fandom.com/wiki/Varka' },
    { src: 'https://static.wikia.nocookie.net/gensin-impact/images/b/b1/Durin_Introduction_Card.png/revision/latest/scale-to-width-down/1200?cb=20250722041941', alt: 'Quảng cáo 5', link: 'https://genshin-impact.fandom.com/wiki/Durin' },
  ];

  return `
    <div id="page-home" class="max-w-7xl mx-auto px-1 sm:px-2 lg:px-2 py-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-16">
      <aside class="md:w-1/5 bg-white rounded-2xl px-2 py-6 shadow-lg h-fit hidden md:block self-start border border-gray-200" style="margin-left: -5rem;">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Danh mục</h2>
        <ul class="space-y-3">
          <li><button onclick="handleNavigate('/')" class="w-full text-left py-3 px-2 text-lg rounded-lg font-semibold transition-colors duration-200 ${!selectedCategory ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-800 hover:bg-gray-100'}">Tất cả</button></li>
          ${uniqueCategories.map(category => `<li><button onclick="handleNavigate('/', { category: '${category}' })" class="w-full text-left py-3 px-1 text-lg rounded-lg font-medium transition-colors duration-200 ${selectedCategory === category ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-800 hover:bg-gray-100'}">${category}</button></li>`).join('')}
        </ul>
      </aside>
      <section class="md:w-4/5">
        <div class="mb-6 flex justify-center">
          <div id="carousel-container" class="relative overflow-hidden rounded-xl shadow-md" style="width:750px;">
            <div id="carousel-track" class="flex transition-transform duration-500 ease-in-out">
              ${slides.map(slide => `<a href="${slide.link}" class="flex-shrink-0" style="width:750px;"><img src="${slide.src}" alt="${slide.alt}" class="w-full h-80 object-cover" /></a>`).join('')}
            </div>
            <button id="prev-btn" class="absolute top-1/2 left-0 transform -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-r-lg p-3 hover:bg-opacity-70">‹</button>
            <button id="next-btn" class="absolute top-1/2 right-0 transform -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-l-lg p-3 hover:bg-opacity-70">›</button>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 class="text-3xl font-bold text-gray-900">${selectedCategory || 'Tất cả sách'}</h1>
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
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${createBookList(booksToDisplay)}</div>
      </section>
    </div>`;
};

export const initCarousel = () => {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (!track || !prevBtn || !nextBtn) return;
  const slides = Array.from(track.children);
  if (slides.length === 0) return;
  
  const totalSlides = slides.length;
  let currentSlide = 0;
  let intervalId = null;
  const intervalTime = 3000;

  const updateSlide = () => {
    const slideWidth = slides[0].offsetWidth;
    track.style.transform = `translateX(${-slideWidth * currentSlide}px)`;
  };

  const showNextSlide = () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlide();
  };

  const showPrevSlide = () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlide();
  };
  
  if (window.carouselIntervalId) {
    clearInterval(window.carouselIntervalId);
  }

  const startAutoSlide = () => {
    intervalId = setInterval(showNextSlide, intervalTime);
    window.carouselIntervalId = intervalId;
  };

  const resetAutoSlide = () => {
    clearInterval(intervalId);
    startAutoSlide();
  };

  nextBtn.addEventListener("click", () => {
    showNextSlide();
    resetAutoSlide();
  });

  prevBtn.addEventListener("click", () => {
    showPrevSlide();
    resetAutoSlide();
  });

  if (totalSlides > 1) {
    startAutoSlide();
  }
};

// Add event handlers to global scope
window.handleNavigate = handleNavigate;
window.handleSort = handleSort;
window.handleAddToCart = handleAddToCart;
