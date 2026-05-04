# Login Security Best Practices

**Document ID:** RISK-POL-003 | **Version:** 3.1 | **Owner:** Information Security & Fraud Operations | **Last Reviewed:** Q1 2025

## Section 1: Purpose and Scope

This document defines authentication requirements, anomaly detection thresholds, and incident response timelines for customer login events across web, mobile, and API channels. It applies to all customer-facing authentication surfaces.

## Section 2: Multi-Factor Authentication (MFA) Requirements

### 2.1 Mandatory MFA Triggers
MFA must be enforced before granting session access in any of the following conditions:

- Login from a new device (new_device_flag = 1)
- Login from an IP country different from the customer's registered residence
- First login after a password reset
- Three or more failed authentication attempts within the trailing 24 hours
- Any login on an account currently flagged with a risk score above 60

### 2.2 MFA Methods
- One-time passcode (OTP) via SMS to registered phone (default)
- OTP via registered email (fallback if SMS delivery fails twice)
- Authenticator app (TOTP) — available opt-in for all customers, mandatory for Premium and High_Value segments
- Biometric verification — mobile app only, supplementary to OTP not replacement

## Section 3: Anomaly Detection Thresholds

### 3.1 Alert Levels by Failed Attempts in 24 Hours
- **Yellow Alert:** 3-4 failed attempts. Action: require MFA on next attempt; no customer notification.
- **Orange Alert:** 5-7 failed attempts. Action: lock account for 15 minutes; send in-app and email notification to customer.
- **Red Alert:** 8 or more failed attempts. Action: lock account for 24 hours pending customer verification; trigger incident response per RISK-POL-004.

### 3.2 IP Geolocation Rules
Logins originating from high-risk countries (RU, NG, CN, BR) require MFA regardless of device trust status. If the registered residence is also in one of these countries, the rule is suspended.

### 3.3 Device Trust
A device is considered trusted after 30 consecutive days of successful authentication without MFA failures. Trust is revoked immediately upon any Orange or Red alert.

## Section 4: Response SLAs

- Yellow Alert: automated handling, no SLA
- Orange Alert: customer notification within 5 minutes; analyst review within 4 business hours
- Red Alert: customer outbound contact within 30 minutes; fraud analyst review within 1 hour

## Section 5: New Device Login Handling

When new_device_flag is set to 1, the following sequence is enforced:

1. Block initial login attempt; require MFA via registered channel
2. After successful MFA, send confirmation notification to customer with device fingerprint, timestamp, and location
3. Customer must explicitly approve the new device within 72 hours or it is removed from the trusted list
4. If the new device login also originates from a foreign country, escalate to Orange Alert handling regardless of failed attempt count

## Section 6: Audit and Logging

All login events — successful and failed — are logged with timestamp, IP, device fingerprint, country, MFA method used, and outcome. Logs are retained for 13 months and reviewed monthly by the Information Security team for pattern anomalies.