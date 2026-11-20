# FM-001 Vercel Deployment Check

This project uses Vercel's Git repository-dispatch integration to gate production
promotion on a commit-scoped GitHub status.

## Required Vercel project setting

Under **Project Settings → Git → Connected Git Repository**, enable
**repository_dispatch Events**.

## Workflow contract

The workflow `.github/workflows/vercel-deployment-check.yml` listens for
`vercel.deployment.ready`. It checks out the exact deployed commit from
`client_payload.git.sha`, runs:

- `npm run check`
- `npm test`

The `vercel/repository-dispatch/actions/status@v1` action reports the final
job result to the commit under the status name `Deployment`.

Vercel sends the event after a deployment is created and before its required
checks are evaluated. Enabling repository-dispatch events does not replay
events for deployments created before the setting was enabled. A fresh
deployment is therefore required after enabling the setting.

## Operational verification

1. Confirm the Vercel `repository_dispatch Events` toggle is ON.
2. Push or create a new deployment from `main`.
3. Confirm GitHub Actions starts the **FM-001 Vercel Deployment Check** workflow
   on the `vercel.deployment.ready` event.
4. Confirm the `Deployment` commit status completes successfully.
5. Confirm Vercel changes the staged production deployment to Ready and assigns
   the production domains.
