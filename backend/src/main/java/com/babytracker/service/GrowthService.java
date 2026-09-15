package com.babytracker.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.babytracker.entity.GrowthRecord;
import com.babytracker.mapper.GrowthMapper;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class GrowthService {
    private final GrowthMapper mapper;
    public GrowthService(GrowthMapper mapper) { this.mapper = mapper; }

    public GrowthRecord record(GrowthRecord record) {
        record.setPercentile(record.getWeightKg() != null && record.getWeightKg() > 9 ? "P75" : "P50");
        mapper.insert(record);
        return record;
    }

    /** 按宝宝和日期区间查询生长记录；参数均为可选，不传时返回全部记录（保持原有行为）。 */
    public List<GrowthRecord> list(Long babyId, LocalDate start, LocalDate end) {
        QueryWrapper<GrowthRecord> wrapper = new QueryWrapper<>();
        if (babyId != null) {
            wrapper.eq("baby_id", babyId);
        }
        if (start != null) {
            wrapper.ge("recorded_at", start);
        }
        if (end != null) {
            wrapper.le("recorded_at", end);
        }
        wrapper.orderByAsc("recorded_at", "id");
        return mapper.selectList(wrapper);
    }
}
