import { auth, userBills } from '../../state.js';
import { setUserBills } from '../../state.js';
import { openReviewModal } from './review.js';
import { handleNavigate } from '../../navigation.js';
import { renderPage } from '../../app.js';
import { showMessage } from '../../utils.js';

export const loadUserBills = async () => {
    if (!auth.user) {
        setUserBills([]);
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/bills/user/${auth.user.user_id}`);
        if (res.ok) {
            const bills = await res.json();
            setUserBills(bills);
            console.log("✅ Bills loaded:", bills);
        } else {
            console.error("❌ Lỗi khi tải hóa đơn");
            setUserBills([]);
        }
    } catch (err) {
        console.error("❌ Lỗi API khi tải hóa đơn:", err);
        setUserBills([]);
    }
};

export const createOrderTrackingPage = () => {
  if (!auth.user) {
    return `<div class="min-h-screen bg-gray-100 flex items-center justify-center p-6"><div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-lg"><h1 class="text-2xl font-bold mb-4">Vui lòng đăng nhập</h1><p class="text-gray-600 mb-6">Bạn cần đăng nhập để xem lịch sử đơn hàng.</p><button onclick="handleNavigate('/login')" class="py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold">Đi đến trang đăng nhập</button></div></div>`;
  }
  if (userBills.length === 0) {
    return `<div class="min-h-screen bg-gray-100 flex items-center justify-center p-6"><div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-lg"><h1 class="text-2xl font-bold mb-4">Bạn chưa có đơn hàng nào</h1><p class="text-gray-600 mb-6">Hãy mua sắm để trải nghiệm.</p><button onclick="handleNavigate('/')" class="py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold">Tiếp tục mua hàng</button></div></div>`;
  }
  return `
    <div class="max-w-4xl mx-auto py-10 px-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Lịch sử đơn hàng</h1>
      <div class="space-y-6">${userBills.map(bill => {
        const orderDate = new Date(bill.purchase_date).toLocaleDateString("vi-VN");
        let statusClass = 'bg-yellow-100 text-yellow-700';
        if (bill.status.toLowerCase().trim() === 'đã xác nhận') statusClass = 'bg-blue-100 text-blue-700';
        else if (bill.status.toLowerCase().trim() === 'đã giao') statusClass = 'bg-green-100 text-green-700';
        else if (bill.status === 'đã hủy') statusClass = 'bg-red-100 text-red-700';
        return `
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-4">
            <div><h2 class="font-bold text-lg">Đơn hàng #${bill.bill_id}</h2><p class="text-sm text-gray-500">Ngày đặt: ${orderDate}</p></div>
            <div class="flex items-center space-x-4 mt-2 sm:mt-0"><span class="text-lg font-bold text-red-600">${Number(bill.total_amount).toLocaleString('vi-VN')}₫</span><span class="text-sm font-semibold capitalize px-3 py-1 rounded-full ${statusClass}">${bill.status}</span></div>
          </div>
          <div class="space-y-4 mb-4">${bill.items?.map(item => `
            <div class="flex items-center justify-between">
              <div class="flex items-center"><img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-md mr-4"><div class="flex-1"><p class="font-semibold">${item.title}</p><p class="text-sm text-gray-600">Số lượng: ${item.quantity} x ${Number(item.price_at_purchase).toLocaleString('vi-VN')}₫</p></div></div>
              ${bill.status.toLowerCase().trim() === 'đã giao' ? (item.is_reviewed ? `<span class="text-sm font-medium text-green-600 py-1 px-3 rounded-full bg-green-100">Đã đánh giá</span>` : `<button onclick="openReviewModal(${item.product_id}, '${item.title.replace(/'/g, "\\'")}', ${bill.bill_id})" class="py-1 px-3 rounded-lg bg-blue-500 text-white font-semibold text-sm">Viết đánh giá</button>`) : ''}
            </div>`).join('') || ''}
          </div>
          <div class="flex justify-end items-center mt-4 pt-4 border-t">
            ${bill.status === 'chờ xác nhận' ? `<button onclick="handleCancelOrder(${bill.bill_id})" class="py-2 px-4 rounded-lg bg-red-500 text-white font-semibold text-sm">Hủy đơn hàng</button>` : ''}
            ${bill.status.toLowerCase().trim() === 'đã xác nhận' && bill.estimated_delivery_date ? `<div class="text-sm text-gray-600"><span class="font-semibold">Giao hàng dự kiến:</span><span class="font-bold text-blue-700 ml-1">${new Date(bill.estimated_delivery_date).toLocaleDateString('vi-VN')}</span></div>` : ''}
          </div>
        </div>`;}).join('')}
      </div>
    </div>`;
};

export async function handleCancelOrder(billId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
        const res = await fetch(`http://localhost:3000/bills/${billId}/cancel`, { method: 'PATCH' });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message || 'Hủy đơn hàng thành công!');
            await loadUserBills();
            renderPage();
        } else {
            showMessage(`Lỗi: ${data.message}`);
        }
    } catch (err) {
        console.error('Lỗi khi hủy đơn hàng:', err);
        showMessage('Lỗi kết nối. Không thể hủy đơn hàng.');
    }
}

export const createOrderSuccessPage = () => {
  // Logic to calculate delivery date could be more complex
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3); // Example: 3 days for delivery
  return `
    <div class="relative min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://source.unsplash.com/random/1600x900/?books,library'); opacity: 0.1;"></div>
      <div class="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-10 z-10 flex flex-col items-center text-center">
        <div class="bg-green-100 rounded-full p-6 mb-6"><svg class="text-green-600 w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Đặt hàng thành công!</h1>
        <p class="text-lg text-gray-600 mb-2">Cảm ơn bạn đã mua hàng tại <span class="font-semibold text-orange-500">Hust Book Store</span>.</p>
        <p class="text-base text-gray-500 mb-8">Đơn hàng của bạn đang được xử lý và sẽ sớm được giao.</p>
        <div class="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-8 w-full md:w-2/3">
          <h2 class="text-lg font-semibold text-blue-700 mb-2">Thông tin giao hàng dự kiến</h2>
          <p id="delivery-date" class="text-2xl font-bold text-blue-800">${deliveryDate.toLocaleDateString('vi-VN')}</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <a href="#" onclick="handleNavigate('/')" class="flex-1 sm:flex-none py-3 px-8 rounded-lg bg-orange-500 text-white text-lg font-semibold">Tiếp tục mua sắm</a>
          <a href="#" onclick="handleNavigate('/order-tracking')" class="flex-1 sm:flex-none py-3 px-8 rounded-lg bg-gray-200 text-gray-700 text-lg font-semibold">Theo dõi đơn hàng</a>
        </div>
      </div>
    </div>`;
};

// Add event handlers to global scope
window.handleNavigate = handleNavigate;
window.openReviewModal = openReviewModal;
window.handleCancelOrder = handleCancelOrder;
window.renderPage = () => {
  const main = document.querySelector('main');
  main.innerHTML = createHomePage();
};