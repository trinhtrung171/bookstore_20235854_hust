/**
 * components/admin/dashboard.js
 * Hiển thị Bảng điều khiển (Dashboard).
 */

import { state } from '../../state.js';

export const renderAdminDashboard = () => {
    if (!state.adminData.stats) return `<p>Đang tải dữ liệu...</p>`;
    const { totalUsers, totalProducts, pendingOrders, monthlyRevenue } = state.adminData.stats;
    return `
        <h1 class="text-3xl font-bold mb-6">Bảng điều khiển</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm font-medium">TỔNG SỐ TÀI KHOẢN</h3>
                <p class="text-3xl font-bold mt-2">${totalUsers || 0}</p>
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