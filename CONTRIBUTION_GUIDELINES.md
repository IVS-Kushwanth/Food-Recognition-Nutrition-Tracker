# NutriVision AI: Contribution & Collaboration Guidelines

Welcome to the **NutriVision AI** collaborative development repository. All team members must adhere to these guidelines to ensure architectural stability, prevent merge conflicts, and preserve data integrity.

---

## 1. General Principles

1. **Scoped Ownership**: Work only within your assigned directories as detailed in `TEAM_ALLOCATION.md`.
2. **Never Commit Secrets**: Do not commit `.env` files, API tokens, passwords, or personal credentials.
3. **No Heavy Binaries**: Never commit `.zip`, `.tar.gz`, node modules, virtual environments, or large temporary files.
4. **No Direct Pushes to `main`**: All contributions must enter `main` exclusively through Pull Requests with approval from the Project Lead.
5. **No Force Pushes**: `git push --force` or `--force-with-lease` is strictly forbidden across all shared branches (`main`, `backend`, `frontend`, `ml-model`, `documentation`).

---

## 2. Local Environment Setup

### Backend Setup (Python 3.10+)
```bash
# 1. Create and activate a clean virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# 2. Install backend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Frontend Setup (Node.js 18+)
```bash
# Navigate to frontend directory and install dependencies
cd frontend
npm install
cd ..
```

---

## 3. Git Workflow & Branching Conventions

### Branch Naming Standard
All feature and bugfix branches must be created off their respective parent integration branch:
- `feature/<module>-<short-description>` (e.g., `feature/frontend-macro-chart`, `feature/api-rate-limit`)
- `fix/<module>-<short-description>` (e.g., `fix/cache-eviction-key`, `fix/mismatch-banner-state`)
- `docs/<short-description>` (e.g., `docs/add-api-specs`, `docs/update-mermaid`)

### Conventional Commit Message Standard
Commits must follow the Conventional Commits specification:
```
<type>(<scope>): <short descriptive summary>

[optional body explaining technical motivation]
```

**Types**:
- `feat`: A new user-facing or architectural feature.
- `fix`: A bug fix.
- `perf`: A code change that improves performance (e.g., LRU cache tuning, inference latency).
- `test`: Adding or updating test cases.
- `docs`: Documentation updates or LaTeX/Mermaid diagram additions.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `style`: Formatting, whitespace, or lint fixes.

**Examples**:
```bash
git commit -m "feat(frontend): integrate live telemetry polling for RAM residency"
git commit -m "fix(cache): resolve off-by-one LRU node unlinking on capacity overflow"
git commit -m "perf(model): vectorize image normalization with torchvision transforms"
git commit -m "test(api): add negative assertions for corrupted image uploads"
```

---

## 4. Pre-Commit Verification Checklist

Before pushing any branch or opening a Pull Request, every contributor must verify:

- [ ] **Tests Pass**: Run the comprehensive verification suite:
  ```bash
  python backend/tests/run_all_tests.py
  ```
- [ ] **PyTest Pass**: Run the unit test suite:
  ```bash
  pytest backend/tests/ -v
  ```
- [ ] **Frontend Builds Cleanly** (if touching UI):
  ```bash
  cd frontend
  npm run build
  cd ..
  ```
- [ ] **No Untracked Bloat**:
  ```bash
  git status
  ```
  Ensure no `__pycache__`, `.zip`, `.pyc`, or node artifacts appear in untracked files.
- [ ] **Proper Scoping**: Run `git diff --stat` to verify you have only modified files in your allocated domain.

---

## 5. Pull Request & Code Review Protocol

1. **Push Feature Branch**: Push your scoped feature branch to the remote repository.
2. **Open PR Against Assigned Integration Branch**:
   - Frontend features $\rightarrow$ `frontend`
   - API / Cache / DB features $\rightarrow$ `backend`
   - Vision / Model features $\rightarrow$ `ml-model`
   - Documentation $\rightarrow$ `documentation`
3. **PR Description**: Include:
   - Summary of changes made.
   - Files modified and rationale.
   - Verification command results (e.g., test output).
   - Screenshots for UI modifications.
4. **Peer Review & Merge**:
   - The Project Lead reviews the PR.
   - At least 1 approval is mandatory.
   - Integration branches are periodically merged into `main` after full regression testing.
