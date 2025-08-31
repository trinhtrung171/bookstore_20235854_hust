import 'dotenv/config';       // Load .env
import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();

app.use(cors());              // Cho phép gọi từ front-end khác port
app.use(express.json());      // Parse JSON body

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
    res.status(500).send('Lỗi server: ' + err.message);
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
    res.status(500).send('Lỗi server: ' + err.message);
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
    res.status(500).send('Lỗi server: ' + err.message);
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
    res.status(500).send('Lỗi server: ' + err.message);
  }
});

// Cập nhật user theo user_id
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, phone_number, address, role } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE "User"
       SET username=$1, email=$2, phone_number=$3, address=$4, role=$5
       WHERE user_id=$6
       RETURNING user_id, username, email, phone_number, address, role, added_date`,
      [username, email, phone_number || null, address || null, role || false, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Lỗi SQL:", err.message);
    res.status(500).send('Lỗi server: ' + err.message);
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
    res.status(500).send('Lỗi server: ' + err.message);
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
    res.status(500).send('Lỗi server: ' + err.message);
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


// ==============================================================
// ==============================================================
// ====== BILL ROUTES (Sửa lại cho khớp với schema của bạn)====== 
// ==============================================================
// ==============================================================

// Lấy tất cả hóa đơn của một user (có kiểm tra review)
app.get('/bills/user/:userId', async (req, res) => {
  const { userId } = req.params;
  let client;
  try {
    client = await pool.connect();
    // Lấy thông tin cơ bản của các hóa đơn
    const billsResult = await client.query(
      'SELECT * FROM Bill WHERE user_id = $1 ORDER BY purchase_date DESC',
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
    // Nhận thêm usedShippingVoucherCode từ body
    const { 
        userId, items, shippingDetails, totals, usedVoucherCode, usedShippingVoucherCode 
    } = req.body;

    if (!userId || !items || !shippingDetails || !totals || items.length === 0) {
        return res.status(400).json({ message: 'Thiếu dữ liệu hoặc không có sản phẩm để tạo hóa đơn.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const item of items) {
            const stockCheck = await client.query('SELECT stock FROM Product WHERE product_id = $1', [item.book.id]);
            if (stockCheck.rows.length === 0 || stockCheck.rows[0].stock < item.quantity) {
                 await client.query('ROLLBACK');
                 return res.status(400).json({ message: `Sản phẩm "${item.book.title}" không đủ số lượng tồn kho.` });
            }
        }

        // Xử lý voucher giảm giá
        let discountVoucherId = null;
        if (usedVoucherCode) {
            const voucherResult = await client.query('SELECT voucher_id FROM Voucher WHERE code = $1', [usedVoucherCode]);
            if (voucherResult.rows.length > 0) {
                discountVoucherId = voucherResult.rows[0].voucher_id;
            }
        }
        
        const billQuery = `
            INSERT INTO Bill (user_id, total_amount, voucher_id, status, shipping_name, shipping_address, shipping_phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING bill_id;
        `;
        const billValues = [
            userId, totals.finalTotal, discountVoucherId, 'chờ xác nhận', // Vẫn lưu voucher giảm giá vào hóa đơn
            shippingDetails.name, shippingDetails.address, shippingDetails.phone,
        ];
        const newBillResult = await client.query(billQuery, billValues);
        const newBillId = newBillResult.rows[0].bill_id;

        for (const item of items) {
            await client.query(
                'INSERT INTO BillItem (bill_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [newBillId, item.book.id, item.quantity, item.book.price]
            );
            await client.query(
                'UPDATE Product SET stock = stock - $1 WHERE product_id = $2',
                [item.quantity, item.book.id]
            );
        }

        // GIẢM SỐ LƯỢNG VOUCHER GIẢM GIÁ (NẾU CÓ)
        if (discountVoucherId) {
            await client.query(
                'UPDATE Voucher SET remaining = remaining - 1 WHERE voucher_id = $1 AND remaining > 0',
                [discountVoucherId]
            );
        }

        // GIẢM SỐ LƯỢNG VOUCHER VẬN CHUYỂN (NẾU CÓ)
        if (usedShippingVoucherCode) {
            await client.query(
                'UPDATE Voucher SET remaining = remaining - 1 WHERE code = $1 AND remaining > 0',
                [usedShippingVoucherCode]
            );
        }

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
        await client.query('ROLLBACK');
        console.error("❌ Lỗi SQL khi tạo hóa đơn:", err);
        res.status(500).json({ message: 'Đặt hàng thất bại: ' + err.message });
    } finally {
        client.release();
    }
});

// chuyển trạng thái đơn hàng
app.put('/api/bills/:id/status', async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    let query;
    let params;

    switch (newStatus) {
      case 'đã xác nhận':
        // Thêm ngày giao dự kiến khi xác nhận
        const estimatedDeliveryDate = addDays(new Date(), 2);
        query = 'UPDATE Bill SET status = $1, expected_delivery_date = $2 WHERE bill_id = $3 RETURNING *';
        params = [newStatus, estimatedDeliveryDate.toISOString(), id];
        break;
      
      case 'đang giao hàng':
        // Chỉ cập nhật trạng thái
        query = 'UPDATE Bill SET status = $1 WHERE bill_id = $2 RETURNING *';
        params = [newStatus, id];
        break;

      case 'đã giao':
        // Cập nhật trạng thái và ngày giao hàng thực tế
        const actualDeliveryDate = new Date();
        query = 'UPDATE Bill SET status = $1, delivery_date = $2 WHERE bill_id = $3 RETURNING *';
        params = [newStatus, actualDeliveryDate.toISOString(), id];
        break;

      default:
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Trạng thái mới không hợp lệ.' });
    }

    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    await client.query('COMMIT');
    res.json(rows[0]);

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Lỗi khi cập nhật trạng thái đơn hàng:', err);
    res.status(500).send('Lỗi server: ' + err.message);
  } finally {
    if (client) client.release();
  }
});

// Hủy một hóa đơn và hoàn lại voucher (nếu có) và hoàn lại stock
app.patch('/admin/orders/:billId/cancel', async (req, res) => {
    const { billId } = req.params;
    const { reason } = req.body; // Lấy lý do từ body của request
    const client = await pool.connect();

    if (!reason) {
        return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy đơn hàng.' });
    }

    try {
        await client.query('BEGIN');

        const billResult = await client.query(
            "SELECT voucher_id, status FROM Bill WHERE bill_id = $1 FOR UPDATE",
            [billId]
        );
        
        if (billResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
        }

        const { voucher_id, status } = billResult.rows[0];

        // Admin có thể hủy đơn ở các trạng thái này
        if (!['chờ xác nhận', 'đã xác nhận', 'đang giao hàng'].includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Không thể hủy đơn hàng ở trạng thái "${status}".` });
        }

        // Hoàn lại tồn kho
        const itemsToRestore = await client.query('SELECT product_id, quantity FROM BillItem WHERE bill_id = $1', [billId]);
        for (const item of itemsToRestore.rows) {
            await client.query(
                'UPDATE Product SET stock = stock + $1 WHERE product_id = $2',
                [item.quantity, item.product_id]
            );
        }

        // Cập nhật trạng thái đơn hàng VÀ LƯU LÝ DO HỦY
        await client.query(
            "UPDATE Bill SET status = 'đã hủy', cancellation_reason = $1 WHERE bill_id = $2", 
            [reason, billId] // Thêm reason vào query
        );

        // Hoàn lại voucher nếu có
        if (voucher_id) {
            await client.query('UPDATE Voucher SET remaining = remaining + 1 WHERE voucher_id = $1', [voucher_id]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Hủy đơn hàng thành công. Tồn kho và voucher đã được hoàn lại.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Lỗi SQL khi admin hủy hóa đơn:", err);
        res.status(500).json({ message: 'Lỗi server khi hủy hóa đơn: ' + err.message });
    } finally {
        client.release();
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
      SELECT 
        r.rating,
        r.comment,
        r.review_date,
        u.username
      FROM Review r
      JOIN "User" u ON r.user_id = u.user_id
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

  const client = await pool.connect();
  try {
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

    await client.query('COMMIT');
    res.status(201).json({ message: 'Đánh giá của bạn đã được ghi nhận. Cảm ơn!', review: rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    // Bắt lỗi unique_violation để báo cho người dùng biết họ đã đánh giá rồi
    if (err.code === '23505') { 
        return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.' });
    }
    console.error("❌ Lỗi SQL khi thêm review:", err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  } finally {
    client.release();
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
    try {
        // Lấy doanh thu tổng theo tháng
        const monthlyRevenue = await pool.query(`
            SELECT 
                TO_CHAR(purchase_date, 'YYYY-MM') as month,
                SUM(total_amount) as total_revenue,
                COUNT(bill_id) as total_orders
            FROM Bill
            WHERE status = 'đã giao'
            GROUP BY month
            ORDER BY month DESC
        `);

        // Lấy chi tiết sản phẩm bán chạy nhất trong tháng hiện tại
        const bestSellers = await pool.query(`
            SELECT 
                p.name,
                SUM(bi.quantity) as total_quantity_sold,
                SUM(bi.quantity * bi.price_at_purchase) as product_revenue
            FROM BillItem bi
            JOIN Product p ON bi.product_id = p.product_id
            JOIN Bill b ON bi.bill_id = b.bill_id
            WHERE b.status = 'đã giao' AND b.purchase_date >= date_trunc('month', CURRENT_DATE)
            GROUP BY p.name
            ORDER BY total_quantity_sold DESC
            LIMIT 10
        `);

        res.json({
            monthly: monthlyRevenue.rows,
            bestSellers: bestSellers.rows,
        });
    } catch (err) {
        console.error("❌ Lỗi SQL khi lấy doanh thu:", err.message);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});
