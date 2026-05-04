# New Customer Risk Guidelines

**Document ID:** RISK-POL-006 | **Version:** 1.6 | **Owner:** Credit Risk Management | **Last Reviewed:** Q1 2025

## Section 1: Purpose and Scope

This document defines the elevated monitoring, transaction velocity controls, and review triggers that apply to customer accounts in their first 90 days of activity. It is intended to mitigate the elevated default and fraud risk associated with newly-opened accounts and applies to all consumer card products.

## Section 2: Definition of New Customer

A "new customer" is any account where the open_date is within the trailing 90 days. The New_To_Credit segment receives an extended observation period of 180 days. After the new-customer window expires, accounts transition to standard monitoring under their assigned segment policy.

## Section 3: First-90-Day Spending Limits by Segment

Maximum single-transaction and 7-day cumulative spend caps during the new-customer window:

### 3.1 Premium and High_Value Segments
- Single-transaction cap: $5,000
- 7-day cumulative cap: $20,000
- Cross-border cap: $2,500 single transaction, $5,000 in 7 days

### 3.2 Standard Segment
- Single-transaction cap: $2,500
- 7-day cumulative cap: $7,500
- Cross-border cap: $1,000 single transaction, $2,000 in 7 days

### 3.3 New_To_Credit Segment
- Single-transaction cap: $1,000
- 7-day cumulative cap: $2,500
- Cross-border cap: $500 single transaction, $750 in 7 days
- Cash advance not permitted in first 90 days

### 3.4 Subprime Segment
- Single-transaction cap: $1,500
- 7-day cumulative cap: $3,500
- Cross-border cap: $500 single transaction, $1,000 in 7 days
- Cash advance permitted only after 60 days of clean activity

## Section 4: Velocity Controls

In addition to the segment caps above, the following velocity rules apply to all new customers:

- No more than 5 transactions in any 1-hour window
- No more than 15 transactions in any 24-hour window
- No more than 2 distinct merchant countries in any 24-hour window
- Any decline triggers a 30-minute soft hold; three declines within 24 hours triggers a customer verification call

## Section 5: Monitoring Frequency

- **Days 1–30:** All transactions monitored in real time. Any anomaly signal (Yellow Alert login or higher, decline pattern, velocity breach) triggers immediate analyst review.
- **Days 31–60:** Transaction monitoring continues in real time but anomaly signals are batch-reviewed daily unless severity is Orange Alert or higher.
- **Days 61–90:** Standard segment-level monitoring applies; only Red Alerts and confirmed fraud indicators trigger immediate review.

## Section 6: Review Triggers

The following events during the new-customer window automatically generate a case in the analyst review queue:

- First cross-border transaction
- First cash advance transaction
- First decline of any kind
- Utilization ratio crossing 0.50 within 30 days of account open
- Any login anomaly classified Yellow Alert or higher
- Any payment that does not clear on first attempt

## Section 7: Risk Score Recalibration

A new customer's risk score is recomputed weekly during the first 90 days using the most recent transaction and login data. Customers who maintain a score below 35 for 60 consecutive days may have their velocity controls relaxed at the discretion of the assigned credit analyst, but spending caps remain in place for the full 90-day window.

## Section 8: Onboarding Documentation

All new customer accounts must have on file: government-issued ID verification, proof of address dated within 90 days of application, and a confirmed monthly income figure. Missing documentation triggers an automatic restriction to Subprime caps regardless of assigned segment.