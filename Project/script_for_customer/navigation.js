/**
 * navigation.js
 * Xử lý các hành động điều hướng, tìm kiếm và sắp xếp.
 */

// Giả sử các hàm/biến này được import từ các module tương ứng
import { state } from './state.js';
import { renderPage } from '../app.js'; // Cần import hàm render chính
import { showMessage } from '../utils.js';
import { loadAdminData } from '../components/admin/admin.js';
import { loadUserBills } from '../components/user/order.js';
import { loadReviewsForProduct } from '../components/user/book.js';
import { getOrCreateCartId } from '../components/user/cart.js';


let debounceTimeout = null;

export const handleNavigate = async (path, data) => {
    if (state.currentPath === '/cart' && path !== '/cart' && path !== '/checkout') {
        handleDeselectAllOnLeave();
    }
    state.currentPath = path;

    if (path === '/forgot-password') {
        state.forgotPasswordStep = 'verify';
        state.forgotUsername = '';
        state.forgotEmail = '';
    }

    if (path === '/admin') {
        if (!state.auth.user || !state.auth.user.role) {
            showMessage("Bạn không có quyền truy cập trang này.");
            state.currentPath = '/'; // Chuyển hướng về trang chủ
        } else {
            await loadAdminData(); // Tải dữ liệu admin
        }
    }

    if (path === '/order-tracking') {
        await loadUserBills();
    }

    if (path === '/book' && data) {
        state.selectedBook = state.availableBooks.find(b => b.id === data.id);
        state.selectedCategory = null;
        state.quantity = 1;
        await loadReviewsForProduct(state.selectedBook?.id);
    } else if (path === '/' && data && data.category) {
        state.selectedCategory = data.category;
        state.selectedBook = null;
    } else {
        state.selectedCategory = null;
        state.selectedBook = null;
    }

    renderPage();
};

export const handleSearch = (value, immediate = false) => {
    clearTimeout(debounceTimeout);
    state.searchTerm = value;
    if (immediate) {
        renderPage();
    } else {
        debounceTimeout = setTimeout(() => {
            renderPage();
        }, 300); // Giảm thời gian chờ để phản hồi nhanh hơn
    }
};

export function handleSearchFromHeader(value, immediate = false) {
    if (state.currentPath !== '/') {
        state.currentPath = '/';
    }
    handleSearch(value, immediate);
}

export const handleSort = (value) => {
    state.sortOrder = value;
    renderPage();
};

export const handleDeselectAllOnLeave = async () => {
    if (state.selectedCartIds.length === 0) {
        return;
    }

    const cartId = await getOrCreateCartId();
    if (!cartId) return;

    state.selectedCartIds = [];

    try {
        const res = await fetch('http://localhost:3000/cart/deselect-all', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId })
        });

        if (!res.ok) {
            console.error('Lỗi khi bỏ chọn sản phẩm trên server.');
            // Nếu lỗi, nên đồng bộ lại để khôi phục trạng thái đúng từ DB
            // await syncCartWithDatabase(); // Giả sử hàm này tồn tại
        }
    } catch (error) {
        console.error('Lỗi API khi bỏ chọn sản phẩm:', error);
        // await syncCartWithDatabase();
    }
};

