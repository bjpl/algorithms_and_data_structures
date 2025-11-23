# CI/CD Quick Reference

## Essential Commands

### Local Testing (Before Push)
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linting
npm run lint

# Security audit
npm audit

# Type check (if applicable)
npx tsc --noEmit
```

### Workflow Files
```
.github/workflows/ci.yml          # Main CI/CD pipeline
.github/workflows/test-report.yml # Test reporting & PR comments
```

## Coverage Requirements

| Metric | Minimum | Check Command |
|--------|---------|---------------|
| Lines | 70% | `npm test -- --coverage` |
| Branches | 70% | View `coverage/index.html` |
| Functions | 70% | Check `coverage-summary.json` |
| Statements | 70% | See test output |

## Workflow Triggers

| Event | Workflow | When |
|-------|----------|------|
| Push to main | CI Pipeline | Code merged to main |
| Pull Request | CI Pipeline | PR opened/updated |
| Manual | CI Pipeline | Via Actions UI |
| CI Complete | Test Report | After CI finishes |

## Job Sequence

```
Push/PR Trigger
    ↓
[Lint] + [Security] (parallel)
    ↓
[Test: Node 18] + [Test: Node 20] (parallel)
    ↓
[Build] (depends on lint)
    ↓
[Integration] (depends on test)
    ↓
[CI Success] (all passed)
    ↓
[Test Report] (workflow_run)
```

## Quick Fixes

### Tests Fail
```bash
# Run locally
npm test -- --verbose

# Check specific test
npm test -- tests/path/to/test.js

# Update snapshots
npm test -- -u
```

### Lint Errors
```bash
# Auto-fix
npm run lint

# Check specific file
npx eslint path/to/file.js --fix
```

### Coverage Too Low
```bash
# See uncovered lines
npm test -- --coverage
# Open coverage/index.html
```

### Security Issues
```bash
# Check vulnerabilities
npm audit

# Auto-fix (if possible)
npm audit fix

# Force fix (breaking changes possible)
npm audit fix --force
```

## PR Workflow

1. **Create branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes & test locally**
   ```bash
   npm test
   npm run lint
   ```

3. **Commit & push**
   ```bash
   git add .
   git commit -m "feat: Add my feature"
   git push origin feature/my-feature
   ```

4. **Create PR**
   - CI runs automatically
   - Test report posts comment
   - Review comment for coverage
   - Fix any failing checks

5. **Merge**
   - All checks must pass
   - Coverage must meet thresholds
   - Code review approved

## Status Badge URLs

Replace `YOUR_ORG/YOUR_REPO` with actual values:

```markdown
[![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)
```

## Artifact Locations

| Artifact | Path | Retention |
|----------|------|-----------|
| Test Results | `test-results/` | 7 days |
| Coverage | `coverage/` | 7 days |
| Final Coverage | `final-coverage-report/` | 30 days |

## Common Issues

| Issue | Solution |
|-------|----------|
| "npm audit failed" | Run `npm audit fix` locally, commit changes |
| "Coverage below threshold" | Add more tests, aim for 70%+ |
| "ESLint errors" | Run `npm run lint` to auto-fix |
| "Tests timeout" | Increase timeout in jest.config.cjs |
| "Node version mismatch" | Use Node 18+ (check with `node -v`) |

## Performance Tips

- **Cache hit**: Workflows reuse cached dependencies (~2x faster)
- **Parallel execution**: Jobs run concurrently when possible
- **Fail-fast**: Errors stop execution early to save time
- **Shallow clones**: Only fetch latest commit
- **Conditional uploads**: Artifacts only uploaded when needed

## Environment Variables

| Variable | Value | Where |
|----------|-------|-------|
| NODE_ENV | test | CI workflows |
| NODE_OPTIONS | --experimental-vm-modules | Jest tests |

## Monitoring

### View Workflows
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select workflow (CI Pipeline or Test Report)
4. View runs and logs

### Check Coverage
1. Download coverage artifact from workflow
2. Extract and open `coverage/index.html`
3. Review uncovered lines
4. Add tests as needed

## Best Practices

✅ **DO**
- Run tests locally before pushing
- Keep coverage above 70%
- Fix lint errors immediately
- Write meaningful commit messages
- Review PR comments from Test Report

❌ **DON'T**
- Skip tests to "fix later"
- Ignore coverage drops
- Commit with lint errors
- Push without local testing
- Merge with failing checks

## Quick Links

- [Full Documentation](./CI_CD_CONFIGURATION.md)
- [Status Badges](./STATUS_BADGES.md)
- [Implementation Summary](./CI_CD_SUMMARY.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Keep this handy!** Pin it in your IDE or print it for quick reference.
