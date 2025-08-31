import { auth, cartItems, selectedCartIds, selectedDiscountVoucher, selectedShippingVoucher } from '../../state.js';
import { setSelectedCartIds, setSelectedDiscountVoucher, setSelectedShippingVoucher } from '../../state.js';
import { showMessage } from '../../utils.js';
import { handleNavigate } from '../../navigation.js';
import { syncCartWithDatabase } from './cart.js';

export const createCheckoutPage = () => {
  const itemsToCheckout = cartItems.filter(item => selectedCartIds.includes(item.book.id));
  if (itemsToCheckout.length === 0) {
    return `<p class="text-center">Không có sản phẩm nào để thanh toán.</p>`;
  }

  const cartTotal = itemsToCheckout.reduce((t, i) => t + i.book.price * i.quantity, 0);
  let shippingFee = itemsToCheckout.length > 0 ? (cartTotal < 200000 ? 40000 : (cartTotal < 500000 ? 25000 : 0)) : 0;
  let discount = selectedDiscountVoucher ? (selectedDiscountVoucher.isPercentage ? Math.min(cartTotal * selectedDiscountVoucher.value / 100, selectedDiscountVoucher.maxDiscount || Infinity) : selectedDiscountVoucher.value) : 0;
  if (selectedShippingVoucher) {
    shippingFee = Math.max(0, shippingFee - selectedShippingVoucher.value);
  }
  const finalTotal = cartTotal - discount + shippingFee;

  const name = auth.user?.username || "";
  const address = auth.user?.address || "";
  const phone = auth.user?.phone_number || "";

  return `
    <div class="relative min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.squarespace-cdn.com/content/v1/56497023e4b06a49bd376eb2/50869e1a-4091-4c05-9fa9-7b58e927485e/IMG_0979.jpg'); opacity: 0.15;"></div>
      <div class="relative max-w-3xl w-full p-6 bg-white rounded-xl shadow-lg my-8 z-10">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">Thanh toán đơn hàng</h1>
        <div class="space-y-4 mb-8">
          <h2 class="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Tóm tắt đơn hàng</h2>
          ${itemsToCheckout.map(item => `<div class="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0"><div class="flex items-center space-x-4"><img src="${item.book.image}" class="w-12 h-12 object-cover rounded-md shadow-sm"/><div class="flex flex-col"><span class="font-medium text-gray-800">${item.book.title}</span><span class="text-sm text-gray-500">Số lượng: ${item.quantity}</span></div></div><span class="font-semibold text-gray-800">${(item.book.price * item.quantity).toLocaleString('vi-VN')}₫</span></div>`).join("")}
        </div>
        <div class="mb-8 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center py-2"><span class="text-gray-600">Tổng sản phẩm:</span><span class="font-medium text-gray-800">${cartTotal.toLocaleString('vi-VN')}₫</span></div>
          <div class="flex justify-between items-center py-2"><span class="text-gray-600">Giảm giá:</span><span class="font-medium text-green-600">- ${discount.toLocaleString('vi-VN')}₫</span></div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200"><span class="text-gray-600">Phí ship:</span><span class="font-medium text-gray-800">${shippingFee.toLocaleString('vi-VN')}₫</span></div>
          <div class="flex justify-between items-center pt-4 text-xl font-bold"><span class="text-gray-800">Tổng cộng:</span><span class="text-red-600">${finalTotal.toLocaleString('vi-VN')}₫</span></div>
        </div>
        <h2 class="text-xl font-semibold text-gray-700 mb-6">Thông tin giao hàng</h2>
        <form onsubmit="handlePlaceOrder(event)" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" id="checkout-name" value="${name}" placeholder="Họ và tên" required class="w-full px-5 py-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-orange-500"/>
            <input type="tel" id="checkout-phone" value="${phone}" placeholder="Số điện thoại" required class="w-full px-5 py-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-orange-500"/>
          </div>
          <input type="text" id="checkout-address" value="${address}" placeholder="Địa chỉ" required class="w-full px-5 py-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-orange-500"/>
          <div class="space-y-4">
            <label for="checkout-payment" class="block text-gray-700 font-medium">Phương thức thanh toán</label>
            <select id="checkout-payment" required class="w-full px-5 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500"><option value="cod">Thanh toán khi nhận hàng (COD)</option></select>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 mt-8">
            <button type="submit" class="flex-1 min-w-[140px] py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">Đặt hàng</button>
            <button type="button" onclick="handleNavigate('/cart')" class="flex-1 min-w-[140px] py-3 px-6 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Hủy</button>
          </div>
        </form>
      </div>
    </div>`;
};

export function handleCheckout() {
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

export async function handlePlaceOrder(event) {
    event.preventDefault();
    const itemsToCheckout = cartItems.filter(item => selectedCartIds.includes(item.book.id));
    if (itemsToCheckout.length === 0) {
        showMessage("Không có sản phẩm để đặt hàng.");
        return;
    }

    const shippingDetails = {
        name: document.getElementById("checkout-name").value,
        phone: document.getElementById("checkout-phone").value,
        address: document.getElementById("checkout-address").value,
    };
    
    const cartTotal = itemsToCheckout.reduce((t, i) => t + i.book.price * i.quantity, 0);
    let baseShippingFee = cartTotal < 200000 ? 40000 : (cartTotal < 500000 ? 25000 : 0);
    let finalShippingFee = baseShippingFee;
    let discount = selectedDiscountVoucher ? (selectedDiscountVoucher.isPercentage ? Math.min(cartTotal * selectedDiscountVoucher.value / 100, selectedDiscountVoucher.maxDiscount || Infinity) : selectedDiscountVoucher.value) : 0;
    if (selectedShippingVoucher) {
        finalShippingFee = Math.max(0, baseShippingFee - selectedShippingVoucher.value);
    }
    const finalTotal = cartTotal - discount + finalShippingFee;

    const payload = {
        userId: auth.user.user_id,
        items: itemsToCheckout,
        shippingDetails,
        totals: { cartTotal, shippingFee: finalShippingFee, discount, finalTotal },
        usedVoucherCode: selectedDiscountVoucher?.code || null,
        usedShippingVoucherCode: selectedShippingVoucher?.code || null,
    };

    try {
        const res = await fetch("http://localhost:3000/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
            showMessage("Đặt hàng thành công!");
            setSelectedCartIds([]);
            setSelectedDiscountVoucher(null);
            setSelectedShippingVoucher(null);
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

// Add event handlers to global scope
window.handleNavigate = handleNavigate;
window.handlePlaceOrder = handlePlaceOrder;