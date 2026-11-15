# Contributing to Adaptive Question Catalog

Thank you for contributing to Adaptive Question Catalog. The project is an active
research prototype, so every contribution must distinguish implemented
behavior from planned research capabilities.

## Before you start

- Open an issue before implementing a larger feature, architectural change, or
  new research prototype.
- Do not include personal learner data, access tokens, copyrighted teaching
  material, or confidential research data in issues, fixtures, or commits.

## Development workflow

1. Create a short-lived branch from `main`, for example
   `feature/competency-management`, `fix/question-validation`, or
   `docs/local-setup`.
2. Keep the change focused on one problem and add or update tests where the
   behavior permits.
3. Open a pull request and wait for all required checks and approvals.
4. Use squash merge. GitHub should delete the source branch after merging.

Use imperative, specific pull-request titles such as
`Validate question competency references` rather than `Various fixes`.

## Definition of done

- The implemented behavior and its limits are documented.
- Existing and new checks pass without unexpected changes to tracked files.
- API or persisted-data changes document compatibility and migration effects.
- Security, privacy, accessibility, and pedagogical consequences were
  considered where relevant.
- No secrets, personal data, generated build output, or local configuration
  were committed.

## Review expectations

Reviewers check correctness, maintainability, tests, documentation, security,
accessibility, and consistency with the pedagogical design.

## License of contributions

Unless separately agreed in writing, contributions submitted to this project
are provided under the same
[Apache License 2.0](LICENSE) as the project. By submitting a
contribution, you confirm that you have the right to provide it under those
terms.
