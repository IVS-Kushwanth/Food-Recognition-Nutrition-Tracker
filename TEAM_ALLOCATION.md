# Team Responsibility Allocation & Work Breakdown Structure

**Project**: NutriVision AI – Food Recognition & Nutrition Tracker  
**Architecture Context**: Full-Stack Computer Vision, Verified Nutritional Database, and COA Memory Hierarchy Profiler  
**Standard**: Modular ownership with zero cross-module collision  

---

## 1. Allocation Matrix & Access Permissions

| Team Member | Designated Project Role | Integration Branch | Scoped Working Folders | Permitted Files to Modify | Restricted / Forbidden Areas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kushwanth** | **CPU ARCHITECTURE LEAD** | `Kushwanth-&-Ganesh`, `main` | `backend/cache/`, `backend/agents/bot_a_coa.py`, `reports/coa/`, Root Governance | `backend/cache/lru_cache.py`, `backend/agents/bot_a_coa.py`, `backend/agents/tools.py`, `reports/coa/**/*`, `*.md` | `frontend/**/*`, `training/**/*`, `datasets/**/*` |
| **Ganesh** | **CPU ARCHITECTURE supporter** | `Kushwanth-&-Ganesh` | `backend/database/`, `backend/services/` | `backend/database/**/*`, `backend/services/nutrition_calculator.py`, `backend/services/nutrition_service.py` | `frontend/**/*`, `training/**/*`, `datasets/**/*` |
| **Reshma** | **ML model and AI integration** | `Reshma` | `backend/models/`, `training/`, `datasets/`, `backend/agents/bot_b_engineer.py` | `backend/models/**/*`, `training/**/*`, `datasets/**/*`, `backend/agents/bot_b_engineer.py`, `reports/ai_engineer/**/*` | `frontend/**/*`, `backend/api/**/*`, `backend/database/**/*`, `backend/cache/**/*` |
| **Deepika** | **Is worked on website** | `Deepika` | `frontend/src/`, `frontend/public/` | `frontend/src/**/*`, `frontend/public/*`, `frontend/index.html`, `frontend/vite.config.js`, `frontend/package.json` | `backend/**/*`, `training/**/*`, `datasets/**/*` |
| **Manikanta** | **GPU** | `Manikanta-&-Koushik` | `training/evaluate_architectures.py`, `backend/models/` | `training/evaluate_architectures.py`, `backend/agents/tools.py`, GPU benchmark scripts | `frontend/**/*`, `backend/database/**/*`, `backend/cache/**/*` |
| **Koushik** | **pipelining** | `Manikanta-&-Koushik` | `backend/api/`, `backend/services/`, `backend/` | `backend/main.py`, `backend/config.py`, `backend/api/**/*`, `backend/services/image_processor.py`, `backend/services/text_matching.py` | `frontend/**/*`, `training/**/*`, `datasets/**/*` |
| **Alekhya** | **CPU-GPU Communication & Interconnect Specialist** | `Alekhya` | `backend/services/cpu_gpu_comm.py`, `reports/coa/`, `backend/tests/test_cpu_gpu_comm.py` | `backend/services/cpu_gpu_comm.py`, `reports/coa/CPU_GPU_COMMUNICATION_AND_BUS_ARCHITECTURE.md`, `backend/tests/test_cpu_gpu_comm.py`, `README.md` | Core model training and database modification without review |

---

## 2. Detailed Member Specifications

### 1. Kushwanth – CPU ARCHITECTURE LEAD
- **Core Responsibilities**:
  - Maintain the integrity of the COA memory hierarchy emulation and repository release branches.
  - Implement the in-memory Level 3 software LRU Cache ($O(1)$ lookup, insertion, capacity-6 eviction) in `backend/cache/lru_cache.py`.
  - Lead Bot A (Autonomous COA Researcher agent) generating formal CPU register and ALU operation reports into `reports/coa/`.
  - Instrument microsecond-level telemetry comparing in-memory cache speed ($2\text{--}15\,\mu\text{s}$) against disk I/O.
- **Key Deliverables**:
  - `backend/cache/lru_cache.py` (Doubly-linked list + hash map).
  - `backend/agents/bot_a_coa.py` and `backend/agents/tools.py`.
  - Academic reports: `reports/coa/CPU_REGISTERS_AND_ALU_OPERATIONS.md` and `reports/coa/MEMORY_HIERARCHY_AND_CACHE_ARCHITECTURE.md`.
- **Testing Requirements**:
  - Run `pytest backend/tests/test_cache.py -v` (LRU hit/miss/eviction).

---

### 2. Ganesh – CPU ARCHITECTURE Supporter
- **Core Responsibilities**:
  - Maintain Level 4 Secondary Storage: the persistent SQLite database engine and schema (`backend/database/`).
  - Curate and seed verified laboratory composition data from IFCT 2017 & USDA FoodData Central (`backend/database/seed_data.py`).
  - Implement proportional nutrient scaling in `backend/services/nutrition_calculator.py`.
  - Maintain the nutrition service coordinator mediating between the LRU cache and secondary disk storage.
- **Key Deliverables**:
  - `backend/database/schema.py`, `backend/database/db.py`, `backend/database/food_nutrition.db`.
  - `backend/services/nutrition_calculator.py` and `backend/services/nutrition_service.py`.
- **Testing Requirements**:
  - Run `pytest backend/tests/test_nutrition.py -v`.

---

### 3. Reshma – ML Model & AI Integration
- **Core Responsibilities**:
  - Maintain the PyTorch MobileNetV3-Small classifier (`backend/models/food_classifier.py`).
  - Implement the singleton model loader enforcing the COA RAM Residency Principle (pre-loaded once into DRAM).
  - Fine-tune transfer learning routines (`training/train.py`, `training/preprocess.py`) across 12 target classes.
  - Calibrate the Nutrition5k bulk density portion estimator (`backend/models/portion_estimator.py`).
  - Maintain Bot B (Autonomous AI Engineer agent) for automated inference benchmarking and health monitoring.
- **Key Deliverables**:
  - Checkpoint weights in `backend/models/saved_weights/food_classifier.pt`.
  - `backend/agents/bot_b_engineer.py` and benchmark logs in `reports/ai_engineer/`.
- **Testing Requirements**:
  - Run `python training/evaluate.py` to confirm Top-1 $\ge 63\%$ and Top-5 $\ge 91\%$.
  - Confirm mean single-image CPU inference latency remains sub-20ms.

---

### 4. Deepika – Website & Frontend Engineer
- **Core Responsibilities**:
  - Implement responsive UI components using React 19 and Vite 6.
  - Coordinate client-side state for image upload, mismatch alert banners, top-5 prediction bars, and portion sliders.
  - Visualize the interactive 4-tier COA memory hierarchy pyramid and live microsecond telemetry panel.
  - Develop the 6 administrative views in the Autonomous Agents Management Hub (`frontend/src/pages/agents/`).
- **Key Deliverables**:
  - `frontend/src/components/*` and `frontend/src/pages/*`.
  - Axios client bindings in `frontend/src/services/api.js`.
  - Production build passing with zero warnings (`npm run build`).
- **Testing Requirements**:
  - Execute `npm run build` and `npx oxlint`.
  - Verify UI responsiveness across desktop and mobile viewports.

---

### 5. Manikanta – GPU Acceleration Specialist
- **Core Responsibilities**:
  - Benchmark candidate deep learning vision architectures (`MobileNetV3-Small` vs `EfficientNet-B0` vs `ResNet-50`) in `training/evaluate_architectures.py`.
  - Audit GPU vs CPU hardware acceleration throughput and evaluate CUDA runtime compatibility.
  - Instrument PyTorch intra-op thread allocation and device tensor placement in `backend/agents/tools.py`.
- **Key Deliverables**:
  - `training/evaluate_architectures.py` and benchmark metrics in `documentation/ARCHITECTURE_BENCHMARK.json`.
  - GPU accelerator detection and diagnostic routines in `backend/agents/tools.py`.
- **Testing Requirements**:
  - Execute `python training/evaluate_architectures.py` to verify throughput metrics across backbones.

---

### 6. Koushik – Pipelining & Backend Systems Engineer
- **Core Responsibilities**:
  - Maintain the FastAPI web application and REST routing (`backend/main.py`, `backend/api/routes.py`).
  - Build the unified end-to-end `/api/analyze` execution pipeline orchestrating image preprocessing, vision inference, portion estimation, fuzzy text matching, and nutrition retrieval.
  - Implement the multi-tier fuzzy text-image matching pipeline (synonym normalization, token Jaccard overlap, Levenshtein edit distance).
  - Implement the 14-scenario automated test runner `backend/tests/run_all_tests.py`.
- **Key Deliverables**:
  - High-performance FastAPI endpoints on port 8000.
  - `backend/services/text_matching.py` and `backend/services/image_processor.py`.
  - `backend/tests/run_all_tests.py` and `backend/tests/test_api.py`.
- **Testing Requirements**:
  - Run `python backend/tests/run_all_tests.py` (Confirm 14/14 scenarios pass).
  - Run `pytest backend/tests/test_api.py -v`.

---

### 7. Alekhya – CPU-GPU Communication & Interconnect Specialist
- **Core Responsibilities**:
  - Maintain the CPU-GPU communication profiler and bus interconnect analysis module (`backend/services/cpu_gpu_comm.py`).
  - Benchmark and model Host-to-Device (H2D) and Device-to-Host (D2H) transfer latencies across PCIe bus configurations (Gen 3, Gen 4, Gen 5 x16 lanes).
  - Profile Direct Memory Access (DMA) and the throughput advantage of Pinned (Page-Locked) memory over Pageable memory allocations.
  - Evaluate Amdahl's Law and Communication-to-Computation Ratios (CCR) for single-sample edge computer vision inference.
  - Author the formal COA academic report on CPU-GPU bus architecture (`reports/coa/CPU_GPU_COMMUNICATION_AND_BUS_ARCHITECTURE.md`).
- **Key Deliverables**:
  - `backend/services/cpu_gpu_comm.py` (CPU-GPU communication profiler).
  - `reports/coa/CPU_GPU_COMMUNICATION_AND_BUS_ARCHITECTURE.md` (Academic report on PCIe layers, DMA, and TLP overhead).
  - `backend/tests/test_cpu_gpu_comm.py` (Verification test suite).
  - FastAPI endpoint `/api/coa/cpu-gpu-comm` exposing interconnect telemetry.
- **Testing Requirements**:
  - Run `python backend/tests/run_all_tests.py` (Confirm Scenario 16: CPU-GPU Communication passes).
