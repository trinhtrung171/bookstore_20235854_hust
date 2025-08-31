/**
 * components/header.js
 * Chịu trách nhiệm tạo và quản lý các chức năng của header.
 *
 * Lưu ý: Các hàm trong thuộc tính onclick (ví dụ: onclick="handleNavigate('/')")
 * cần được gán vào đối tượng `window` trong file app.js (entry point) để có thể được truy cập toàn cục.
 * Ví dụ trong app.js:
 * import { handleNavigate } from './navigation.js';
 * window.handleNavigate = handleNavigate;
 */

// Import các state và hàm cần thiết từ các module khác
import { state } from '../../state.js';
import { showMessage } from '../../utils.js';
import { handleNavigate } from '../navigation.js'; 


/**
 * Tạo chuỗi HTML cho toàn bộ component header.
 * @returns {string} - Chuỗi HTML của header.
 */
export const createHeader = () => {
    const user = state.auth.user;
    const isLoggedIn = !!user;
    const cartItemCount = state.cartItems.reduce((total, item) => total + item.quantity, 0);

    return `
    <div class="bg-white text-card-foreground shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <a href="#" onclick="handleNavigate('/')" class="flex items-center">
                    <img src="./image/logo.png" alt="Hust Book Store" class="h-20 w-20 object-fill">
                </a>

                <div class="flex-1 px-6 max-w-3xl mx-auto py-4">
                    <input
                        id="header-search"
                        type="text"
                        placeholder="Tìm kiếm sách..."
                        value="${state.searchTerm}"
                        oninput="handleSearchFromHeader(this.value)"
                        onkeydown="if(event.key==='Enter') handleSearchFromHeader(this.value, true)"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="flex items-center space-x-4 py-4">
                    <button onclick="handleNavigate('/cart')" class="relative text-gray-500 hover:text-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        ${cartItemCount > 0 ? `<span class="absolute -top-1 -right-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold">${cartItemCount}</span>` : ''}
                    </button>

                    ${isLoggedIn ? `
                        <div class="relative" id="account-menu-container">
                            <button id="account-menu-trigger" class="text-base font-medium text-gray-600 hover:text-gray-900" type="button">
                                Chào, ${user.username}
                            </button>
                            <div id="account-menu" class="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white text-gray-900 ring-1 ring-gray-200 hidden">
                                <div class="py-1">
                                    ${user.role ? `<a href="#" onclick="handleNavigate('/admin')" class="block px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-gray-100">Trang Admin</a>` : ''}
                                    <a href="#" onclick="handleNavigate('/profile')" class="block px-4 py-2 text-sm hover:bg-gray-100">Hồ sơ</a>
                                    <a href="#" onclick="handleNavigate('/order-tracking')" class="block px-4 py-2 text-sm hover:bg-gray-100">Theo dõi đơn hàng</a>                  
                                    <a href="#" onclick="logout()" class="block px-4 py-2 text-sm hover:bg-gray-100">Đăng xuất</a>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="flex space-x-2">
                            <a href="#" onclick="handleNavigate('/login')" class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold">Đăng nhập</a>
                            <a href="#" onclick="handleNavigate('/register')" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold hidden sm:inline-block">Đăng ký</a>
                        </div>
                    `}
                </div>
            </div>
        </div>
    </div>`;
};

/**
 * Gắn các sự kiện cần thiết cho menu tài khoản sau khi header được render.
 * Hàm này cần được gọi sau mỗi lần `renderPage`.
 */
export function initAccountMenu() {
    const trigger = document.getElementById("account-menu-trigger");
    const menu = document.getElementById("account-menu");
    const container = document.getElementById("account-menu-container");

    if (!trigger || !menu || !container) return;

    // Toggle khi bấm nút
    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
    });

    // Logic để đóng menu khi click ra ngoài
    const clickOutsideHandler = (e) => {
        const cont = document.getElementById("account-menu-container");
        const m = document.getElementById("account-menu");
        if (m && cont && !cont.contains(e.target)) {
            m.classList.add("hidden");
        }
    };

    // Gỡ bỏ listener cũ trước khi thêm mới để tránh leak memory
    document.removeEventListener("click", window.__accountMenuOutsideHandler);
    window.__accountMenuOutsideHandler = clickOutsideHandler;
    document.addEventListener("click", window.__accountMenuOutsideHandler);
}

/**
 * Xử lý logic đăng xuất người dùng.
 */
export function logout() {
    // Cập nhật state
    state.auth.user = null;
    state.cartItems = [];
    state.selectedCartIds = [];

    // Xóa khỏi localStorage
    localStorage.removeItem("auth");

    // Điều hướng về trang chủ và hiển thị thông báo
    handleNavigate("/");
    showMessage('Bạn đã đăng xuất và giỏ hàng đã được xóa!');
}

