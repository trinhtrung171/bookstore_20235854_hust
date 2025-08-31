import { forgotPasswordStep, forgotUsername, forgotEmail } from '../../state.js';
import { setAuth, setForgotPasswordStep, setForgotUsername, setForgotEmail } from '../../state.js';
import { handleNavigate } from '../../navigation.js';
import { showMessage } from '../../utils.js';
import { syncCartWithDatabase } from './cart.js';
import { renderPage } from '../../app.js';


export const createAuthPages = (mode) => {
    let title = '', content = '', link = '', formContent = '';
    switch (mode) {
        case 'login':
            title = 'Đăng nhập';
            content = `<p class="text-gray-500 text-center mb-6">Chào mừng bạn đến với Hust Book Store!</p>`;
            link = `<div class="links flex justify-between text-sm text-orange-600 mt-4"><a href="#" onclick="handleNavigate('/forgot-password')" class="hover:underline">Quên mật khẩu?</a><a href="#" onclick="handleNavigate('/register')" class="hover:underline">Đăng ký ngay</a></div>`;
            formContent = `<div><label for="login-username" class="block text-sm font-medium text-gray-700">Tên đăng nhập</label><input type="text" id="login-username" required class="w-full px-3 py-2 border rounded-lg"></div><div><label for="login-password" class="block text-sm font-medium text-gray-700">Mật khẩu</label><input type="password" id="login-password" required class="w-full px-3 py-2 border rounded-lg"></div><button type="submit" class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">Đăng nhập</button>`;
            break;
        case 'register':
            title = 'Đăng ký';
            content = `<p class="text-gray-500 text-center mb-6">Tạo tài khoản mới để mua sắm!</p>`;
            link = `<div class="links mt-4 text-center text-sm"><a href="#" onclick="handleNavigate('/login')" class="text-orange-600 hover:underline">Đã có tài khoản? Đăng nhập</a></div>`;
            formContent = `<div><label for="register-email" class="block text-sm font-medium text-gray-700">Email</label><input type="email" id="register-email" required class="w-full px-3 py-2 border rounded-lg"></div><div><label for="register-username" class="block text-sm font-medium text-gray-700">Tên đăng nhập</label><input type="text" id="register-username" required class="w-full px-3 py-2 border rounded-lg"></div><div><label for="register-password" class="block text-sm font-medium text-gray-700">Mật khẩu</label><input type="password" id="register-password" required class="w-full px-3 py-2 border rounded-lg"></div><div><label for="register-confirm" class="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label><input type="password" id="register-confirm" required class="w-full px-3 py-2 border rounded-lg"></div><button type="submit" class="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">Đăng ký</button>`;
            break;
        case 'forgot-password':
            title = 'Quên mật khẩu';
            link = `<div class="links mt-4 text-center text-sm"><a href="#" onclick="handleNavigate('/login')" class="text-orange-600 hover:underline">Quay lại đăng nhập</a></div>`;
            if (forgotPasswordStep === 'verify') {
              formContent = `<div><label for="forgot-username" class="block text-sm font-medium">Tên đăng nhập</label><input type="text" id="forgot-username" required class="w-full px-3 py-2 border rounded-lg"></div><div class="mt-4"><label for="forgot-email" class="block text-sm font-medium">Email</label><input type="email" id="forgot-email" required class="w-full px-3 py-2 border rounded-lg"></div><button type="submit" class="w-full bg-orange-500 text-white py-2 rounded-lg mt-6">Xác thực</button>`;
            } else if (forgotPasswordStep === 'reset') {
              formContent = `<div><label for="new-password" class="block text-sm font-medium">Mật khẩu mới</label><input type="password" id="new-password" required class="w-full px-3 py-2 border rounded-lg"></div><div class="mt-4"><label for="confirm-password" class="block text-sm font-medium">Xác nhận mật khẩu</label><input type="password" id="confirm-password" required class="w-full px-3 py-2 border rounded-lg"></div><button type="submit" class="w-full bg-orange-500 text-white py-2 rounded-lg mt-6">Đặt lại mật khẩu</button>`;
            }
            content = `<p class="text-gray-500 text-center mb-6">Nhập thông tin để đặt lại mật khẩu.</p>`;
    }
    return `<div class="min-h-screen flex items-center justify-center bg-cover bg-center" style="background-image: url('https://freight.cargo.site/t/original/i/9e5708691e64a1e33d917b7303eb44b6187904ee192962ed2e8ee0ff73b9c996/daikanyama_2016_001.jpg');"><div class="bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-4xl relative"><a href="#" onclick="handleNavigate('/')" class="absolute top-4 left-4 z-50 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg><span>Quay lại</span></a><div class="p-8 bg-white/90 backdrop-blur-sm relative" style="background-image: url('./image/auth.jpg'); background-size: cover;"><div class="absolute inset-0 bg-white/80 backdrop-blur-sm"></div><div class="relative z-10"><h1 class="text-3xl font-bold text-center mb-4">${title}</h1>${content}<form class="space-y-4" onsubmit="handleAuthSubmit(event, '${mode}')">${formContent}</form>${link}</div></div></div></div>`;
};

export const handleAuthSubmit = async (e, mode) => {
    e.preventDefault();
    if (mode === 'login') {
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
        if (!username || !password) { showMessage("Vui lòng nhập đủ thông tin."); return; }
        try {
            const res = await fetch("http://localhost:3000/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
            const data = await res.json();
            if (res.ok) {
                setAuth({ user: data.user });
                localStorage.setItem("auth", JSON.stringify(data.user));
                await syncCartWithDatabase();
                handleNavigate("/");
                showMessage("Đăng nhập thành công!");
            } else {
                showMessage(data.message || "Sai tài khoản hoặc mật khẩu.");
            }
        } catch (err) { showMessage("Không thể kết nối tới server."); }
    } else if (mode === 'register') {
        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirm = document.getElementById("register-confirm").value;
        if (password !== confirm) { showMessage("Mật khẩu không khớp."); return; }
        if (!username || !email || !password) { showMessage("Vui lòng nhập đủ thông tin."); return; }
        try {
            const res = await fetch("http://localhost:3000/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, email, password }) });
            const data = await res.json();
            if (res.ok) {
                setAuth({ user: data });
                localStorage.setItem("auth", JSON.stringify(data));
                handleNavigate("/");
                showMessage("Đăng ký thành công!");
            } else {
                showMessage(data.message || "Đăng ký thất bại.");
            }
        } catch (err) { showMessage("Không thể kết nối tới server."); }
    } else if (mode === 'forgot-password') {
        if (forgotPasswordStep === 'verify') {
            const username = document.getElementById('forgot-username').value;
            const email = document.getElementById('forgot-email').value;
            if (!username || !email) { showMessage('Vui lòng nhập đủ thông tin.'); return; }
            try {
                const res = await fetch("http://localhost:3000/api/forgot-password", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email }) });
                const data = await res.json();
                if (res.ok) {
                    showMessage('Xác thực thành công! Vui lòng đặt lại mật khẩu.');
                    setForgotPasswordStep('reset');
                    setForgotUsername(username);
                    setForgotEmail(email);
                    renderPage();
                } else {
                    showMessage(data.message || 'Thông tin không chính xác.');
                }
            } catch (err) { showMessage('Lỗi kết nối server.'); }
        } else if (forgotPasswordStep === 'reset') {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (newPassword !== confirmPassword) { showMessage('Mật khẩu không khớp.'); return; }
            try {
                const res = await fetch("http://localhost:3000/api/reset-password", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: forgotUsername, email: forgotEmail, newPassword }) });
                const data = await res.json();
                if (res.ok) {
                    showMessage('Đặt lại mật khẩu thành công!');
                    setForgotPasswordStep('verify');
                    handleNavigate('/login');
                } else {
                    showMessage(data.message || 'Có lỗi xảy ra.');
                }
            } catch (err) { showMessage('Lỗi kết nối server.'); }
        }
    }
};

// Add event handlers to global scope
window.handleNavigate = handleNavigate;
window.handleAuthSubmit = handleAuthSubmit;
