import { auth } from '../../state.js';
import { setAuth } from '../../state.js';
import { showMessage } from '../../utils.js';
import { handleNavigate } from '../../navigation.js';

export const createProfilePage = () => {
  if (!auth.user) {
    return `<div class="max-w-xl mx-auto p-6 bg-white shadow rounded-lg"><p>Bạn cần đăng nhập để chỉnh sửa hồ sơ.</p></div>`;
  }
  const u = auth.user;
  return `
    <div class="min-h-screen flex items-center justify-center bg-cover bg-center" style="background-image: url('https://png.pngtree.com/background/20250102/original/pngtree-sophisticated-white-texture-for-a-stunning-background-design-picture-image_15289420.jpg');">
      <div class="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-2xl relative z-10">
        <h1 class="text-2xl font-bold mb-6 text-center">Hồ sơ của tôi</h1>
        <form onsubmit="handleSaveProfile(event)">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <input id="profile-name" type="text" value="${u.username}" class="w-full px-3 py-2 border rounded-lg" required>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value="${u.email}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input id="profile-phone" type="text" value="${u.phone_number || ''}" class="w-full px-3 py-2 border rounded-lg">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input id="profile-address" type="text" value="${u.address || ''}" class="w-full px-3 py-2 border rounded-lg">
          </div>
          <button type="submit" class="w-full px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">Lưu thay đổi</button>
        </form>
      </div>
    </div>`;
};

export const handleSaveProfile = async (e) => {
  e.preventDefault();
  if (!auth.user || !auth.user.user_id) {
    showMessage("Lỗi: Không tìm thấy thông tin người dùng.");
    return;
  }
  
  const updatedData = {
    username: document.getElementById("profile-name").value,
    address: document.getElementById("profile-address").value,
    phone_number: document.getElementById("profile-phone").value,
    email: auth.user.email,
    role: auth.user.role
  };

  try {
    const res = await fetch(`http://localhost:3000/users/${auth.user.user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    const data = await res.json();
    if (res.ok) {
      setAuth({ user: data });
      localStorage.setItem("auth", JSON.stringify(data));
      showMessage("Cập nhật hồ sơ thành công!");
      handleNavigate("/");
    } else {
      showMessage(`Lỗi: ${data.message || 'Cập nhật thất bại.'}`);
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ:", error);
    showMessage("Lỗi kết nối đến server. Vui lòng thử lại.");
  }
};

// Add event handlers to global scope
window.handleSaveProfile = handleSaveProfile;
