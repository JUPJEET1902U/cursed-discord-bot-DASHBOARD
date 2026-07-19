# Initial Dashboard Audit Targets

The moderation/security dashboard must make protection readiness and failure states explicit instead of allowing unsafe configurations to look active.

## Required fixes in this branch

- Surface missing View Audit Log, Manage Roles, Manage Channels, Ban Members, Kick Members, and Moderate Members permissions.
- Surface CURSED role-hierarchy readiness.
- Validate quarantine role and emergency lockdown channels.
- Warn when anti-nuke is enabled with alert-only response.
- Warn when destructive thresholds are too permissive.
- Require confirmation for quarantine, lockdown, release, and incident-resolution actions.
- Show containment success/failure and incident status.
- Preserve every unrelated dashboard page and API route.
