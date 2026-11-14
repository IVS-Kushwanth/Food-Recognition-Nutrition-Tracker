# NutriVision AI: Git Branching & Collaboration Strategy

This document establishes the official branching model, protection policies, integration workflows, and merge strategies for collaborative development.

---

## 1. Branch Hierarchy & Roles

```
                                      [ main ]
                           (Protected Production Branch)
                                         ^
                                         | Pull Request & Audit
         +-------------------------------+-------------------------------+
         |                               |                               |
    [ backend ]                    [ frontend ]                    [ ml-model ]
(API, Services, DB, LRU)           (React 19, Vite, UI)           (PyTorch, Vision, Train)
         ^                               ^                               ^
         | PR                            | PR                            | PR
[ feature/api-... ]             [ feature/ui-... ]              [ feature/cv-... ]
```

### Branch Taxonomy

| Branch | Purpose | Base Branch | Target Integration Branch | Merged By |
| :--- | :--- | :--- | :--- | :--- |
| `main` | Production-ready, stable release. Only tested code is allowed here. | N/A | Production Deployments | Project Lead (Owner) |
| `backend` | Integration branch for backend APIs, database, caching, and autonomous agents. | `main` | `main` via PR | Project Lead (Owner) |
| `frontend` | Integration branch for React UI, Vite configurations, and client styling. | `main` | `main` via PR | Project Lead (Owner) |
| `ml-model` | Integration branch for MobileNetV3 models, portion estimator, and training scripts. | `main` | `main` via PR | Project Lead (Owner) |
| `documentation` | Integration branch for project documentation, academic reports, and benchmarks. | `main` | `main` via PR | Project Lead (Owner) |
| `feature/*` | Ephemeral developer branches for individual tasks. | Assigned Integration Branch | Assigned Integration Branch | Subsystem Contributor / Lead |
| `fix/*` | Scoped bug fixes for defects identified during testing. | Assigned Integration Branch | Assigned Integration Branch | Subsystem Contributor / Lead |

---

## 2. Branch Protection Rules on `main`

The repository owner must configure the following protection rules on GitHub for `main`:

1. **Require a Pull Request before merging**: Direct `git push origin main` is blocked.
2. **Require Approvals**: At least 1 code review approval required before merge.
3. **Require Status Checks to Pass**: Automated tests (`pytest` and `npm run build`) must pass.
4. **Do Not Allow Force Pushing**: Prevents accidental history destruction (`git push -f`).
5. **Do Not Allow Deletions**: Prevents accidental branch deletion.

---

## 3. Step-by-Step Developer Workflow

### Step 1: Sync with Upstream
Always ensure your local integration branch is up-to-date before creating a new feature branch:
```bash
git checkout <your-assigned-branch>
git pull origin <your-assigned-branch>
```

### Step 2: Branch Creation
Create a descriptive branch for your task:
```bash
git checkout -b feature/<descriptive-name>
# Example: git checkout -b feature/portion-slider-smoothness
```

### Step 3: Implement & Verify Locally
Make your changes strictly within your permitted directory boundaries:
```bash
# Verify test health
python backend/tests/run_all_tests.py
```

### Step 4: Commit with Conventional Message
```bash
git add <modified-files>
git commit -m "feat(<scope>): <concise description of feature>"
```

### Step 5: Push and Open Pull Request
```bash
git push -u origin feature/<descriptive-name>
```
Go to GitHub and open a Pull Request targeting your parent integration branch (e.g. `feature/ui-slider` $\rightarrow$ `frontend`).

---

## 4. Conflict Resolution Protocol

If two developers modify overlapping code:
1. **Rebase or Merge Upstream**:
   ```bash
   git checkout feature/<descriptive-name>
   git fetch origin
   git merge origin/<assigned-integration-branch>
   ```
2. **Resolve Conflicts**: Open conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), resolve logically, and run tests to ensure no regressions.
3. **Commit Resolution**:
   ```bash
   git add <resolved-files>
   git commit -m "fix(merge): resolve merge conflict in <file>"
   git push origin feature/<descriptive-name>
   ```
4. **Never Force-Push** during conflict resolution.
