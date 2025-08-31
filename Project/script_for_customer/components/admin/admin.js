/**
 * components/admin/admin.js
 * Quản lý layout và logic chung cho trang Admin.
 */

import { state } from '../../state.js';
import { showMessage } from '../../utils.js';
import { renderPage } from '../../app.js';
import { renderAdminDashboard } from './dashboard.js';
import { renderAdminOrders } from './orders.js';
import { renderAdminInventory, createAddProductModal } from './inventory.js';
import { renderAdminRevenue } from './revenue.js';

export const loadAdminData = async () => {
    try {
        const [statsRes, ordersRes, revenueRes] = await Promise.all([
            fetch('http://localhost:3000/admin/stats'),
            fetch('http://localhost:3000/admin/orders'),
            fetch('http://localhost:3000/admin/revenue')
        ]);

        if (!statsRes.ok || !ordersRes.ok || !revenueRes.ok) {
            throw new Error('Failed to fetch admin data');
        }

        state.adminData.stats = await statsRes.json();
        state.adminData.orders = await ordersRes.json();
        state.adminData.revenue = await revenueRes.json();
        
        console.log("✅ Admin data loaded:", state.adminData);

    } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu admin:", err);
        showMessage("Không thể tải dữ liệu quản trị viên.");
        state.adminData = { stats: null, orders: null, revenue: null };
    }
};

export const setAdminView = (view) => {
    state.adminCurrentView = view;
    renderPage();
};

export const createAdminPage = () => {
    let content = '';
    switch (state.adminCurrentView) {
        case 'dashboard':
            content = renderAdminDashboard();
            break;
        case 'orders':
            content = renderAdminOrders();
            break;
        case 'inventory':
            content = renderAdminInventory();
            break;
        case 'revenue':
            content = renderAdminRevenue();
            break;
        default:
            content = renderAdminDashboard();
    }

    return `
    <div class="min-h-screen bg-gray-100">
        <div class="flex">
            <aside class="w-64 bg-gray-800 text-white p-4 space-y-2 flex-shrink-0">
                <h2 class="text-2xl font-bold mb-6">Admin Panel</h2>
                <nav>
                    <button onclick="setAdminView('dashboard')" class="w-full text-left px-4 py-2 rounded-lg ${state.adminCurrentView === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Bảng điều khiển</button>
                    <button onclick="setAdminView('orders')" class="w-full text-left px-4 py-2 rounded-lg ${state.adminCurrentView === 'orders' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý đơn hàng</button>
                    <button onclick="setAdminView('inventory')" class="w-full text-left px-4 py-2 rounded-lg ${state.adminCurrentView === 'inventory' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý kho</button>
                    <button onclick="setAdminView('revenue')" class="w-full text-left px-4 py-2 rounded-lg ${state.adminCurrentView === 'revenue' ? 'bg-gray-700' : 'hover:bg-gray-700'}">Quản lý doanh thu</button>
                </nav>
            </aside>

            <main class="flex-1 p-8">
                ${content}
            </main>
        </div>
        ${state.isAddProductModalOpen ? createAddProductModal() : ''}
    </div>
    `;
};