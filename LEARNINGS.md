# What I learned

After each phase, the Agent asks the developer for one useful learning and records it briefly.

- **Planning:**
- **Detection:** Keep the detector pure and test it against the supplied synthetic fixture matrix before connecting uploads or persistence; Node 24's built-in test runner can execute these tests without adding a test dependency.
- **Security/persistence:** Validate file bytes and encoding on the server before scanning, return only masked aggregates, and make the database reject direct finding inserts and malformed masks even if application code is bypassed. Keep atomic writes inside a narrowly granted RPC; hosted isolation still requires two-user verification.
- **UI:** Copy the actual Lepidus component anatomy for filters and upload targets; use token-only CSS only for page layout, and verify the rendered screen at desktop and mobile widths.
- **Testing/deployment:** When a browser can reach an API but the server cannot, suspect TLS interception: Node ignores the OS trust store by default, so a corporate proxy CA causes `SELF_SIGNED_CERT_IN_CHAIN` and looks like an auth bug. Fix with `--use-system-ca`, never by disabling certificate verification.
- **What I'd do differently:**
