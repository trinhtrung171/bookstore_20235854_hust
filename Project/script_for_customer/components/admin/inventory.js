/**
 * components/admin/inventory.js
 * Quản lý kho hàng (sản phẩm).
 */

import { state } from '../../state.js';
import { showMessage } from '../../utils.js';
import { renderPage } from '../../app.js';
import { loadProducts } from '../user/home.js'; // Cần load lại sản phẩm sau khi thay đổi

export const renderAdminInventory = () => {
    return `
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Quản lý kho</h1>
            <button onclick="openAddProductModal()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Thêm sản phẩm mới</button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
             <table class="w-full text-sm text-left">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="p-3">ID</th>
                        <th class="p-3">Tên sản phẩm</th>
                        <th class="p-3">Tồn kho</th>
                        <th class="p-3">Giá</th>
                        <th class="p-3">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.availableBooks.map(book => `
                         <tr class="border-b">
                            <td class="p-3 font-medium">${book.id}</td>
                            <td class="p-3">${book.title}</td>
                            <td class="p-3">${book.stock}</td>
                            <td class="p-3">${book.price.toLocaleString('vi-VN')}₫</td>
                            <td class="p-3 space-x-2">
                                <button onclick="handleAddStock(${book.id}, ${book.stock})" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs">Thêm SL</button>
                                <button onclick="handleDeleteProduct(${book.id})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

export const createAddProductModal = () => {
    return `
    <div id="add-product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-lg p-8 w-full max-w-2xl">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Thêm sản phẩm mới</h2>
                <button onclick="closeAddProductModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onsubmit="handleAddNewProduct(event)" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label class="block text-sm font-medium">Tên sách</label>
                    <input type="text" id="prod-name" required class="w-full p-2 border rounded">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Tác giả</label>
                    <input type="text" id="prod-author" required class="w-full p-2 border rounded">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Thể loại</label>
                    <input type="text" id="prod-category" required class="w-full p-2 border rounded">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Giá bán</label>
                    <input type="number" id="prod-price" required class="w-full p-2 border rounded">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Số lượng tồn kho</label>
                    <input type="number" id="prod-stock" required class="w-full p-2 border rounded">
                </div>
                 <div>
                    <label class="block text-sm font-medium">URL Hình ảnh</label>
                    <input type="text" id="prod-image" required class="w-full p-2 border rounded">
                </div>
                <div>
                    <label class="block text-sm font-medium">Mô tả</label>
                    <textarea id="prod-description" rows="4" required class="w-full p-2 border rounded"></textarea>
                </div>
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="closeAddProductModal()" class="bg-gray-200 px-4 py-2 rounded">Hủy</button>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Lưu sản phẩm</button>
                </div>
            </form>
        </div>
    </div>
    `;
};

export const openAddProductModal = () => { state.isAddProductModalOpen = true; renderPage(); };
export const closeAddProductModal = () => { state.isAddProductModalOpen = false; renderPage(); };

export const handleAddNewProduct = async (event) => {
    event.preventDefault();
    const newProduct = {
        name: document.getElementById('prod-name').value,
        author: document.getElementById('prod-author').value,
        category: document.getElementById('prod-category').value,
        sell_price: document.getElementById('prod-price').value,
        stock: document.getElementById('prod-stock').value,
        image: document.getElementById('prod-image').value,
        description: document.getElementById('prod-description').value,
    };

    try {
        const res = await fetch('http://localhost:3000/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        if (!res.ok) throw new Error('Failed to add product');
        showMessage('Thêm sản phẩm thành công!');
        closeAddProductModal();
        await loadProducts();
        renderPage();
    } catch (err) {
         showMessage('Lỗi: ' + err.message);
    }
};

export const handleAddStock = async (productId, currentStock) => {
    const amountToAdd = prompt(`Nhập số lượng cần thêm cho sản phẩm ID ${productId}:`, "10");
    if (amountToAdd === null || isNaN(parseInt(amountToAdd))) return;

    const bookToUpdate = state.availableBooks.find(b => b.id === productId);
    if (!bookToUpdate) return;
    
    const updatedData = {
        name: bookToUpdate.title,
        author: bookToUpdate.author,
        category: bookToUpdate.category,
        sell_price: bookToUpdate.price,
        description: bookToUpdate.description,
        image: bookToUpdate.image,
        stock: currentStock + parseInt(amountToAdd)
    };
    
    try {
         const res = await fetch(`http://localhost:3000/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!res.ok) throw new Error('Failed to update stock');
        showMessage('Cập nhật tồn kho thành công!');
        await loadProducts();
        renderPage();
    } catch (err) {
         showMessage('Lỗi: ' + err.message);
    }
};

export const handleDeleteProduct = async (productId) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm ID ${productId}? Hành động này không thể hoàn tác.`)) return;

    try {
        const res = await fetch(`http://localhost:3000/admin/products/${productId}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showMessage(data.message);
        await loadProducts();
        renderPage();
    } catch (err) {
        showMessage('Lỗi: ' + err.message);
    }
};