# Team Responsibility Allocation & Work Breakdown Structure

**Project**: NutriVision AI – Food Recognition & Nutrition Tracker  
**Architecture Context**: Full-Stack Computer Vision, Verified Nutritional Database, and COA Memory Hierarchy Profiler  
**Standard**: Modular ownership with zero cross-module collision  

---

## 1. Allocation Matrix & Access Permissions

| Member / Role | Integration Branch | Scoped Working Folders | Permitted Files to Modify | Restricted / Forbidden Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1: Project Lead & Docs** | `main` (admin), `documentation` | `documentation/`, `reports/`, Root Markdown | `README.md`, `*.md`, `documentation/**/*`, `reports/**/*` | Source code in `backend/`, `frontend/`, `training/` without peer review. |
| **Member 2: Frontend Engineer** | `frontend` | `frontend/src/`, `frontend/public/` | `frontend/src/**/*`, `frontend/public/*`, `frontend/index.html`, `frontend/vite.config.js` | `backend/**/*`, `training/**/*`, `datasets/**/*` |
| **Member 3: Backend & API Engineer** | `backend` | `backend/api/`, `backend/services/`, `backend/` | `backend/main.py`, `backend/config.py`, `backend/api/**/*`, `backend/services/text_matching.py`, `backend/services/image_processor.py`, `backend/requirements.txt`, `backend/tests/test_api.py`, `backend/tests/test_matching.py` | `frontend/**/*`, `training/**/*`, `datasets/**/*` |
| **Member 4: ML & Computer Vision Engineer** | `ml-model` | `backend/models/`, `training/`, `datasets/` | `backend/models/food_classifier.py`, `backend/models/portion_estimator.py`, `backend/models/saved_weights/*`, `training/**/*`, `datasets/**/*` | `frontend/**/*`, `backend/api/**/*`, `backend/database/**/*`, `backend/cache/**/*` |
| **Member 5: COA Systems & Agents Engineer** | `backend` (or `feature/coa-agents`) | `backend/cache/`, `backend/database/`, `backend/agents/` | `backend/cache/lru_cache.py`, `backend/database/**/*`, `backend/agents/**/*`, `backend/services/nutrition_calculator.py`, `backend/services/nutrition_service.py`, `backend/tests/test_cache.py`, `backend/tests/test_nutrition.py`, `backend/tests/test_agents.py` | `frontend/**/*`, `training/**/*`, `datasets/**/*` |

---

## 2. Detailed Member Specifications

### Member 1: Technical Project Lead & Documentation Coordinator
- **Core Responsibilities**:
  - Maintain the integrity of the `main` branch.
  - Review all incoming Pull Requests against unit tests and style conventions.
  - Produce architectural diagrams, academic reports, and API documentation.
  - Ensure benchmark metrics in `documentation/` align with actual model output.
- **Key Deliverables**:
  - Up-to-date `README.md`, `PROJECT_STRUCTURE.md`, `BRANCH_STRATEGY.md`, and `CONTRIBUTION_GUIDELINES.md`.
  - Academic report formatting and LaTeX / Mermaid diagram visualizations.
  - GitHub release milestones and changelogs.
- **Dependencies**: Depends on Member 3 for API endpoints, Member 4 for accuracy benchmarks, and Member 5 for hardware cache telemetry.
- **Testing Requirements**:
  - Verify all markdown links and documentation diagrams render cleanly.
  - Audit PR test logs prior to merging.

---

### Member 2: Frontend & UI/UX Engineer
- **Core Responsibilities**:
  - Implement responsive UI components using React 19 and Vite.
  - Coordinate client-side state for food image upload, mismatch alert banners, top-5 prediction bars, and portion sliders.
  - Visualize the 4-tier COA memory hierarchy diagram and live microsecond telemetry panel.
  - Maintain the Autonomous Agents Management Hub screens.
- **Key Deliverables**:
  - `frontend/src/components/*` and `frontend/src/pages/*`.
  - Axios client bindings in `frontend/src/services/api.js`.
  - Clean production bundle (`npm run build` with zero warnings).
- **Dependencies**: Depends on Member 3's REST API specifications and response schemas.
- **Testing Requirements**:
  - Execute `npm run build` and `npm run lint` (`npx oxlint`).
  - Verify UI responsiveness across desktop and mobile screen viewports.
  - Confirm real-time macro recalculations on portion slider drag.

---

### Member 3: Backend & API Engineer
- **Core Responsibilities**:
  - Maintain the FastAPI web application (`backend/main.py`).
  - Implement modular REST endpoints in `backend/api/routes.py` and `backend/api/agent_routes.py`.
  - Handle file upload validation (MIME type verification, 15MB size limits).
  - Implement text-image fuzzy matching (Levenshtein distance, token Jaccard overlap, synonym dictionary).
- **Key Deliverables**:
  - Robust Pydantic request/response models.
  - High-performance REST endpoints on port 8000.
  - Unit tests covering API validation and error handling in `backend/tests/test_api.py`.
- **Dependencies**: Depends on Member 4 for ML inference methods and Member 5 for database/cache service hooks.
- **Testing Requirements**:
  - Run `pytest backend/tests/test_api.py -v`.
  - Run `pytest backend/tests/test_matching.py -v`.
  - Ensure 100% pass rate on status code 200, 400, 422, and 404 paths.

---

### Member 4: Machine Learning & Computer Vision Engineer
- **Core Responsibilities**:
  - Maintain the PyTorch MobileNetV3-Small classifier (`backend/models/food_classifier.py`).
  - Optimize the single-instance RAM residency loading routine (COA RAM Principle).
  - Fine-tune transfer learning routines (`training/train.py`, `training/preprocess.py`).
  - Calibrate the Nutrition5k bulk density portion estimator (`backend/models/portion_estimator.py`).
- **Key Deliverables**:
  - Evaluated PyTorch weights checkpoint in `backend/models/saved_weights/food_classifier.pt`.
  - Evaluation scripts and confusion matrix generator in `training/evaluate.py`.
  - Top-5 softmax confidence and low-confidence (<20%) threshold handling.
- **Dependencies**: Consumes dataset images from `datasets/raw/` and `datasets/processed/`.
- **Testing Requirements**:
  - Run `python training/evaluate.py` to confirm Top-1 $\ge 63\%$ and Top-5 $\ge 91\%$.
  - Verify mean CPU inference time stays under $20\,\text{ms}$.

---

### Member 5: COA Systems, Database & Autonomous Agents Engineer
- **Core Responsibilities**:
  - Maintain the application-level software LRU Cache (`backend/cache/lru_cache.py`).
  - Ensure O(1) lookup, insertion, and capacity-6 eviction via doubly-linked list + hash map.
  - Maintain the SQLite database engine and schema (`backend/database/`).
  - Maintain verified nutritional composition data from IFCT 2017 & USDA FoodData Central.
  - Maintain the autonomous agent loop for Bot A (COA Researcher) and Bot B (AI Engineer).
- **Key Deliverables**:
  - LRU cache hit/miss latency instrumentation ($\sim 2\text{--}15\,\mu s$ vs $\sim 1\text{--}5\,\text{ms}$ disk I/O).
  - Proportional nutrition calculator (`backend/services/nutrition_calculator.py`).
  - Agent background worker threads and inter-agent message bus (`backend/agents/`).
- **Dependencies**: Consumed by Backend routes; feeds hardware metrics to Documentation.
- **Testing Requirements**:
  - Run `pytest backend/tests/test_cache.py -v` (LRU hit/miss/eviction).
  - Run `pytest backend/tests/test_nutrition.py -v` (proportional scaling).
  - Run `pytest backend/tests/test_agents.py -v` (agent task lifecycle).
