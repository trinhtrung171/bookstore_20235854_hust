/**
 * components/admin/orders.js
 * Quản lý và hiển thị đơn hàng.
 */
import { state } from '../../state.js';
import { showMessage } from '../../utils.js';
import { loadAdminData } from './admin.js';
import { renderPage } from '../../app.js';

export const renderAdminOrders = () => {
    if (!state.adminData.orders) return `<p>Đang tải dữ liệu...</p>`;
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
                        <th class="p-3">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.adminData.orders.map(order => `
                        <tr class="border-b">
                            <td class="p-3 font-medium">#${order.bill_id}</td>
                            <td class="p-3">${order.username}</td>
                            <td class="p-3">${new Date(order.purchase_date).toLocaleDateString('vi-VN')}</td>
                            <td class="p-3">${Number(order.total_amount).toLocaleString('vi-VN')}₫</td>
                            <td class="p-3"><span class="px-2 py-1 text-xs rounded-full ${order.status === 'chờ xác nhận' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}">${order.status}</span></td>
                            <td class="p-3">
                                ${order.status === 'chờ xác nhận' ? `
                                <button onclick="handleConfirmOrder(${order.bill_id})" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs">Xác nhận</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

export const handleConfirmOrder = async (billId) => {
    try {
        const res = await fetch(`http://localhost:3000/api/bills/${billId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStatus: 'đã xác nhận' })
        });
        if (!res.ok) throw new Error('Failed to confirm order');
        showMessage('Đã xác nhận đơn hàng!');
        await loadAdminData(); // Tải lại dữ liệu
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};