/**
 * utils.js
 * Chứa các hàm tiện ích chung.
 */

/**
 * Hiển thị một thông báo tạm thời (toast message) ở góc màn hình.
 * @param {string} message - Nội dung thông báo cần hiển thị.
 */
export const showMessage = (message) => {
  // Xóa thông báo cũ nếu có
  const existingMessage = document.querySelector('.toast-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageBox = document.createElement('div');
  messageBox.className = 'toast-message fixed bottom-4 right-4 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-xl z-[100] transition-transform duration-300 ease-in-out transform translate-x-full';
  messageBox.textContent = message;

  document.body.appendChild(messageBox);

  // Animate IN
  setTimeout(() => {
    messageBox.classList.remove('translate-x-full');
    messageBox.classList.add('translate-x-0');
  }, 10);

  // Animate OUT
  setTimeout(() => {
    messageBox.classList.remove('translate-x-0');
    messageBox.classList.add('translate-x-full');

    messageBox.addEventListener('transitionend', () => {
      messageBox.remove();
    }, { once: true });
  }, 3000);
};

/**
 * Tạo chuỗi HTML cho các ngôi sao đánh giá sản phẩm.
 * @param {number} rating - Số điểm đánh giá (ví dụ: 4.5).
 * @returns {string} - Chuỗi HTML của các thẻ SVG hình ngôi sao.
 */
export const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const fraction = rating - fullStars;
    const emptyStars = 5 - fullStars - (fraction > 0 ? 1 : 0);
    let stars = '';

    // Sao đầy
    for (let i = 0; i < fullStars; i++) {
        stars += `
        <svg class="w-5 h-5 text-yellow-400 inline-block" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
        </svg>`;
    }

    // Sao phần trăm
    if (fraction > 0) {
        const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`;
        stars += `
        <svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="currentColor">
            <defs>
            <linearGradient id="${gradId}">
                <stop offset="${fraction * 100}%" stop-color="rgb(250 204 21)" />
                <stop offset="${fraction * 100}%" stop-color="rgb(229 231 235)" />
            </linearGradient>
            </defs>
            <path fill="url(#${gradId})" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
        </svg>`;
    }

    // Sao rỗng
    for (let i = 0; i < emptyStars; i++) {
        stars += `
        <svg class="w-5 h-5 text-gray-300 inline-block" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.542 8.281-7.478-4.148-7.479 4.148 1.542-8.281-6.064-5.828 8.332-1.151z"/>
        </svg>`;
    }

    return stars;
};

