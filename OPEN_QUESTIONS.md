# Open Questions

- [x] Remove Wrangler from Nix dev shell? Note: nothing is *built* in-repo (it's re-exported from dendritic-config input), but deploy.ts, setup-dev.sh, and deploy-new-account.sh all invoke `wrangler` — removal needs a replacement source.
  - Options:
    - Keep re-exported Nix Wrangler in dev shell (current contract, zero maintenance)
    - Drop Nix Wrangler, switch scripts to a direct npm/bun dependency in apps/website
    - Drop Wrangler entirely from deploy flow (requires a whole new deploy mechanism)
  - Provisional choice: Keep re-exported Nix Wrangler in dev shell (current contract, zero maintenance)
  - Rationale: No in-repo build exists to remove; removing it breaks bun run deploy / setup / deploy-new-account.sh, which conflict with the recorded durable preference "Nix-provided CLI, never bunx or package.json dependency".
  - Resolution: superseded by user decision — hosting moves to an AWS Lightsail VM. Wrangler, adapter-cloudflare, R2, and the dendritic-config input are removed entirely; see root AGENTS.md "Lightsail VM production".

- [ ] With Cloudflare R2 gone for Lightsail VM deployment, where should uploaded files live
  - Options:
    - Local disk via STORAGE_DIR env var - simple, full VM control, backups are our job
    - Keep R2 over HTTP from the VM via aws4fetch - durable offsite storage but adds creds and network dependency
  - Provisional choice: Local disk via STORAGE_DIR env var - simple, full VM control, backups are our job
  - Rationale: User picked Lightsail specifically for VM-level control; a single store on one box makes local disk the fewest-moving-parts choice. The swap lives entirely in src/lib/server/storage.ts so moving to S3 later touches one file plus env.
