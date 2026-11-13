INSERT IGNORE INTO sys_user
    (id, username, display_name, password_hash, role, status, phone,
     rider_code, area, vehicle, online, today_done, total_done, rating)
VALUES
    (1001, 'merchant', '刘添祺',
     'pbkdf2$120000$LASN7hT+x2UUwleopeGUpQ==$5mnnm383OCGnUz/ZaWhNi5b3SsT9uz+xN8DWxV8UPvE=',
     'MERCHANT', 1, '13800001001', NULL, '', '电动车', 0, 0, 0, 5.0),
    (1002, 'rider', '王小明',
     'pbkdf2$120000$RStDDSe5Jvwu8DN8ONrP+A==$/YDKA3tD0mVDEj7OWNPWSQysBothk71AjIirMEZR5R4=',
     'RIDER', 1, '13800001002', 'R1001', '中关村站', '电动车', 1, 1, 68, 4.9),
    (1003, 'rider2', '桂誉',
     'pbkdf2$120000$zgNt6HM4u8hqsOWBdW92Xg==$70S7nqaEGwCW1rfc/TujDxtURFNpkG9yI4bhXB/BpUo=',
     'RIDER', 1, '13800001003', 'R1002', '望京站', '摩托车', 0, 0, 31, 4.8),
    (1004, 'customer', '胡粤毫',
     'pbkdf2$120000$GKhbkNVmYOXvKY1gtI7pww==$ja/AqL9p73uc/ASjamRDv7u7zRC7Q5uCv2eP886FSPM=',
     'CUSTOMER', 1, '13800001004', NULL, '', '电动车', 0, 0, 0, 5.0);

UPDATE sys_user SET
    display_name = '刘添祺',
    password_hash = 'pbkdf2$120000$LASN7hT+x2UUwleopeGUpQ==$5mnnm383OCGnUz/ZaWhNi5b3SsT9uz+xN8DWxV8UPvE=',
    role = 'MERCHANT', status = 1, phone = '13800001001'
WHERE username = 'merchant';
UPDATE sys_user SET
    display_name = '王小明',
    password_hash = 'pbkdf2$120000$RStDDSe5Jvwu8DN8ONrP+A==$/YDKA3tD0mVDEj7OWNPWSQysBothk71AjIirMEZR5R4=',
    role = 'RIDER', status = 1, phone = '13800001002',
    rider_code = 'R1001', area = '中关村站', vehicle = '电动车', online = 1,
    today_done = 1, total_done = 68, rating = 4.9
WHERE username = 'rider';
UPDATE sys_user SET
    display_name = '桂誉',
    password_hash = 'pbkdf2$120000$zgNt6HM4u8hqsOWBdW92Xg==$70S7nqaEGwCW1rfc/TujDxtURFNpkG9yI4bhXB/BpUo=',
    role = 'RIDER', status = 1, phone = '13800001003',
    rider_code = 'R1002', area = '望京站', vehicle = '摩托车', online = 0,
    today_done = 0, total_done = 31, rating = 4.8
WHERE username = 'rider2';
UPDATE sys_user SET
    display_name = '胡粤毫',
    password_hash = 'pbkdf2$120000$GKhbkNVmYOXvKY1gtI7pww==$ja/AqL9p73uc/ASjamRDv7u7zRC7Q5uCv2eP886FSPM=',
    role = 'CUSTOMER', status = 1, phone = '13800001004'
WHERE username = 'customer';

INSERT IGNORE INTO shop
    (id, name, image, rating, monthly_sales, min_price, delivery_fee, delivery_time,
     distance, notice, status, open_menu, tags_json)
VALUES
    (10001, '川味小馆', '', 4.9, 2380, 20.00, 5.00, 30, '1.2km',
     '现炒现做，高峰期可能延迟', 1, 1, '["川菜","热销"]'),
    (10002, '稻香快餐', '', 4.7, 1860, 15.00, 3.00, 25, '800m',
     '新客立减 5 元', 1, 1, '["快餐","新客优惠"]'),
    (10003, '轻食研究所', '', 4.8, 920, 25.00, 6.00, 35, '2.4km',
     '正在准备菜单', 1, 0, '["轻食","健康"]'),
    (10004, '夜宵炸物局', '', 4.6, 760, 18.00, 4.00, 40, '3.1km',
     '今日休息，暂停接单', 0, 1, '["夜宵","炸物"]');

INSERT IGNORE INTO address (id, user_id, tag, name, phone, detail, is_default)
VALUES
    (11001, 1004, '公司', '胡粤毫', '13800001004', '北京市海淀区中关村大街 1 号', 1),
    (11002, 1004, '家', '胡粤毫', '13800001004', '北京市海淀区知春路 8 号 2 栋 501', 0);

INSERT IGNORE INTO category (id, name, type, sort_no, status)
VALUES
    (2001, '热菜', 1, 1, 1),
    (2002, '凉菜', 1, 2, 1),
    (2003, '主食', 1, 3, 1),
    (2004, '饮品', 1, 4, 1),
    (2005, '甜点', 1, 5, 1),
    (2008, '单人套餐', 2, 1, 1),
    (2009, '双人套餐', 2, 2, 1);

INSERT IGNORE INTO flavor (id, category_id, name, sort_no)
VALUES
    (2101, 2001, '辣度', 1),
    (2102, 2001, '份量', 2),
    (2103, 2003, '份量', 1),
    (2104, 2004, '温度', 1),
    (2105, 2004, '甜度', 2);

INSERT IGNORE INTO flavor_value (id, flavor_id, name, sort_no)
VALUES
    (2201, 2101, '不辣', 1), (2202, 2101, '微辣', 2),
    (2203, 2101, '中辣', 3), (2204, 2101, '特辣', 4),
    (2205, 2102, '小份', 1), (2206, 2102, '大份', 2),
    (2207, 2103, '小碗', 1), (2208, 2103, '大碗', 2),
    (2209, 2104, '常温', 1), (2210, 2104, '加冰', 2),
    (2211, 2105, '无糖', 1), (2212, 2105, '半糖', 2), (2213, 2105, '全糖', 3);

INSERT IGNORE INTO dish
    (id, name, category_id, shop_id, price, image, description, status, flavors_json)
VALUES
    (3001, '宫保鸡丁', 2001, 10001, 38.00, '', '经典川味热菜', 1,
     '[{"name":"辣度","values":["微辣","中辣"]}]'),
    (3002, '鱼香肉丝', 2001, 10001, 32.00, '', '酸甜微辣', 1,
     '[{"name":"辣度","values":["微辣"]}]'),
    (3003, '凉拌黄瓜', 2002, 10002, 14.00, '', '清爽开胃', 1, '[]'),
    (3004, '米饭', 2003, 10002, 2.00, '', '当日新米', 1,
     '[{"name":"份量","values":["小碗","大碗"]}]'),
    (3005, '牛肉面', 2003, 10002, 28.00, '', '现煮牛肉面', 1,
     '[{"name":"份量","values":["小碗","大碗"]}]'),
    (3006, '柠檬水', 2004, 10001, 10.00, '', '新鲜柠檬', 1,
     '[{"name":"温度","values":["常温","加冰"]},{"name":"甜度","values":["无糖","半糖","全糖"]}]'),
    (3007, '红豆双皮奶', 2005, 10001, 16.00, '', '冷藏甜品', 1, '[]'),
    (3008, '炸鸡块', 2001, 10004, 24.00, '', '外酥里嫩', 1,
     '[{"name":"辣度","values":["不辣","微辣"]}]');

INSERT IGNORE INTO combo
    (id, name, category_id, shop_id, price, image, description, status)
VALUES
    (4001, '单人A餐', 2008, 10001, 38.00, '', '热菜、主食和饮品', 1),
    (4002, '双人超值餐', 2009, 10001, 88.00, '', '双人共享套餐', 1);

INSERT IGNORE INTO combo_dish (combo_id, dish_id, sort_no)
VALUES
    (4001, 3001, 1), (4001, 3004, 2), (4001, 3006, 3),
    (4002, 3001, 1), (4002, 3002, 2), (4002, 3004, 3),
    (4002, 3005, 4), (4002, 3006, 5);

INSERT IGNORE INTO orders
    (id, order_no, user_name, phone, customer_id, shop_id, shop_name, table_no,
     address, address_name, address_phone, address_detail, address_tag,
     amount, delivery_fee, pack_fee, total_amount, remark, pay_status, status,
     rider_id, rider_name, rider_phone, created_at, updated_at)
VALUES
    (5001, 'DC-DEMO-5001', '胡粤毫', '13800001004', 1004, 10001, '川味小馆', '',
     '北京市海淀区中关村大街 1 号', '胡粤毫', '13800001004',
     '北京市海淀区中关村大街 1 号', '公司',
     42.00, 5.00, 0.00, 47.00, '不要香菜', 'PAID', 'PENDING',
     NULL, '', '', DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
    (5002, 'DC-DEMO-5002', '胡粤毫', '13800001004', 1004, 10001, '川味小馆', '',
     '北京市海淀区中关村大街 1 号', '胡粤毫', '13800001004',
     '北京市海淀区中关村大街 1 号', '公司',
     38.00, 5.00, 0.00, 43.00, '', 'PAID', 'ACCEPTED',
     NULL, '', '', DATE_SUB(NOW(), INTERVAL 40 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    (5003, 'DC-DEMO-5003', '胡粤毫', '13800001004', 1004, 10001, '川味小馆', '',
     '北京市海淀区知春路 8 号', '胡粤毫', '13800001004',
     '北京市海淀区知春路 8 号 2 栋 501', '家',
     32.00, 5.00, 0.00, 37.00, '', 'PAID', 'DELIVERING',
     1002, '王小明', '13800001002', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    (5004, 'DC-DEMO-5004', '胡粤毫', '13800001004', 1004, 10001, '川味小馆', '',
     '北京市海淀区中关村大街 1 号', '胡粤毫', '13800001004',
     '北京市海淀区中关村大街 1 号', '公司',
     30.00, 5.00, 0.00, 35.00, '', 'PAID', 'DONE',
     1002, '王小明', '13800001002', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (5005, 'DC-DEMO-5005', '胡粤毫', '13800001004', 1004, 10001, '川味小馆', '',
     '北京市海淀区中关村大街 1 号', '胡粤毫', '13800001004',
     '北京市海淀区中关村大街 1 号', '公司',
     26.00, 5.00, 0.00, 31.00, '', 'REFUND', 'CANCELED',
     NULL, '', '', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 40 HOUR));

INSERT IGNORE INTO order_item
    (id, order_id, dish_id, dish_name, quantity, unit_price, amount, flavors_json)
VALUES
    (6001, 5001, 3001, '宫保鸡丁', 1, 38.00, 38.00, '["辣度:中辣"]'),
    (6002, 5001, 3004, '米饭', 2, 2.00, 4.00, '["份量:小碗"]'),
    (6003, 5002, 3006, '柠檬水', 1, 10.00, 10.00, '["温度:加冰","甜度:半糖"]'),
    (6004, 5002, 3005, '牛肉面', 1, 28.00, 28.00, '["份量:大碗"]'),
    (6005, 5003, 3002, '鱼香肉丝', 1, 32.00, 32.00, '["辣度:微辣"]'),
    (6006, 5004, 3001, '宫保鸡丁', 1, 38.00, 38.00, '["辣度:微辣"]'),
    (6007, 5005, 3003, '凉拌黄瓜', 1, 14.00, 14.00, '[]');

INSERT IGNORE INTO order_timeline (id, order_id, status, created_at)
VALUES
    (7001, 5001, 'PENDING', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
    (7002, 5002, 'PENDING', DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
    (7003, 5002, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    (7004, 5003, 'PENDING', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (7005, 5003, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
    (7006, 5003, 'DELIVERING', DATE_SUB(NOW(), INTERVAL 60 MINUTE)),
    (7007, 5004, 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7008, 5004, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 23 HOUR)),
    (7009, 5004, 'DELIVERING', DATE_SUB(NOW(), INTERVAL 22 HOUR)),
    (7010, 5004, 'DONE', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (7011, 5005, 'PENDING', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (7012, 5005, 'CANCELED', DATE_SUB(NOW(), INTERVAL 40 HOUR));
