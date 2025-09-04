--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3
-- Dumped by pg_dump version 17.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: trg_update_product_star(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_product_star() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.trg_update_product_star() OWNER TO postgres;

--
-- Name: update_bill_summary_on_delivery(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_bill_summary_on_delivery() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.update_bill_summary_on_delivery() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(100) NOT NULL,
    phone_number character varying(15),
    address text,
    role boolean DEFAULT false,
    added_date timestamp without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_user_id_seq" OWNER TO postgres;

--
-- Name: User_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_user_id_seq" OWNED BY public."User".user_id;


--
-- Name: admincomment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admincomment (
    cmt_id integer NOT NULL,
    admin_id integer NOT NULL,
    customer_id integer NOT NULL,
    review_id integer NOT NULL,
    rep text
);


ALTER TABLE public.admincomment OWNER TO postgres;

--
-- Name: admincomment_cmt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admincomment_cmt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admincomment_cmt_id_seq OWNER TO postgres;

--
-- Name: admincomment_cmt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admincomment_cmt_id_seq OWNED BY public.admincomment.cmt_id;


--
-- Name: banner; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banner (
    banner_id integer NOT NULL,
    image_url text NOT NULL,
    link text,
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.banner OWNER TO postgres;

--
-- Name: banner_banner_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.banner_banner_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banner_banner_id_seq OWNER TO postgres;

--
-- Name: banner_banner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banner_banner_id_seq OWNED BY public.banner.banner_id;


--
-- Name: bill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bill (
    bill_id integer NOT NULL,
    user_id integer NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    purchase_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    profit numeric(12,2),
    status character varying(50) DEFAULT 'chờ xác nhận'::character varying,
    shipping_name character varying(255),
    shipping_address text,
    shipping_phone character varying(20),
    expected_delivery_date date,
    delivery_date date,
    cancellation_reason text,
    CONSTRAINT bill_profit_check CHECK ((profit >= (0)::numeric)),
    CONSTRAINT bill_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.bill OWNER TO postgres;

--
-- Name: bill_bill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bill_bill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bill_bill_id_seq OWNER TO postgres;

--
-- Name: bill_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bill_bill_id_seq OWNED BY public.bill.bill_id;


--
-- Name: billitem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billitem (
    bill_item_id integer NOT NULL,
    bill_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1,
    price_at_purchase numeric(12,2) NOT NULL,
    discounted_price numeric(12,2),
    discount_amount numeric(12,2),
    CONSTRAINT billitem_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT billitem_discounted_price_check CHECK ((discounted_price >= (0)::numeric)),
    CONSTRAINT billitem_price_at_purchase_check CHECK ((price_at_purchase >= (0)::numeric)),
    CONSTRAINT billitem_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.billitem OWNER TO postgres;

--
-- Name: billitem_bill_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.billitem_bill_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billitem_bill_item_id_seq OWNER TO postgres;

--
-- Name: billitem_bill_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billitem_bill_item_id_seq OWNED BY public.billitem.bill_item_id;


--
-- Name: billvouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billvouchers (
    bill_id integer NOT NULL,
    voucher_id integer NOT NULL
);


ALTER TABLE public.billvouchers OWNER TO postgres;

--
-- Name: cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.cart OWNER TO postgres;

--
-- Name: cart_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_cart_id_seq OWNER TO postgres;

--
-- Name: cart_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;


--
-- Name: cartitem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cartitem (
    cart_item_id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1,
    is_selected boolean DEFAULT false,
    CONSTRAINT cartitem_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cartitem OWNER TO postgres;

--
-- Name: cartitem_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cartitem_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cartitem_cart_item_id_seq OWNER TO postgres;

--
-- Name: cartitem_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cartitem_cart_item_id_seq OWNED BY public.cartitem.cart_item_id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    favorite_id integer NOT NULL,
    user_id integer NOT NULL,
    book_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: favorites_favorite_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_favorite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_favorite_id_seq OWNER TO postgres;

--
-- Name: favorites_favorite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_favorite_id_seq OWNED BY public.favorites.favorite_id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image text,
    import_price numeric(12,2),
    sell_price numeric(12,2) NOT NULL,
    total_sold integer DEFAULT 0,
    stock integer DEFAULT 0,
    added_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    author character varying(255),
    pub_date date,
    category character varying(100),
    isbn character varying(20),
    star numeric(3,2) DEFAULT 0,
    is_sale boolean DEFAULT false,
    discount numeric(4,2) DEFAULT 0,
    sale_end timestamp without time zone,
    CONSTRAINT product_star_check CHECK (((star >= (0)::numeric) AND (star <= (5)::numeric))),
    CONSTRAINT product_stock_check CHECK ((stock >= 0)),
    CONSTRAINT product_total_sold_check CHECK ((total_sold >= 0))
);


ALTER TABLE public.product OWNER TO postgres;

--
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_product_id_seq OWNER TO postgres;

--
-- Name: product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_product_id_seq OWNED BY public.product.product_id;


--
-- Name: review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review (
    review_id integer NOT NULL,
    product_id integer NOT NULL,
    user_id integer NOT NULL,
    bill_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    review_date timestamp with time zone DEFAULT now(),
    CONSTRAINT review_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.review OWNER TO postgres;

--
-- Name: review_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_review_id_seq OWNER TO postgres;

--
-- Name: review_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_review_id_seq OWNED BY public.review.review_id;


--
-- Name: voucher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voucher (
    voucher_id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount numeric(12,2) NOT NULL,
    min_order_value numeric(12,2) DEFAULT 0,
    remaining integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    type character varying(20) NOT NULL,
    voucher_type character varying(20),
    max_discount numeric(12,2),
    description character varying(255),
    CONSTRAINT voucher_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT voucher_min_order_value_check CHECK ((min_order_value >= (0)::numeric)),
    CONSTRAINT voucher_remaining_check CHECK ((remaining >= 0)),
    CONSTRAINT voucher_type_check CHECK (((type)::text = ANY ((ARRAY['fixed'::character varying, 'percentage'::character varying])::text[]))),
    CONSTRAINT voucher_voucher_type_check CHECK (((voucher_type)::text = ANY ((ARRAY['product'::character varying, 'shipping'::character varying])::text[])))
);


ALTER TABLE public.voucher OWNER TO postgres;

--
-- Name: voucher_voucher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.voucher_voucher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.voucher_voucher_id_seq OWNER TO postgres;

--
-- Name: voucher_voucher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.voucher_voucher_id_seq OWNED BY public.voucher.voucher_id;


--
-- Name: User user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN user_id SET DEFAULT nextval('public."User_user_id_seq"'::regclass);


--
-- Name: admincomment cmt_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admincomment ALTER COLUMN cmt_id SET DEFAULT nextval('public.admincomment_cmt_id_seq'::regclass);


--
-- Name: banner banner_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banner ALTER COLUMN banner_id SET DEFAULT nextval('public.banner_banner_id_seq'::regclass);


--
-- Name: bill bill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill ALTER COLUMN bill_id SET DEFAULT nextval('public.bill_bill_id_seq'::regclass);


--
-- Name: billitem bill_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billitem ALTER COLUMN bill_item_id SET DEFAULT nextval('public.billitem_bill_item_id_seq'::regclass);


--
-- Name: cart cart_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);


--
-- Name: cartitem cart_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitem ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cartitem_cart_item_id_seq'::regclass);


--
-- Name: favorites favorite_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN favorite_id SET DEFAULT nextval('public.favorites_favorite_id_seq'::regclass);


--
-- Name: product product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product ALTER COLUMN product_id SET DEFAULT nextval('public.product_product_id_seq'::regclass);


--
-- Name: review review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review ALTER COLUMN review_id SET DEFAULT nextval('public.review_review_id_seq'::regclass);


--
-- Name: voucher voucher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher ALTER COLUMN voucher_id SET DEFAULT nextval('public.voucher_voucher_id_seq'::regclass);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (user_id, username, password, email, phone_number, address, role, added_date) FROM stdin;
1	johndoe	hashed_password_1	john.doe@example.com	0912345678	123 Đường ABC, Quận 1, TP. HCM	f	2025-08-27 23:40:42.997199
2	janedoe	hashed_password_2	jane.doe@example.com	0987654321	456 Đường XYZ, Quận 3, TP. HCM	f	2025-08-27 23:40:42.997199
3	adminuser	88888888	admin@example.com	\N	\N	t	2025-08-27 23:40:50.395471
5	test01	123456789	test01@gmail.com	0123456789	Hà Lỗ - Liên Hà	f	\N
4	trung	17112005	trunghalo@gmail.com	123	Thư Lâm - Hà Nội	f	2025-08-28 10:35:27.421787
7	test02	123456789	test02@gmail.com	0987654321	Châu Phong - Thư Lâm	f	\N
\.


--
-- Data for Name: admincomment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admincomment (cmt_id, admin_id, customer_id, review_id, rep) FROM stdin;
1	3	4	1	\N
2	3	4	2	\N
3	3	5	3	\N
4	3	5	4	\N
6	3	5	6	\N
7	3	5	7	\N
8	3	7	8	\N
9	3	5	9	\N
10	3	5	10	\N
11	3	5	11	\N
12	3	5	12	\N
13	3	5	13	\N
14	3	5	14	\N
15	3	4	15	\N
16	3	7	16	\N
19	3	4	19	\N
20	3	4	20	\N
23	3	5	23	Cảm ơn bạn đã mua hàng
22	3	5	22	Cảm ơn bạn nhé
18	3	4	18	Ok okokokok
17	3	4	17	Hay như thế mà không hay
24	1	4	24	Ok bạn nhé
21	3	7	21	Lần sau ủng hộ nhé
5	3	5	5	Chúc bạn thành công
25	1	4	26	Cảm ơn bạn đã mua hàng
\.


--
-- Data for Name: banner; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banner (banner_id, image_url, link, "order", is_active, created_at) FROM stdin;
2	https://static.ybox.vn/2022/3/0/1647748348849-coverr.png	/book?id=19	2	t	2025-09-02 09:55:57.960005
3	https://thietkelogo.edu.vn/uploads/images/thiet-ke-do-hoa-khac/banner-sach/1.png	/book?id=20	2	t	2025-09-02 10:01:24.577051
1	https://png.pngtree.com/background/20210711/original/pngtree-world-reading-day-hand-painted-e-commerce-book-banner-picture-image_1118336.jpg		1	t	2025-09-02 09:43:07.632869
4	https://png.pngtree.com/background/20220714/original/pngtree-flash-sale-30-percent-off-wide-banner-background-picture-image_1608158.jpg	/flash-sale	4	t	2025-09-03 09:18:28.679036
\.


--
-- Data for Name: bill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bill (bill_id, user_id, total_amount, purchase_date, profit, status, shipping_name, shipping_address, shipping_phone, expected_delivery_date, delivery_date, cancellation_reason) FROM stdin;
1	4	225000.00	2025-08-29 17:14:02.166115	\N	đã hủy	Trịnh Đức Trung	Thư Lâm - Hà Nội	123	\N	\N	\N
2	4	265000.00	2025-08-29 17:18:24.847703	\N	đã hủy	Trịnh Đức Trung	Thư Lâm - Hà Nội	33	\N	\N	\N
3	4	225000.00	2025-08-29 17:21:58.366422	\N	đã hủy	Trịnh Đức Trung	Thư Lâm - Hà Nội	123	\N	\N	\N
5	4	215000.00	2025-08-30 00:38:37.716315	\N	đã hủy	Trịnh Đức Trung	Thư Lâm - Hà Nội	123	\N	\N	\N
15	4	500000.00	2025-09-01 20:59:07.487115	\N	đã giao	trung	Thư Lâm - Hà Nội	123	2025-09-03	2025-09-01	\N
6	4	270000.00	2025-08-30 10:41:20.985453	75000.00	đã giao	Trịnh Đức Trung	Thư Lâm - Hà Nội	123456	2025-09-01	2025-08-31	\N
16	7	125000.00	2025-09-01 21:11:12.053968	\N	đã giao	test02	Châu Phong - Thư Lâm	0987654321	2025-09-03	2025-09-01	\N
7	5	454000.00	2025-09-01 11:05:43.082214	124000.00	đã giao	Trung Trịnh	Hà Lỗ - Liên Hà	0123456789	2025-09-03	2025-09-01	\N
8	5	135000.00	2025-09-01 11:08:42.326335	\N	đã hủy	test01	Hà Lỗ - Liên Hà	0123456789	2025-09-03	\N	Shipper ngã xe làm hàng xuống sông
9	5	840000.00	2025-09-01 15:32:53.54878	\N	đã hủy	test01	Hà Lỗ - Liên Hà	0123456789	2025-09-03	\N	Shipper trộm mất hàng
17	4	155000.00	2025-09-01 21:34:55.283102	\N	đã giao	trung	Thư Lâm - Hà Nội	123	2025-09-03	2025-09-01	\N
10	5	390000.00	2025-09-01 15:43:49.259891	85000.00	đã giao	test01	Hà Lỗ - Liên Hà	0123456789	2025-09-03	2025-09-01	\N
18	4	1029000.00	2025-09-01 22:11:15.419107	\N	đã giao	Trung Trịnh	Thư Lâm - Hà Nội	123	2025-09-03	2025-09-01	\N
19	7	235000.00	2025-09-01 22:16:37.013345	\N	đã giao	test02	Châu Phong - Thư Lâm	0987654321	2025-09-03	2025-09-01	\N
11	7	210000.00	2025-09-01 16:14:07.797162	50000.00	đã giao	test02	Liên Hà	0123456789	2025-09-03	2025-09-01	Đơn hàng #11 đã được giao thành công. Cảm ơn bạn đã mua sắm! Vui lòng dành chút thời gian để đánh giá sản phẩm.
12	7	505000.00	2025-09-01 17:05:47.063697	\N	đã hủy	test02	Liên Hà	0123456789	2025-09-03	\N	Shipper hết xăng
20	5	360000.00	2025-09-01 22:59:25.683814	\N	đã giao	test01	Hà Lỗ - Liên Hà	0123456789	2025-09-06	2025-09-01	\N
13	5	140000.00	2025-09-01 17:49:43.886663	\N	đã giao	test01	Hà Lỗ - Liên Hà	0123456789	2025-09-03	2025-09-01	\N
14	5	639000.00	2025-09-01 20:31:21.357448	\N	đã giao	test01	Hà Lỗ - Liên Hà	0123456789	2025-09-03	2025-09-01	\N
21	4	93000.00	2025-09-03 14:37:42.149607	\N	đã giao	trung	Thư Lâm - Hà Nội	123	2025-09-08	2025-09-03	\N
22	4	235000.00	2025-09-03 17:46:56.075388	55000.00	đã giao	trung	Thư Lâm - Hà Nội	123	2025-09-08	2025-09-03	\N
23	4	191000.00	2025-09-03 18:23:16.091877	31000.00	đã giao	trung	Thư Lâm - Hà Nội	123	2025-09-08	2025-09-03	\N
\.


--
-- Data for Name: billitem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billitem (bill_item_id, bill_id, product_id, quantity, price_at_purchase, discounted_price, discount_amount) FROM stdin;
1	1	9	2	105000.00	\N	\N
2	2	10	1	250000.00	\N	\N
3	3	7	1	210000.00	\N	\N
5	5	16	1	210000.00	\N	\N
6	6	5	1	180000.00	\N	\N
7	6	2	1	85000.00	\N	\N
8	7	17	1	89000.00	\N	\N
9	7	18	1	115000.00	\N	\N
10	7	10	1	250000.00	\N	\N
11	8	9	1	105000.00	\N	\N
12	9	15	1	280000.00	\N	\N
13	9	6	1	110000.00	\N	\N
14	9	12	1	450000.00	\N	\N
15	10	15	1	280000.00	\N	\N
16	10	6	1	110000.00	\N	\N
17	11	16	1	210000.00	\N	\N
18	12	15	1	280000.00	\N	\N
19	12	7	1	210000.00	\N	\N
20	13	3	1	120000.00	\N	\N
21	14	18	1	115000.00	\N	\N
22	14	17	1	89000.00	\N	\N
23	14	3	1	120000.00	\N	\N
24	14	7	1	210000.00	\N	\N
25	14	9	1	105000.00	\N	\N
26	15	14	1	500000.00	\N	\N
27	16	6	1	110000.00	\N	\N
28	17	8	1	135000.00	\N	\N
29	18	12	1	450000.00	\N	\N
30	18	13	1	480000.00	\N	\N
31	18	1	1	99000.00	\N	\N
32	19	11	1	230000.00	\N	\N
33	20	7	1	210000.00	\N	\N
34	20	4	1	150000.00	\N	\N
35	21	20	1	73000.00	\N	\N
36	22	11	1	230000.00	\N	\N
37	23	5	1	171000.00	\N	\N
\.


--
-- Data for Name: billvouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billvouchers (bill_id, voucher_id) FROM stdin;
6	12
7	1
10	4
11	1
13	12
16	1
17	12
19	12
20	1
21	27
21	28
22	12
23	5
23	28
\.


--
-- Data for Name: cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart (cart_id, user_id) FROM stdin;
1	4
2	3
3	5
4	7
\.


--
-- Data for Name: cartitem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartitem (cart_item_id, cart_id, product_id, quantity, is_selected) FROM stdin;
15	1	2	1	f
45	1	10	1	t
13	1	3	1	f
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (favorite_id, user_id, book_id, created_at) FROM stdin;
1	4	20	2025-09-02 22:50:22.477358
2	4	10	2025-09-02 22:50:30.939108
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product (product_id, name, description, image, import_price, sell_price, total_sold, stock, added_date, author, pub_date, category, isbn, star, is_sale, discount, sale_end) FROM stdin;
15	Design Patterns	Hệ thống hóa các mẫu thiết kế hướng đối tượng, giúp viết mã linh hoạt và dễ mở rộng.	https://prodimage.images-bn.com/pimages/9780201633610_p1_v4_s600x595.jpg	220000.00	280000.00	470	84	2025-08-27 23:26:08.448318	Erich Gamma et al.	1994-10-31	Học thuật	9780201633610	5.00	t	10.00	2025-10-01 00:00:00
3	1984	1984 khắc họa một xã hội bị kiểm soát toàn diện, nơi sự thật bị bóp méo và tự do cá nhân bị xóa bỏ.	https://static.oreka.vn/800-800_a711de6a-c6fe-4570-a5c4-9517e9681b33	90000.00	120000.00	920	148	2025-08-27 23:26:08.448318	George Orwell	1949-06-08	Sách nước ngoài	9780451524935	4.50	f	0.00	\N
6	7 Thói Quen Hiệu Quả	Stephen Covey trình bày 7 thói quen nền tảng giúp thay đổi cách suy nghĩ và hành động để đạt thành công.	https://pos.nvncdn.com/fd5775-40602/ps/20240329_LRErpdCwzC.jpeg	85000.00	110000.00	420	57	2025-08-27 23:26:08.448318	Stephen R. Covey	1989-08-15	Phát triển bản thân	9780743269513	4.00	f	0.00	\N
17	Tuổi Trẻ Đáng Giá Bao Nhiêu	Cuốn sách truyền cảm hứng cho người trẻ trong việc lựa chọn, theo đuổi đam mê và sống hết mình.	https://www.nhavanhoasinhvien.vn/wp-content/uploads/2024/03/%E1%BA%A2nh-ch%E1%BB%A5p-m%C3%A0n-h%C3%ACnh-2024-03-11-151734.png	60000.00	89000.00	0	98	2025-08-31 17:08:43.747458	Rosie Nguyễn	2016-05-20	Phát triển bản thân	9786047733751	4.50	f	0.00	\N
16	The Mythical Man-Month	Brooks chia sẻ kinh nghiệm từ dự án IBM System/360, bao gồm định luật nổi tiếng về quản lý phần mềm.	https://www.tigosolutions.com/Uploads/the-mythical-man-month11032024032721.jpg	160000.00	210000.00	330	54	2025-08-27 23:26:08.448318	Frederick P. Brooks Jr.	1975-01-01	Học thuật	9780201835953	4.00	f	0.00	\N
12	Introduction to Algorithms (CLRS)	Cung cấp phân tích chi tiết và ví dụ về các thuật toán, từ sắp xếp đến đồ thị.	https://img.pchome.com.tw/cs/items/DJBQ3HD900FKLF1/000001_1663935457.jpg	350000.00	450000.00	910	49	2025-08-27 23:26:08.448318	Thomas H. Cormen et al.	1990-01-01	Học thuật	9780262033848	5.00	t	35.00	2025-09-30 00:00:00
2	Nhà Giả Kim	Một câu chuyện ẩn dụ về hành trình tìm kiếm vận mệnh của mình. Cuốn sách nhấn mạnh tầm quan trọng của việc theo đuổi ước mơ và lắng nghe trái tim.	https://diendaniso.com/wp-content/uploads/2023/11/Review-s%C3%A1ch-Nh%C3%A0-gi%E1%BA%A3-kim-Paulo-Coelho.jpg	60000.00	85000.00	730	89	2025-08-27 23:26:08.448318	Paulo Coelho	1988-01-01	Tiểu thuyết	9780061122415	5.00	f	0.00	\N
5	Sapiens: Lược Sử Loài Người	Harari đưa người đọc qua hành trình lịch sử loài người từ Homo sapiens đến thế giới hiện đại.	https://bizweb.dktcdn.net/thumb/1024x1024/100/435/244/products/sg11134201221202ucumy8655kvff-e77f3ab8-38e3-4fd5-8470-0f8d19a9ba9b.jpg?v=1672971355547	130000.00	180000.00	650	108	2025-08-27 23:26:08.448318	Yuval Noah Harari	2011-01-01	Lịch sử	9780062316097	5.00	t	5.00	2025-09-04 00:00:00
18	Không Gia Đình	Tác phẩm văn học kinh điển kể về cuộc đời phiêu lưu và nghị lực của cậu bé mồ côi Rémi.	https://cdn1.fahasa.com/media/flashmagazine/images/page_images/khong_gia_dinh_tai_ban_2024/2024_11_05_16_37_52_1-390x510.jpg	80000.00	115000.00	0	58	2025-08-31 17:21:15.061466	Hector Malot	1878-01-01	Văn học	9786042101110	4.50	f	0.00	\N
7	Dune	Lấy bối cảnh hành tinh sa mạc Arrakis, nơi duy nhất sản xuất gia vị quý giá nhất vũ trụ.	http://bizweb.dktcdn.net/thumb/1024x1024/100/363/455/products/xucatbiamembia.jpg?v=1705552591840	160000.00	210000.00	770	68	2025-08-27 23:26:08.448318	Frank Herbert	1965-08-01	Tiểu thuyết	9780441172719	3.50	f	0.00	\N
1	Đắc Nhân Tâm	Đắc nhân tâm là một trong những cuốn sách bán chạy nhất mọi thời đại, giúp bạn hiểu và áp dụng các nguyên tắc để gây thiện cảm và xây dựng các mối quan hệ thành công.	https://noithatbn.vn/image/cache/catalog/dac-nhan-tam/1123-1493801476304-1400x875.jpg	75000.00	99000.00	580	119	2025-08-27 23:26:08.448318	Dale Carnegie	1936-10-22	Phát triển bản thân	9780671027032	4.00	f	0.00	\N
8	Harry Potter và Hòn Đá Phù Thủy	Cuốn mở đầu cho hành trình của Harry Potter tại Trường Phù thủy Hogwarts.	https://www.nxbtre.com.vn/Images/Book/nxbtre_full_21042022_030444.jpg	105000.00	135000.00	950	199	2025-08-27 23:26:08.448318	J.K. Rowling	1997-06-26	Tiểu thuyết	9780747532743	4.00	f	0.00	\N
14	Deep Learning	Giới thiệu lý thuyết, toán học và ứng dụng của học sâu.	https://img.drz.lazcdn.com/static/mm/p/9e4ace86579ba80bec0cd49558b5e12a.jpg_720x720q80.jpg	\N	500000.00	660	39	2025-08-27 23:26:08.448318	Ian Goodfellow, Yoshua Bengio, Aaron Courville	\N	Học thuật	\N	4.00	t	15.00	2025-09-27 00:00:00
11	The Pragmatic Programmer	Hướng dẫn các kỹ năng và tư duy để trở thành lập trình viên giỏi hơn.	https://upload.wikimedia.org/wikipedia/en/8/8f/The_pragmatic_programmer.jpg	175000.00	230000.00	720	93	2025-08-27 23:26:08.448318	Andrew Hunt & David Thomas	1999-10-20	Học thuật	9780201616224	5.00	t	35.00	2025-09-27 00:00:00
13	Artificial Intelligence: A Modern Approach	Bao quát các khái niệm cốt lõi của AI: tìm kiếm, suy luận, học máy, NLP, thị giác máy tính.	https://m.media-amazon.com/images/I/61-6TTTBZeL.jpg	380000.00	480000.00	690	39	2025-08-27 23:26:08.448318	Stuart Russell & Peter Norvig	1995-01-01	Học thuật	9780134610993	5.00	f	0.00	\N
4	Những Người Khốn Khổ	Tác phẩm theo chân Jean Valjean trong hành trình tìm kiếm sự cứu chuộc giữa xã hội đầy bất công.	https://sachchon.com/uploads/2021/07/19/nhung-nguoi-khon-kho.jpg	110000.00	150000.00	880	79	2025-08-27 23:26:08.448318	Victor Hugo	1862-03-30	Văn học	9782070381488	5.00	f	0.00	\N
10	Clean Code	Robert C. Martin đưa ra các nguyên tắc và thực tiễn tốt nhất để viết mã dễ đọc, dễ bảo trì.	https://cdn1.fahasa.com/media/catalog/product/8/9/8936107813361.jpg	190000.00	250000.00	830	129	2025-08-27 23:26:08.448318	Robert C. Martin	2008-08-01	Học thuật	9780132350884	5.00	t	20.00	2025-09-05 00:00:00
20	Giấc Mơ Mỹ - Đường Đến Stanford	“Giấc mơ Mỹ - Đường đến Stanford” không phải là một cuốn cẩm nang du học với những gợi ý đi đâu, ăn gì, hay làm sao để nhận học bổng. Bởi Huyền Chip chưa từng và không bao giờ chọn đi lối mòn, không ngại thử thách và luôn khát khao sống khác biệt. Học xong cấp ba, cô không thi đại học mà nhận lời mời làm việc ở một công ty Malaysia. Khi công việc đang tiến triển\nthuận lợi, cô từ bỏ công việc mơ ước để đi vòng quanh thế giới. Về nước sau chuyến đi kéo dài gần ba năm qua ba châu lục, cô khiến tất cả sửng sốt khi báo tin mình nhận được học bổng toàn phần tại một trong những ngôi trường hàng đầu thế giới. Cô bỏ lại sau lưng những chuyến đi dài ngày và những câu chuyện thị phi để trở thành một sinh viên tưởng như bất bình thường nhưng thực sự lại rất bình thường ở một ngôi trường đặc biệt như Stanford. Bạn sẽ tìm được gì trong nhật ký về những năm đầu tại trường đại học của một cô gái như vậy?	https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1631987653i/33397539.jpg	\N	73000.00	0	149	2025-09-02 09:59:40.651673	Huyền Chip	\N	Phát triển bản thân	\N	5.00	f	0.00	\N
19	Cây cam ngọt của tôi	Cuốn tiểu thuyết là một phần trong bộ bốn tác phẩm tự truyện của Vasconcelos. Nội dung tập trung xoay quanh về các giai đoạn khác nhau trong cuộc đời của nhân vật chính Zezé, hay chính là tác giả Vasconcelos.	https://library.hust.edu.vn/sites/default/files/C%C3%A2y%20cam%20ng%E1%BB%8Dt%20c%E1%BB%A7a%20t%C3%B4i%20-%20%E1%BA%A2nh%20b%C3%ACa.jpg	\N	90000.00	0	100	2025-09-02 09:54:23.13653	José Mauro de Vasconcelos	\N	Tiểu thuyết	\N	0.00	f	0.00	\N
9	Giết Con Chim Nhại (To Kill a Mockingbird)	Lấy bối cảnh miền Nam nước Mỹ thập niên 1930, phản ánh phân biệt chủng tộc và sự trưởng thành.	https://sachxanhxanh.com/wp-content/uploads/2023/03/giet-con-chim-nhai-1-1024x768.png	\N	105000.00	540	99	2025-08-27 23:26:08.448318	Harper Lee	\N	Sách nước ngoài	\N	5.00	f	0.00	\N
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review (review_id, product_id, user_id, bill_id, rating, comment, review_date) FROM stdin;
1	2	4	6	5	Giao nhanh, sách đẹp, rất uy tín	2025-09-01 00:01:21.73165+07
2	5	4	6	5	Sản phẩm rất đáng tiền	2025-09-01 00:01:37.447502+07
3	17	5	7	5	Đơn hàng giao nhanh, 10/10	2025-09-01 11:25:29.461689+07
4	18	5	7	5	Sách hay, giao nhanh, rất tốt	2025-09-01 11:25:46.361878+07
5	10	5	7	5	Sách phù hợp với người nhập môn IT như mình, nội dung chi tiết, 10 điểm	2025-09-01 11:26:13.122367+07
6	15	5	10	5	Hay	2025-09-01 15:45:15.335439+07
7	6	5	10	5	Quá hayyyyy	2025-09-01 15:45:23.360423+07
8	16	7	11	4	Sách đọc cũng được	2025-09-01 16:50:13.736504+07
9	3	5	13	4	Đọc cũng hay	2025-09-01 18:01:59.260825+07
10	17	5	14	4	Đọc cũng OK	2025-09-01 20:32:15.007625+07
11	3	5	14	5	Good	2025-09-01 20:32:21.563604+07
12	18	5	14	4	Cũng được	2025-09-01 20:32:27.534787+07
13	7	5	14	3	Bình thường quá	2025-09-01 20:32:34.997811+07
14	9	5	14	5	Sản phẩm tốt	2025-09-01 20:32:41.34211+07
15	14	4	15	4	Sách hay	2025-09-01 21:02:06.593199+07
16	6	7	16	3	Không hiệu quả lắm	2025-09-01 21:11:50.431568+07
17	8	4	17	4	Đọc cũng được, không hay lắm	2025-09-01 21:35:34.553858+07
18	1	4	18	4	Ok ok ok	2025-09-01 22:13:03.000564+07
19	12	4	18	5	Quá hay	2025-09-01 22:13:09.114404+07
20	13	4	18	5	Quá tuyệt vờiii	2025-09-01 22:13:15.831454+07
21	11	7	19	5	Ổn	2025-09-01 22:18:46.499212+07
22	4	5	20	5	Trên tuyệt vời 1 chút\n	2025-09-01 23:11:45.11998+07
23	7	5	20	4	Sách cũng được, được cái giao nhanh	2025-09-01 23:11:59.383594+07
24	20	4	21	5	Sách hay 10 điểm	2025-09-03 14:38:40.475872+07
25	11	4	22	5	Sản phẩm tốt	2025-09-03 17:47:44.009466+07
26	5	4	23	5	Sách quá hay	2025-09-03 18:24:06.29849+07
\.


--
-- Data for Name: voucher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voucher (voucher_id, code, discount, min_order_value, remaining, start_date, end_date, type, voucher_type, max_discount, description) FROM stdin;
27	TestVoucher	15.00	50000.00	29	2025-09-03 00:00:00	2025-09-30 00:00:00	percentage	product	10000.00	Thử nghiệm
12	SHIPXMAS	20000.00	100000.00	94	2025-08-28 15:38:11.551525	2025-12-25 23:59:59	fixed	shipping	\N	Giảm 20K phí vận chuyển dịp Giáng sinh
5	GIAM10K	10000.00	150000.00	99	2025-09-03 00:00:00	2025-11-30 00:00:00	fixed	product	\N	Giảm 10K cho đơn hàng từ 150K
28	TestVoucher2	10000.00	25000.00	23	2025-09-03 00:00:00	2025-09-30 00:00:00	fixed	shipping	\N	Thử nghiệm thêm voucher - Giảm 10K phí vận chuyển cho đơn từ 25K
3	FREESHIPXMAS	15000.00	50000.00	10	2025-09-04 00:00:00	2025-12-25 00:00:00	fixed	shipping	\N	Giảm 15K phí vận chuyển
6	SALE20	20.00	300000.00	30	2025-08-30 00:00:00	2025-10-31 00:00:00	percentage	product	50000.00	Giảm 20% tối đa 50K cho đơn hàng từ 300K
7	GIAM50K	50000.00	500000.00	15	2025-09-05 00:00:00	2025-09-30 00:00:00	fixed	product	\N	Giảm 50K cho đơn hàng từ 500K
8	SALE15	15.00	200000.00	25	2025-08-31 00:00:00	2025-12-15 00:00:00	percentage	product	30000.00	Giảm 15% tối đa 30K
9	BOOKSALE	30000.00	250000.00	40	2025-09-02 00:00:00	2026-01-31 00:00:00	fixed	product	\N	Giảm 30K cho sách
10	SPECIAL10	10000.00	100000.00	60	2025-09-06 00:00:00	2025-11-15 00:00:00	fixed	product	\N	Giảm 10K cho mọi đơn hàng
11	SUMMER25	25000.00	150000.00	150	2025-08-28 15:38:11.551525	2025-12-31 23:59:59	fixed	product	\N	Giảm 25K cho đơn hàng mùa hè
14	SALE30K	30000.00	300000.00	80	2025-08-28 15:38:11.551525	2025-12-31 23:59:59	fixed	product	\N	Giảm 30K cho đơn hàng lớn
15	MIDAUTUMN	20000.00	100000.00	120	2025-09-05 00:00:00	2025-09-17 23:59:59	fixed	product	\N	Giảm 20K cho đơn hàng mừng Tết Trung Thu
16	NATIONALDAY	10.00	250000.00	80	2025-09-02 00:00:00	2025-09-05 23:59:59	percentage	product	30000.00	Giảm 10% tối đa 30K mừng Quốc Khánh
17	BLACKFRIDAY	50.00	500000.00	30	2025-11-28 00:00:00	2025-11-28 23:59:59	percentage	product	100000.00	Giảm 50% tối đa 100K trong ngày Black Friday
18	YEAR2025	100000.00	1000000.00	15	2025-12-15 00:00:00	2025-12-31 23:59:59	fixed	product	\N	Giảm 100K cho đơn hàng cuối năm
4	SHIP50K	50000.00	300000.00	4	2025-08-28 00:00:00	2025-11-01 00:00:00	fixed	shipping	\N	Miễn phí vận chuyển lên đến 50K
2	SHIPFREE10	10000.00	100000.00	18	2025-08-29 00:00:00	2025-12-31 00:00:00	fixed	shipping	\N	Giảm 10K phí vận chuyển
1	SHIPFREE25	25000.00	0.00	46	2025-09-01 00:00:00	2025-12-31 00:00:00	fixed	shipping	\N	Giảm 25K phí vận chuyển
\.


--
-- Name: User_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_user_id_seq"', 7, true);


--
-- Name: admincomment_cmt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admincomment_cmt_id_seq', 25, true);


--
-- Name: banner_banner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banner_banner_id_seq', 4, true);


--
-- Name: bill_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bill_bill_id_seq', 23, true);


--
-- Name: billitem_bill_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billitem_bill_item_id_seq', 37, true);


--
-- Name: cart_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_cart_id_seq', 4, true);


--
-- Name: cartitem_cart_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cartitem_cart_item_id_seq', 45, true);


--
-- Name: favorites_favorite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_favorite_id_seq', 2, true);


--
-- Name: product_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_product_id_seq', 20, true);


--
-- Name: review_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_review_id_seq', 26, true);


--
-- Name: voucher_voucher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.voucher_voucher_id_seq', 28, true);


--
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (user_id);


--
-- Name: User User_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_username_key" UNIQUE (username);


--
-- Name: admincomment admincomment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admincomment
    ADD CONSTRAINT admincomment_pkey PRIMARY KEY (cmt_id);


--
-- Name: banner banner_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banner
    ADD CONSTRAINT banner_pkey PRIMARY KEY (banner_id);


--
-- Name: bill bill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill
    ADD CONSTRAINT bill_pkey PRIMARY KEY (bill_id);


--
-- Name: billitem billitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billitem
    ADD CONSTRAINT billitem_pkey PRIMARY KEY (bill_item_id);


--
-- Name: billvouchers billvouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billvouchers
    ADD CONSTRAINT billvouchers_pkey PRIMARY KEY (bill_id, voucher_id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);


--
-- Name: cartitem cartitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitem
    ADD CONSTRAINT cartitem_pkey PRIMARY KEY (cart_item_id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (favorite_id);


--
-- Name: favorites favorites_user_id_book_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_book_id_key UNIQUE (user_id, book_id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);


--
-- Name: review review_product_id_user_id_bill_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_product_id_user_id_bill_id_key UNIQUE (product_id, user_id, bill_id);


--
-- Name: voucher voucher_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_code_key UNIQUE (code);


--
-- Name: voucher voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_pkey PRIMARY KEY (voucher_id);


--
-- Name: idx_product_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_category ON public.product USING btree (category);


--
-- Name: idx_product_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_name ON public.product USING btree (name);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_email ON public."User" USING btree (email);


--
-- Name: idx_user_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_username ON public."User" USING btree (username);


--
-- Name: idx_voucher_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_voucher_code ON public.voucher USING btree (code);


--
-- Name: review review_after_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER review_after_delete AFTER DELETE ON public.review FOR EACH ROW EXECUTE FUNCTION public.trg_update_product_star();


--
-- Name: review review_after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER review_after_insert AFTER INSERT ON public.review FOR EACH ROW EXECUTE FUNCTION public.trg_update_product_star();


--
-- Name: review review_after_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER review_after_update AFTER UPDATE OF rating, product_id ON public.review FOR EACH ROW EXECUTE FUNCTION public.trg_update_product_star();


--
-- Name: bill trg_update_bill_summary_on_delivery; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_bill_summary_on_delivery AFTER UPDATE OF status ON public.bill FOR EACH ROW EXECUTE FUNCTION public.update_bill_summary_on_delivery();


--
-- Name: admincomment admincomment_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admincomment
    ADD CONSTRAINT admincomment_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public."User"(user_id) ON DELETE CASCADE;


--
-- Name: admincomment admincomment_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admincomment
    ADD CONSTRAINT admincomment_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public."User"(user_id) ON DELETE CASCADE;


--
-- Name: admincomment admincomment_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admincomment
    ADD CONSTRAINT admincomment_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review(review_id) ON DELETE CASCADE;


--
-- Name: bill bill_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill
    ADD CONSTRAINT bill_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON DELETE CASCADE;


--
-- Name: billitem billitem_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billitem
    ADD CONSTRAINT billitem_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bill(bill_id) ON DELETE CASCADE;


--
-- Name: billitem billitem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billitem
    ADD CONSTRAINT billitem_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: billvouchers billvouchers_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billvouchers
    ADD CONSTRAINT billvouchers_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bill(bill_id) ON DELETE CASCADE;


--
-- Name: billvouchers billvouchers_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billvouchers
    ADD CONSTRAINT billvouchers_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.voucher(voucher_id) ON DELETE RESTRICT;


--
-- Name: cart cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON DELETE CASCADE;


--
-- Name: cartitem cartitem_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitem
    ADD CONSTRAINT cartitem_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(cart_id) ON DELETE CASCADE;


--
-- Name: cartitem cartitem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartitem
    ADD CONSTRAINT cartitem_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: favorites favorites_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id) ON DELETE CASCADE;


--
-- Name: review review_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bill(bill_id);


--
-- Name: review review_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: review review_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(user_id);


--
-- PostgreSQL database dump complete
--

