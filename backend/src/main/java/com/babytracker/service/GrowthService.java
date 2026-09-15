package com.babytracker.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.babytracker.constants.ErrorCode;
import com.babytracker.entity.Baby;
import com.babytracker.entity.GrowthRecord;
import com.babytracker.exception.BizException;
import com.babytracker.mapper.BabyMapper;
import com.babytracker.mapper.GrowthMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class GrowthService {
    private final GrowthMapper mapper;
    private final BabyMapper babyMapper;

    public GrowthService(GrowthMapper mapper, BabyMapper babyMapper) {
        this.mapper = mapper;
        this.babyMapper = babyMapper;
    }

    @Transactional
    public GrowthRecord record(GrowthRecord record) {
        validate(record);
        record.setPercentile(record.getWeightKg() != null && record.getWeightKg() > 9 ? "P75" : "P50");
        mapper.insert(record);
        return record;
    }

    /**
     * 写入前业务校验，任一不满足都明确失败且不落库：
     * 宝宝必须已建档；日期不能为空且不能是未来；身高体重至少填一项；已填项必须为正数。
     */
    private void validate(GrowthRecord record) {
        if (record.getBabyId() == null) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "请先选择宝宝");
        }
        Long babyCount = babyMapper.selectCount(new QueryWrapper<Baby>().eq("id", record.getBabyId()));
        if (babyCount == null || babyCount == 0) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "宝宝档案不存在，请先建档后再记录");
        }
        if (record.getRecordedAt() == null) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "请选择记录日期");
        }
        if (record.getRecordedAt().isAfter(LocalDate.now())) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "记录日期不能晚于今天");
        }

        Double height = record.getHeightCm();
        Double weight = record.getWeightKg();
        if (height == null && weight == null) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "身高和体重至少填写一项");
        }
        if (height != null && height <= 0) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "身高必须为大于 0 的数值");
        }
        if (weight != null && weight <= 0) {
            throw new BizException(ErrorCode.VALIDATION_FAILED, "体重必须为大于 0 的数值");
        }
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
