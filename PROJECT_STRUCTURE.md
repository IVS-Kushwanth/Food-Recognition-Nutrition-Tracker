# NutriVision AI: Complete Project Structure & File Guide

**System Name**: NutriVision AI – Food Recognition & Nutrition Tracker  
**Scope**: Full-Stack Architecture, Deep Learning Pipeline, COA Memory Hierarchy, Autonomous Multi-Agent System  

---

## 1. Directory Tree Overview

```
COA PROJECT/
├── .gitignore                      # Central Git ignore specification
├── README.md                       # Comprehensive system documentation
├── TEAM_ALLOCATION.md              # Engineering roles & module permissions
├── CONTRIBUTION_GUIDELINES.md      # Code standards, commits, and PR rules
├── BRANCH_STRATEGY.md              # Multi-branch GitHub collaboration strategy
├── PROJECT_STRUCTURE.md            # Architectural directory & file taxonomy
├── start_app.bat                   # 1-Click Production Server Launcher (Port 8000)
├── start_dev.bat                   # 1-Click Dual-Server Dev Launcher (8000 + 5173)
│
├── backend/                        # FastAPI Application & Systems Logic
│   ├── main.py                     # Entrypoint: Model RAM pre-loading, SQLite init, routing
│   ├── config.py                   # Central paths, image constraints, LRU cache capacity
│   ├── requirements.txt            # Python dependencies (PyTorch, FastAPI, etc.)
│   ├── agents/                     # Autonomous AI Agents Subsystem
│   │   ├── base_agent.py           # 7-phase agent loop & state machine
│   │   ├── bot_a_coa.py            # Bot A: COA Researcher agent (Hardware reports)
│   │   ├── bot_b_engineer.py       # Bot B: AI Engineer agent (Benchmarks & diagnostics)
│   │   ├── coordinator.py          # Central coordinator, task queue, thread manager
│   │   ├── db_models.py            # SQLite schema for agent tasks, logs, and messages
│   │   └── tools.py                # Telemetry capture, pytest runner, benchmark tools
│   ├── api/                        # REST API Routing
│   │   ├── routes.py               # Core routes (/analyze, /nutrition, /match-food, /history)
│   │   └── agent_routes.py         # Agent hub routes (/agents, /tasks, /messages, /reports)
│   ├── cache/                      # COA Memory Hierarchy: Level 3 Cache
│   │   └── lru_cache.py            # Doubly-linked list + Hash Map O(1) LRU Cache
│   ├── database/                   # COA Memory Hierarchy: Level 4 Secondary Storage
│   │   ├── db.py                   # SQLite query manager & analysis history persistence
│   │   ├── schema.py               # Database table schemas
│   │   ├── seed_data.py            # Verified nutritional composition (IFCT 2017 & USDA)
│   │   └── food_nutrition.db       # Persistent SQLite database file
│   ├── models/                     # Deep Learning Models & Weights
│   │   ├── food_classifier.py      # Singleton MobileNetV3 loader (COA RAM Principle)
│   │   ├── portion_estimator.py    # Nutrition5k plate area & bulk density estimator
│   │   └── saved_weights/
│   │       └── food_classifier.pt  # Fine-tuned PyTorch checkpoint (16.5 MB)
│   ├── services/                   # Application Business Logic
│   │   ├── image_processor.py      # PIL image validation, aspect-ratio preservation
│   │   ├── nutrition_calculator.py # Proportional nutrient scaling formula implementation
│   │   ├── nutrition_service.py    # LRU Cache lookup coordinator with DB fallback
│   │   └── text_matching.py        # Multi-tier text-image matching & mismatch detection
│   ├── tests/                      # Automated Verification Test Suites
│   │   ├── run_all_tests.py        # 14-scenario end-to-end verification runner
│   │   ├── test_agents.py          # Autonomous agent thread & task lifecycle tests
│   │   ├── test_api.py             # FastAPI REST endpoint integration tests
│   │   ├── test_cache.py           # LRU Cache hit, miss, and capacity-6 eviction tests
│   │   ├── test_matching.py        # Levenshtein & token Jaccard matching tests
│   │   └── test_nutrition.py       # Proportional nutritional calculation tests
│   └── uploads/                    # Runtime image upload folder (tracked with .gitkeep)
│       └── .gitkeep
│
├── frontend/                       # React 19 + Vite User Interface
│   ├── index.html                  # Single Page Application HTML root
│   ├── package.json                # Frontend package dependencies & scripts
│   ├── package-lock.json           # Locked npm dependency tree
│   ├── vite.config.js              # Vite server configuration & API proxy (Port 8000)
│   ├── .gitignore                  # Frontend-specific ignore rules
│   ├── .oxlintrc.json              # Oxlint linter configuration
│   ├── public/                     # Static web assets (Favicon, SVG icons)
│   └── src/
│       ├── main.jsx                # React root mount
│       ├── App.jsx                 # Main layout & tab router
│       ├── App.css                 # Base application styles
│       ├── index.css               # Global theme & dark-mode CSS variables
│       ├── assets/                 # Brand assets & hero illustrations
│       ├── components/             # Reusable UI Components
│       │   ├── Navbar.jsx          # Top navigation with live RAM residency badge
│       │   ├── ImageUploader.jsx   # Drag & drop upload, preview & quick food presets
│       │   ├── MatchBanner.jsx     # Text-image confirmation & interactive mismatch alert
│       │   ├── TopPredictions.jsx  # Top-5 softmax confidence probability bars
│       │   ├── NutritionCards.jsx  # Nutrient metric cards (Calories, Protein, Carbs, Fat)
│       │   ├── MacroChart.jsx      # Energy distribution SVG donut chart
│       │   ├── PortionController.jsx # Interactive serving weight slider (50g to 1000g)
│       │   ├── CoaTelemetryPanel.jsx # Live CPU, RAM, Cache, and Disk latency profiler
│       │   └── MemoryHierarchyDiagram.jsx # Interactive 4-tier COA memory hierarchy pyramid
│       ├── pages/                  # High-Level Page Views
│       │   ├── AnalysisPage.jsx    # End-to-end recognition & nutrition analysis workflow
│       │   ├── HistoryPage.jsx     # SQLite analysis history log viewer
│       │   ├── CoaExplorerPage.jsx # COA memory profiler & empirical cache benchmarking
│       │   └── agents/             # Autonomous Agents Hub Views
│       │       ├── AgentsDashboardPage.jsx # Multi-agent status & live hardware telemetry
│       │       ├── BotAPage.jsx    # Bot A (COA Researcher) controls & reports
│       │       ├── BotBPage.jsx    # Bot B (AI Engineer) benchmarks & test runners
│       │       ├── TaskManagerPage.jsx # Background task queue & priority scheduler
│       │       ├── AgentCommsPage.jsx  # Inter-agent tripartite communication chat
│       │       └── ReportsPage.jsx # Technical report viewer (Markdown rendering)
│       └── services/
│           └── api.js              # Axios HTTP client connecting to FastAPI backend
│
├── datasets/                       # Model Training & Benchmark Datasets
│   ├── class_mapping.json          # 12-class index mapping & train/val/test split counts
│   ├── metadata.json               # Wikimedia Commons attribution & license records
│   ├── download_dataset.py         # Dataset download & verification utility
│   ├── raw/                        # 192 high-resolution raw food images (35.7 MB)
│   └── processed/                  # 192 pre-scaled 224x224 RGB tensors (35.7 MB)
│
├── training/                       # Deep Learning Model Pipeline
│   ├── preprocess.py               # Train/val/test data splitting & augmentations
│   ├── evaluate_architectures.py   # MobileNet vs EfficientNet vs ResNet latency benchmark
│   ├── train.py                    # Transfer learning fine-tuning execution script
│   ├── evaluate.py                 # Test-set evaluation & confusion matrix generator
│   └── training_history.json       # Epoch-by-epoch loss & accuracy log
│
├── documentation/                  # Technical Architecture & Academic Reports
│   ├── ARCHITECTURE_BENCHMARK.json # Candidate model CPU latency & parameter benchmarks
│   ├── MODEL_EVALUATION.md         # Held-out test set accuracy, precision & recall metrics
│   ├── EVALUATION_REPORT.json      # Structured classification evaluation metrics
│   └── confusion_matrix.png        # 12-class test set confusion matrix visual
│
└── reports/                        # Autonomous Agent Generated Reports
    ├── coa/                        # Bot A Generated Computer Architecture Reports
    │   ├── CPU_REGISTERS_AND_ALU_OPERATIONS.md
    │   └── MEMORY_HIERARCHY_AND_CACHE_ARCHITECTURE.md
    ├── ai_engineer/                # Bot B Generated Model Benchmarks & Test Logs
    └── benchmarks/                 # System performance logs
```

---

## 2. Component Responsibility Mapping

| Path | Primary Technology | Core Function |
| :--- | :--- | :--- |
| `backend/main.py` | FastAPI, Uvicorn | Pre-loads model into DRAM once, mounts endpoints and static files. |
| `backend/models/food_classifier.py` | PyTorch, MobileNetV3 | Singleton vision model; executes forward pass in sub-20ms. |
| `backend/cache/lru_cache.py` | Python (Doubly-Linked List) | Application-level software cache demonstrating O(1) hit/miss mechanics. |
| `backend/database/` | SQLite3 | Secondary storage holding verified nutritional records (IFCT/USDA). |
| `backend/agents/` | Python Multi-threading | Autonomous agent execution loop generating COA telemetry. |
| `frontend/src/` | React 19, Lucide, Axios | Interactive UI displaying analysis, mismatch warnings, and COA stats. |
| `training/` | PyTorch, TorchVision | Model training, cross-entropy loss optimization, and evaluation. |
