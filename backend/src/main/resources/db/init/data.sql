INSERT IGNORE INTO sys_user (id, username, display_name, password_hash, role, status, phone)
VALUES
    (1001, 'admin', '刘添祺',
     'pbkdf2$120000$06J+pOIJUWRbjvKO44KdUQ==$Du4iY1orRsr5FaG4tSe3+8XkF8zAvE/R+VCdcDHe6Tc=',
     'ADMIN', 1, '13800001001'),
    (1002, 'hyh', '胡粤毫',
     'pbkdf2$120000$nPBG0CNB7TUIOZvquXfUkw==$uiMMq2SrkR1LJWm2AvOqJV6fJfkqFvM+yyg7zbknIos=',
     'ADMIN', 1, '13800001002'),
    (1003, 'gy', '桂誉',
     'pbkdf2$120000$rbIuTOBhXdONueYnLw8nAA==$VfZ1EdWuH2UZaH/UGgLk2Y8niN1VluUeDIqKmIfNIwk=',
     'ADMIN', 1, '13800001003'),
    (1004, 'staff', '员工账号',
     'pbkdf2$120000$tDqzUbFU8SwvcvcrazS1Ew==$9Dl+5tos//z5HmL36rFtXK5u6Qj6lR2fLh8bu1qCPJc=',
     'STAFF', 1, '13800001004');

UPDATE sys_user SET
    display_name = '刘添祺',
    password_hash = 'pbkdf2$120000$06J+pOIJUWRbjvKO44KdUQ==$Du4iY1orRsr5FaG4tSe3+8XkF8zAvE/R+VCdcDHe6Tc=',
    role = 'ADMIN', status = 1, phone = '13800001001'
WHERE username = 'admin';
UPDATE sys_user SET
    display_name = '胡粤毫',
    password_hash = 'pbkdf2$120000$nPBG0CNB7TUIOZvquXfUkw==$uiMMq2SrkR1LJWm2AvOqJV6fJfkqFvM+yyg7zbknIos=',
    role = 'ADMIN', status = 1, phone = '13800001002'
WHERE username = 'hyh';
UPDATE sys_user SET
    display_name = '桂誉',
    password_hash = 'pbkdf2$120000$rbIuTOBhXdONueYnLw8nAA==$VfZ1EdWuH2UZaH/UGgLk2Y8niN1VluUeDIqKmIfNIwk=',
    role = 'ADMIN', status = 1, phone = '13800001003'
WHERE username = 'gy';
UPDATE sys_user SET
    display_name = '员工账号',
    password_hash = 'pbkdf2$120000$tDqzUbFU8SwvcvcrazS1Ew==$9Dl+5tos//z5HmL36rFtXK5u6Qj6lR2fLh8bu1qCPJc=',
    role = 'STAFF', status = 1, phone = '13800001004'
WHERE username = 'staff';

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

INSERT IGNORE INTO dish (id, name, category_id, price, image, description, status, flavors_json)
VALUES
    (3001, '宫保鸡丁', 2001, 38.00, '', '经典川味热菜', 1,
     '[{"name":"辣度","values":["微辣","中辣"]}]'),
    (3002, '鱼香肉丝', 2001, 32.00, '', '酸甜微辣', 1,
     '[{"name":"辣度","values":["微辣"]}]'),
    (3003, '凉拌黄瓜', 2002, 14.00, '', '清爽开胃', 1, '[]'),
    (3004, '米饭', 2003, 2.00, '', '当日新米', 1,
     '[{"name":"份量","values":["小碗","大碗"]}]'),
    (3005, '牛肉面', 2003, 28.00, '', '现煮牛肉面', 1,
     '[{"name":"份量","values":["小碗","大碗"]}]'),
    (3006, '柠檬水', 2004, 10.00, '', '新鲜柠檬', 1,
     '[{"name":"温度","values":["常温","加冰"]},{"name":"甜度","values":["无糖","半糖","全糖"]}]'),
    (3007, '红豆双皮奶', 2005, 16.00, '', '冷藏甜品', 1, '[]'),
    (3008, '炸鸡块', 2001, 24.00, '', '外酥里嫩', 1,
     '[{"name":"辣度","values":["不辣","微辣"]}]');

INSERT IGNORE INTO combo (id, name, category_id, price, image, description, status)
VALUES
    (4001, '单人A餐', 2008, 38.00, '', '热菜、主食和饮品', 1),
    (4002, '双人超值餐', 2009, 88.00, '', '双人共享套餐', 1);

INSERT IGNORE INTO combo_dish (combo_id, dish_id, sort_no)
VALUES
    (4001, 3001, 1), (4001, 3004, 2), (4001, 3006, 3),
    (4002, 3001, 1), (4002, 3002, 2), (4002, 3004, 3),
    (4002, 3005, 4), (4002, 3006, 5);

INSERT IGNORE INTO orders
    (id, order_no, user_name, phone, table_no, address, amount, pack_fee, total_amount, remark,
     pay_status, status, created_at, updated_at)
VALUES
    (5001, 'DC-DEMO-5001', '王小明', '13800001111', '3 号桌', '', 42.00, 0.00, 42.00, '不要香菜',
     'PAID', 'PENDING', DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
    (5002, 'DC-DEMO-5002', '李静', '13900002222', '7 号桌', '', 38.00, 0.00, 38.00, '',
     'PAID', 'DONE', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (5003, 'DC-DEMO-5003', '张伟', '13700003333', '打包带走', '北京市海淀区示例地址', 32.00, 2.00, 34.00, '',
     'REFUND', 'CANCELED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 40 HOUR));

INSERT IGNORE INTO order_item
    (id, order_id, dish_id, dish_name, quantity, unit_price, amount, flavors_json)
VALUES
    (6001, 5001, 3001, '宫保鸡丁', 1, 38.00, 38.00, '["辣度:中辣"]'),
    (6002, 5001, 3004, '米饭', 2, 2.00, 4.00, '["份量:小碗"]'),
    (6003, 5002, 3006, '柠檬水', 1, 10.00, 10.00, '["温度:加冰","甜度:半糖"]'),
    (6004, 5002, 3005, '牛肉面', 1, 28.00, 28.00, '["份量:大碗"]'),
    (6005, 5003, 3002, '鱼香肉丝', 1, 32.00, 32.00, '["辣度:微辣"]');

INSERT IGNORE INTO order_timeline (id, order_id, status, created_at)
VALUES
    (7001, 5001, 'PENDING', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
    (7002, 5002, 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7003, 5002, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 23 HOUR)),
    (7004, 5002, 'DELIVERING', DATE_SUB(NOW(), INTERVAL 22 HOUR)),
    (7005, 5002, 'DONE', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (7006, 5003, 'PENDING', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (7007, 5003, 'CANCELED', DATE_SUB(NOW(), INTERVAL 40 HOUR));
