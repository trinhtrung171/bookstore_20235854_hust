-- Bảng User
CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15),
    address TEXT,
    role BOOLEAN DEFAULT FALSE, -- FALSE: customer, TRUE: admin
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index tăng tốc tìm kiếm
CREATE INDEX idx_user_username ON "User"(username);
CREATE INDEX idx_user_email ON "User"(email);

-- Bảng Product
CREATE TABLE Product (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,  --URL/source
    import_price NUMERIC(12, 2),
    sell_price NUMERIC(12, 2) NOT NULL,
    total_sold INT DEFAULT 0 CHECK (total_sold >= 0),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255),
    pub_date DATE,
    category VARCHAR(100),
    isbn VARCHAR(20),
    star NUMERIC(3,2) DEFAULT 0 CHECK (star >= 0 AND star <= 5),
    is_sale BOOLEAN DEFAULT FALSE,
    discount NUMERIC(4,2) DEFAULT 0,
    sale_end TIMESTAMP
);

-- Index tăng tốc tìm kiếm
CREATE INDEX idx_product_name ON Product(name);
CREATE INDEX idx_product_category ON Product(category);

-- Bảng Cart
CREATE TABLE Cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "User"(user_id) ON DELETE CASCADE
);

-- Bảng CartItem
CREATE TABLE CartItem (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
);

ALTER TABLE CartItem
ADD COLUMN is_selected BOOLEAN DEFAULT FALSE;

-- Bảng Voucher
CREATE TABLE Voucher (
    voucher_id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount NUMERIC(12,2) NOT NULL CHECK (discount >= 0), -- Giá trị giảm, có thể là số tiền hoặc % tuỳ type
    min_order_value NUMERIC(12,2) DEFAULT 0 CHECK (min_order_value >= 0),
    remaining INT DEFAULT 0 CHECK (remaining >= 0),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    type VARCHAR(20) NOT NULL CHECK(type IN ('fixed','percentage')), -- Xác định discount là tiền hay % 
    voucher_type VARCHAR(20) CHECK(voucher_type IN ('product','shipping')),
    max_discount NUMERIC(12,2),
    description VARCHAR(255)
);

-- Index
CREATE INDEX idx_voucher_code ON Voucher(code);

-- Bảng Bill
CREATE TABLE Bill (
    bill_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date DATE, --ngày giao hàng dự kiến
    delivery_date DATE,   --ngày giao hàng thực tế
    cancellation_reason TEXT,  
    profit NUMERIC(12,2) CHECK (profit >= 0),
    status VARCHAR(50) DEFAULT 'chờ xác nhận',
    shipping_name VARCHAR(255),
    shipping_address TEXT,
    shipping_phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES "User"(user_id) ON DELETE CASCADE,
);

-- Tạo bảng trung gian để lưu các voucher được áp dụng cho mỗi hóa đơn
CREATE TABLE BillVouchers (
    bill_id INT NOT NULL,
    voucher_id INT NOT NULL,
    PRIMARY KEY (bill_id, voucher_id),
    FOREIGN KEY (bill_id) REFERENCES Bill(bill_id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES Voucher(voucher_id) ON DELETE RESTRICT
);

-- Bảng BillItem
CREATE TABLE BillItem (
    bill_item_id SERIAL PRIMARY KEY,
    bill_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    price_at_purchase NUMERIC(12,2) NOT NULL CHECK (price_at_purchase >= 0),
    discounted_price NUMERIC(12,2) CHECK (discounted_price >= 0),
    discount_amount NUMERIC(12,2) CHECK (discount_amount >= 0),
    FOREIGN KEY (bill_id) REFERENCES Bill(bill_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- Bảng Review
CREATE TABLE Review (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    bill_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (user_id) REFERENCES "User"(user_id),
    FOREIGN KEY (bill_id) REFERENCES Bill(bill_id),
    UNIQUE (product_id, user_id, bill_id)
);


-- Index tăng tốc tìm kiếm đánh giá
CREATE INDEX idx_review_product ON Review(product_id);
CREATE INDEX idx_review_user ON Review(user_id);
CREATE INDEX idx_review_rating ON Review(rating);

-- Tạo bảng Banner
CREATE TABLE Banner (
    banner_id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    link TEXT,
    "order" INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES "User"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES product(product_id) ON DELETE CASCADE
);

CREATE TABLE AdminComment (
    cmt_id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    review_id INTEGER NOT NULL REFERENCES Review(review_id) ON DELETE CASCADE,
    rep TEXT
);

-- tài khoản admin
INSERT INTO "User" (username, password, email, role, added_date) VALUES
('adminuser', 'hashed_password_3', 'admin@example.com', TRUE, NOW());

