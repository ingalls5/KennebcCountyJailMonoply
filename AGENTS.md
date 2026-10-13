# GitHub uploads in the Codex cloud environment

This repository is `ingalls5/KennebcCountyJailMonoply`.

GitHub access may be supplied through a proxy-backed `GH_TOKEN`. A valid binding
can fail with `gh auth git-credential` because Git encodes its returned password
for Basic authentication. Do not diagnose token expiry from that failure alone.
Check the existing connection with `gh api user --jq .login` without printing the token.

For this repository, the tested upload method passes the existing token in an
HTTPS header, allowing the platform proxy to supply the credential:

```bash
GIT_CONFIG_COUNT=1 \
GIT_CONFIG_KEY_0=http.https://github.com/.extraheader \
GIT_CONFIG_VALUE_0="Authorization: Bearer $GH_TOKEN" \
git push origin main
```

Use this only with the repository's existing HTTPS GitHub remote and available
`GH_TOKEN`. Keep the header in the command's environment; never store the token
in Git configuration, a remote URL, files, logs, or chat. If other runtime Git
configuration entries are present, append this entry rather than overwriting them.
If the connection itself is rejected, investigate that error before asking the
user to refresh credentials. When `GH_TOKEN` is absent, test existing native Git
access first instead of assuming a new token is required.
