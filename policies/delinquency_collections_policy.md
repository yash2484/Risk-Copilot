# Delinquency and Collections Policy

**Document ID:** RISK-POL-005 | **Version:** 2.4 | **Owner:** Credit Risk & Collections | **Last Reviewed:** Q1 2025

## Section 1: Purpose and Scope

This policy defines the staged intervention approach for accounts that miss minimum payment due dates, the criteria for charge-off, and the conditions under which accounts are referred to external collections agencies. It applies to all consumer card products.

## Section 2: Days Past Due (DPD) Stages

### 2.1 Early Stage: 1–29 DPD
- No formal collections action
- Automated payment reminder email at DPD 3, DPD 10, and DPD 20
- SMS reminder at DPD 15 if customer has opted in
- No impact on credit reporting or account standing

### 2.2 Stage 1: 30–59 DPD
- Account is reported to credit bureaus as 30 days past due
- delinquency_flag is set to 1 in the customer record
- Outbound call attempt within 5 business days of crossing 30 DPD
- Workout option: customer can request a hardship plan that pauses fees for 30 days while a payment arrangement is set up

### 2.3 Stage 2: 60–89 DPD
- Outbound call attempts every 3 business days
- Account is restricted from new credit purchases (existing recurring charges may continue at customer's discretion)
- Customer is offered a structured repayment plan with fee waiver if the plan is honored for 6 consecutive months
- Cross-sell and CLI offers suppressed for 24 months from this date

### 2.4 Stage 3: 90–119 DPD
- Account is moved to high-priority collections queue
- Daily call attempts during business hours, with mandatory written notification by certified mail at DPD 90
- Account access frozen — customer cannot initiate new transactions
- Final settlement offer issued: typically 60-70% of outstanding balance, depending on segment and history

### 2.5 Stage 4: 120–179 DPD
- Account flagged for charge-off review
- Credit reporting reflects current delinquency status monthly
- Settlement offers continue but at reduced amounts (40-60% of balance)
- Customer is informed in writing that the account will charge off at 180 DPD if no resolution is reached

## Section 3: Charge-Off

Charge-off occurs at 180 DPD per regulatory requirement. When charge-off is processed:

- charge_off_flag is set to 1 in the transaction record
- The full outstanding balance is written off the active receivables ledger
- The debt is not extinguished — it is moved to recovery status
- Account is closed to all future activity
- Charge-off is reported to credit bureaus and remains on the customer's credit file for 7 years

## Section 4: External Collections Referral

Accounts charged off without a settlement arrangement are referred to a contracted external collections agency within 30 days of charge-off. Agency referral criteria:

- Outstanding balance above $500
- No active dispute or pending litigation
- Customer has not entered formal bankruptcy proceedings
- Last contact attempt occurred within the trailing 60 days

Accounts below $500 are pursued through low-cost letter campaigns only.

## Section 5: Customer Hardship Programs

Customers who proactively contact collections before reaching DPD 90 may qualify for the Financial Hardship Program. Qualification requires documented income reduction of at least 25% or a qualifying life event (job loss, medical emergency, natural disaster). Program benefits include up to 6 months of reduced minimum payments, fee waivers, and pause of credit bureau reporting.

## Section 6: Re-Aging Rules

A re-aged account (returned to current status after delinquency) is permitted only once per 12-month period and only after the customer makes 3 consecutive on-time minimum payments under a workout plan. Re-aging requires Senior Collections Analyst approval.