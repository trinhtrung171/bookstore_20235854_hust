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
    star NUMERIC(3,2) DEFAULT 0 CHECK (star >= 0 AND star <= 5)
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
    voucher_type VARCHAR(20) CHECK(voucher_type IN ('product','shipping'))
);

--thêm cột max_discount dành cho voucher % (giảm tối đa...)
ALTER TABLE Voucher
ADD COLUMN max_discount NUMERIC(12,2),
ADD COLUMN description VARCHAR(255);

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
    voucher_id INT,
    status VARCHAR(50) DEFAULT 'chờ xác nhận',
    shipping_name VARCHAR(255),
    shipping_address TEXT,
    shipping_phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES "User"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES Voucher(voucher_id)
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




-- -- Trigger tự động cập nhật số sao sau khi người dùng đánh giá sản phẩm
CREATE OR REPLACE FUNCTION trg_update_product_star()
RETURNS TRIGGER AS $$
DECLARE
    avg_star NUMERIC(3,2);
BEGIN
    -- Tính trung bình rating cho product liên quan
    SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
    INTO avg_star
    FROM Review
    WHERE product_id = NEW.product_id;

    -- Cập nhật star cho product
    UPDATE Product
    SET star = avg_star
    WHERE product_id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sau khi insert
CREATE TRIGGER review_after_insert
AFTER INSERT ON Review
FOR EACH ROW
EXECUTE FUNCTION trg_update_product_star();

-- Trigger sau khi update rating hoặc product_id
CREATE TRIGGER review_after_update
AFTER UPDATE OF rating, product_id ON Review
FOR EACH ROW
EXECUTE FUNCTION trg_update_product_star();

-- Trigger sau khi delete review
CREATE TRIGGER review_after_delete
AFTER DELETE ON Review
FOR EACH ROW
EXECUTE FUNCTION trg_update_product_star();





-- -- trigger giảm voucher
-- CREATE OR REPLACE FUNCTION update_voucher_remaining_on_bill_status()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Chỉ thực hiện logic nếu hóa đơn có sử dụng voucher
--     IF NEW.voucher_id IS NOT NULL THEN
--         -- Giảm số lượng voucher khi trạng thái chuyển sang 'Đã giao'
--         IF NEW.status = 'Đã giao' AND OLD.status != 'Đã giao' THEN
--             UPDATE Voucher
--             SET remaining = remaining - 1
--             WHERE voucher_id = NEW.voucher_id;
        
--         -- Hoàn lại số lượng voucher khi trạng thái chuyển sang 'Đã hủy'
--         ELSIF NEW.status = 'Đã hủy' AND OLD.status != 'Đã hủy' THEN
--             UPDATE Voucher
--             SET remaining = remaining + 1
--             WHERE voucher_id = NEW.voucher_id;
--         END IF;
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;



-- --Tạo trigger gọi hàm trên khi bảng Bill được cập nhật
-- CREATE TRIGGER trg_voucher_update_on_bill_status
-- AFTER UPDATE ON Bill
-- FOR EACH ROW
-- EXECUTE FUNCTION update_voucher_remaining_on_bill_status();








-- -- 3. Trigger cập nhật profit, total và total_sold khi Bill được giao
CREATE OR REPLACE FUNCTION update_bill_summary_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
    total_profit NUMERIC := 0;
    total_amount NUMERIC := 0;
BEGIN
    -- Chỉ chạy khi Bill chuyển sang "Đã giao"
    IF NEW.status = 'Đã giao' AND OLD.status IS DISTINCT FROM 'Đã giao' THEN
        -- Tính tổng profit và total
        SELECT 
            SUM( (COALESCE(bi.discounted_price, bi.price_at_purchase) - p.import_price) * bi.quantity ),
            SUM( COALESCE(bi.discounted_price, bi.price_at_purchase) * bi.quantity )
        INTO total_profit, total_amount
        FROM BillItem bi
        JOIN Product p ON p.product_id = bi.product_id
        WHERE bi.bill_id = NEW.bill_id;

        -- Cập nhật Bill
        UPDATE Bill
        SET profit = total_profit,
            total = total_amount
        WHERE bill_id = NEW.bill_id;

        -- Cập nhật total_sold cho Product
        UPDATE Product p
        SET total_sold = total_sold + bi.quantity
        FROM BillItem bi
        WHERE bi.bill_id = NEW.bill_id
          AND p.product_id = bi.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bill_summary_on_delivery
AFTER UPDATE OF status ON Bill
FOR EACH ROW
EXECUTE FUNCTION update_bill_summary_on_delivery();







-- -- Function giới hạn quantity theo stock   
-- CREATE OR REPLACE FUNCTION trg_check_cartitem_stock()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     current_stock INT;
-- BEGIN
--     SELECT stock INTO current_stock FROM Product WHERE product_id = NEW.product_id;

--     IF NEW.quantity > current_stock THEN
--         RAISE EXCEPTION 'Quantity (%s) exceeds available stock (%s)', NEW.quantity, current_stock;
--     END IF;

--     -- Nếu quantity = 0 thì xóa CartItem
--     IF NEW.quantity = 0 THEN
--         DELETE FROM CartItem WHERE cart_item_id = NEW.cart_item_id;
--         RETURN NULL;
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Trigger kiểm tra trước insert/update CartItem
-- CREATE TRIGGER cartitem_before_change
-- BEFORE INSERT OR UPDATE ON CartItem
-- FOR EACH ROW
-- EXECUTE FUNCTION trg_check_cartitem_stock();





-- -- Trigger chỉ giảm stock khi đơn được giao thành công
-- CREATE OR REPLACE FUNCTION trg_update_stock_after_bill_confirm()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.status = 'Đã giao' AND OLD.status IS DISTINCT FROM 'Đã giao' THEN
--         UPDATE Product
--         SET stock = stock - bi.quantity
--         FROM BillItem bi
--         WHERE bi.bill_id = NEW.bill_id
--           AND Product.product_id = bi.product_id;
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;


-- -- Trigger: chạy sau khi update Bill
-- CREATE TRIGGER trg_update_stock_after_bill_confirm
-- AFTER UPDATE OF status ON Bill
-- FOR EACH ROW
-- EXECUTE FUNCTION trg_update_stock_after_bill_confirm();









-- -- Function kiểm tra giá sản phẩm và discount
-- CREATE OR REPLACE FUNCTION trg_check_price_discount()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Giá bán phải >= giá nhập
--     IF NEW.price_at_purchase < (SELECT import_price FROM Product WHERE product_id = NEW.product_id) THEN
--         RAISE EXCEPTION 'price_at_purchase cannot be less than import_price';
--     END IF;

--     -- Discount không vượt quá price_at_purchase
--     IF NEW.discount_amount IS NOT NULL AND NEW.discount_amount > NEW.price_at_purchase THEN
--         RAISE EXCEPTION 'discount_amount cannot exceed price_at_purchase';
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Trigger trước khi insert/update BillItem
-- CREATE TRIGGER billitem_before_check_price_discount
-- BEFORE INSERT OR UPDATE ON BillItem
-- FOR EACH ROW
-- EXECUTE FUNCTION trg_check_price_discount();





-- -- Trigger Tự động Hoàn Kho khi Hóa Đơn Bị Hủy
-- -- Bước 1: Tạo function để hoàn kho
-- CREATE OR REPLACE FUNCTION restock_on_bill_cancel()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     bill_item_record RECORD;
-- BEGIN
--     -- Chỉ thực hiện khi trạng thái hóa đơn chuyển từ bất kỳ trạng thái nào sang 'Đã hủy'
--     IF NEW.status = 'Đã hủy' AND OLD.status != 'Đã hủy' THEN
--         -- Lặp qua từng sản phẩm trong hóa đơn đã bị hủy
--         FOR bill_item_record IN SELECT * FROM BillItem WHERE bill_id = NEW.bill_id
--         LOOP
--             -- Cập nhật lại số lượng tồn kho
--             UPDATE Product
--             SET stock = stock + bill_item_record.quantity
--             WHERE product_id = bill_item_record.product_id;
--         END LOOP;
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Bước 2: Tạo trigger gọi function khi bảng Bill được cập nhật
-- CREATE TRIGGER trg_restock_on_bill_cancel
-- AFTER UPDATE ON Bill
-- FOR EACH ROW
-- EXECUTE FUNCTION restock_on_bill_cancel();






-- -- Trigger function: Xóa các sản phẩm đã chọn trong CartItem sau khi Bill được tạo
-- CREATE OR REPLACE FUNCTION trg_clear_selected_cartitems()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Xóa những sản phẩm trong CartItem thuộc user vừa đặt đơn, mà is_selected = TRUE
--     DELETE FROM CartItem
--     WHERE cart_id IN (
--         SELECT cart_id
--         FROM Cart
--         WHERE user_id = NEW.user_id
--     )
--     AND is_selected = TRUE;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER bill_after_insert_clear_cart
-- AFTER INSERT ON Bill
-- FOR EACH ROW
-- EXECUTE FUNCTION trg_clear_selected_cartitems();








-- --Trigger Đảm bảo Chỉ Khách hàng đã mua mới được Đánh giá
-- -- Bước 1: Tạo function kiểm tra người dùng đã mua sản phẩm chưa
-- CREATE OR REPLACE FUNCTION check_user_has_purchased_product()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     purchase_count INT;
-- BEGIN
--     -- Đếm số lần sản phẩm đã được mua bởi người dùng này
--     SELECT COUNT(*)
--     INTO purchase_count
--     FROM BillItem bi
--     JOIN Bill b ON bi.bill_id = b.bill_id
--     WHERE b.user_id = NEW.user_id AND bi.product_id = NEW.product_id;

--     -- Nếu số lượng mua là 0, báo lỗi
--     IF purchase_count = 0 THEN
--         RAISE EXCEPTION 'Bạn chỉ có thể đánh giá sản phẩm đã mua.';
--     END IF;
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Bước 2: Tạo trigger gọi function trên bảng Review
-- CREATE TRIGGER trg_check_user_purchase_before_review
-- BEFORE INSERT ON Review
-- FOR EACH ROW
-- EXECUTE FUNCTION check_user_has_purchased_product();







-- --Trigger Tự động Cập nhật ngày tháng và Chuẩn hóa dữ liệu người dùng
-- -- Tạo function để chuẩn hóa dữ liệu người dùng
-- CREATE OR REPLACE FUNCTION normalize_user_data()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Tự động đặt ngày thêm vào nếu là bản ghi mới
--     IF TG_OP = 'INSERT' THEN
--         NEW.added_date = NOW();
--     END IF;
    
--     -- Chuẩn hóa username về chữ thường và xóa khoảng trắng ở đầu/cuối
--     NEW.username = LOWER(TRIM(NEW.username));
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Tạo trigger gọi function trên bảng User
-- CREATE TRIGGER trg_normalize_user_data
-- BEFORE INSERT OR UPDATE ON "User"
-- FOR EACH ROW
-- EXECUTE FUNCTION normalize_user_data();





















-- Insert dữ liệu vào bảng Product
INSERT INTO Product (
    name,
    description,
    image,
    import_price,
    sell_price,
    total_sold,
    stock,
    author,
    pub_date,
    category,
    isbn
) VALUES
('Đắc Nhân Tâm', 'Đắc nhân tâm là một trong những cuốn sách bán chạy nhất mọi thời đại, giúp bạn hiểu và áp dụng các nguyên tắc để gây thiện cảm và xây dựng các mối quan hệ thành công.', 'https://noithatbn.vn/image/cache/catalog/dac-nhan-tam/1123-1493801476304-1400x875.jpg', 75000.00, 99000.00, 580, 120, 'Dale Carnegie', '1936-10-22', 'Phát triển bản thân', '9780671027032'),
('Nhà Giả Kim', 'Một câu chuyện ẩn dụ về hành trình tìm kiếm vận mệnh của mình. Cuốn sách nhấn mạnh tầm quan trọng của việc theo đuổi ước mơ và lắng nghe trái tim.', 'https://diendaniso.com/wp-content/uploads/2023/11/Review-s%C3%A1ch-Nh%C3%A0-gi%E1%BA%A3-kim-Paulo-Coelho.jpg', 60000.00, 85000.00, 730, 90, 'Paulo Coelho', '1988-01-01', 'Tiểu thuyết', '9780061122415'),
('1984', '1984 khắc họa một xã hội bị kiểm soát toàn diện, nơi sự thật bị bóp méo và tự do cá nhân bị xóa bỏ.', 'https://static.oreka.vn/800-800_a711de6a-c6fe-4570-a5c4-9517e9681b33', 90000.00, 120000.00, 920, 150, 'George Orwell', '1949-06-08', 'Sách nước ngoài', '9780451524935'),
('Những Người Khốn Khổ', 'Tác phẩm theo chân Jean Valjean trong hành trình tìm kiếm sự cứu chuộc giữa xã hội đầy bất công.', 'https://sachchon.com/uploads/2021/07/19/nhung-nguoi-khon-kho.jpg', 110000.00, 150000.00, 880, 80, 'Victor Hugo', '1862-03-30', 'Văn học', '9782070381488'),
('Sapiens: Lược Sử Loài Người', 'Harari đưa người đọc qua hành trình lịch sử loài người từ Homo sapiens đến thế giới hiện đại.', 'https://bizweb.dktcdn.net/thumb/1024x1024/100/435/244/products/sg11134201221202ucumy8655kvff-e77f3ab8-38e3-4fd5-8470-0f8d19a9ba9b.jpg?v=1672971355547', 130000.00, 180000.00, 650, 110, 'Yuval Noah Harari', '2011-01-01', 'Lịch sử', '9780062316097'),
('7 Thói Quen Hiệu Quả', 'Stephen Covey trình bày 7 thói quen nền tảng giúp thay đổi cách suy nghĩ và hành động để đạt thành công.', 'https://pos.nvncdn.com/fd5775-40602/ps/20240329_LRErpdCwzC.jpeg', 85000.00, 110000.00, 420, 60, 'Stephen R. Covey', '1989-08-15', 'Phát triển bản thân', '9780743269513'),
('Dune', 'Lấy bối cảnh hành tinh sa mạc Arrakis, nơi duy nhất sản xuất gia vị quý giá nhất vũ trụ.', 'http://bizweb.dktcdn.net/thumb/1024x1024/100/363/455/products/xucatbiamembia.jpg?v=1705552591840', 160000.00, 210000.00, 770, 70, 'Frank Herbert', '1965-08-01', 'Tiểu thuyết', '9780441172719'),
('Harry Potter và Hòn Đá Phù Thủy', 'Cuốn mở đầu cho hành trình của Harry Potter tại Trường Phù thủy Hogwarts.', 'https://www.nxbtre.com.vn/Images/Book/nxbtre_full_21042022_030444.jpg', 105000.00, 135000.00, 950, 200, 'J.K. Rowling', '1997-06-26', 'Tiểu thuyết', '9780747532743'),
('Giết Con Chim Nhại (To Kill a Mockingbird)', 'Lấy bối cảnh miền Nam nước Mỹ thập niên 1930, phản ánh phân biệt chủng tộc và sự trưởng thành.', 'https://sachxanhxanh.com/wp-content/uploads/2023/03/giet-con-chim-nhai-1-1024x768.png', 80000.00, 105000.00, 540, 100, 'Harper Lee', '1960-07-11', 'Sách nước ngoài', '9780446310789'),
('Clean Code', 'Robert C. Martin đưa ra các nguyên tắc và thực tiễn tốt nhất để viết mã dễ đọc, dễ bảo trì.', 'https://cdn1.fahasa.com/media/catalog/product/8/9/8936107813361.jpg', 190000.00, 250000.00, 830, 130, 'Robert C. Martin', '2008-08-01', 'Học thuật', '9780132350884'),
('The Pragmatic Programmer', 'Hướng dẫn các kỹ năng và tư duy để trở thành lập trình viên giỏi hơn.', 'https://upload.wikimedia.org/wikipedia/en/8/8f/The_pragmatic_programmer.jpg', 175000.00, 230000.00, 720, 95, 'Andrew Hunt & David Thomas', '1999-10-20', 'Học thuật', '9780201616224'),
('Introduction to Algorithms (CLRS)', 'Cung cấp phân tích chi tiết và ví dụ về các thuật toán, từ sắp xếp đến đồ thị.', 'https://img.pchome.com.tw/cs/items/DJBQ3HD900FKLF1/000001_1663935457.jpg', 350000.00, 450000.00, 910, 50, 'Thomas H. Cormen et al.', '1990-01-01', 'Học thuật', '9780262033848'),
('Artificial Intelligence: A Modern Approach', 'Bao quát các khái niệm cốt lõi của AI: tìm kiếm, suy luận, học máy, NLP, thị giác máy tính.', 'https://m.media-amazon.com/images/I/61-6TTTBZeL.jpg', 380000.00, 480000.00, 690, 40, 'Stuart Russell & Peter Norvig', '1995-01-01', 'Học thuật', '9780134610993'),
('Deep Learning', 'Giới thiệu lý thuyết, toán học và ứng dụng của học sâu.', 'https://img.drz.lazcdn.com/static/mm/p/9e4ace86579ba80bec0cd49558b5e12a.jpg_720x720q80.jpg', 400000.00, 500000.00, 660, 35, 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', '2016-11-01', 'Học thuật', '9780262035613'),
('Design Patterns', 'Hệ thống hóa các mẫu thiết kế hướng đối tượng, giúp viết mã linh hoạt và dễ mở rộng.', 'https://prodimage.images-bn.com/pimages/9780201633610_p1_v4_s600x595.jpg', 220000.00, 280000.00, 470, 85, 'Erich Gamma et al.', '1994-10-31', 'Học thuật', '9780201633610'),
('The Mythical Man-Month', 'Brooks chia sẻ kinh nghiệm từ dự án IBM System/360, bao gồm định luật nổi tiếng về quản lý phần mềm.', 'https://www.tigosolutions.com/Uploads/the-mythical-man-month11032024032721.jpg', 160000.00, 210000.00, 330, 55, 'Frederick P. Brooks Jr.', '1975-01-01', 'Học thuật', '9780201835953');

-- Thêm voucher mẫu
INSERT INTO Voucher (
    code,
    discount,
    min_order_value,
    remaining,
    start_date,
    end_date,
    type,
    voucher_type
) VALUES
('SHIPFREE25', 25000.00, 0.00, 50, '2025-09-01', '2025-12-31', 'fixed', 'shipping'),
('SHIPFREE10', 10000.00, 100000.00, 20, '2025-08-29', '2025-12-31', 'fixed', 'shipping'),
('FREESHIPXMAS', 15000.00, 50000.00, 10, '2025-09-04', '2025-12-25', 'fixed', 'shipping'),
('SHIP50K', 50000.00, 300000.00, 5, '2025-08-28', '2025-11-01', 'fixed', 'shipping'),
('GIAM10K', 10000.00, 150000.00, 100, '2025-09-03', '2025-11-30', 'fixed', 'product'),
('SALE20', 20.00, 300000.00, 30, '2025-08-30', '2025-10-31', 'percentage', 'product'),
('GIAM50K', 50000.00, 500000.00, 15, '2025-09-05', '2025-09-30', 'fixed', 'product'),
('SALE15', 15.00, 200000.00, 25, '2025-08-31', '2025-12-15', 'percentage', 'product'),
('BOOKSALE', 30000.00, 250000.00, 40, '2025-09-02', '2026-01-31', 'fixed', 'product'),
('SPECIAL10', 10000.00, 100000.00, 60, '2025-09-06', '2025-11-15', 'fixed', 'product');

UPDATE Voucher SET description = 'Giảm 25K phí vận chuyển', max_discount = NULL WHERE code = 'SHIPFREE25';
UPDATE Voucher SET description = 'Giảm 10K phí vận chuyển', max_discount = NULL WHERE code = 'SHIPFREE10';
UPDATE Voucher SET description = 'Giảm 15K phí vận chuyển', max_discount = NULL WHERE code = 'FREESHIPXMAS';
UPDATE Voucher SET description = 'Miễn phí vận chuyển lên đến 50K', max_discount = NULL WHERE code = 'SHIP50K';
UPDATE Voucher SET description = 'Giảm 10K cho đơn hàng từ 150K', max_discount = NULL WHERE code = 'GIAM10K';
UPDATE Voucher SET description = 'Giảm 20% tối đa 50K cho đơn hàng từ 300K', max_discount = 50000 WHERE code = 'SALE20';
UPDATE Voucher SET description = 'Giảm 50K cho đơn hàng từ 500K', max_discount = NULL WHERE code = 'GIAM50K';
UPDATE Voucher SET description = 'Giảm 15% tối đa 30K', max_discount = 30000 WHERE code = 'SALE15';
UPDATE Voucher SET description = 'Giảm 30K cho sách', max_discount = NULL WHERE code = 'BOOKSALE';
UPDATE Voucher SET description = 'Giảm 10K cho mọi đơn hàng', max_discount = NULL WHERE code = 'SPECIAL10';

INSERT INTO Voucher (code, discount, min_order_value, remaining, start_date, end_date, type, voucher_type, description, max_discount)
VALUES
  ('SUMMER25', 25000, 150000, 150, NOW(), '2025-12-31 23:59:59', 'fixed', 'product', 'Giảm 25K cho đơn hàng mùa hè', NULL),
  ('SHIPXMAS', 20000, 100000, 100, NOW(), '2025-12-25 23:59:59', 'fixed', 'shipping', 'Giảm 20K phí vận chuyển dịp Giáng sinh', NULL),
  ('NEWYEAR10', 10, 200000, 50, NOW(), '2025-12-31 23:59:59', 'percentage', 'product', 'Giảm 10% tối đa 30K', 30000),
  ('SALE30K', 30000, 300000, 80, NOW(), '2025-12-31 23:59:59', 'fixed', 'product', 'Giảm 30K cho đơn hàng lớn', NULL);

INSERT INTO Voucher (code, discount, min_order_value, remaining, start_date, end_date, type, voucher_type, description, max_discount)
VALUES
  -- Voucher cho Tết Trung Thu
  ('MIDAUTUMN', 20000, 100000, 120, '2025-09-05 00:00:00', '2025-09-17 23:59:59', 'fixed', 'product', 'Giảm 20K cho đơn hàng mừng Tết Trung Thu', NULL),

  -- Voucher cho Quốc Khánh
  ('NATIONALDAY', 10, 250000, 80, '2025-09-02 00:00:00', '2025-09-05 23:59:59', 'percentage', 'product', 'Giảm 10% tối đa 30K mừng Quốc Khánh', 30000),

  -- Voucher cho Black Friday
  ('BLACKFRIDAY', 50, 500000, 30, '2025-11-28 00:00:00', '2025-11-28 23:59:59', 'percentage', 'product', 'Giảm 50% tối đa 100K trong ngày Black Friday', 100000),

  -- Voucher cho cuối năm
  ('YEAR2025', 100000, 1000000, 15, '2025-12-15 00:00:00', '2025-12-31 23:59:59', 'fixed', 'product', 'Giảm 100K cho đơn hàng cuối năm', NULL);


-- Thêm người dùng mẫu
INSERT INTO "User" (username, password, email, phone_number, address, role, code_secur, added_date) VALUES
('johndoe', 'hashed_password_1', 'john.doe@example.com', '0912345678', '123 Đường ABC, Quận 1, TP. HCM', FALSE, 'jD_123', NOW()),
('janedoe', 'hashed_password_2', 'jane.doe@example.com', '0987654321', '456 Đường XYZ, Quận 3, TP. HCM', FALSE, 'jD_456', NOW()),

INSERT INTO "User" (username, password, email, role, added_date) VALUES
('adminuser', 'hashed_password_3', 'admin@example.com', TRUE, NOW());

