import 'dotenv/config';       // Load .env
import express from 'express';
import cors from 'cors';
import pkg from 'pg';

import PDFDocument from 'pdfkit';
import fs from 'fs';

const { Pool } = pkg;
const app = express();

app.use(cors());              // Cho phép gọi từ front-end khác port
app.use(express.json());      // Parse JSON body
app.use('/invoices', express.static('invoices'));

// ====== PostgreSQL Pool ======
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT)
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Lỗi khi kết nối tới database', err);
  } else {
    console.log('✅ Kết nối PostgreSQL thành công!');
  }
});

// ====== START SERVER ======
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});


// ====== ROUTES ======

// Route test server
app.get('/', (req, res) => {
  res.send('Server Node.js + PostgreSQL đang chạy!');
});

// ====== GET PRODUCTS (có review) ======
app.get('/products', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.product_id AS id,
        p.name AS title,
        p.author,
        p.category,
        p.sell_price AS price,
        p.description,
        p.star AS rating,
        p.image,
        p.stock,
        p.is_sale,      
        p.discount,    
        p.sale_end,    
        COUNT(r.review_id) AS reviews,
        COALESCE(ROUND(AVG(r.rating), 2), 0) AS avg_rating
      FROM Product p
      LEFT JOIN Review r ON p.product_id = r.product_id
      GROUP BY p.product_id
      ORDER BY p.added_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Lấy danh sách users
app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, username, email, phone_number, address, role, added_date FROM "User"'
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Thêm user mới (KHÔNG hash password)
app.post('/users', async (req, res) => {
  const { username, email, password, phone_number, address, role } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO "User"(username, password, email, phone_number, address, role)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, email, phone_number, address, role, added_date`,
      [username, password, email, phone_number || null, address || null, role || false]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Lấy user theo user_id
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT user_id, username, email, phone_number, address, role, added_date FROM "User" WHERE user_id = $1',
      [id]
    );
    if (rows.length > 0) {
      // Trả về thông tin người dùng nếu tìm thấy
      res.json(rows[0]);
    } else {
      // Báo lỗi nếu không tìm thấy
      res.status(404).send('Không tìm thấy người dùng');
    }
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Cập nhật user theo user_id
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, phone_number, address, role, password } = req.body;
  try {
    // Lấy mật khẩu hiện tại từ DB
    const userRes = await pool.query('SELECT password FROM "User" WHERE user_id=$1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (password !== userRes.rows[0].password) {
      return res.status(401).json({ message: "Mật khẩu xác nhận không đúng." });
    }

    const { rows } = await pool.query(
      `UPDATE "User"
       SET email=$1, phone_number=$2, address=$3, role=$4
       WHERE user_id=$5
       RETURNING user_id, username, email, phone_number, address, role, added_date`,
      [email, phone_number || null, address || null, role || false, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Xóa user theo user_id
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM "User" WHERE user_id=$1', [id]);
    res.send(`User ${id} đã bị xóa`);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ====== LOGIN (so sánh plain text với username) ======
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM "User" WHERE username = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tên đăng nhập không tồn tại' });
    }

    const user = rows[0];

    if (password !== user.password) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    res.json({
      message: 'Đăng nhập thành công!',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        role: user.role,
        added_date: user.added_date
      }
    });
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Route lấy tất cả vouchers đang có hiệu lực
app.get('/vouchers', async (req, res) => {
  let client;
  try {
    // Kết nối đến database
    client = await pool.connect(); 

    // Thực hiện truy vấn SQL, chỉ lấy voucher có hiệu lực trong ngày hôm nay
    const sql = `
      SELECT * FROM Voucher 
      WHERE start_date <= NOW() AND end_date >= NOW();
    `;
    const result = await client.query(sql);

    // Trả về danh sách voucher dưới dạng JSON
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu vouchers:', err);
    // Trả về lỗi nếu có
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    // Luôn đóng kết nối sau khi hoàn tất
    if (client) {
      client.release();
    }
  }
});

// Route xác thực quên mật khẩu (kiểm tra username + email)
app.post('/api/forgot-password', async (req, res) => {
  const { username, email } = req.body;
  let client;
  try {
    client = await pool.connect();
    const userQuery = 'SELECT * FROM "User" WHERE username = $1 AND email = $2';
    const userResult = await client.query(userQuery, [username, email]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Tên đăng nhập hoặc email không chính xác.' });
    }
    res.status(200).json({ message: 'Xác thực thành công!' });
  } catch (err) {
    console.error('Lỗi khi xác thực quên mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
  } finally {
    if (client) client.release();
  }
});

// Route xử lý yêu cầu đặt lại mật khẩu
app.post('/api/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;
  let client;
  try {
    client = await pool.connect();
    // Kiểm tra lại username/email
    const userQuery = 'SELECT * FROM "User" WHERE username = $1 AND email = $2';
    const userResult = await client.query(userQuery, [username, email]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Tên đăng nhập hoặc email không chính xác.' });
    }
    // Cập nhật mật khẩu mới
    await client.query(
      'UPDATE "User" SET password = $1 WHERE username = $2 AND email = $3',
      [newPassword, username, email]
    );
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (err) {
    console.error('Lỗi khi đặt lại mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
  } finally {
    if (client) client.release();
  }
});

// Lấy giỏ hàng theo user_id
app.get('/cart', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: 'Thiếu tham số user_id.' });
  }
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query('SELECT * FROM Cart WHERE user_id = $1', [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// Tạo mới giỏ hàng cho user
app.post('/cart', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: 'Thiếu tham số user_id.' });
  }
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'INSERT INTO Cart (user_id) VALUES ($1) RETURNING *',
      [user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// Lấy danh sách sản phẩm trong giỏ hàng HOẶC kiểm tra một sản phẩm cụ thể
app.get('/cart/items', async (req, res) => {
  const { cart_id, product_id } = req.query;

  if (!cart_id) {
    return res.status(400).json({ message: 'Thiếu tham số cart_id.' });
  }

  let client;
  try {
    client = await pool.connect();
    let query = 'SELECT * FROM CartItem WHERE cart_id = $1';
    const values = [cart_id];

    if (product_id) {
      query += ' AND product_id = $2';
      values.push(product_id);
    }

    const { rows } = await client.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// *** ADD: Thêm sản phẩm mới vào giỏ hàng ***
app.post('/cart/items', async (req, res) => {
    const { cart_id, product_id, quantity, is_selected } = req.body;
    if (!cart_id || !product_id || !quantity) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết.' });
    }
    let client;
    try {
        client = await pool.connect();
        const { rows } = await client.query(
            'INSERT INTO CartItem (cart_id, product_id, quantity, is_selected) VALUES ($1, $2, $3, $4) RETURNING *',
            [cart_id, product_id, quantity, is_selected]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error("❌ Lỗi SQL khi thêm vào giỏ:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    } finally {
        if (client) client.release();
    }
});

// *** ADD: Cập nhật số lượng sản phẩm trong giỏ hàng ***
app.patch('/cart/items/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;
    const { quantity, is_selected } = req.body;

    // Build the query dynamically
    let setClauses = [];
    let values = [];
    let paramIndex = 1;

    if (quantity !== undefined) {
        setClauses.push(`quantity = $${paramIndex++}`);
        values.push(quantity);
    }
    if (is_selected !== undefined) {
        setClauses.push(`is_selected = $${paramIndex++}`);
        values.push(is_selected);
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Không có trường nào để cập nhật.' });
    }

    values.push(cart_item_id);

    const query = `UPDATE CartItem SET ${setClauses.join(', ')} WHERE cart_item_id = $${paramIndex} RETURNING *`;
    
    let client;
    try {
        client = await pool.connect();
        const { rows } = await client.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error("❌ Lỗi SQL khi cập nhật giỏ hàng:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    } finally {
        if (client) client.release();
    }
});

// *** ADD: Bỏ chọn tất cả sản phẩm trong giỏ hàng ***
app.patch('/cart/deselect-all', async (req, res) => {
    const { cart_id } = req.body;
    if (!cart_id) {
        return res.status(400).json({ message: 'Thiếu tham số cart_id.' });
    }
    
    let client;
    try {
        client = await pool.connect();
        const { rowCount } = await client.query(
            'UPDATE CartItem SET is_selected = false WHERE cart_id = $1 AND is_selected = true',
            [cart_id]
        );
        res.status(200).json({ 
            message: 'Đã bỏ chọn tất cả sản phẩm thành công.',
            updatedItems: rowCount 
        });
    } catch (err) {
        console.error("❌ Lỗi SQL khi bỏ chọn hàng loạt:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    } finally {
        if (client) client.release();
    }
});

// Xóa sản phẩm khỏi giỏ hàng
app.delete('/cart/items', async (req, res) => {
  const { cart_id, product_id } = req.body;
  if (!cart_id || !product_id) {
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm hoặc giỏ hàng.' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query(
      'DELETE FROM CartItem WHERE cart_id = $1 AND product_id = $2',
      [cart_id, product_id]
    );
    res.status(200).json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công.' });
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// gọi API thêm vào yêu thích
app.post('/favorites', async (req, res) => {
  const { user_id, book_id } = req.body;
  if (!user_id || !book_id) {
    return res.status(400).json({ message: 'Thiếu user_id hoặc book_id.' });
  }
  let client;
  try {
    client = await pool.connect();
    // Thêm vào bảng favorites, nếu đã tồn tại thì báo lỗi
    await client.query(
      `INSERT INTO favorites (user_id, book_id) VALUES ($1, $2)
       ON CONFLICT (user_id, book_id) DO NOTHING`,
      [user_id, book_id]
    );
    res.status(201).json({ message: 'Đã thêm vào yêu thích!' });
  } catch (err) {
    console.error("❌ Lỗi SQL khi thêm vào favorites:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// lấy danh sách yêu thích
app.get('/favorites', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: 'Thiếu user_id.' });
  }
  let client;
  try {
    client = await pool.connect();
    // Lấy danh sách sách yêu thích của user
    const result = await client.query(`
      SELECT 
        f.favorite_id,
        p.product_id AS book_id,
        p.name AS title,
        p.author,
        p.category,
        p.sell_price AS price,
        p.description,
        p.star AS rating,
        p.image,
        p.stock,
        COUNT(r.review_id) AS reviews
      FROM favorites f
      JOIN product p ON f.book_id = p.product_id
      LEFT JOIN review r ON p.product_id = r.product_id
      WHERE f.user_id = $1
      GROUP BY f.favorite_id, p.product_id
      ORDER BY f.created_at DESC
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Lỗi SQL khi lấy favorites:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// flash sale
app.get('/flash-sale', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.product_id AS id,
        p.name AS title,
        p.author,
        p.category,
        p.sell_price AS price,
        p.description,
        p.star AS rating,
        p.image,
        p.stock,
        p.is_sale,
        p.discount,
        p.sale_end,
        COUNT(r.review_id) AS reviews,
        COALESCE(ROUND(AVG(r.rating), 2), 0) AS avg_rating
      FROM Product p
      LEFT JOIN Review r ON p.product_id = r.product_id
      WHERE p.is_sale = TRUE AND p.sale_end > NOW()
       GROUP BY 
          p.product_id, 
          p.name, 
          p.author, 
          p.category, 
          p.sell_price, 
          p.description, 
          p.star, 
          p.image, 
          p.stock, 
          p.is_sale, 
          p.discount, 
          p.sale_end
      ORDER BY p.sale_end ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi SQL Flash Sale:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ==============================================================
// ==============================================================
// ===================== BILL ROUTES =========================== 
// ==============================================================
// ==============================================================

// Lấy tất cả hóa đơn của một user (có kiểm tra review)
app.get('/bills/user/:userId', async (req, res) => {
  const { userId } = req.params;
  let client;
  try {
    client = await pool.connect();
    // SỬA ĐỔI: Tính toán động các giá trị chi tiết thay vì lấy từ cột
    const billsResult = await client.query(
      `WITH BillDetails AS (
          SELECT
              bi.bill_id,
              SUM(bi.price_at_purchase * bi.quantity) AS calculated_subtotal
          FROM BillItem bi
          GROUP BY bi.bill_id
      ),
      VoucherDetails AS (
          SELECT
              bv.bill_id,
              COALESCE(SUM(v.discount), 0) AS calculated_discount
          FROM BillVouchers bv
          JOIN Voucher v ON bv.voucher_id = v.voucher_id
          WHERE v.voucher_type = 'product'
          GROUP BY bv.bill_id
      )
      SELECT 
          b.bill_id, 
          b.user_id, 
          b.total_amount, 
          b.purchase_date, 
          b.expected_delivery_date, 
          b.delivery_date, 
          b.cancellation_reason, 
          b.status, 
          b.shipping_name, 
          b.shipping_address, 
          b.shipping_phone, 
          COALESCE(bd.calculated_subtotal, 0) AS subtotal,
          COALESCE(vd.calculated_discount, 0) AS discount_amount,
          -- Tính phí ship: total - subtotal + discount
          (b.total_amount - COALESCE(bd.calculated_subtotal, 0) + COALESCE(vd.calculated_discount, 0)) AS shipping_fee
      FROM Bill b
      LEFT JOIN BillDetails bd ON b.bill_id = bd.bill_id
      LEFT JOIN VoucherDetails vd ON b.bill_id = vd.bill_id
      WHERE b.user_id = $1 
      ORDER BY b.purchase_date DESC`,
      [userId]
    );
    const bills = billsResult.rows;

    // Với mỗi hóa đơn, lấy chi tiết các sản phẩm bên trong
    for (const bill of bills) {
      const itemsResult = await client.query(
        `SELECT 
           bi.quantity, 
           bi.price_at_purchase, 
           p.product_id,
           p.name as title, 
           p.image,
           -- Thêm dòng này: Kiểm tra xem có review nào khớp với bill_id, user_id, và product_id không
           EXISTS (
             SELECT 1 FROM Review r 
             WHERE r.bill_id = bi.bill_id AND r.user_id = $1 AND r.product_id = bi.product_id
           ) as is_reviewed
         FROM BillItem bi
         JOIN Product p ON bi.product_id = p.product_id
         WHERE bi.bill_id = $2`,
        [userId, bill.bill_id] // Truyền userId vào query
      );
      bill.items = itemsResult.rows;

      if (bill.status === 'đã giao') {
      bill.invoice_pdf = `invoices/invoice_${bill.bill_id}.pdf`;
    }
  }

    res.json(bills);
  } catch (err) {
    console.error("❌ Lỗi SQL khi lấy hóa đơn:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

//hàm thêm ngày (dùng trong shipping)
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

app.post('/bills', async (req, res) => {
    // Nhận cả hai loại voucher code
    const {
        userId, items, shippingDetails, totals, usedVoucherCode, usedShippingVoucherCode
    } = req.body;

    if (!userId || !items || !shippingDetails || !totals || items.length === 0) {
        return res.status(400).json({ message: 'Thiếu dữ liệu hoặc không có sản phẩm để tạo hóa đơn.' });
    }

    let client; 
    try {
        client = await pool.connect(); 
        await client.query('BEGIN');

        // --- START: LOGIC TÍNH LỢI NHUẬN ĐÃ SỬA ---
        let totalRevenueFromProducts = 0;
        let totalImportPrice = 0;

        for (const item of items) {
            // Cộng dồn doanh thu thực tế từ sản phẩm (giá đã tính sale)
            totalRevenueFromProducts += item.book.price_at_purchase * item.quantity;

            // Truy vấn giá nhập của từng sản phẩm từ DB
            const productInfo = await client.query(
                'SELECT import_price FROM Product WHERE product_id = $1',
                [item.book.id]
            );
            if (productInfo.rows.length > 0 && productInfo.rows[0].import_price) {
                totalImportPrice += productInfo.rows[0].import_price * item.quantity;
            }
        }
        // Lợi nhuận = (Doanh thu thực tế từ sản phẩm - Tổng giá nhập) - Giảm giá từ VOUCHER
        const calculatedProfit = totalRevenueFromProducts - totalImportPrice - totals.discount;

        for (const item of items) {
            const stockCheck = await client.query('SELECT stock FROM Product WHERE product_id = $1', [item.book.id]);
            if (stockCheck.rows.length === 0 || stockCheck.rows[0].stock < item.quantity) {
                 await client.query('ROLLBACK');
                 return res.status(400).json({ message: `Sản phẩm "${item.book.title}" không đủ số lượng tồn kho.` });
            }
        }
        
        const billQuery = `
            INSERT INTO Bill (user_id, total_amount, status, shipping_name, shipping_address, shipping_phone, profit)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING bill_id;
        `;
        const billValues = [
            userId, totals.finalTotal, 'chờ xác nhận',
            shippingDetails.name, shippingDetails.address, shippingDetails.phone,
            calculatedProfit
        ];
        const newBillResult = await client.query(billQuery, billValues);
        const newBillId = newBillResult.rows[0].bill_id;

        // SỬA ĐỔI: Dùng price_at_purchase khi thêm BillItem
        for (const item of items) {
            await client.query(
                'INSERT INTO BillItem (bill_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [newBillId, item.book.id, item.quantity, item.book.price_at_purchase]
            );
            await client.query(
                'UPDATE Product SET stock = stock - $1 WHERE product_id = $2',
                [item.quantity, item.book.id]
            );
        }

        // --- LOGIC MỚI: Xử lý và lưu nhiều voucher ---
        const usedVoucherCodes = [];
        if (usedVoucherCode) usedVoucherCodes.push(usedVoucherCode);
        if (usedShippingVoucherCode) usedVoucherCodes.push(usedShippingVoucherCode);

        if (usedVoucherCodes.length > 0) {
            // Lặp qua từng code để lấy id, lưu vào BillVouchers và giảm số lượng
            for (const code of usedVoucherCodes) {
                const voucherResult = await client.query(
                    'SELECT voucher_id FROM Voucher WHERE code = $1',
                    [code]
                );
                
                if (voucherResult.rows.length > 0) {
                    const voucherId = voucherResult.rows[0].voucher_id;
                    
                    // Lưu vào bảng trung gian
                    await client.query(
                        'INSERT INTO BillVouchers (bill_id, voucher_id) VALUES ($1, $2)',
                        [newBillId, voucherId]
                    );

                    // Giảm số lượng voucher
                    await client.query(
                        'UPDATE Voucher SET remaining = remaining - 1 WHERE voucher_id = $1 AND remaining > 0',
                        [voucherId]
                    );
                }
            }
        }

        // (Xóa sản phẩm khỏi giỏ hàng giữ nguyên...)
        const productIds = items.map(item => item.book.id);
        const cartResult = await client.query('SELECT cart_id FROM Cart WHERE user_id = $1', [userId]);
        if (cartResult.rows.length > 0) {
            const cartId = cartResult.rows[0].cart_id;
            await client.query(
                'DELETE FROM CartItem WHERE cart_id = $1 AND product_id = ANY($2::int[])',
                [cartId, productIds]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Đặt hàng thành công!', bill_id: newBillId });

    } catch (err) {
        if (client) await client.query('ROLLBACK'); // Kiểm tra client trước khi rollback
        console.error("❌ Lỗi SQL khi tạo hóa đơn:", err);
        res.status(500).json({ message: 'Đặt hàng thất bại: ' + err.message });
    } finally {
        if (client) client.release(); // Luôn giải phóng client nếu nó đã được kết nối
    }
});

// server.js

// chuyển trạng thái đơn hàng kèm gửi thông báo cho người dùng, nếu đã giao thì gửi hóa đơn
app.put('/api/bills/:id/status', async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Lấy thông tin bill và user
    const billInfoResult = await client.query(
      `SELECT b.*, u.username, u.email 
       FROM Bill b JOIN "User" u ON b.user_id = u.user_id 
       WHERE b.bill_id = $1`, [id]
    );
    if (billInfoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    const billInfo = billInfoResult.rows[0];

    // XỬ LÝ CHO TỪNG TRẠNG THÁI
    if (newStatus === 'đã giao') {
        // Lấy danh sách sản phẩm trong bill
        const itemsResult = await client.query(
          `SELECT bi.quantity, bi.price_at_purchase, p.name, p.image
           FROM BillItem bi JOIN Product p ON bi.product_id = p.product_id
           WHERE bi.bill_id = $1`, [id]
        );
        const items = itemsResult.rows;

        const doc = new PDFDocument({ margin: 50 });
        const filePath = `invoices/invoice_${id}.pdf`;
        doc.pipe(fs.createWriteStream(filePath));
        doc.font('./fonts/DejaVuSans.ttf');

        // Logo chìm ở giữa
        doc.opacity(0.08);
        doc.image('./image/logo.png', doc.page.width / 2 - 120, doc.page.height / 2 - 120, { width: 240 });
        doc.opacity(1);

        // Tiêu đề bên trái, ngày bên phải
        doc.fontSize(22).text('CỬA HÀNG SÁCH BÁCH KHOA', 50, 60, { align: 'left' });
        doc.fontSize(12).text(`Ngày ${new Date().getDate()} tháng ${new Date().getMonth()+1} năm ${new Date().getFullYear()}`, 0, 60, { align: 'right' });

        doc.moveDown(2);

        // Thông tin khách hàng
        doc.fontSize(12);
        doc.text('HÓA ĐƠN ĐƯỢC GỬI CHO:', 50, 120);
        doc.text(`Khách hàng: ${billInfo.shipping_name}\nSố điện thoại: ${billInfo.shipping_phone}\nĐịa chỉ: ${billInfo.shipping_address}`, 50, 140);

        doc.moveDown(2);

        // Bảng sản phẩm (Giữ nguyên logic tạo bảng của bạn)
        const tableTop = doc.y;
        const colWidths = [280, 80, 100, 100];
        const startX = 50;
        doc.fontSize(10);
        doc.text('HẠNG MỤC', startX, tableTop);
        doc.text('SỐ LƯỢNG', startX + colWidths[0], tableTop, { width: colWidths[1], align: 'center' });
        doc.text('ĐƠN GIÁ', startX + colWidths[0] + colWidths[1], tableTop, { width: colWidths[2], align: 'right' });
        doc.text('TỔNG CỘNG', startX + colWidths[0] + colWidths[1] + colWidths[2], tableTop, { width: colWidths[3], align: 'right' });
        doc.moveTo(startX, doc.y).lineTo(startX + colWidths.reduce((a,b)=> a+b), doc.y).stroke();
        doc.moveDown(1);
        
        items.forEach(item => {
            const y = doc.y;
            doc.text(item.name, startX, y, { width: colWidths[0] });
            doc.text(item.quantity, startX + colWidths[0], y, { width: colWidths[1], align: 'center' });
            doc.text(`${Number(item.price_at_purchase).toLocaleString('vi-VN')}₫`, startX + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: 'right' });
            doc.text(`${(item.quantity * item.price_at_purchase).toLocaleString('vi-VN')}₫`, startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], align: 'right' });
            doc.moveDown(1);
        });

        doc.moveTo(startX, doc.y).lineTo(startX + colWidths.reduce((a,b)=> a+b), doc.y).stroke();
        doc.moveDown(2);

        // Tổng tiền
        const totalY = doc.y;
        doc.text(`Tổng tiền sản phẩm:`, startX, totalY, { width: 400, align: 'right' });
        doc.text(`${Number(billInfo.total_amount).toLocaleString('vi-VN')}₫`, startX + 400, totalY, { width: 160, align: 'right' });
        
        // ... giữ nguyên phần còn lại của logic tạo PDF ...
        doc.end();

        const query = 'UPDATE Bill SET status = $1, delivery_date = $2 WHERE bill_id = $3 RETURNING *';
        const params = [newStatus, new Date().toISOString(), id];
        const { rows } = await client.query(query, params);
        await client.query('COMMIT');
        return res.json({ ...rows[0], invoice_pdf: filePath });

    } else {
        // <<<<<<<<<<<<<<< PHẦN BỔ SUNG QUAN TRỌNG >>>>>>>>>>>>>>>
        // Xử lý các trạng thái khác: 'đã xác nhận', 'đang giao hàng'
        let query = '';
        let params = [];
        
        if (newStatus === 'đã xác nhận') {
            // Khi xác nhận, tính ngày giao hàng dự kiến (ví dụ: 3-5 ngày sau)
            const expectedDelivery = addDays(new Date(), 5); 
            query = 'UPDATE Bill SET status = $1, expected_delivery_date = $2 WHERE bill_id = $3 RETURNING *';
            params = [newStatus, expectedDelivery.toISOString(), id];
        } else {
             // Các trường hợp khác (như 'đang giao hàng') chỉ cập nhật trạng thái
            query = 'UPDATE Bill SET status = $1 WHERE bill_id = $2 RETURNING *';
            params = [newStatus, id];
        }

        const { rows } = await client.query(query, params);
        await client.query('COMMIT');
        res.json(rows[0]); // Gửi lại thông tin bill đã cập nhật
    }

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Lỗi khi cập nhật trạng thái đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// Route mới: Hủy đơn hàng (phía khách hàng)
app.patch('/bills/:billId/cancel', async (req, res) => {
    const { billId } = req.params;
    const { userId } = req.body; // Lấy userId để xác thực
    let client; // Khai báo client ở đây

    try {
        client = await pool.connect(); // Gán client trong try
        if (!userId) {
            return res.status(401).json({ message: 'Cần xác thực người dùng.' });
        }

        await client.query('BEGIN');

        // 1. Kiểm tra quyền sở hữu và trạng thái ("chờ xác nhận")
        const billResult = await client.query(
            "SELECT status FROM Bill WHERE bill_id = $1 AND user_id = $2 FOR UPDATE",
            [billId, userId]
        );

        if (billResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn này.' });
        }

        const { status } = billResult.rows[0];
        if (status !== 'chờ xác nhận') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Không thể hủy đơn hàng ở trạng thái "${status}".` });
        }

        // 2. Hoàn lại tồn kho
        const itemsToRestore = await client.query('SELECT product_id, quantity FROM BillItem WHERE bill_id = $1', [billId]);
        for (const item of itemsToRestore.rows) {
            await client.query(
                'UPDATE Product SET stock = stock + $1 WHERE product_id = $2',
                [item.quantity, item.product_id]
            );
        }

        // 3. Hoàn lại số lượng cho tất cả voucher đã dùng
        const usedVouchersResult = await client.query('SELECT voucher_id FROM BillVouchers WHERE bill_id = $1', [billId]);
        for (const row of usedVouchersResult.rows) {
            await client.query('UPDATE Voucher SET remaining = remaining + 1 WHERE voucher_id = $1', [row.voucher_id]);
        }
        
        // 4. Xóa các voucher đã dùng khỏi bảng BillVouchers
        await client.query('DELETE FROM BillVouchers WHERE bill_id = $1', [billId]);

        // 5. Cập nhật trạng thái đơn hàng
        await client.query(
            "UPDATE Bill SET status = 'đã hủy', cancellation_reason = 'Người dùng tự hủy' WHERE bill_id = $1",
            [billId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Hủy đơn hàng thành công. Tồn kho và voucher đã được hoàn lại.' });

    } catch (err) {
        if (client) await client.query('ROLLBACK'); // Kiểm tra client trước khi rollback
        console.error("❌ Lỗi SQL khi khách hàng hủy hóa đơn:", err);
        res.status(500).json({ message: 'Lỗi server khi hủy hóa đơn: ' + err.message });
    } finally {
        if (client) client.release(); // Luôn giải phóng client nếu nó đã được kết nối
    }
});

// Hủy một hóa đơn và hoàn lại voucher (nếu có) và hoàn lại stock - handle của admin
app.patch('/admin/orders/:billId/cancel', async (req, res) => {
    const { billId } = req.params;
    const { reason } = req.body;
    let client; // Khai báo client ở đây

    try {
        client = await pool.connect(); // Gán client trong try
        if (!reason) {
            return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy đơn hàng.' });
        }

        await client.query('BEGIN');

        // 1. Kiểm tra trạng thái đơn hàng
        const billResult = await client.query(
            "SELECT status FROM Bill WHERE bill_id = $1 FOR UPDATE",
            [billId]
        );
        
        if (billResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
        }

        const { status } = billResult.rows[0];

        if (!['chờ xác nhận', 'đã xác nhận', 'đang giao hàng'].includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Không thể hủy đơn hàng ở trạng thái "${status}".` });
        }

        // 2. Hoàn lại tồn kho
        const itemsToRestore = await client.query('SELECT product_id, quantity FROM BillItem WHERE bill_id = $1', [billId]);
        for (const item of itemsToRestore.rows) {
            await client.query(
                'UPDATE Product SET stock = stock + $1 WHERE product_id = $2',
                [item.quantity, item.product_id]
            );
        }

        // 3. Hoàn lại số lượng cho tất cả voucher đã dùng (LOGIC ĐƯỢC SỬA)
        const usedVouchersResult = await client.query('SELECT voucher_id FROM BillVouchers WHERE bill_id = $1', [billId]);
        for (const row of usedVouchersResult.rows) {
            await client.query('UPDATE Voucher SET remaining = remaining + 1 WHERE voucher_id = $1', [row.voucher_id]);
        }
        
        // 4. Xóa các voucher đã dùng khỏi bảng BillVouchers (THEO YÊU CẦU)
        await client.query('DELETE FROM BillVouchers WHERE bill_id = $1', [billId]);

        // 5. Cập nhật trạng thái và lý do hủy
        await client.query(
            "UPDATE Bill SET status = 'đã hủy', cancellation_reason = $1 WHERE bill_id = $2", 
            [reason, billId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Hủy đơn hàng thành công. Tồn kho và voucher đã được hoàn lại.' });

    } catch (err) {
        if (client) await client.query('ROLLBACK'); // Kiểm tra client trước khi rollback
        console.error("❌ Lỗi SQL khi admin hủy hóa đơn:", err);
        res.status(500).json({ message: 'Lỗi server khi hủy hóa đơn: ' + err.message });
    } finally {
        if (client) client.release(); // Luôn giải phóng client nếu nó đã được kết nối
    }
});


// ==============================================================
// ==============================================================
// ================== REVIEW ROUTES =============================
// ==============================================================
// ==============================================================
// Lấy tất cả review của một sản phẩm
app.get('/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  try {
    const { rows } = await pool.query(`
            SELECT r.*, u.username, ac.rep AS admin_reply
            FROM Review r
            JOIN "User" u ON r.user_id = u.user_id
            LEFT JOIN AdminComment ac ON ac.review_id = r.review_id
            WHERE r.product_id = $1
            ORDER BY r.review_date DESC
    `, [productId]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi SQL khi lấy reviews:", err.message);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Thêm một review mới
app.post('/reviews', async (req, res) => {
  const { userId, productId, billId, rating, comment } = req.body;

  if (!userId || !productId || !billId || !rating) {
    return res.status(400).json({ message: 'Thiếu thông tin cần thiết.' });
  }

  let client; // Khai báo client ở đây
  try {
    client = await pool.connect(); // Gán client trong try
    await client.query('BEGIN');

    // 1. KIỂM TRA: Đơn hàng có tồn tại, thuộc về user, và đã giao thành công không?
    const billCheck = await client.query(
      'SELECT status FROM Bill WHERE bill_id = $1 AND user_id = $2',
      [billId, userId]
    );

    if (billCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Bạn không có quyền đánh giá sản phẩm từ đơn hàng này.' });
    }
    if (billCheck.rows[0].status !== 'đã giao') {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Chỉ có thể đánh giá sản phẩm từ đơn hàng đã giao thành công.' });
    }

    // 2. KIỂM TRA: Sản phẩm có nằm trong đơn hàng đó không?
    const billItemCheck = await client.query(
        'SELECT * FROM BillItem WHERE bill_id = $1 AND product_id = $2',
        [billId, productId]
    );

    if (billItemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Sản phẩm này không có trong đơn hàng của bạn.' });
    }
    
    // 3. THÊM REVIEW: Chèn vào DB (Ràng buộc UNIQUE sẽ tự động bắt lỗi nếu đã review)
    const { rows } = await client.query(
      `INSERT INTO Review (user_id, product_id, bill_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, productId, billId, rating, comment || null]
    );

    // 4. TÍNH TOÁN VÀ CẬP NHẬT LẠI ĐIỂM TRUNG BÌNH CHO SẢN PHẨM
    const avgRatingResult = await client.query(
        'SELECT AVG(rating) as new_avg FROM Review WHERE product_id = $1',
        [productId]
    );
    const newAvgRating = parseFloat(avgRatingResult.rows[0].new_avg).toFixed(2);

    await client.query(
        'UPDATE Product SET star = $1 WHERE product_id = $2',
        [newAvgRating, productId]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Đánh giá của bạn đã được ghi nhận. Cảm ơn!', review: rows[0] });

  } catch (err) {
    if (client) await client.query('ROLLBACK'); // Kiểm tra client trước khi rollback
    // Bắt lỗi unique_violation để báo cho người dùng biết họ đã đánh giá rồi
    if (err.code === '23505') { 
        return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.' });
    }
    console.error("❌ Lỗi SQL khi thêm review:", err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    if (client) client.release(); // Luôn giải phóng client nếu nó đã được kết nối
  }
});


// =================================================================
// =================================================================
// ======================= ADMIN ROUTES ============================
// =================================================================
// =================================================================

// Lấy các số liệu thống kê cho dashboard
app.get('/admin/stats', async (req, res) => {
    try {
        const totalUsers = await pool.query('SELECT COUNT(*) FROM "User"');
        const totalProducts = await pool.query('SELECT COUNT(*) FROM Product');
        const pendingOrders = await pool.query("SELECT COUNT(*) FROM Bill WHERE status = 'chờ xác nhận'");
        
        // Doanh thu tháng này (chỉ tính đơn hàng 'đã giao')
        const monthlyRevenue = await pool.query(
            "SELECT SUM(total_amount) as revenue FROM Bill WHERE status = 'đã giao' AND purchase_date >= date_trunc('month', CURRENT_DATE)"
        );

        res.json({
            totalUsers: totalUsers.rows[0].count,
            totalProducts: totalProducts.rows[0].count,
            pendingOrders: pendingOrders.rows[0].count,
            monthlyRevenue: monthlyRevenue.rows[0].revenue || 0,
        });
    } catch (err) {
        console.error("❌ Lỗi SQL khi lấy stats cho admin:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Lấy tất cả đơn hàng
app.get('/admin/orders', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT b.*, u.username 
            FROM Bill b
            JOIN "User" u ON b.user_id = u.user_id
            ORDER BY b.purchase_date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("❌ Lỗi SQL khi lấy đơn hàng cho admin:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Thêm sản phẩm mới
app.post('/admin/products', async (req, res) => {
    // Lấy tất cả các trường từ body
    const { 
        name, author, category, sell_price, description, image, stock,
        import_price, pub_date, isbn 
    } = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!name || !sell_price) {
        return res.status(400).json({ message: 'Tên sách và giá bán là bắt buộc.' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO Product (name, author, category, sell_price, description, image, stock, import_price, pub_date, isbn)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [name, author, category, sell_price, description, image, stock, import_price, pub_date, isbn]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error("❌ Lỗi SQL khi thêm sản phẩm:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Cập nhật sản phẩm (bao gồm cả thêm stock)
app.put('/admin/products/:id', async (req, res) => {
    const { id } = req.params;
    // Lấy tất cả các trường từ body
    const { 
        name, author, category, sell_price, description, image, stock,
        import_price, pub_date, isbn 
    } = req.body;
    
    try {
        const { rows } = await pool.query(
            `UPDATE Product 
             SET name = $1, author = $2, category = $3, sell_price = $4, description = $5, image = $6, stock = $7,
                 import_price = $8, pub_date = $9, isbn = $10
             WHERE product_id = $11
             RETURNING *`,
            [name, author, category, sell_price, description, image, stock, import_price, pub_date, isbn, id]
        );
        if(rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error("❌ Lỗi SQL khi cập nhật sản phẩm:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Xóa sản phẩm
app.delete('/admin/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Product WHERE product_id = $1', [id]);
        res.status(200).json({ message: `Sản phẩm ${id} đã được xóa.` });
    } catch (err) {
        // Bắt lỗi khóa ngoại nếu sản phẩm đã tồn tại trong hóa đơn
        if(err.code === '23503') {
            return res.status(400).json({ message: 'Không thể xóa sản phẩm đã có trong đơn hàng. Hãy cập nhật số lượng tồn kho về 0 thay thế.' });
        }
        console.error("❌ Lỗi SQL khi xóa sản phẩm:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Lấy dữ liệu doanh thu
app.get('/admin/revenue', async (req, res) => {
    // --- START: MODIFICATION ---
    const { year, month } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Sử dụng giá trị từ query hoặc mặc định là tháng/năm hiện tại
    const filterYear = year ? parseInt(year) : currentYear;
    const filterMonth = month ? parseInt(month) : currentMonth;
    // --- END: MODIFICATION ---

    try {
        // Lấy doanh thu VÀ LỢI NHUẬN tổng theo tháng
        const monthlyRevenue = await pool.query(`
            SELECT 
                TO_CHAR(purchase_date, 'YYYY-MM') as month,
                SUM(total_amount) as total_revenue,
                SUM(profit) as total_profit, -- THÊM DÒNG NÀY
                COUNT(bill_id) as total_orders
            FROM Bill
            WHERE status = 'đã giao'
            GROUP BY month
            ORDER BY month DESC
        `);

        // Lấy chi tiết sản phẩm bán chạy nhất TRONG THÁNG/NĂM được chọn
        const bestSellers = await pool.query(`
            SELECT 
                p.name,
                SUM(bi.quantity) as total_quantity_sold,
                SUM(bi.quantity * bi.price_at_purchase) as product_revenue
            FROM BillItem bi
            JOIN Product p ON bi.product_id = p.product_id
            JOIN Bill b ON bi.bill_id = b.bill_id
            WHERE b.status = 'đã giao' 
              AND EXTRACT(YEAR FROM b.purchase_date) = $1 -- LỌC THEO NĂM
              AND EXTRACT(MONTH FROM b.purchase_date) = $2 -- LỌC THEO THÁNG
            GROUP BY p.name
            ORDER BY total_quantity_sold DESC
        `, [filterYear, filterMonth]); // Truyền tham số vào query
        // --- END: MODIFICATION ---

        res.json({
            monthly: monthlyRevenue.rows,
            bestSellers: bestSellers.rows,
        });
    } catch (err) {
        console.error("❌ Lỗi SQL khi lấy doanh thu:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Lấy danh sách voucher
app.get('/admin/vouchers', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM Voucher ORDER BY start_date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Thêm voucher mới
app.post('/admin/vouchers', async (req, res) => {
    const { code, voucher_type, discount, max_discount, min_order_value, remaining, start_date, end_date, description, type } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO Voucher (code, voucher_type, discount, max_discount, min_order_value, remaining, start_date, end_date, description, type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [code, voucher_type, discount, max_discount, min_order_value, remaining, start_date, end_date, description, type]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Sửa voucher
app.put('/admin/vouchers/:id', async (req, res) => {
    const { id } = req.params;
    // SỬA LẠI DÒNG NÀY: Thêm 'type' vào
    const { code, voucher_type, discount, max_discount, min_order_value, remaining, start_date, end_date, description, type } = req.body;
    try {
        const { rows } = await pool.query(
            // SỬA LẠI CÂU QUERY: Thêm 'type=$10' và sửa lại các tham số
            `UPDATE Voucher SET code=$1, voucher_type=$2, discount=$3, max_discount=$4, min_order_value=$5, remaining=$6, start_date=$7, end_date=$8, description=$9, type=$10
             WHERE voucher_id=$11 RETURNING *`,
            // SỬA LẠI THAM SỐ: Thêm 'type' vào
            [code, voucher_type, discount, max_discount, min_order_value, remaining, start_date, end_date, description, type, id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Xóa voucher
app.delete('/admin/vouchers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Voucher WHERE voucher_id=$1', [id]);
        res.json({ message: 'Đã xóa voucher.' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Lấy danh sách banner
app.get('/admin/banners', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM Banner ORDER BY "order" ASC, banner_id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Thêm banner mới
app.post('/admin/banners', async (req, res) => {
    const { image_url, link, order, is_active } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO Banner (image_url, link, "order", is_active)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [image_url, link, order || 0, is_active !== undefined ? is_active : true]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Sửa banner
app.put('/admin/banners/:id', async (req, res) => {
    const { id } = req.params;
    const { image_url, link, order, is_active } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE Banner SET image_url=$1, link=$2, "order"=$3, is_active=$4 WHERE banner_id=$5 RETURNING *`,
            [image_url, link, order, is_active, id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ADMIN: Xóa banner
app.delete('/admin/banners/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Banner WHERE banner_id=$1', [id]);
        res.json({ message: 'Đã xóa banner.' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// sale
app.patch('/admin/products/:id/sale', async (req, res) => {
    const { id } = req.params;
    const { is_sale, discount, sale_end } = req.body;
    try {
        // Nếu bật sale, cập nhật giá sale, discount, sale_end
        await pool.query(
            `UPDATE Product SET is_sale = $1, discount = $2, sale_end = $3 WHERE product_id = $4`,
            [is_sale, discount, sale_end, id]
        );
        res.json({ message: 'Cập nhật Flash Sale thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Lấy danh sách bình luận cho admin
app.get('/admin/comments', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT r.review_id, r.product_id, p.name AS product_title, r.comment, r.review_date, u.username, ac.rep AS admin_reply
            FROM Review r
            JOIN Product p ON r.product_id = p.product_id
            JOIN "User" u ON r.user_id = u.user_id
            LEFT JOIN AdminComment ac ON ac.review_id = r.review_id
            ORDER BY r.review_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// Trả lời bình luận
app.patch('/admin/comments/:reviewId/reply', async (req, res) => {
    const { reviewId } = req.params;
    const { admin_reply } = req.body;
    // Giả sử bạn lấy admin_id từ session hoặc truyền lên
    const admin_id = 1; // Thay bằng lấy từ session thực tế
    try {
        // Kiểm tra đã có comment admin chưa
        const check = await pool.query('SELECT * FROM AdminComment WHERE review_id = $1', [reviewId]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE AdminComment SET rep = $1 WHERE review_id = $2', [admin_reply, reviewId]);
        } else {
            // Lấy customer_id từ bảng Review
            const reviewRes = await pool.query('SELECT user_id FROM Review WHERE review_id = $1', [reviewId]);
            const customer_id = reviewRes.rows[0]?.user_id;
            if (!customer_id) return res.status(400).json({ message: 'Không tìm thấy review để lấy customer_id.' });
            await pool.query('INSERT INTO AdminComment (admin_id, customer_id, review_id, rep) VALUES ($1, $2, $3, $4)', [admin_id, customer_id, reviewId, admin_reply]);
        }
        res.json({ message: 'Đã trả lời bình luận.' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});