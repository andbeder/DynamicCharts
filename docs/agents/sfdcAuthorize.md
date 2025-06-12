# sfdcAuthorize Agent

**Script Path**: `scripts/agents/sfdcAuthorize.js`

## Description

The `sfdcAuthorize` agent performs a JWT-based login using the Salesforce CLI. It sets the default username for subsequent automation commands so other agents can interact with the target org.

## Inputs

- Environment variables:
  - `SFDC_USERNAME`: Username of the Salesforce integration user.
  - `SFDC_CLIENT_ID`: Connected App consumer key.
  - `SFDC_LOGIN_URL` (optional): Login URL, defaults to `https://login.salesforce.com`.
- `jwt.key`: Private key used for the JWT flow.

## Behavior

1. Validate required environment variables and presence of `jwt.key`.
2. Execute `sfdx auth:jwt:grant` with the provided parameters.
3. On success, the authenticated org becomes the default username for the CLI.
4. Exit with a non-zero code and error message on failure.

## Dependencies

- Salesforce CLI (`sfdx`) installed and accessible in the PATH.
- Node.js ≥ 14.

## CLI Usage

```bash
node scripts/agents/sfdcAuthorize.js
```

## Output

- Authenticated Salesforce CLI session with the default username set.
