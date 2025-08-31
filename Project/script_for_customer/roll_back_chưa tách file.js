// Import state and state setters
import { currentPath, auth, reviewModalState } from './state.js';
import { setAuth, setAdminCurrentView } from './state.js';

// Import navigation and utility functions
import { handleNavigate, handleSearchFromHeader, handleSort } from './navigation.js';
import { logout } from './components/header.js';
import { handleAddToCart, handleToggleCartItem, handleUpdateCartItemQuantity, handleRemoveCartItem, handleShowVoucherList, handleHideVoucherList, handleApplyVoucher, handleRemoveVoucher } from './components/user/cart.js';
import { handleCheckout, handlePlaceOrder } from './components/user/checkout.js';

import { handleAuthSubmit } from './components/user/auth.js';
import { handleSaveProfile } from './components/user/profile.js';
import { handleCancelOrder } from './components/user/order.js';
import { openReviewModal, closeReviewModal, handleReviewSubmit } from './components/user/review.js';

window.handleNavigate = handleNavigate; // Sửa lỗi ở đây
window.logout = logout;
window.handleAuthSubmit = handleAuthSubmit;
window.handleSaveProfile = handleSaveProfile;
window.handleCancelOrder = handleCancelOrder;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.handleReviewSubmit = handleReviewSubmit;
window.handleSearchFromHeader = handleSearchFromHeader; // THÊM DÒNG NÀY
window.handleSort = handleSort; // Thêm cả hàm sort
window.handleAddToCart = handleAddToCart; // Thêm các hàm của cart
window.handleToggleCartItem = handleToggleCartItem;
window.handleUpdateCartItemQuantity = handleUpdateCartItemQuantity;
window.handleRemoveCartItem = handleRemoveCartItem;
window.handleShowVoucherList = handleShowVoucherList;
window.handleHideVoucherList = handleHideVoucherList;
window.handleApplyVoucher = handleApplyVoucher;
window.handleRemoveVoucher = handleRemoveVoucher;
window.handleCheckout = handleCheckout;
window.handlePlaceOrder = handlePlaceOrder;

// Import page creation functions
import { createHomePage, initCarousel, loadProducts, loadVouchers } from './components/user/home.js';
import { createBookDetailPage } from './components/user/book.js';
import { createCartPage, syncCartWithDatabase } from './components/user/cart.js';
import { createAuthPages } from './components/user/auth.js';
import { createProfilePage } from './components/user/profile.js';
import { createCheckoutPage } from './components/user/checkout.js';
import { createOrderTrackingPage } from './components/user/order.js';
import { createOrderSuccessPage } from './components/user/order.js';
import { createAdminPage } from './components/admin/admin.js';
import { createHeader, initAccountMenu } from './components/header.js';
import { createReviewModal } from './components/user/review.js';

// Global function to set admin view and re-render
window.setAdminViewAndRender = (view) => {
    setAdminCurrentView(view);
    renderPage();
};

export const renderPage = () => {
  const pageContainer = document.getElementById('page-container');
  const headerContainer = document.getElementById('header-container');

  const isSpecialPage = ['/login', '/register', '/forgot-password', '/admin'].includes(currentPath);
  headerContainer.innerHTML = isSpecialPage ? '' : createHeader();

  if (!isSpecialPage) {
    initAccountMenu();
  }

  let pageContent = '';
  switch (currentPath) {
    case '/': pageContent = createHomePage(); break;
    case '/book': pageContent = createBookDetailPage(); break;
    case '/cart': pageContent = createCartPage(); break;
    case '/login': pageContent = createAuthPages('login'); break;
    case '/register': pageContent = createAuthPages('register'); break;
    case '/forgot-password': pageContent = createAuthPages('forgot-password'); break;
    case '/profile': pageContent = createProfilePage(); break;
    case '/checkout': pageContent = createCheckoutPage(); break;
    case '/order-tracking': pageContent = createOrderTrackingPage(); break;
    case '/order-success': pageContent = createOrderSuccessPage(); break;
    case '/admin': pageContent = createAdminPage(); break;
    default: pageContent = createHomePage(); break;
  }
  
  const oldModal = document.getElementById('review-modal');
  if(oldModal) oldModal.remove();
  
  pageContainer.innerHTML = pageContent;
  
  if(reviewModalState.isOpen){
      document.body.insertAdjacentHTML('beforeend', createReviewModal());
  }

  if (currentPath === "/") {
    initCarousel(); 
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const savedAuth = localStorage.getItem("auth");
  if (savedAuth) {
    try {
      const user = JSON.parse(savedAuth);
      setAuth({ user });
      
      // Sync user data with server
      const res = await fetch(`http://localhost:3000/users/${user.user_id}`);
      if (res.ok) {
        const freshUserData = await res.json();
        setAuth({ user: freshUserData });
        localStorage.setItem("auth", JSON.stringify(freshUserData));
        console.log("✅ Đồng bộ thông tin người dùng thành công!");
      } else {
        console.warn("Người dùng không tồn tại, tự động đăng xuất.");
        logout();
      }
    } catch (err) {
      console.error("❌ Lỗi khi đồng bộ lại thông tin người dùng:", err);
      // Keep old data if server fails
    }
  }

  await loadProducts();
  await loadVouchers(); 
  if (auth.user) {
    await syncCartWithDatabase();
  }

  // Initial render
  renderPage();
});