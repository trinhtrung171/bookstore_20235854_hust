import { selectedBook, quantity, bookDetailTab, currentBookReviews, availableBooks } from '../../state.js';
import { setBookDetailTabState, setQuantity, setCurrentBookReviews } from '../../state.js';
import { getRatingStars, showMessage } from '../../utils.js';
import { handleNavigate } from '../../navigation.js';
import { getOrCreateCartId, handleAddToCart, syncCartWithDatabase } from './cart.js';
import { renderPage } from '../../app.js';


export const loadReviewsForProduct = async (productId) => {
    if (!productId) {
        setCurrentBookReviews([]);
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/products/${productId}/reviews`);
        if (res.ok) {
            const reviews = await res.json();
            setCurrentBookReviews(reviews);
        } else {
            console.error("Lỗi khi tải reviews");
            setCurrentBookReviews([]);
        }
    } catch (err) {
        console.error("Lỗi API khi tải reviews:", err);
        setCurrentBookReviews([]);
    }
};

export const createBookDetailPage = () => {
  if (!selectedBook) {
    return `<p class="text-gray-900">Không tìm thấy sách. <button onclick="handleNavigate('/')" class="text-orange-500 hover:underline">Về trang chủ</button></p>`;
  }
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
        <div class="product-image-wrapper" style="width:300px;height:420px;"><img src="${selectedBook.image}" alt="${selectedBook.title}"></div>
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
        <div class="mb-6"><span class="font-medium">Tình trạng: </span><span class="font-semibold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}">${isOutOfStock ? 'Hết hàng' : 'Còn hàng'}</span></div>
        <div class="flex items-center mb-8">
          <span class="mr-4">Số lượng:</span>
          <div class="flex items-center border rounded-lg">
            <button onclick="decreaseQuantity()" class="px-3" ${isOutOfStock ? 'disabled' : ''}>-</button>
            <input type="number" id="book-quantity" value="${quantity}" min="1" max="${selectedBook.stock}" oninput="updateQuantity(this.value)" class="w-12 text-center border-none focus:outline-none" ${isOutOfStock ? 'disabled' : ''}>
            <button onclick="increaseQuantity()" class="px-3" ${isOutOfStock ? 'disabled' : ''}>+</button>
          </div>
          ${!isOutOfStock ? `<span class="text-sm text-gray-500 ml-4">(${selectedBook.stock} sản phẩm có sẵn)</span>` : ''}
        </div>
        <div class="flex space-x-4 mb-8">
          <button onclick="handleAddToCart(${selectedBook.id})" class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg font-semibold transition-colors ${isOutOfStock ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'Hết hàng' : '+ Thêm vào giỏ'}</button>
          <button onclick="handleBuyNow(${selectedBook.id})" class="flex-1 flex items-center justify-center py-3 px-6 rounded-lg font-semibold transition-colors ${isOutOfStock ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}" ${isOutOfStock ? 'disabled' : ''}>Mua ngay</button>
        </div>
      </div>
    </div>
    <div class="mt-12">
      <div class="flex border-b">
        <button onclick="setBookDetailTab('description')" class="py-2 px-4 border-b-2 ${bookDetailTab === 'description' ? 'border-orange-500 text-orange-500 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'}">Mô tả</button>
        <button onclick="setBookDetailTab('reviews')" class="py-2 px-4 border-b-2 ${bookDetailTab === 'reviews' ? 'border-orange-500 text-orange-500 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'}">Đánh giá</button>
      </div>
      <div class="mt-6 text-gray-900">
        ${bookDetailTab === 'description' ? `<p>${selectedBook.fullDescription}</p>` : `<div>${currentBookReviews.length > 0 ? currentBookReviews.map(review => `<div class="border-b py-4"><div class="flex items-center mb-2"><span class="font-bold mr-3">${review.username}</span><div class="flex items-center">${getRatingStars(review.rating)}</div></div><p class="text-gray-500 text-sm mb-2">${new Date(review.review_date).toLocaleDateString('vi-VN')}</p><p class="text-gray-800">${review.comment}</p></div>`).join('') : `<p class="text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên để lại đánh giá cho cuốn sách này!</p>`}</div>`}
      </div>
    </div>
  </div>`;
};

export const setBookDetailTab = (tab) => {
  setBookDetailTabState(tab);
  renderPage();
};

export const updateQuantity = (value) => {
  const newQuantity = parseInt(value, 10);
  const updatedQuantity = (!isNaN(newQuantity) && newQuantity >= 1) ? newQuantity : 1;
  setQuantity(updatedQuantity);

  const totalPriceElement = document.getElementById('total-price');
  if (totalPriceElement && selectedBook) {
    totalPriceElement.textContent = (selectedBook.price * updatedQuantity).toLocaleString('vi-VN') + '₫';
  }
};

export const decreaseQuantity = () => {
  if (quantity > 1) {
    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    const quantityInput = document.getElementById('book-quantity');
    if (quantityInput) quantityInput.value = newQuantity;
    updateQuantity(newQuantity);
  }
};

export const increaseQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    const quantityInput = document.getElementById('book-quantity');
    if (quantityInput) quantityInput.value = newQuantity;
    updateQuantity(newQuantity);
};

export async function handleBuyNow(bookId) {
    const book = availableBooks.find(b => b.id === bookId);
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
        const existingItemRes = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}&product_id=${book.id}`);
        const existingItem = (await existingItemRes.json())[0];

        let targetCartItem = null;
        if (existingItem) {
            const updateRes = await fetch(`http://localhost:3000/cart/items/${existingItem.cart_item_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: existingItem.quantity + bookQuantity })
            });
            if (!updateRes.ok) throw new Error('Lỗi khi cập nhật sản phẩm để mua ngay!');
            targetCartItem = await updateRes.json();
        } else {
            const addRes = await fetch('http://localhost:3000/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart_id: cartId, product_id: book.id, quantity: bookQuantity, is_selected: true })
            });
            if (!addRes.ok) throw new Error('Lỗi khi thêm sản phẩm để mua ngay!');
            targetCartItem = await addRes.json();
        }

        const allItemsRes = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}`);
        const allItems = await allItemsRes.json();
        const updates = allItems.map(item => ({
            cart_item_id: item.cart_item_id,
            is_selected: item.cart_item_id === targetCartItem.cart_item_id
        }));

        await Promise.all(updates.map(update =>
            fetch(`http://localhost:3000/cart/items/${update.cart_item_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_selected: update.is_selected })
            })
        ));

        await syncCartWithDatabase();
        handleNavigate('/cart');

    } catch (error) {
        console.error("❌ Lỗi API khi mua ngay:", error);
        showMessage('Lỗi: Không thể kết nối tới máy chủ hoặc thao tác thất bại!');
    }
}

// Add event handlers to global scope
window.handleNavigate = handleNavigate;
window.setBookDetailTab = setBookDetailTab;
window.updateQuantity = updateQuantity;
window.decreaseQuantity = decreaseQuantity;
window.increaseQuantity = increaseQuantity;
window.handleAddToCart = handleAddToCart;
window.handleBuyNow = handleBuyNow;
window.loadReviewsForProduct = loadReviewsForProduct;
