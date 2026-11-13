package com.dandanyun.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

/**
 * 集成测试专用数据库：每次运行前重建 diancanyun_test，避免污染开发库。
 * 连接信息可通过 DANDANYUN_TEST_DB_HOST / PORT / USER / PASSWORD 覆盖，
 * 未设置时依次回退到 DB_USERNAME / DB_PASSWORD，最后回退到 root / 123456。
 */
public final class TestDatabase {

    public static final String HOST = firstNonBlank(System.getenv("DANDANYUN_TEST_DB_HOST"), "127.0.0.1");
    public static final String PORT = firstNonBlank(System.getenv("DANDANYUN_TEST_DB_PORT"), "3306");
    public static final String USER = firstNonBlank(
            System.getenv("DANDANYUN_TEST_DB_USER"),
            System.getenv("DB_USERNAME"),
            "root"
    );
    public static final String PASSWORD = firstNonBlank(
            System.getenv("DANDANYUN_TEST_DB_PASSWORD"),
            System.getenv("DB_PASSWORD"),
            "123456"
    );
    public static final String DATABASE = "diancanyun_test";

    private static boolean prepared;

    private TestDatabase() {
    }

    /**
     * 本机没有可用 MySQL 时返回 false，集成测试整体跳过而不是报红。
     */
    public static boolean mysqlAvailable() {
        try (Connection connection = DriverManager.getConnection(serverUrl(), USER, PASSWORD)) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 重建测试库并返回可用的 JDBC 地址（由 Spring 在启动上下文前调用）。
     */
    public static String url() {
        reset();
        return "jdbc:mysql://" + HOST + ":" + PORT + "/" + DATABASE
                + "?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"
                + "&allowPublicKeyRetrieval=true&useSSL=false";
    }

    private static String serverUrl() {
        return "jdbc:mysql://" + HOST + ":" + PORT + "/"
                + "?allowPublicKeyRetrieval=true&useSSL=false&connectTimeout=2000";
    }

    private static synchronized void reset() {
        if (prepared) {
            return;
        }
        try (Connection connection = DriverManager.getConnection(serverUrl(), USER, PASSWORD);
             Statement statement = connection.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS " + DATABASE);
            statement.execute("CREATE DATABASE " + DATABASE
                    + " CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
        } catch (Exception e) {
            throw new IllegalStateException("无法准备测试库 " + DATABASE, e);
        }
        prepared = true;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
