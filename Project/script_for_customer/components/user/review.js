import { auth, reviewModalState } from '../../state.js';
import { setReviewModalState } from '../../state.js';
import { showMessage } from '../../utils.js';
import { loadUserBills } from './order.js';
import { renderPage } from '../../app.js';

export const openReviewModal = (productId, productTitle, billId) => {
    setReviewModalState({ isOpen: true, productId, productTitle, billId });
    renderPage();
};

export const closeReviewModal = () => {
    setReviewModalState({ ...reviewModalState, isOpen: false });
    renderPage();
};

export const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('review-comment').value;

    if (!rating) {
        showMessage("Vui lòng chọn số sao đánh giá.");
        return;
    }

    const { productId, billId } = reviewModalState;
    const userId = auth.user.user_id;

    try {
        const res = await fetch('http://localhost:3000/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, billId, rating: parseInt(rating), comment })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message);
            closeReviewModal();
            await loadUserBills();
            renderPage();
        } else {
            showMessage(`Lỗi: ${data.message}`);
        }
    } catch (err) {
        console.error("Lỗi API khi gửi review:", err);
        showMessage("Lỗi kết nối server khi gửi đánh giá.");
    }
};

export const createReviewModal = () => {
    if (!reviewModalState.isOpen) return '';
    return `
    <div id="review-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
        <div class="bg-white rounded-lg p-8 w-full max-w-md relative">
            <button onclick="closeReviewModal()" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800">&times;</button>
            <h2 class="text-2xl font-bold mb-2">Đánh giá sản phẩm</h2>
            <p class="text-gray-700 mb-6 font-semibold">${reviewModalState.productTitle}</p>
            <form onsubmit="handleReviewSubmit(event)">
                <div class="mb-6">
                    <label class="block text-lg font-medium mb-3">Chất lượng sản phẩm:</label>
                    <div class="flex flex-row-reverse justify-end items-center" id="star-rating">
                        <input type="radio" id="star5" name="rating" value="5" class="hidden"/><label for="star5" title="5 sao" class="star">&#9733;</label>
                        <input type="radio" id="star4" name="rating" value="4" class="hidden"/><label for="star4" title="4 sao" class="star">&#9733;</label>
                        <input type="radio" id="star3" name="rating" value="3" class="hidden"/><label for="star3" title="3 sao" class="star">&#9733;</label>
                        <input type="radio" id="star2" name="rating" value="2" class="hidden"/><label for="star2" title="2 sao" class="star">&#9733;</label>
                        <input type="radio" id="star1" name="rating" value="1" class="hidden"/><label for="star1" title="1 sao" class="star">&#9733;</label>
                    </div>
                </div>
                <div class="mb-6">
                    <label for="review-comment" class="block text-lg font-medium mb-2">Bình luận của bạn:</label>
                    <textarea id="review-comment" rows="4" placeholder="Sản phẩm này tuyệt vời..." class="w-full p-2 border border-gray-300 rounded-lg"></textarea>
                </div>
                <button type="submit" class="w-full py-3 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">Gửi đánh giá</button>
            </form>
        </div>
    </div>`;
};

// Add event handlers to global scope
window.closeReviewModal = closeReviewModal;
window.handleReviewSubmit = handleReviewSubmit;
