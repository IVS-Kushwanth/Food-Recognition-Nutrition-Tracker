# NutriVision AI: Food Recognition & Nutrition Tracker
### Academic Computer Vision & Computer Organization and Architecture (COA) Capstone Project

NutriVision AI is an end-to-end, functional machine-learning application that accepts a user-entered food name and an uploaded photograph of a food plate. It identifies the dish using a fine-tuned MobileNetV3 deep learning classifier, validates the prediction against the user's input with multi-tier text-image matching, estimates the serving weight, calculates exact proportional nutritional values from verified laboratory composition tables (IFCT 2017 & USDA FoodData Central), and instruments every step against the **CPU Memory Hierarchy (Registers → RAM Residency → Application LRU Cache → Secondary Storage)**.

---

## 🌟 Key Features

1. **Autonomous AI Agents & Control Center (Bot A & Bot B)**:
   - **Bot A – COA Researcher**: Researches CPU registers, ALU operations, L1/L2 SRAM cache, and memory hierarchy. Inspects project files and generates formal technical reports and Mermaid diagrams into `reports/coa/`.
   - **Bot B – AI Engineer**: Benchmarks PyTorch inference on held-out test data, captures latency distributions (min, mean, p95), monitors host CPU & RAM utilization (`psutil`), detects GPU acceleration (`torch.cuda`), runs automated pytest suites, and diagnoses code issues.
   - **Autonomous Execution Loop**: Each agent executes a strict 7-phase loop:
     $$\text{PLAN} \rightarrow \text{ASSIGN} \rightarrow \text{EXECUTE} \rightarrow \text{OBSERVE} \rightarrow \text{DEBUG} \rightarrow \text{VERIFY} \rightarrow \text{REPORT}$$
   - **Inter-Agent Communication**: Direct tripartite messaging bus where Bot A requests real hardware/cache telemetry from Bot B, Bot B returns empirical measurements, and Bot A integrates verified numbers into COA documentation.
   - **Agent Management Dashboard**: Web interface with live CPU/RAM/GPU telemetry, task dispatching, priority queues, step-by-step audit logs, tripartite chat, and reports explorer.

2. **Computer Vision Inference (No Dummy Models)**:
   - Fine-tuned **MobileNetV3-Small** (1.52M parameters, 5.88 MB RAM resident footprint).
   - Trained across 12 dishes (Indian staples and global favorites) with ImageNet normalization and data augmentations.
   - Evaluated on held-out test data: **91.67% Top-5 Accuracy**, **63.89% Top-1 Accuracy**, Macro F1: **62.28%**, Mean CPU latency: **16.19 ms**.
   - Top-5 softmax confidence distribution with unknown-food handling (< 35% threshold).

2. **Intelligent Text & Image Verification**:
   - Multi-tier matching pipeline: text normalization, database synonym mapping (e.g. *"Dum Biryani"* ↔ *"Chicken Biryani"*), token Jaccard overlap, and Levenshtein sequence matching.
   - **Interactive Mismatch Warning**: When user text differs from the image prediction (e.g., entered *"Veg Fried Rice"* vs predicted *"Chicken Biryani"*), the UI halts automatic nutrition assignment, displays an alert, and prompts the user to select either the computer vision prediction or their entered dish name.

3. **Verified Nutritional Database & Exact Calculations**:
   - Sourced from the **Indian Food Composition Tables (IFCT 2017)** published by the National Institute of Nutrition (ICMR) and **USDA FoodData Central**.
   - Zero hardcoded or random numbers: exact proportional scaling using:
     $$\text{Nutrient Amount} = \frac{\text{Nutrient per } 100\,\text{g} \times \text{Serving Weight (g)}}{100}$$
   - Energy contribution calculation (4 kcal/g protein, 4 kcal/g carbohydrates, 9 kcal/g fat) and FDA Daily Values (% DV).

4. **Calibrated Portion Estimation & Uncertainty Handling**:
   - 2D plate area coverage combined with dish bulk density ($\text{g/cm}^3$) calibrated against **Nutrition5k** dataset measurements.
   - Prominent uncertainty disclosure: explains that single 2D RGB photographs lack depth/volumetric geometry.
   - Interactive slider and numeric input allows users to adjust serving size (50g to 1000g) with live recalculation.

5. **COA Memory Hierarchy Integration**:
   - **CPU Processing**: Vector arithmetic, image preprocessing, and proportional nutrient calculations.
   - **Main Memory (RAM) Residency**: Model loaded into RAM **once** at server startup (5.88 MB); zero repeated disk file reads.
   - **Application LRU Cache**: In-RAM doubly-linked list + hash map (Capacity = 6) delivering **O(1) lookups in 2–15 µs** vs 1–5 ms SQLite disk access (~200–500x speedup).
   - **Secondary Storage**: SQLite database (`food_nutrition.db`) for catalog, persistent history, and model checkpoints.
   - *Academic Distinction*: Clearly documents that the software LRU cache operates in process memory demonstrating caching concepts, not direct hardware L1/L2 SRAM cache line manipulation.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite)"]
        UI["User Interface"]
        IMG_INPUT["Plate Image Upload"]
        TXT_INPUT["Food Name Input"]
        PORTION_SLIDER["Serving Size Adjustment"]
        COA_VIEW["COA Memory Hierarchy Profiler"]
    end

    subgraph API["Backend API (FastAPI)"]
        ROUTER["API Router (/api/analyze, /api/nutrition)"]
        PREPROC["Image Preprocessor (Pillow + Torchvision)"]
        TEXT_MATCHER["Text & Image Matcher"]
        CALC["Nutrition Proportional Calculator"]
    end

    subgraph MemoryHierarchy["COA Memory Hierarchy"]
        subgraph L1_L3["Level 1: CPU Registers & L1/L2/L3 SRAM"]
            ALU["Matrix Mult & Softmax (~0.5 - 15 ns)"]
        end

        subgraph RAM_Tier["Level 2: Main Memory (DRAM)"]
            MODEL_RAM["Resident MobileNetV3 Weights (5.88 MB)"]
        end

        subgraph LRU_Tier["Level 3: Application LRU Cache"]
            LRU["Doubly-Linked List + Hash Map (Capacity: 6, ~2-15 µs)"]
        end

        subgraph Disk_Tier["Level 4: Secondary Storage (NVMe/SSD)"]
            SQLITE[("SQLite: food_nutrition.db (~0.5 - 5.0 ms)")]
            WEIGHTS[("Saved Weights Checkpoint (.pt)")]
        end
    end

    IMG_INPUT --> ROUTER
    TXT_INPUT --> ROUTER
    PORTION_SLIDER --> ROUTER

    ROUTER --> PREPROC
    PREPROC --> ALU
    ALU <--> MODEL_RAM
    ROUTER --> TEXT_MATCHER
    ROUTER --> CALC

    CALC --> LRU
    LRU -- Cache Hit (O(1)) --> CALC
    LRU -- Cache Miss --> SQLITE
    SQLITE --> LRU

    ROUTER --> UI
    ROUTER --> COA_VIEW
```

---

## 📊 Computer Vision Model Benchmark & Selection

Three candidate architectures were benchmarked on CPU inference latency, parameter count, and memory footprint:

| Architecture | Parameters | Checkpoint Size | Mean CPU Latency | RAM Footprint | Selection Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MobileNetV3-Small** | **1.52M** | **5.84 MB** | **11.81 ms** | **5.88 MB** | **SELECTED** |
| EfficientNet-B0 | 4.02M | 15.35 MB | 42.35 ms | 15.42 MB | Rejected (3.6x slower) |
| ResNet-50 | 23.53M | 89.77 MB | 93.88 ms | 89.85 MB | Rejected (7.9x slower) |

**Empirical Rationale**: MobileNetV3-Small delivers sub-15ms CPU inference, fitting comfortably within RAM and L3 CPU cache boundaries without memory thrashing, making it the ideal architecture for real-time edge processing and educational COA profiling.

### Model Evaluation Results (Held-Out Test Set)
- **Top-1 Accuracy**: 63.89%
- **Top-5 Accuracy**: 91.67%
- **Macro F1 Score**: 62.28%
- **Mean Inference Time**: 16.19 ms
- Confusion Matrix generated and preserved at `documentation/confusion_matrix.png`.

---

## ⚡ COA Memory Hierarchy Latency Spectrum

| Hierarchy Tier | Component in System | Typical Access Latency | Data Stored | Capacity |
| :--- | :--- | :--- | :--- | :--- |
| **CPU Registers** | CPU Execution Units | ~0.5 – 1.0 ns | Active vector dot products | < 1 KB |
| **Hardware L1/L2/L3** | On-die SRAM Cache | ~1 – 15 ns | Hot convolution kernels | 1 – 32 MB |
| **Main Memory (RAM)** | OS / PyTorch Runtime | ~50 – 100 ns | Resident Model (5.88 MB) | 8 – 32 GB |
| **Software LRU Cache** | Hash Map + Doubly-Linked List | **~2 – 15 µs (0.002 ms)** | Hot Food Nutrition Records | 6 Entries |
| **Secondary Storage** | SQLite `food_nutrition.db` | **~0.5 – 5.0 ms** | Full Catalog, History, Disk Checkpoint | 500 GB – 2 TB |

**Speedup**: In-memory LRU cache queries run **~200x to 500x faster** than disk-bound SQLite queries.

---

## 📂 Project Structure

```
Food Recognition & Nutrition Tracker/
├── backend/
│   ├── main.py                     # FastAPI entrypoint & static mounting
│   ├── config.py                   # Central configuration & paths
│   ├── requirements.txt            # Python dependencies
│   ├── agents/                     # Autonomous AI Agents & Coordinator
│   │   ├── base_agent.py           # Base agent lifecycle & state machine
│   │   ├── bot_a_coa.py            # Bot A: COA Researcher agent
│   │   ├── bot_b_engineer.py       # Bot B: AI Engineer agent
│   │   ├── coordinator.py          # Central agent coordinator & task scheduler
│   │   ├── db_models.py            # SQLite schema for agent tasks & messages
│   │   └── tools.py                # Telemetry, benchmarking & diagnostic tools
│   ├── api/
│   │   ├── routes.py               # Core REST API endpoints
│   │   └── agent_routes.py         # Autonomous agent management endpoints
│   ├── cache/
│   │   └── lru_cache.py            # Doubly-linked list + Hash Map LRU Cache
│   ├── database/
│   │   ├── db.py                   # SQLite connection & query manager
│   │   ├── schema.py               # Database schema definition
│   │   └── seed_data.py            # IFCT 2017 & USDA FDC nutritional seed data
│   ├── models/
│   │   ├── food_classifier.py      # Singleton PyTorch model loader (RAM resident)
│   │   ├── portion_estimator.py    # Nutrition5k density & area portion estimator
│   │   └── saved_weights/          # Trained MobileNetV3 checkpoint (16.5 MB)
│   ├── services/
│   │   ├── image_processor.py      # Image validation & transforms
│   │   ├── nutrition_calculator.py # Exact proportional nutrient scaling
│   │   ├── nutrition_service.py    # LRU cache + DB fallback coordinator
│   │   └── text_matching.py        # Multi-tier text-image matching & mismatch detection
│   └── tests/
│       ├── test_agents.py          # Autonomous agent lifecycle & task tests
│       ├── test_api.py             # FastAPI endpoint tests
│       ├── test_cache.py           # LRU hit/miss/eviction tests
│       ├── test_matching.py        # Text-image matching tests
│       ├── test_nutrition.py       # Nutrition scaling & database tests
│       └── run_all_tests.py        # Comprehensive verification runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top brand navigation & RAM residency badge
│   │   │   ├── ImageUploader.jsx   # Drag & drop upload, preview & presets
│   │   │   ├── MatchBanner.jsx     # Text-image match confirmation / mismatch alert
│   │   │   ├── TopPredictions.jsx  # Top-5 probabilities bar list
│   │   │   ├── NutritionCards.jsx  # Calories, Protein, Carbs, Fat, Fiber cards
│   │   │   ├── MacroChart.jsx      # SVG Donut energy distribution
│   │   │   ├── PortionController.jsx # Serving weight slider (50g-1000g)
│   │   │   ├── CoaTelemetryPanel.jsx # Live pipeline latency breakdown
│   │   │   └── MemoryHierarchyDiagram.jsx # Interactive 4-tier COA pyramid
│   │   ├── pages/
│   │   │   ├── AnalysisPage.jsx    # End-to-end analysis workflow
│   │   │   ├── HistoryPage.jsx     # SQLite analysis history viewer & delete
│   │   │   └── CoaExplorerPage.jsx # COA memory profiler & cache benchmark
│   │   ├── services/
│   │   │   └── api.js              # Axios API client
│   │   ├── App.jsx                 # Main application layout
│   │   └── index.css               # Styling & dark-mode design system
│   └── dist/                       # Compiled production frontend bundle
├── training/
│   ├── preprocess.py               # Dataset train/val/test splitter
│   ├── evaluate_architectures.py   # MobileNet vs EfficientNet vs ResNet benchmark
│   ├── train.py                    # Transfer learning fine-tuning script
│   └── evaluate.py                 # Evaluation & confusion matrix generator
├── datasets/
│   ├── download_dataset.py         # Wikimedia Commons dataset fetcher
│   ├── metadata.json               # Image attribution & Creative Commons licenses
│   └── class_mapping.json          # 12 target classes mapping
├── documentation/
│   ├── ARCHITECTURE_BENCHMARK.json # Benchmarking report
│   ├── MODEL_EVALUATION.md         # Detailed classification metrics
│   └── confusion_matrix.png        # Test set confusion matrix
├── start_app.bat                   # 1-Click Unified Full-Stack Launcher (Port 8000)
├── start_dev.bat                   # 1-Click Dual-Server Dev Launcher (8000 + 5173)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ (Tested on Python 3.12.8)
- Node.js 18+ (Tested on Node.js v24.13.0)

### Quick Start (Single Unified Server)
Double-click `start_app.bat` or run:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser. The backend serves both the complete interactive React UI and the REST API.

### Dual-Server Development Mode
Double-click `start_dev.bat` or run:
```bash
# Terminal 1 - Backend:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 - Frontend Dev Server:
cd frontend
node node_modules/vite/bin/vite.js --port 5173 --host
```
Open **[http://localhost:5173](http://localhost:5173)** for instant hot-module replacement.

---

## 🧪 Verification & Test Suite

NutriVision AI includes two independent test suites verifying every component:

### 1. PyTest Unit & Integration Suite (21 Tests)
```bash
python -m pytest backend/tests/ -v
```
**Result**: `21 passed in 13.75s` (API routes, LRU cache eviction, synonym matching, mismatch detection, exact nutrient proportions, portion scaling, unknown dish handling).

### 2. Comprehensive 14-Scenario Real-World Verification
```bash
python backend/tests/run_all_tests.py
```
**Result**: `14/14 SCENARIOS PASSED`
- Valid food image processing (Pillow validation)
- Invalid image rejection (Corrupted / non-image files)
- Valid food name & synonym matching (*"Dum Biryani"* ↔ *"Chicken Biryani"*)
- Unknown food detection (Threshold < 0.35)
- Text-image match confirmation
- User prompt spec: *"Veg Fried Rice"* vs *"Chicken Biryani"* mismatch warning
- Top-5 predictions with confidence
- Exact proportional nutrition calculations
- Serving size scaling recalculation
- Missing food database fallback
- LRU cache hit, miss, insertion, and capacity-6 eviction
- SQLite database connectivity & IFCT/USDA records
- End-to-end analysis pipeline
- COA memory hierarchy instrumentation (CPU, RAM, Cache, Disk)

---

## 📚 Academic Citations & Datasets

1. **Indian Food Composition Tables (IFCT 2017)**: National Institute of Nutrition, Indian Council of Medical Research (ICMR). Sourced for traditional Indian dishes (`chicken_biryani`, `dosa`, `idli`, `chapati`, `dal_makhani`, `paneer_tikka`, `samosa`, `chole_bhature`).
2. **USDA FoodData Central (FDC)**: Agricultural Research Service, U.S. Department of Agriculture. Sourced for western dishes (`pizza`, `burger`, `caesar_salad`, `fried_rice`).
3. **Nutrition5k Dataset**: Thames, A., et al. *"Nutrition5k: Towards Analysis of Multiple Nutrients from Food Images"*, IEEE/CVF CVPR 2021. Used for dish bulk density ($\text{g/cm}^3$) and plate area portion calibration.
4. **Food-101 Dataset**: Bossard, L., et al. *"Food-101 – Mining Discriminative Components with Random Forests"*, ECCV 2014. Used for category taxonomy.
5. **Wikimedia Commons**: High-resolution dish photographs utilized under Creative Commons licenses (CC BY-SA 2.0, 3.0, 4.0). Complete attribution metadata preserved in `datasets/metadata.json`.

---

## 📜 License
Distributed for academic and research purposes under the MIT License.
