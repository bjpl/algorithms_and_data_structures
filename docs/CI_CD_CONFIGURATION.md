# CI/CD Configuration

This document describes the GitHub Actions CI/CD pipeline configuration for this project.

## Overview

The project uses two main GitHub Actions workflows:
1. **CI Pipeline** (`ci.yml`) - Main continuous integration workflow
2. **Test Report** (`test-report.yml`) - Test reporting and coverage visualization

## CI Pipeline (`ci.yml`)

### Triggers
- **Push to main**: Runs on pushes to the main branch
- **Pull Requests**: Runs on PRs targeting the main branch
- **Manual**: Can be triggered manually via workflow_dispatch

### Jobs

#### 1. Lint (5 min timeout)
- Runs ESLint on the codebase
- Uses Node.js 20
- Fails fast on linting errors
- Caches npm dependencies

#### 2. Security (5 min timeout)
- Runs `npm audit` for security vulnerabilities
- Moderate level warnings (continue-on-error: true)
- High level vulnerabilities fail the build
- Runs in parallel with lint

#### 3. Test (10 min timeout)
- **Matrix Strategy**: Tests on Node.js 18 and 20
- Runs all Jest tests with coverage
- Uses ESM support (`--experimental-vm-modules`)
- Uploads coverage reports (Node 20 only)
- Uploads test results (both versions)
- Checks coverage thresholds (70% minimum)
- Depends on lint job passing

#### 4. Build (5 min timeout)
- Verifies project structure
- Checks TypeScript compilation (if applicable)
- Ensures all dependencies install correctly
- Depends on lint job passing

#### 5. Integration (10 min timeout)
- Runs UI integration tests
- Runs UI component tests
- Depends on test job passing

#### 6. CI Success
- Final job that depends on all others
- Confirms all checks passed
- Provides summary output

### Features
- **Concurrency control**: Cancels in-progress runs for the same ref
- **Fail-fast**: Stops immediately on critical failures
- **Parallel execution**: Lint, security, and build run in parallel
- **Caching**: npm dependencies cached for faster runs
- **Shallow clones**: Uses fetch-depth: 1 for speed
- **Test results**: Uploaded as artifacts (7 days retention)
- **Coverage reports**: Uploaded as artifacts (7 days retention)

## Test Report Workflow (`test-report.yml`)

### Triggers
- Runs after CI Pipeline completes
- Triggers on workflow_run completion

### Permissions
- `contents: read` - Read repository contents
- `actions: read` - Read workflow run data
- `checks: write` - Write check results
- `pull-requests: write` - Comment on PRs

### Jobs

#### 1. Test Report
- Downloads test results and coverage from CI Pipeline
- Publishes test results as check
- Generates coverage summary with visual bars
- Comments on PR with detailed report
- Updates existing comment if present
- Uploads final coverage report (30 days retention)

#### 2. Coverage Main (Main branch only)
- Runs only for pushes to main branch
- Displays coverage summary in workflow summary
- Generates coverage badge data

### PR Comment Format
The workflow automatically comments on PRs with:
- **Coverage summary table** with visual progress bars
- **Status indicators** (✅/❌) for each metric
- **Threshold comparison** (70% minimum)
- **Test execution details**
- **Link to full workflow run**

Example:
```markdown
## ✅ Test Results & Coverage Report

### Coverage Summary
All thresholds passed!

| Metric | Coverage | Visual | Status |
|--------|----------|--------|--------|
| Lines | 85.50% | ████████████████████ | ✅ |
| Branches | 78.20% | ███████████████░░░░░ | ✅ |
| Functions | 90.00% | ██████████████████░░ | ✅ |
| Statements | 85.30% | █████████████████░░░ | ✅ |
```

## Status Badges

### Adding to README.md

Add the following badges to your README.md file:

```markdown
## Status

[![CI Pipeline](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)
[![Test Report](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/test-report.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/test-report.yml)
```

Replace `YOUR_ORG` and `YOUR_REPO` with your actual GitHub organization and repository names.

### Badge Options

You can customize badges with additional parameters:

```markdown
<!-- Show status for specific branch -->
[![CI Pipeline](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)

<!-- Show status for specific event -->
[![CI Pipeline](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)
```

## Configuration Details

### Node.js Versions
- **Primary**: Node.js 20 (LTS)
- **Compatibility**: Node.js 18 (tested in matrix)
- **Minimum**: Node.js 18.0.0 (specified in package.json)

### Test Configuration
- **Framework**: Jest 29.7.0
- **Environment**: node (ESM support enabled)
- **Coverage Tool**: Built-in Jest coverage
- **Report Format**: JUnit XML for test results
- **Coverage Formats**: text, html, lcov

### Coverage Thresholds
All metrics must meet 70% minimum:
- Lines: 70%
- Branches: 70%
- Functions: 70%
- Statements: 70%

### Timeout Settings
- Lint: 5 minutes
- Security: 5 minutes
- Test: 10 minutes
- Build: 5 minutes
- Integration: 10 minutes

## Optimization Features

### Performance
- **npm ci** instead of npm install (faster, deterministic)
- **--prefer-offline**: Use cache when available
- **--no-audit**: Skip audit during install (separate job)
- **Shallow clones**: fetch-depth: 1
- **Dependency caching**: actions/setup-node with cache: 'npm'
- **maxWorkers**: Limited to 50% in tests

### Resource Management
- **Artifact retention**: 7 days for test results, 30 days for final reports
- **Concurrency control**: Cancel in-progress runs
- **Conditional uploads**: Coverage only uploaded from Node 20

## Troubleshooting

### Tests Failing in CI But Pass Locally
1. Check Node.js version matches (use nvm or similar)
2. Verify environment variables are set correctly
3. Check for timing-dependent tests
4. Review CI logs for specific error messages

### Coverage Thresholds Not Met
1. Run `npm test -- --coverage` locally
2. Review coverage/index.html for uncovered lines
3. Add tests for uncovered code paths
4. Update thresholds in jest.config.cjs if necessary

### Lint Errors in CI
1. Run `npm run lint` locally
2. Fix issues or add to .eslintignore
3. Ensure ESLint config is committed
4. Check for different behavior between dev/CI environments

### Security Audit Failures
1. Run `npm audit` locally
2. Review vulnerabilities
3. Run `npm audit fix` for automatic fixes
4. Update dependencies manually if needed
5. Use `npm audit --audit-level=moderate` to test

## Best Practices

### For Contributors
1. **Run tests before pushing**: `npm test`
2. **Check lint**: `npm run lint`
3. **Verify coverage**: `npm test -- --coverage`
4. **Review security**: `npm audit`
5. **Keep dependencies updated**: Regular dependency updates

### For Maintainers
1. **Monitor CI metrics**: Track build times and failure rates
2. **Update Node.js versions**: Keep matrix current with LTS releases
3. **Review coverage trends**: Ensure coverage doesn't decrease
4. **Audit dependencies**: Regular security audits
5. **Optimize workflows**: Profile and improve slow jobs

## Security Considerations

### Secrets Management
- Never commit secrets or API keys
- Use GitHub Secrets for sensitive data
- Use environment variables for configuration
- Review audit logs regularly

### Permissions
- Workflows use minimum required permissions
- GITHUB_TOKEN has limited scope
- Pull request comments use write permission only when needed

### Dependency Security
- npm audit runs on every build
- High vulnerabilities fail the build
- Moderate vulnerabilities are warnings
- Regular dependency updates encouraged

## Future Enhancements

### Potential Additions
- [ ] Code quality metrics (CodeClimate, SonarQube)
- [ ] Performance benchmarking
- [ ] E2E tests with Playwright
- [ ] Automated dependency updates (Dependabot)
- [ ] Deploy previews for PRs
- [ ] Release automation
- [ ] Changelog generation

### Advanced Features
- [ ] Matrix testing with multiple OS (Windows, macOS)
- [ ] Visual regression testing
- [ ] Load testing
- [ ] Accessibility testing
- [ ] Bundle size tracking

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Jest Documentation](https://jestjs.io/)
- [npm Documentation](https://docs.npmjs.com/)

---

**Last Updated**: 2025-10-09
**Maintained By**: Development Team
