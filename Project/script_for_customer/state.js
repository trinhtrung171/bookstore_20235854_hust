// state.js
export let currentPath = '/';
export let selectedBook = null;
export let selectedCategory = null;
export let searchTerm = '';
export let sortOrder = 'default';
export let cartItems = [];
export let quantity = 1;
export let bookDetailTab = 'description';
export let captchaCode = '';
export let selectedDiscountVoucher = null;
export let selectedShippingVoucher = null;
export let showVoucherList = false;
export let selectedCartIds = [];
export let currentBookReviews = [];
export let reviewModalState = { isOpen: false, productId: null, productTitle: '', billId: null };

export let forgotPasswordStep = 'verify';
export let forgotUsername = '';
export let forgotEmail = '';

export let auth = { user: null };
export let userBills = [];

export let adminCurrentView = 'dashboard';
export let adminData = { stats: null, orders: null, revenue: null };
export let isAddProductModalOpen = false;

export let availableBooks = [];
export let uniqueCategories = [];
export let availableVouchers = [];
