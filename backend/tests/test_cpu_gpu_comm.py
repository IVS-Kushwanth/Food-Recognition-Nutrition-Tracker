"""
Unit & Integration Tests for CPU-GPU Communication & Interconnect Profiler.
Validates PCIe bus modeling, Direct Memory Access (DMA) latency,
pinned memory mechanics, and Amdahl's Law communication-to-computation analysis.
"""

try:
    import pytest
except ImportError:
    pytest = None
try:
    import torch
except ImportError:
    torch = None
from backend.services.cpu_gpu_comm import CpuGpuCommProfiler, cpu_gpu_profiler, PCIE_BANDWIDTH_SPECS


def test_profiler_initialization():
    """Verifies profiler correctly identifies hardware interconnect environment."""
    profiler = CpuGpuCommProfiler()
    specs = profiler.get_interconnect_specs()
    assert "cuda_available" in specs
    assert "supported_interconnects" in specs
    assert "PCIe Gen 4 x16" in specs["supported_interconnects"]
    assert specs["dma_supported"] is True


def test_pcie_bandwidth_specs():
    """Verifies PCIe bandwidth calculations against standard specifications."""
    assert PCIE_BANDWIDTH_SPECS["PCIe Gen 3 x16"]["max_bandwidth_gb_s"] == 15.75
    assert PCIE_BANDWIDTH_SPECS["PCIe Gen 4 x16"]["max_bandwidth_gb_s"] == 31.50
    assert PCIE_BANDWIDTH_SPECS["PCIe Gen 5 x16"]["max_bandwidth_gb_s"] == 63.00


def test_transfer_latency_measurement():
    """Verifies Host-to-Device and Device-to-Host transfer profiling on 224x224 RGB tensors."""
    res = cpu_gpu_profiler.measure_transfer_latency(
        tensor_shape=(1, 3, 224, 224),
        dtype=getattr(torch, "float32", None),
        iterations=10,
        pinned=True,
    )
    assert res["payload_bytes"] == 1 * 3 * 224 * 224 * 4  # 602,112 bytes
    assert res["h2d_latency_us"] > 0
    assert res["d2h_latency_us"] > 0
    assert res["round_trip_comm_ms"] > 0


def test_pinned_memory_speedup():
    """Verifies that pinned memory provides lower overhead than pageable memory."""
    res_pinned = cpu_gpu_profiler.measure_transfer_latency(pinned=True, iterations=10)
    res_pageable = cpu_gpu_profiler.measure_transfer_latency(pinned=False, iterations=10)

    # In both live CUDA and modeled PCIe, pinned memory overhead is strictly lower or equal
    assert res_pinned["h2d_latency_us"] <= res_pageable["h2d_latency_us"]


def test_amdahls_bottleneck_evaluation():
    """Verifies Amdahl's Law communication-to-computation ratio calculation."""
    eval_res = cpu_gpu_profiler.evaluate_amdahls_bottleneck(compute_ms=16.19)
    assert eval_res["compute_time_ms"] == 16.19
    assert eval_res["comm_transfer_time_ms"] > 0
    assert eval_res["total_execution_ms"] > 16.19
    assert eval_res["communication_overhead_percent"] >= 0.0
    assert "architectural_insight" in eval_res
