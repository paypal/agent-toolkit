# Security Policy

PayPal takes the security of its open source software seriously. We appreciate
the work of security researchers and users who responsibly report potential
vulnerabilities in PayPal Agent Toolkit.

## Supported Versions

Security fixes are applied to the latest published release of each actively
maintained package in this repository.

| Version | Supported |
| --- | --- |
| Latest published release | Yes |
| Earlier releases | No |

Users should upgrade to the latest release before reporting an issue. When a
vulnerability affects multiple releases, the corresponding security advisory
will identify the affected and fixed versions.

## Reporting a Vulnerability

Report suspected vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/paypal/agent-toolkit/security/advisories/new).

Do not disclose a suspected vulnerability through a public GitHub issue,
discussion, pull request, social media post, or other public channel.

If the issue affects a PayPal website, API, account, or production service
rather than this repository, report it through the
[PayPal Bug Bounty Program on HackerOne](https://hackerone.com/paypal).
Review the current HackerOne program policy and scope before testing or
submitting a report.

### What to Include

Provide enough detail for maintainers to reproduce and assess the issue:

- A clear description of the vulnerability and its security impact.
- The affected package, language, version, and commit, when known.
- The agent framework, runtime, and relevant toolkit configuration.
- Minimal, reproducible steps or a proof of concept.
- The permissions and toolkit actions enabled during reproduction.
- Whether the issue occurs in the PayPal Sandbox, a local environment, or
  another approved test environment.
- Sanitized logs, stack traces, or screenshots that help explain the issue.
- Any known mitigations or suggested remediation.
- Your preferred name or handle for acknowledgment, if desired.

Do not include live credentials, access tokens, financial information,
personal data, or data belonging to another person or organization. Revoke and
rotate any credential that may have been exposed.

## Scope

This policy covers security vulnerabilities in:

- The TypeScript and Python implementations maintained in this repository.
- Packages published from this repository.
- Toolkit validation, configuration, and authorization boundaries.
- Handling of PayPal credentials, access tokens, and merchant data.
- Build, packaging, and release workflows maintained in this repository.

Examples of issues that may be in scope include:

- Exposure of credentials, tokens, financial information, or merchant data.
- Authorization or action-configuration bypasses.
- Cross-account or cross-tenant data access caused by the toolkit.
- Input-validation flaws that enable unintended PayPal API operations.
- Injection vulnerabilities in code paths maintained by this repository.
- Resource exhaustion triggered through untrusted input when the toolkit is
  used as documented.
- A toolkit flaw that allows model-controlled input to exceed documented
  permissions or enabled actions.
- A supply-chain issue in this repository's build or release process.

The following are generally outside the scope of this repository:

- Vulnerabilities in PayPal production services, websites, APIs, or accounts;
  report these through the PayPal Bug Bounty Program.
- Vulnerabilities that exist solely in a third-party dependency or agent
  framework, unless this toolkit's integration makes them exploitable in a
  distinct way.
- General support requests, feature requests, and non-security defects.
- Reports based only on automated scanner output without a reproducible
  security impact.
- Social engineering, phishing, physical attacks, or testing that intentionally
  degrades or disrupts PayPal or third-party services.
- Model hallucinations, inaccurate model output, or prompt injection that does
  not cross a security boundary enforced by this toolkit.
- An authorized application invoking an action that the operator explicitly
  enabled and permitted.

If you are unsure whether an issue is in scope, report it privately and explain
the security boundary you believe is being crossed.

## Safe Research Guidelines

When investigating a potential vulnerability:

- Use the PayPal Sandbox, test accounts, and synthetic data.
- Follow the current rules and scope of the PayPal Bug Bounty Program whenever
  PayPal systems or services are involved.
- Test only accounts and data that you own or are explicitly authorized to use.
- Use the minimum interaction necessary to demonstrate the issue.
- Do not perform fraudulent transactions, disrupt services, degrade
  availability, or attempt to access another party's data.
- Stop testing and report the issue immediately if you encounter sensitive
  information or data outside your authorized scope.
- Keep vulnerability details confidential until disclosure is coordinated with
  the maintainers and PayPal.

This policy does not authorize testing that violates applicable law, PayPal
terms, the HackerOne program policy, or the rights of third parties.

## What to Expect

After a report is submitted, maintainers will make a reasonable effort to:

1. Confirm receipt and request any information needed for reproduction.
2. Validate the report and assess its impact and affected versions.
3. Keep the reporter informed when there are material updates.
4. Develop and validate a remediation when the issue is confirmed.
5. Coordinate release and disclosure, including a GitHub security advisory or
   CVE when appropriate.

Response and remediation times depend on complexity, impact, affected
components, and required coordination. Please do not disclose the issue
publicly until a fix is available or a disclosure timeline has been agreed
with the maintainers.

## Recognition

With the reporter's consent, PayPal may acknowledge responsible reports in a
security advisory or release notes. Eligibility for a bounty is determined
solely by the current PayPal Bug Bounty Program policy.
