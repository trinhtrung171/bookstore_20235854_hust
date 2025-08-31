/**
 * components/admin/revenue.js
 * Hiển thị báo cáo doanh thu.
 */

import { state } from '../../state.js';

export const renderAdminRevenue = () => {
    if (!state.adminData.revenue) return `<p>Đang tải dữ liệu...</p>`;
    const { monthly, bestSellers } = state.adminData.revenue;
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
                        </tr>
                    </thead>
                    <tbody>
                        ${monthly.map(row => `
                            <tr class="border-b">
                                <td class="p-3 font-medium">${row.month}</td>
                                <td class="p-3">${row.total_orders}</td>
                                <td class="p-3 font-semibold">${Number(row.total_revenue).toLocaleString('vi-VN')}₫</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-bold mb-4">Sản phẩm bán chạy (Tháng này)</h2>
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