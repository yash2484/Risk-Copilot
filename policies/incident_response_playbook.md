# Incident Response Playbook

**Document ID:** RISK-POL-004 | **Version:** 2.0 | **Owner:** Fraud Operations | **Last Reviewed:** Q1 2025

## Section 1: Purpose and Scope

This playbook defines the standard operating procedure for fraud and security incidents detected through automated monitoring, customer reports, or analyst escalation. It applies to all customer-facing card products and is the authoritative reference for the Fraud Operations team.

## Section 2: Severity Definitions

### 2.1 P0 — Critical
Confirmed account takeover with active fraudulent transactions, OR confirmed data breach affecting customer PII. Response begins within 15 minutes of detection regardless of business hours.

### 2.2 P1 — High
Suspected account takeover with one or more anomaly signals (Red Alert login, new-device cross-border transaction, or charge-off event), OR Level 3 cross-border escalation. Response begins within 1 hour.

### 2.3 P2 — Medium
Single anomaly signal without confirmed fraud — for example, Orange Alert login or Level 2 cross-border escalation. Response begins within 4 business hours.

### 2.4 P3 — Low
Pattern-based monitoring alerts that do not require immediate action — for example, gradual utilization climb or repeated declines without other signals. Reviewed in next business-day batch.

## Section 3: Fraud Confirmation Sequence

When an incident is opened at P1 or higher, the analyst must complete the following steps in order:

1. Freeze the account immediately to prevent further transactions
2. Pull the trailing 30 days of transactions and login events for the customer
3. Identify the earliest signal of compromise (timestamp and event type)
4. Attempt outbound contact to the customer using registered phone, then registered email
5. Document customer response or non-response in the case management system
6. If customer confirms unauthorized activity: initiate card replacement and fraud chargeback
7. If customer cannot be reached within the SLA: maintain freeze, escalate to Senior Fraud Analyst

## Section 4: Account Freeze Criteria

An account must be frozen when ANY of the following conditions are met:

- Confirmed unauthorized transaction reported by customer
- Red Alert login event combined with any subsequent transaction within 60 minutes
- Cross-border Level 3 escalation
- Two or more Orange Alert login events within 7 days
- Charge-off event combined with new device login

## Section 5: Customer Communication SLAs

- P0: Outbound call within 15 minutes; written notification within 1 hour
- P1: Outbound call within 1 hour; written notification within 4 hours
- P2: Written notification within 4 business hours; outbound call within 24 hours
- P3: Written notification within 2 business days

## Section 6: Escalation Chain (RACI Summary)

- **Responsible:** On-call Fraud Analyst (handles all P1-P3 directly)
- **Accountable:** Fraud Operations Manager (owns case outcome)
- **Consulted:** Information Security (for P0 and P1 with login compromise)
- **Informed:** Customer Experience (for any case requiring outbound call), Legal (for confirmed P0)

## Section 7: Post-Incident Review

All P0 and P1 incidents require a written post-incident review within 5 business days documenting: time-to-detection, time-to-containment, root cause, and any process improvements identified. Reviews are aggregated monthly and presented to the Risk Committee.