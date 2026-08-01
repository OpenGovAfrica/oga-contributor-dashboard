# Contributing to OpenGovAfrica Dashboard

First off, thank you for considering contributing to the OpenGovAfrica Intelligence Dashboard! 

## Local Development Workflow

1. **Fork & Clone:** Fork the repository and clone it to your local machine.
2. **Docker Dependency:** We use a containerized PostgreSQL database to ensure absolute parity across all developer environments. You MUST have Docker running.
   ```bash
   docker compose up -d
   ```
3. **Database Schema:** If you modify the `prisma/schema.prisma` file, you must run:
   ```bash
   npm run db:generate
   npm run db:migrate --name <your_migration_name>
   ```
4. **Code Standards:** 
   - We use Tailwind v4 for all styling. Do not write inline styles.
   - We strictly use `Zod` for URL state parameter validation. If you add a new filter to a dashboard page, it must be validated in `src/lib/zod-schemas.ts`.
5. **Testing:** Before submitting a PR, ensure all tests pass:
   ```bash
   npm run test
   ```

## Pull Request Process
1. Create a branch from `main` (e.g., `feature/awesome-new-metric`).
2. Ensure your code passes the GitHub Actions CI pipeline (Linting & Vitest).
3. Request review from a core maintainer.
