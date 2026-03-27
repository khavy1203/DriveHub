# DriveHub — Vibe Coding Standards

> Senior-level React + Node.js conventions for this project.
> These rules override Claude's defaults. Follow them exactly.

---

## 0. Non-Negotiables

- **All identifiers, folder names, CSS classes, and comments must be English.**
  No Vietnamese in code. UI strings/labels may be Vietnamese (they're user-facing text, not code).
- **Never auto-push to git.** Stage and commit only when explicitly asked. Let the user review and push.
- **No speculative code.** Don't add features, configs, error handling, or abstractions that weren't asked for.
- **No trailing summaries.** After completing a task, don't recap what you did — the diff speaks for itself.

---

## 1. TypeScript

- Strict mode is on. No `any`. No `@ts-ignore` without a comment explaining why.
- Prefer `type` over `interface` for data shapes; use `interface` only for extension/OOP patterns.
- Never cast with `as X` to silence a type error — fix the root type.
- Use `unknown` for untrusted data (API responses, parsed JSON) and narrow before use.
- No implicit `void` returns on async functions that should return data.

---

## 2. React

### Components
- Functional components only. No class components.
- One component per file. File name matches export name (PascalCase).
- Props types at the top of the file, before the component.
- Destructure props in the function signature.

### State & Effects
- Colocate state as close to usage as possible.
- `useEffect` deps must be complete and correct. No empty `[]` unless truly mount-only.
- Derive values with `useMemo`/`useCallback` only when there's a measurable perf reason — don't cargo-cult them.
- No derived state in `useState`. Compute from source.

### Performance
- Avoid anonymous functions/objects as JSX props in render-hot paths.
- Use `key` correctly — stable IDs, not array index unless the list is static.
- `React.memo` only where profiling shows a real issue.

### Patterns
- Custom hooks for reusable logic (`useAuth`, `useExamSession`, etc.).
- Feature folder structure: `features/<name>/components/`, `features/<name>/hooks/`, `features/<name>/services/`, `features/<name>/index.ts`.
- Barrel exports (`index.ts`) at feature boundary — not inside sub-folders.

---

## 3. SCSS / Styling

- BEM naming: `.block__element--modifier`.
- CSS custom properties (design tokens) scoped to the page/feature root class.
- No hardcoded colors inline — always a token or variable.
- Mobile-first media queries (`min-width`), fallback `max-width` only when necessary.
- No `!important`. Fix specificity instead.

---

## 4. Node.js / Express

### Structure
- Controllers handle HTTP (req/res). Services handle business logic. No DB queries in controllers.
- Services return plain objects or throw errors. Never return `res` objects.
- Middleware functions follow `(req, res, next)` — call `next(err)` to delegate errors.

### Error Handling
- All async route handlers must catch errors and pass to `next(err)` or have a global error handler.
- Never swallow errors with empty `catch {}`.
- Validate inputs at the controller boundary before calling services.
- Service errors throw typed errors; controllers map to HTTP status codes.

### Database (Sequelize)
- Use `queryInterface.describeTable()` before `addColumn()` in migrations (idempotency).
- All migrations must have a working `down()`.
- No raw queries (`sequelize.query()`) unless no ORM equivalent exists.
- Use transactions for multi-table writes.

### Response format (existing convention)
```json
{ "EM": "message", "EC": 0, "DT": <data> }
```
`EC: 0` = success. `EC: -1` = error. Never return `EC: -1` with 200 OK.

---

## 5. File & Folder Conventions

```
frontend/src/
  features/
    <name>/
      components/   # React components
      hooks/        # Custom hooks
      services/     # API calls / business logic
      types.ts      # Feature-specific types
      index.ts      # Public barrel export
  shared/           # Cross-feature utilities
  layouts/          # Header, Footer, layout wrappers
  pages/            # Legacy pages (to be migrated to features/)
  core/             # Config, constants, env helpers

backend/node-app/src/
  controllers/
  services/
  models/
  middleware/
  migrations/
  routes/
```

---

## 6. Code Quality

- Functions do one thing. If it needs a comment to explain "what", split it.
- Max function length: ~40 lines. If longer, decompose.
- No magic numbers — use named constants.
- Remove dead code immediately. Don't comment it out.
- Imports ordered: external libs → internal absolute → relative.

---

## 7. Security

- Never trust client input. Validate and sanitize at every API boundary.
- No credentials, secrets, or API keys in code or git. Use environment variables.
- Parameterize all DB queries (Sequelize does this by default — never interpolate user input into raw SQL).
- CORS configured explicitly — no wildcard `*` in production.

---

## 8. Git

- Commit messages: imperative mood, English, concise (`fix migration idempotency`, `add review page`).
- One logical change per commit.
- Never force-push to `master`/`main`.
- Never skip hooks (`--no-verify`).

---

## 9. When Searching / Exploring

- Before editing any file, read it first.
- Before adding a feature, check if it already exists somewhere in the codebase.
- Prefer targeted `Grep`/`Glob` over broad exploration agents for specific lookups.
- Read the relevant existing code before proposing a solution — don't guess at patterns.
