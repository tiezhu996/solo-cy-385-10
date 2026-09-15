package com.babytracker.controller;

import com.babytracker.entity.GrowthRecord;
import com.babytracker.service.GrowthService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/growth")
public class GrowthController {
    private final GrowthService service;
    public GrowthController(GrowthService service) { this.service = service; }

    @GetMapping
    public List<GrowthRecord> list(
            @RequestParam(name = "babyId", required = false) Long babyId,
            @RequestParam(name = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(name = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return service.list(babyId, start, end);
    }

    @PostMapping public GrowthRecord record(@RequestBody GrowthRecord record) { return service.record(record); }
}
