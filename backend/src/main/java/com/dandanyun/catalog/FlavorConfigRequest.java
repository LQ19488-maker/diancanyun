package com.dandanyun.catalog;

import java.util.List;

public record FlavorConfigRequest(List<FlavorConfig> flavors) {

    public record FlavorConfig(String name, List<FlavorValueConfig> values) {
    }

    public record FlavorValueConfig(String name) {
    }
}
