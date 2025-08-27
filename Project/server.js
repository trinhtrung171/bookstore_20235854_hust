// server.js
import 'dotenv/config';       // load .env ngay từ đầu
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(express.json());      // parse JSON body

// In ra để kiểm tra env
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

// Khởi tạo Pool PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,           
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT)
});

// Test kết nối
pool.connect((err) => {
  if (err) {
    console.error('❌ Lỗi khi kết nối tới database', err);
  } else {
    console.log('✅ Kết nối PostgreSQL thành công!');
  }
});

// Route test server
app.get('/', (req, res) => {
  res.send('Server Node.js + PostgreSQL đang chạy!');
});

// === CRUD cho bảng users ===

// Lấy danh sách users
app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

// Thêm user mới
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO users(name, email) VALUES($1, $2) RETURNING *',
      [name, email]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

// Cập nhật user theo id
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
      [name, email, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

// Xóa user theo id
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.send(`User ${id} đã bị xóa`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

// Khởi chạy server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
