package com.dandanyun.common;

import java.util.List;

public record PageResult<T>(long total, List<T> records, long page, long pageSize) {
}
