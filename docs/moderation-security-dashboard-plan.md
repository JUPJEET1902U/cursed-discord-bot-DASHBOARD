# CURSED Moderation & Security Dashboard Rebuild

## Scope lock

Only moderation and server-security dashboard areas may change in this branch.

Included:
- Moderation command configuration
- AutoMod rules and enforcement settings
- Anti-raid and anti-nuke configuration
- Quarantine and lockdown controls
- Cases, incidents, staff safety, audit logs, and permission readiness
- API proxy/types used exclusively by these pages
- Focused validation and CI

Excluded:
- AI, economy, games, tickets, welcome, autorole, profiles, images
- Authentication and server switching
- General navigation outside moderation/security
- Deployment architecture
- Unrelated UI refactors

## Delivery gates

1. Unsafe configurations are clearly blocked or warned.
2. Bot permission and role-hierarchy readiness is visible.
3. Destructive emergency actions require explicit confirmation.
4. Anti-nuke thresholds and responses are understandable and validated.
5. Incidents expose containment success or failure.
6. Existing unrelated dashboard pages remain unchanged.
7. PR remains unmerged until bot API compatibility and Vercel checks pass.
