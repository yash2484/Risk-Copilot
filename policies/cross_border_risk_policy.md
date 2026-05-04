# Cross-Border Transaction Risk Policy

**Document ID:** RISK-POL-001 | **Version:** 2.3 | **Owner:** Global Risk Management | **Last Reviewed:** Q1 2025

## Section 1: Purpose and Scope

This policy governs risk assessment and response procedures for cross-border transactions on all consumer and small business card products. It applies to every transaction where the merchant country code differs from the cardholder's country of residence. The policy is owned by Global Risk Management and is reviewed quarterly in coordination with Fraud Operations and Customer Experience.

## Section 2: Risk Thresholds

### 2.1 Automatic Flag Triggers

The following conditions trigger automatic risk review without manual intervention:

- Single cross-border transaction exceeding $2,000 on an account with no prior international transaction history in the trailing 12 months
- Cross-border spend exceeding 200% of the customer's 30-day average in any 7-day rolling window
- Three or more distinct foreign countries in any 24-hour period
- Any cross-border transaction in a high-risk country (RU, NG, CN, BR) combined with a customer risk score above 60
- Any cross-border transaction within 60 minutes of a new-device login from the same country

### 2.2 Escalation Levels

- **Level 1 (Auto-Review):** Cross-border spend 150-200% of 30-day average. No customer contact required.
- **Level 2 (Analyst Review):** Cross-border spend exceeding 200% of 30-day average, OR new country with no prior international history.
- **Level 3 (Immediate Action):** Any Level 2 criteria combined with a new-device login from the same foreign country, OR transaction in a high-risk country with risk score above 70.

## Section 3: Required Actions by Escalation Level

### 3.1 Level 1 Actions
- Flag in transaction monitoring system
- Add to daily risk review queue
- No customer contact required unless additional signals appear within 72 hours

### 3.2 Level 2 Actions
- Analyst must review within 4 business hours of flag
- Send in-app notification to customer confirming the transaction
- Temporarily reduce cross-border transaction limit to $1,000 for 72 hours
- Document reviewer notes in case management system

### 3.3 Level 3 Actions
- Immediate account freeze pending customer verification
- Outbound call to customer's registered phone number within 1 hour
- Incident logged in fraud management system with priority P1
- Notify card replacement team if fraud is confirmed

## Section 4: Customer Notification Standards

All Level 2 and Level 3 actions require customer notification within the timeframes above. Notifications must reference the specific transaction (amount, merchant country, timestamp) and provide a one-click confirmation or dispute path. Failure to acknowledge within 24 hours auto-escalates to the next level.

## Section 5: Exceptions

Premium and High_Value segment customers with travel history exceeding 12 months may have Level 1 thresholds raised by 50%. Exceptions require written approval from a Senior Risk Analyst and expire after 90 days.