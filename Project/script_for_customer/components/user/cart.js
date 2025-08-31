import { auth, cartItems, selectedCartIds, availableBooks, availableVouchers, showVoucherList, selectedDiscountVoucher, selectedShippingVoucher } from '../../state.js';
import { setCartItems, setSelectedCartIds, setShowVoucherList, setSelectedDiscountVoucher, setSelectedShippingVoucher } from '../../state.js';
import { showMessage } from '../../utils.js';
import { handleNavigate } from '../../navigation.js';
import { handleCheckout } from './checkout.js';
import { renderPage } from '../../app.js';

export const getOrCreateCartId = async () => {
    if (!auth.user) {
        showMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        handleNavigate('/login');
        return null;
    }
    const userId = auth.user.user_id;
    try {
      const res = await fetch(`http://localhost:3000/cart?user_id=${userId}`);
      const carts = await res.json();
      if (Array.isArray(carts) && carts.length > 0 && carts[0].cart_id) {
        return carts[0].cart_id;
      }
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

export const syncCartWithDatabase = async () => {
    if (!auth.user) {
        setCartItems([]);
        renderPage();
        return;
    }
    const cartId = await getOrCreateCartId();
    if (!cartId) {
        setCartItems([]);
        renderPage();
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}`);
        if (res.ok) {
            const data = await res.json();
            const newCartItems = data.map(item => ({
                cart_item_id: item.cart_item_id,
                book: availableBooks.find(b => b.id === item.product_id),
                quantity: item.quantity,
                is_selected: item.is_selected
            })).filter(item => item.book);
            setCartItems(newCartItems);

            const newSelectedIds = newCartItems.filter(item => item.is_selected).map(item => item.book.id);
            setSelectedCartIds(newSelectedIds);

            console.log("✅ Cart synced with database:", newCartItems);
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

export const handleAddToCart = async (bookId) => {
    const bookToAdd = availableBooks.find(book => book.id === bookId);
    if (!bookToAdd || bookToAdd.stock <= 0) {
        showMessage('Sản phẩm này đã hết hàng!');
        return;
    }
    const cartId = await getOrCreateCartId();
    if (!cartId) return;

    const quantityInput = document.getElementById('book-quantity');
    const bookQuantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    if (!bookToAdd) {
        showMessage('Lỗi: Không tìm thấy sản phẩm!');
        return;
    }

    try {
        const existingItemRes = await fetch(`http://localhost:3000/cart/items?cart_id=${cartId}&product_id=${bookToAdd.id}`);
        const existingItem = (await existingItemRes.json())[0];

        if (existingItem) {
            const newQuantity = existingItem.quantity + bookQuantity;
            const updateRes = await fetch(`http://localhost:3000/cart/items/${existingItem.cart_item_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });
            showMessage(updateRes.ok ? 'Đã cập nhật số lượng sản phẩm trong giỏ hàng!' : 'Lỗi khi cập nhật sản phẩm!');
        } else {
            const addRes = await fetch('http://localhost:3000/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart_id: cartId, product_id: bookToAdd.id, quantity: bookQuantity, is_selected: true })
            });
            showMessage(addRes.ok ? 'Sản phẩm đã được thêm vào giỏ hàng!' : 'Lỗi khi thêm sản phẩm vào giỏ!');
        }
        await syncCartWithDatabase();
    } catch (error) {
        console.error("❌ Lỗi API khi thêm vào giỏ hàng:", error);
        showMessage('Lỗi: Không thể kết nối tới máy chủ!');
    }
};

export const createCartPage = () => {
    const cartTotal = cartItems.filter(item => selectedCartIds.includes(item.book.id)).reduce((total, item) => total + (item.book.price * item.quantity), 0);
    let shippingFee = selectedCartIds.length > 0 ? (cartTotal < 200000 ? 40000 : (cartTotal < 500000 ? 25000 : 0)) : 0;
    let finalDiscount = 0;
    let finalShippingFee = shippingFee;

    if (selectedDiscountVoucher) {
        finalDiscount = selectedDiscountVoucher.isPercentage
            ? Math.min(cartTotal * (selectedDiscountVoucher.value / 100), selectedDiscountVoucher.maxDiscount)
            : selectedDiscountVoucher.value;
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
        ${cartItems.length > 0 && !showVoucherList ? `<div class="mb-6 flex justify-start"><button onclick="handleNavigate('/')" class="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">Tiếp tục mua hàng</button></div>` : ''}
        ${cartItems.length === 0 ? `<p class="text-center text-muted-foreground">Giỏ hàng của bạn trống.</p>` : `
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 space-y-4">
              ${cartItems.map(item => `
                <div class="flex items-center border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <input type="checkbox" ${selectedCartIds.includes(item.book.id) ? 'checked' : ''} onchange="handleToggleCartItem(${item.book.id})" class="mr-4 w-5 h-5 accent-orange-500">
                  <img src="${item.book.image}" alt="${item.book.title}" class="w-20 h-20 rounded-lg object-cover mr-4 flex-shrink-0">
                  <div class="flex-1"><h3 class="font-semibold text-lg">${item.book.title}</h3><p class="text-gray-500 text-sm mb-2">Tác giả: ${item.book.author}</p><p class="font-bold text-black-600">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</p></div>
                  <div class="flex items-center space-x-2"><button onclick="handleUpdateCartItemQuantity(${item.book.id}, -1)" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300">-</button><span class="font-medium w-6 text-center">${item.quantity}</span><button onclick="handleUpdateCartItemQuantity(${item.book.id}, 1)" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300">+</button></div>
                  <button onclick="handleRemoveCartItem(${item.book.id})" class="ml-4 text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>`).join('')}
            </div>
            <div class="md:w-1/3 bg-white rounded-lg p-6 shadow-md h-fit">
              <h2 class="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
              <div class="flex justify-between mb-2"><span>Tổng tiền sản phẩm</span><span class="font-semibold">${cartTotal.toLocaleString('vi-VN')}₫</span></div>
              <div class="flex justify-between mb-4 border-b border-gray-200 pb-4"><span>Phí vận chuyển</span><span class="font-semibold">${shippingFee.toLocaleString('vi-VN')}₫</span></div>
              <div class="flex justify-between mb-4"><span>Giảm giá phí vận chuyển</span><span class="font-semibold text-green-600">- ${(selectedShippingVoucher ? selectedShippingVoucher.value : 0).toLocaleString('vi-VN')}₫</span></div>
              <div class="flex justify-between mb-4"><span>Giảm giá</span><span class="font-semibold text-red-500">- ${finalDiscount.toLocaleString('vi-VN')}₫</span></div>
              <div class="flex justify-between font-bold text-lg mb-6"><span>Tổng thanh toán</span><span class="text-red-500">${finalTotal.toLocaleString('vi-VN')}₫</span></div>
              <button onclick="handleShowVoucherList()" class="w-full py-2 px-4 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors mb-4">${selectedDiscountVoucher || selectedShippingVoucher ? 'Đã áp dụng mã giảm giá' : 'Áp dụng mã giảm giá'}</button>
              <button onclick="handleCheckout()" class="w-full py-3 px-6 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors" ${selectedCartIds.length === 0 ? 'disabled' : ''}>Tiến hành thanh toán (${selectedCartIds.length} sản phẩm)</button>
            </div>
          </div>`}
        ${showVoucherList ? `
        <div id="voucher-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg p-6 w-full" style="max-width: 600px;">
            <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold">Chọn mã giảm giá</h3><button onclick="handleHideVoucherList()" class="text-gray-500 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div class="overflow-y-auto" style="max-height: calc(70vh - 80px);">
                <h4 class="text-lg font-semibold mb-2 mt-4">Mã miễn phí vận chuyển</h4>
                <div class="space-y-4 mb-6">${shippingVouchers.map(v => { const isUsable = cartTotal >= v.minPrice && v.remaining > 0 && shippingFee > 0; const isSelected = selectedShippingVoucher?.code === v.code; const isDisabled = !isUsable || (selectedShippingVoucher && !isSelected); return `<div class="p-4 border border-dashed rounded-lg flex items-center justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}"><div><h4 class="font-semibold text-lg">${v.code}</h4><p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${v.minPrice.toLocaleString('vi-VN')}₫</p><p class="text-sm text-gray-700">Giảm <span class="font-bold">${v.value.toLocaleString('vi-VN')}₫</span> phí vận chuyển</p><p class="text-xs text-red-500">HSD: ${new Date(v.expiration).toLocaleDateString('vi-VN')} | Còn lại: ${v.remaining} mã</p></div>${isSelected ? `<button onclick="handleRemoveVoucher('${v.code}', 'shipping')" class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold">Xóa</button>` : `<button onclick="handleApplyVoucher('${v.code}', 'shipping')" ${isDisabled ? 'disabled' : ''} class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold ${isDisabled ? 'cursor-not-allowed' : ''}">Áp dụng</button>`}</div>`; }).join('')}</div>
                <h4 class="text-lg font-semibold mb-2 mt-4">Mã giảm giá sản phẩm</h4>
                <div class="space-y-4">${discountVouchers.map(v => { const isUsable = cartTotal >= v.minPrice && v.remaining > 0; const isSelected = selectedDiscountVoucher?.code === v.code; const isDisabled = !isUsable || (selectedDiscountVoucher && !isSelected); let detail = v.isPercentage ? `Giảm <span class="font-bold">${v.value}%</span> tối đa <span class="font-bold">${v.maxDiscount.toLocaleString('vi-VN')}₫</span>` : `Giảm <span class="font-bold">${v.value.toLocaleString('vi-VN')}₫</span>`; return `<div class="p-4 border border-dashed rounded-lg flex items-center justify-between ${isDisabled ? 'opacity-50' : (isSelected ? 'border-green-500' : 'border-blue-500')}"><div><h4 class="font-semibold text-lg">${v.code}</h4><p class="text-sm text-gray-500">Áp dụng cho đơn hàng từ ${v.minPrice.toLocaleString('vi-VN')}₫</p><p class="text-sm text-gray-700">${detail}</p><p class="text-xs text-red-500">HSD: ${new Date(v.expiration).toLocaleDateString('vi-VN')} | Còn lại: ${v.remaining} mã</p></div>${isSelected ? `<button onclick="handleRemoveVoucher('${v.code}', 'discount')" class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold">Xóa</button>` : `<button onclick="handleApplyVoucher('${v.code}', 'discount')" ${isDisabled ? 'disabled' : ''} class="py-1 px-3 text-sm rounded-lg bg-red-500 text-white font-semibold ${isDisabled ? 'cursor-not-allowed' : ''}">Áp dụng</button>`}</div>`; }).join('')}</div>
            </div>
          </div>
        </div>` : ''}
    </div>`;
};

export const handleToggleCartItem = async (bookId) => {
  const isCurrentlySelected = selectedCartIds.includes(bookId);
  const newSelectedState = !isCurrentlySelected;

  if (isCurrentlySelected) {
    setSelectedCartIds(selectedCartIds.filter(id => id !== bookId));
  } else {
    setSelectedCartIds([...selectedCartIds, bookId]);
  }
  renderPage();

  const itemToUpdate = cartItems.find(item => item.book.id === bookId);
  if (!itemToUpdate) return;

  try {
    const res = await fetch(`http://localhost:3000/cart/items/${itemToUpdate.cart_item_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_selected: newSelectedState })
    });
    if (!res.ok) await syncCartWithDatabase();
  } catch (error) {
    await syncCartWithDatabase();
  }
};

export function handleUpdateCartItemQuantity(bookId, delta) {
  const item = cartItems.find(i => i.book.id === bookId);
  if (!item) return;
  const newQuantity = Math.max(1, item.quantity + delta);
  const newCartItems = cartItems.map(i => i.book.id === bookId ? { ...i, quantity: newQuantity } : i);
  setCartItems(newCartItems);
  renderPage();
  // Optional: Add API call to update quantity in the database
}

export async function handleRemoveCartItem(bookId) {
  const item = cartItems.find(i => i.book.id === bookId);
  if (!item) return;
  
  const cartId = await getOrCreateCartId();
  if (!cartId) return;

  try {
    const res = await fetch('http://localhost:3000/cart/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId, product_id: bookId })
    });
    const data = await res.json();
    showMessage(data.message || 'Đã xóa sản phẩm khỏi giỏ hàng!');
    await syncCartWithDatabase();
  } catch(err) {
    console.error("❌ Lỗi API khi xóa sản phẩm:", err);
    showMessage('Lỗi: Không thể kết nối tới máy chủ!');
  }
}

export function handleShowVoucherList() {
  setShowVoucherList(true);
  document.body.classList.add('overflow-hidden');
  renderPage();
}

export function handleHideVoucherList() {
  setShowVoucherList(false);
  document.body.classList.remove('overflow-hidden');
  renderPage();
}

export const handleApplyVoucher = (code, type) => {
    const voucherToApply = availableVouchers.find(v => v.code === code);
    if (voucherToApply) {
        if (type === 'discount') setSelectedDiscountVoucher(voucherToApply);
        else if (type === 'shipping') setSelectedShippingVoucher(voucherToApply);
        showMessage(`Đã áp dụng mã giảm giá ${code}`);
    }
    renderPage();
};

export const handleRemoveVoucher = (code, type) => {
    if (type === 'discount') setSelectedDiscountVoucher(null);
    else if (type === 'shipping') setSelectedShippingVoucher(null);
    showMessage('Đã xóa mã giảm giá');
    renderPage();
};

// Add event handlers to global scope
window.handleNavigate = handleNavigate;
window.handleToggleCartItem = handleToggleCartItem;
window.handleUpdateCartItemQuantity = handleUpdateCartItemQuantity;
window.handleRemoveCartItem = handleRemoveCartItem;
window.handleShowVoucherList = handleShowVoucherList;
window.handleHideVoucherList = handleHideVoucherList;
window.handleApplyVoucher = handleApplyVoucher;
window.handleRemoveVoucher = handleRemoveVoucher;
window.handleCheckout = handleCheckout;
