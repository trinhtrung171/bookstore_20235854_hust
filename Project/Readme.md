# 🌐 My Project

Dự án web sử dụng **Node.js, PostgreSQL, TailwindCSS**. Repo được thiết kế để dễ dàng setup và chạy.

---

## 🚀 Công nghệ

* Frontend: HTML, CSS, TailwindCSS, JavaScript
* Backend: Node.js (Express)
* Database: PostgreSQL
* Container: Docker, Docker Compose

---

## 📂 Cấu trúc chính

```
Project/
├── .env.example       # File mẫu biến môi trường
├── data.sql           # Dump database
├── docker-compose.yml # Khởi tạo DB + app
├── Dockerfile         # Build Node.js app
├── package.json       # Script Node.js
├── server.js          # Start server
├── index.html         # Giao diện chính
├── styles.css         # CSS + Tailwind input
└── src/               # Source code
```

---

## ⚙️ Cài đặt

### 1. Clone repo

```bash
git clone <repo-url>
cd Project
```

### 2. Cấu hình `.env`

```bash
cp .env.example .env
```

Chỉnh `DB_USER`, `DB_PASSWORD`, `DB_NAME` nếu cần.

### 3. Chạy với Docker (khuyên dùng)

```bash
docker-compose up --build
```

* App: [http://localhost:3000](http://localhost:3000)
* DB: PostgreSQL cổng 5432 (import tự động `data.sql`)

### 4. Chạy thủ công

Yêu cầu: Node.js >= 20, PostgreSQL >= 14

```bash
npm install
node server.js
```

Tự import dữ liệu:

```bash
psql -U postgres -d my_project -f data.sql
```

---

## 🎨 TailwindCSS

Build CSS:

```bash
npx tailwindcss -i ./styles.css -o ./dist/output.css --watch
```

Hoặc thêm script trong `package.json`:

```json
"scripts": {
  "dev:css": "tailwindcss -i ./styles.css -o ./dist/output.css --watch"
}
```

Chạy:

```bash
npm run dev:css
```

---

## ✅ Lưu ý

* Commit `.env.example`, không commit `.env`.
* Dùng Docker là cách nhanh nhất để chạy project.
