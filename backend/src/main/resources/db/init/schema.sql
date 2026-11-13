CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    phone VARCHAR(20) NOT NULL DEFAULT '',
    rider_code VARCHAR(16) NULL,
    area VARCHAR(32) NOT NULL DEFAULT '',
    vehicle VARCHAR(16) NOT NULL DEFAULT '电动车',
    online TINYINT NOT NULL DEFAULT 0,
    today_done INT NOT NULL DEFAULT 0,
    total_done INT NOT NULL DEFAULT 0,
    rating DECIMAL(3, 1) NOT NULL DEFAULT 5.0,
    last_login_time DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sys_user_rider_code (rider_code),
    CONSTRAINT chk_sys_user_role CHECK (role IN ('MERCHANT', 'RIDER', 'CUSTOMER')),
    CONSTRAINT chk_sys_user_status CHECK (status IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS shop (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    image VARCHAR(512) NOT NULL DEFAULT '',
    rating DECIMAL(3, 1) NOT NULL DEFAULT 5.0,
    monthly_sales INT NOT NULL DEFAULT 0,
    min_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    full_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '满减门槛，0 表示不参与满减',
    reduce_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '满减优惠金额',
    delivery_time INT NOT NULL DEFAULT 30,
    distance VARCHAR(32) NOT NULL DEFAULT '',
    notice VARCHAR(255) NOT NULL DEFAULT '',
    status TINYINT NOT NULL DEFAULT 1,
    open_menu TINYINT NOT NULL DEFAULT 1,
    tags_json TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS address (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    tag VARCHAR(16) NOT NULL DEFAULT '其他',
    name VARCHAR(64) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    detail VARCHAR(255) NOT NULL,
    is_default TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_address_user_default (user_id, is_default),
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES sys_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(32) NOT NULL,
    type TINYINT NOT NULL,
    sort_no INT NOT NULL DEFAULT 1,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_category_name_type (name, type),
    KEY idx_category_type_status (type, status, sort_no),
    CONSTRAINT chk_category_type CHECK (type IN (1, 2)),
    CONSTRAINT chk_category_status CHECK (status IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS flavor (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    name VARCHAR(32) NOT NULL,
    sort_no INT NOT NULL DEFAULT 1,
    UNIQUE KEY uk_flavor_category_name (category_id, name),
    CONSTRAINT fk_flavor_category FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS flavor_value (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    flavor_id BIGINT NOT NULL,
    name VARCHAR(32) NOT NULL,
    sort_no INT NOT NULL DEFAULT 1,
    UNIQUE KEY uk_flavor_value_name (flavor_id, name),
    CONSTRAINT fk_flavor_value_flavor FOREIGN KEY (flavor_id) REFERENCES flavor (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS dish (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    category_id BIGINT NOT NULL,
    shop_id BIGINT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(512) NOT NULL DEFAULT '',
    description VARCHAR(255) NOT NULL DEFAULT '',
    status TINYINT NOT NULL DEFAULT 1,
    flavors_json TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_dish_category_status (category_id, status),
    CONSTRAINT fk_dish_category FOREIGN KEY (category_id) REFERENCES category (id),
    CONSTRAINT fk_dish_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
    CONSTRAINT chk_dish_status CHECK (status IN (0, 1)),
    CONSTRAINT chk_dish_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS combo (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    category_id BIGINT NOT NULL,
    shop_id BIGINT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(512) NOT NULL DEFAULT '',
    description VARCHAR(255) NOT NULL DEFAULT '',
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_combo_category_status (category_id, status),
    CONSTRAINT fk_combo_category FOREIGN KEY (category_id) REFERENCES category (id),
    CONSTRAINT fk_combo_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
    CONSTRAINT chk_combo_status CHECK (status IN (0, 1)),
    CONSTRAINT chk_combo_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS combo_dish (
    combo_id BIGINT NOT NULL,
    dish_id BIGINT NOT NULL,
    sort_no INT NOT NULL DEFAULT 1,
    PRIMARY KEY (combo_id, dish_id),
    CONSTRAINT fk_combo_dish_combo FOREIGN KEY (combo_id) REFERENCES combo (id) ON DELETE CASCADE,
    CONSTRAINT fk_combo_dish_dish FOREIGN KEY (dish_id) REFERENCES dish (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) NOT NULL UNIQUE,
    user_name VARCHAR(64) NOT NULL DEFAULT '',
    phone VARCHAR(20) NOT NULL DEFAULT '',
    customer_id BIGINT NULL,
    shop_id BIGINT NULL,
    shop_name VARCHAR(64) NOT NULL DEFAULT '',
    table_no VARCHAR(32) NOT NULL DEFAULT '',
    address VARCHAR(255) NOT NULL DEFAULT '',
    address_name VARCHAR(64) NOT NULL DEFAULT '',
    address_phone VARCHAR(20) NOT NULL DEFAULT '',
    address_detail VARCHAR(255) NOT NULL DEFAULT '',
    address_tag VARCHAR(16) NOT NULL DEFAULT '',
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    pack_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '满减优惠金额',
    coupon_id BIGINT NULL COMMENT '使用的优惠券',
    coupon_title VARCHAR(64) NOT NULL DEFAULT '' COMMENT '优惠券名称快照',
    coupon_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '优惠券抵扣金额',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    remark VARCHAR(255) NOT NULL DEFAULT '',
    pay_status VARCHAR(16) NOT NULL DEFAULT 'PAID',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    rider_id BIGINT NULL,
    rider_name VARCHAR(64) NOT NULL DEFAULT '',
    rider_phone VARCHAR(20) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_orders_status_created (status, created_at),
    KEY idx_orders_rider_status (rider_id, status),
    KEY idx_orders_created (created_at),
    CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DELIVERING', 'DONE', 'CANCELED')),
    CONSTRAINT chk_order_pay_status CHECK (pay_status IN ('UNPAID', 'PAID', 'REFUND'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    dish_id BIGINT NOT NULL,
    dish_name VARCHAR(64) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    flavors_json TEXT NOT NULL,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_dish FOREIGN KEY (dish_id) REFERENCES dish (id),
    CONSTRAINT chk_order_item_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_timeline (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_order_timeline_order (order_id, created_at),
    CONSTRAINT fk_order_timeline_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS coupon_template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(64) NOT NULL,
    threshold DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '可用门槛，按菜品金额判断',
    amount DECIMAL(10, 2) NOT NULL COMMENT '抵扣金额',
    shop_id BIGINT NULL COMMENT '为空表示全平台通用',
    description VARCHAR(255) NOT NULL DEFAULT '',
    total INT NOT NULL DEFAULT 0 COMMENT '发放总量',
    expire_days INT NOT NULL DEFAULT 30 COMMENT '领取后有效天数',
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_coupon_template_status (status, amount),
    CONSTRAINT chk_coupon_template_amount CHECK (amount > 0),
    CONSTRAINT chk_coupon_template_threshold CHECK (threshold >= 0),
    CONSTRAINT chk_coupon_template_status CHECK (status IN (0, 1)),
    CONSTRAINT fk_coupon_template_shop FOREIGN KEY (shop_id) REFERENCES shop (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_coupon (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    title VARCHAR(64) NOT NULL,
    threshold DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(10, 2) NOT NULL,
    shop_id BIGINT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'UNUSED',
    order_id BIGINT NULL,
    claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expire_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    active_flag TINYINT GENERATED ALWAYS AS (CASE WHEN status = 'UNUSED' THEN 1 ELSE NULL END) STORED,
    UNIQUE KEY uk_user_coupon_active (user_id, template_id, active_flag),
    KEY idx_user_coupon_user_status (user_id, status, expire_at),
    CONSTRAINT chk_user_coupon_status CHECK (status IN ('UNUSED', 'USED', 'EXPIRED')),
    CONSTRAINT fk_user_coupon_template FOREIGN KEY (template_id) REFERENCES coupon_template (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS wallet_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rider_id BIGINT NOT NULL,
    type VARCHAR(16) NOT NULL DEFAULT 'WITHDRAW',
    amount DECIMAL(10, 2) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL DEFAULT 'DONE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_wallet_rider_time (rider_id, created_at),
    CONSTRAINT chk_wallet_amount CHECK (amount > 0),
    CONSTRAINT chk_wallet_type CHECK (type IN ('WITHDRAW')),
    CONSTRAINT chk_wallet_status CHECK (status IN ('DONE', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

