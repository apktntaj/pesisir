# Risk Assessment Matrix: Pesisir Platform

**Project:** Pesisir - Multi-Tenant Customs Business Automation Platform  
**Version:** 1.0  
**Date:** December 8, 2025  
**Review Frequency:** Bi-weekly during development, Monthly post-launch

---

## Executive Summary

This document provides a comprehensive risk assessment for the Pesisir platform development and operations. Risks are categorized, evaluated for probability and impact, and paired with detailed mitigation strategies.

**Total Risks Identified:** 15  
**High Priority:** 5  
**Medium Priority:** 7  
**Low Priority:** 3

---

## Risk Assessment Methodology

### Probability Scale
- **High (H):** >60% likelihood of occurrence
- **Medium (M):** 30-60% likelihood of occurrence
- **Low (L):** <30% likelihood of occurrence

### Impact Scale
- **Critical (C):** Project failure, major data loss, significant financial impact
- **High (H):** Major delays (>2 weeks), significant rework required
- **Medium (M):** Minor delays (<2 weeks), moderate rework
- **Low (L):** Minimal impact on timeline or scope

### Risk Priority Matrix

| Impact → Probability ↓ | Low (L) | Medium (M) | High (H) | Critical (C) |
|------------------------|---------|------------|----------|--------------|
| **High (H)** | Medium | High | High | Critical |
| **Medium (M)** | Low | Medium | High | High |
| **Low (L)** | Low | Low | Medium | Medium |

---

## Risk Register

### RISK-001: CEISA API Credential Complexity 🔴 HIGH PRIORITY

**Category:** Technical / External Dependency  
**Probability:** High (70%)  
**Impact:** High  
**Risk Level:** 🔴 HIGH  
**Status:** Active

**Description:**
CEISA (Indonesia Customs) API integration may be blocked or delayed due to complex credential requirements, bureaucratic approval processes, or technical documentation gaps.

**Potential Impact:**
- MVP delayed by 2-4 weeks if API integration is mandatory
- Reduced automation value for customers
- Competitive disadvantage if competitors have API access
- Increased manual work for users

**Root Causes:**
- Complex approval process for API access
- Limited documentation on CEISA API
- Potential cost barriers for API credentials
- Bureaucratic red tape in government systems

**Mitigation Strategies:**

**Preventive (Before Development):**
1. ✅ Prioritize Excel template approach for MVP (already decided)
2. Assign dedicated team member for CEISA API research
3. Initiate contact with CEISA technical team in Week 1
4. Research successful CEISA integrations by other companies
5. Explore partnerships with customs brokers who have API access

**Contingency (During Development):**
1. Excel template becomes primary long-term solution
2. Develop web scraping fallback (if legally permissible)
3. Manual upload interface for CEISA portal
4. Partner with third-party customs clearance services

**Monitoring:**
- Weekly check-ins on CEISA API research progress
- Document all communication with CEISA team
- Track time spent on API integration attempts
- Set 4-week deadline to decide on fallback approach

**Contingency Budget:** $5,000 for consultant or legal support

---

### RISK-002: OCR Accuracy Below Expectations 🔴 HIGH PRIORITY

**Category:** Technical / Quality  
**Probability:** Medium (45%)  
**Impact:** High  
**Risk Level:** 🔴 HIGH  
**Status:** Active

**Description:**
Azure Document Intelligence may not achieve target >95% accuracy for Bill of Lading documents, especially with varied formats, poor image quality, or non-standard layouts.

**Potential Impact:**
- User frustration from extensive manual corrections
- Reduced time savings vs manual data entry
- Poor user adoption
- Negative reviews and reputation damage
- Need for significant rework of OCR pipeline

**Root Causes:**
- Diverse BOL formats across shipping lines
- Poor quality scanned documents or photos
- Complex tables and layouts
- Multiple languages on documents
- Handwritten fields on BOLs

**Mitigation Strategies:**

**Preventive:**
1. ✅ Use Azure Document Intelligence custom model training
2. Collect 50+ diverse BOL samples before Phase 3 starts
3. Set realistic accuracy targets per field type:
   - Printed text fields: >95%
   - Tables: >90%
   - Handwritten fields: >70% (flag for manual review)
4. Implement confidence score thresholds:
   - >90%: Auto-accept
   - 70-90%: Highlight for review
   - <70%: Require manual entry
5. Budget $500/month for custom model training and retraining

**Contingency:**
1. Implement comprehensive review UI with easy editing
2. Add field-level confidence indicators
3. Provide image-to-form side-by-side view
4. Allow users to mark fields as "always manual"
5. Collect feedback to continuously improve model

**Monitoring:**
- Track accuracy metrics per field type
- Weekly review of low-confidence extractions
- User feedback on correction time
- A/B testing of pre-built vs custom models

**Success Metrics:**
- Overall accuracy >92% (slightly below target is acceptable)
- User review time <2 minutes per BOL
- User satisfaction score >4/5 on OCR feature

**Contingency Budget:** $2,000 for model improvements and testing

---

### RISK-003: MarineTraffic API Rate Limits or Costs 🟡 MEDIUM PRIORITY

**Category:** Technical / Financial  
**Probability:** Medium (40%)  
**Impact:** Medium  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
MarineTraffic API usage may exceed rate limits or budget due to frequent polling, resulting in degraded ETA tracking functionality or unexpected costs.

**Potential Impact:**
- ETA updates delayed or stopped
- Additional costs beyond budget ($50-200/month initially)
- Need to reduce polling frequency
- Manual ETA entry required as fallback

**Root Causes:**
- Underestimated API call frequency requirements
- More shipments tracked than anticipated
- Inefficient polling strategy
- User-triggered manual refreshes

**Mitigation Strategies:**

**Preventive:**
1. ✅ Implement caching for vessel data (4-hour cache)
2. ✅ Smart polling strategy:
   - Active shipments (ETA <7 days): Poll every 4 hours
   - Upcoming shipments (ETA 7-30 days): Poll every 12 hours
   - Future shipments (ETA >30 days): Poll every 24 hours
3. Calculate API usage: 100 shipments × 6 calls/day = 18,000 calls/month
4. Start with Developer plan ($50/month, 30,000 calls)
5. Monitor usage dashboard daily

**Contingency:**
1. Upgrade to Intermediate plan ($200/month) if needed
2. Reduce polling frequency for non-critical shipments
3. Manual refresh button with rate limiting (1 per 15 minutes)
4. Allow manual ETA entry as fallback
5. Batch API requests where possible

**Monitoring:**
- Daily API usage tracking
- Weekly cost review
- Alert when usage reaches 80% of limit
- Monthly usage trend analysis

**Budget Allocation:**
- MVP: $50/month (Developer plan)
- 6 months: $200/month (Intermediate plan)
- 12 months: $500/month (Advanced plan if needed)

---

### RISK-004: WhatsApp Business Approval Delays 🟡 MEDIUM PRIORITY

**Category:** External Dependency / Timeline  
**Probability:** Medium (50%)  
**Impact:** Medium  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
Twilio WhatsApp Business Profile approval may take longer than expected (>3 weeks), delaying notification feature launch or forcing sandbox usage in production.

**Potential Impact:**
- Notification feature delayed or unavailable at MVP launch
- Limited testing with real users
- Need to implement alternative notification channels
- User disappointment if advertised feature unavailable

**Root Causes:**
- Facebook/Meta review process unpredictable
- Business verification requirements
- Template message approval delays
- Documentation issues

**Mitigation Strategies:**

**Preventive:**
1. ✅ Apply for WhatsApp Business approval IMMEDIATELY (Week 1, Day 1)
2. ✅ Prepare all required business documentation in advance
3. Complete Twilio sandbox development first (Weeks 5-6)
4. Submit 3-5 template messages for approval early
5. Consider expedited review option if available

**Contingency:**
1. ✅ Implement email notifications in parallel (Week 5)
2. Add SMS notifications as backup (cost: $0.01-0.05/message)
3. Launch MVP with email only if WhatsApp not approved
4. Add WhatsApp in subsequent release
5. Clearly communicate timeline to early customers

**Monitoring:**
- Check approval status daily
- Follow up with Twilio support if delayed >2 weeks
- Track template message approval separately
- Document all communication with Meta/Twilio

**Timeline Expectations:**
- Best case: 1 week approval
- Expected: 2-3 weeks approval
- Worst case: 4-6 weeks approval
- Fallback: Launch without WhatsApp

**Alternative Providers (if Twilio fails):**
- MessageBird
- 360dialog
- Direct Meta Cloud API (more complex)

---

### RISK-005: Multi-Tenant Data Leakage 🔴 CRITICAL PRIORITY

**Category:** Security / Compliance  
**Probability:** Low (15%)  
**Impact:** Critical  
**Risk Level:** 🔴 HIGH  
**Status:** Active - Requires Continuous Vigilance

**Description:**
Security vulnerability allows one tenant to access another tenant's data, resulting in data breach, legal liability, and reputation damage.

**Potential Impact:**
- CATASTROPHIC: Complete loss of customer trust
- Legal liability and potential lawsuits
- GDPR violations with fines up to €20M or 4% of revenue
- Business closure in worst case
- Criminal charges in Indonesia for data privacy violations

**Root Causes:**
- Missing tenant ID in database queries
- Incorrect tenant context resolution
- Authorization bypass vulnerabilities
- SQL injection or other exploits
- Bug in EF Core query filters
- Developer error or oversight

**Mitigation Strategies:**

**Preventive (Critical - Must Implement):**
1. ✅ EF Core Global Query Filters on all tenant-scoped entities
2. Automated test suite for tenant isolation:
   - Create 2 test tenants with sample data
   - Attempt cross-tenant queries in every test
   - Fail test if any cross-tenant data returned
3. Code review checklist:
   - [ ] All queries include tenant validation
   - [ ] Authorization checks present
   - [ ] No raw SQL without tenant filter
4. Static code analysis for tenant isolation patterns
5. Separate encryption keys per tenant (Phase 2)
6. Database constraints: Foreign keys include TenantId
7. Runtime assertions on TenantId before data access

**Testing Requirements:**
- Unit tests: >100 test cases for tenant isolation
- Integration tests: All API endpoints tested with different tenants
- Penetration testing before launch
- Quarterly security audits post-launch

**Contingency (Incident Response):**
1. Immediate incident response plan:
   - Identify scope of data exposure within 1 hour
   - Notify affected customers within 24 hours
   - Notify regulatory authorities within 72 hours (GDPR)
   - Engage legal counsel immediately
2. Technical response:
   - Disable affected accounts immediately
   - Deploy emergency fix within 4 hours
   - Conduct full security audit
   - Implement additional monitoring
3. Customer response:
   - Transparent communication
   - Offer credit monitoring or compensation
   - Provide detailed incident report
   - Implement customer-requested safeguards

**Monitoring:**
- Audit log analysis for suspicious cross-tenant access attempts
- Alert on any query without tenant filter
- Weekly security scan for vulnerabilities
- Real-time monitoring for unusual data access patterns

**Insurance:** Cyber liability insurance (minimum $1M coverage)

**Budget:** $10,000 for security audit + ongoing monitoring tools

---

### RISK-006: Team Availability / Resource Constraints 🟡 MEDIUM PRIORITY

**Category:** Resource / Timeline  
**Probability:** High (65%)  
**Impact:** Medium  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
Key team members unavailable due to illness, departure, or competing priorities, causing development delays and knowledge gaps.

**Potential Impact:**
- Timeline extension of 1-3 weeks
- Features cut from MVP
- Quality compromises
- Increased stress on remaining team
- Delayed launch

**Mitigation Strategies:**

**Preventive:**
1. Cross-train team members on multiple services
2. Maintain comprehensive documentation
3. Pair programming for critical components
4. 20% timeline buffer built into schedule
5. Have backup contractor identified ($100-150/hour)

**Contingency:**
1. Re-prioritize features using MoSCoW method
2. Extend timeline if necessary (communicate early)
3. Bring in contractor for specific tasks
4. Simplify features to reduce scope
5. Consider phased release (core features first)

**Monitoring:**
- Weekly team capacity check
- Track velocity and burndown
- Early warning if falling behind schedule

---

### RISK-007: Azure Service Outages 🟡 MEDIUM PRIORITY

**Category:** Technical / Infrastructure  
**Probability:** Low (20%)  
**Impact:** High  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
Azure services (Document Intelligence, SQL Database, Blob Storage) experience outages affecting platform availability.

**Potential Impact:**
- OCR processing stopped
- API unavailable
- User data inaccessible
- SLA violations
- User frustration

**Mitigation Strategies:**

**Preventive:**
1. Multi-region deployment (Phase 2)
2. Implement circuit breakers for external services
3. Cache OCR results and vessel data
4. Graceful degradation:
   - OCR down: Allow manual entry
   - DB read replica for queries
5. Monitor Azure service health dashboard

**Contingency:**
1. Manual workarounds documented
2. Status page for users
3. Failover procedures ready
4. SLA credit claims process

**Monitoring:**
- Azure Service Health alerts
- Health checks every 5 minutes
- Automated failover testing

---

### RISK-008: Security Vulnerabilities 🔴 HIGH PRIORITY

**Category:** Security  
**Probability:** Medium (35%)  
**Impact:** High  
**Risk Level:** 🔴 HIGH  
**Status:** Active

**Description:**
Security vulnerabilities in code or dependencies exploited by attackers, leading to data breach or service disruption.

**Potential Impact:**
- Data breach
- Service downtime
- Reputation damage
- Legal liability
- Financial losses

**Mitigation Strategies:**

**Preventive:**
1. Weekly automated security scans (Snyk, OWASP ZAP)
2. Monthly dependency updates
3. Input validation on all endpoints
4. SQL injection prevention (parameterized queries)
5. XSS protection
6. Security code review checklist

**Testing:**
1. Penetration testing before launch ($2,000-5,000)
2. Bug bounty program (post-launch)
3. Security training for developers

**Contingency:**
1. Incident response plan ready
2. Security patch deployment <24 hours
3. Post-mortem and lessons learned

**Monitoring:**
- Automated vulnerability scanning
- Security audit logs
- Unusual activity alerts

---

### RISK-009: Poor User Adoption 🟡 MEDIUM PRIORITY

**Category:** Business / Product-Market Fit  
**Probability:** Medium (40%)  
**Impact:** High  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
Users find the platform difficult to use or not valuable enough, resulting in low adoption and churn.

**Potential Impact:**
- Business failure
- Wasted development effort
- No revenue generation
- Need for major product pivot

**Mitigation Strategies:**

**Preventive:**
1. User research interviews (5-10 customs officers) before Phase 3
2. Pilot program with 3-5 friendly companies
3. Weekly feedback sessions during development
4. Comprehensive onboarding documentation
5. Video tutorials for key workflows

**Validation:**
1. Measure time savings vs manual process
2. User satisfaction surveys (target >4/5)
3. Usage analytics (active users, feature adoption)
4. Net Promoter Score tracking

**Contingency:**
1. Rapid iteration based on feedback
2. Feature prioritization adjustments
3. Enhanced support during onboarding
4. Consider pricing adjustments

---

### RISK-010: Cost Overrun on External Services 🟡 MEDIUM PRIORITY

**Category:** Financial  
**Probability:** Medium (45%)  
**Impact:** Medium  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
External service costs (Azure, MarineTraffic, Twilio) exceed budget due to higher usage than anticipated.

**Potential Impact:**
- Budget deficit of $500-2,000/month
- Need to reduce features or usage
- Pricing model adjustments required
- Cash flow issues

**Mitigation Strategies:**

**Preventive:**
1. Monitor costs weekly
2. Set up billing alerts at 50%, 80%, 100% of budget
3. Implement usage quotas per tenant
4. Optimize API calls and storage
5. Cost estimation per tenant for pricing model

**Cost Projections:**
```
MVP (100 tenants, 500 shipments/month):
- Azure Document Intelligence: $150/month
- MarineTraffic API: $50/month
- Twilio WhatsApp: $100/month
- Azure Infrastructure: $300/month
Total: $600/month

Year 1 (500 tenants, 2500 shipments/month):
- Azure Document Intelligence: $750/month
- MarineTraffic API: $200/month
- Twilio WhatsApp: $500/month
- Azure Infrastructure: $800/month
Total: $2,250/month
```

**Contingency:**
1. Implement tiered pricing model
2. Reduce free tier limits
3. Optimize to lower-cost alternatives if needed
4. Renegotiate rates at higher volumes

---

### RISK-011: Database Performance Degradation 🟢 LOW PRIORITY

**Category:** Technical / Performance  
**Probability:** Low (25%)  
**Impact:** Medium  
**Risk Level:** 🟢 LOW  
**Status:** Monitoring

**Description:**
Database queries become slow as data volume grows, affecting user experience and API response times.

**Mitigation Strategies:**

**Preventive:**
1. Proper indexing on TenantId, ShipmentId, foreign keys
2. Query optimization and execution plan review
3. Database performance testing with large datasets
4. Connection pooling configured
5. Read replicas for reporting queries

**Monitoring:**
- Query execution time tracking
- Slow query log analysis
- Database resource utilization

**Contingency:**
1. Database tier upgrade ($$$)
2. Query optimization sprint
3. Implement caching layer (Redis)
4. Archive old data

---

### RISK-012: Third-Party API Changes 🟢 LOW PRIORITY

**Category:** External Dependency  
**Probability:** Low (15%)  
**Impact:** Medium  
**Risk Level:** 🟢 LOW  
**Status:** Monitoring

**Description:**
External APIs (MarineTraffic, Azure, Twilio) change unexpectedly, breaking integrations.

**Mitigation Strategies:**

**Preventive:**
1. Use stable API versions
2. Subscribe to API change notifications
3. Integration tests catch breaking changes
4. Version pinning for SDKs

**Contingency:**
1. Emergency fix deployment
2. Temporary manual workarounds
3. Fallback to cached data

---

### RISK-013: Regulatory Compliance Issues 🟡 MEDIUM PRIORITY

**Category:** Legal / Compliance  
**Probability:** Low (20%)  
**Impact:** High  
**Risk Level:** 🟡 MEDIUM  
**Status:** Active

**Description:**
Platform fails to comply with Indonesian customs regulations, data protection laws, or international standards.

**Mitigation Strategies:**

**Preventive:**
1. Legal review of customs document requirements
2. GDPR compliance checklist (if EU customers)
3. Data retention policy aligned with regulations
4. Privacy policy and terms of service
5. Consultation with customs law expert ($1,000-2,000)

**Monitoring:**
- Quarterly compliance review
- Track regulatory changes
- User consent management

---

### RISK-014: Competition / Market Changes 🟡 MEDIUM PRIORITY

**Category:** Business / Market  
**Probability:** Medium (30%)  
**Impact:** Medium  
**Risk Level:** 🟡 MEDIUM  
**Status:** Monitoring

**Description:**
Competitor launches similar product first or CEISA launches own solution, reducing market opportunity.

**Mitigation Strategies:**

**Preventive:**
1. Focus on unique value proposition
2. Build customer relationships early
3. Rapid MVP launch (8 weeks)
4. Continuous feature differentiation

**Contingency:**
1. Adjust pricing strategy
2. Add differentiating features
3. Explore adjacent markets
4. Partnership opportunities

---

### RISK-015: Technical Debt Accumulation 🟢 LOW PRIORITY

**Category:** Technical / Maintainability  
**Probability:** High (70%)  
**Impact:** Low  
**Risk Level:** 🟢 LOW  
**Status:** Monitoring

**Description:**
Shortcuts taken during rapid MVP development lead to technical debt that slows future development.

**Mitigation Strategies:**

**Preventive:**
1. 15% time allocation for refactoring
2. Code review standards
3. "Boy Scout Rule" - leave code better than found
4. Track tech debt items in backlog

**Acceptance:**
- Some tech debt acceptable for MVP speed
- Prioritize user-facing features initially
- Plan refactoring in post-MVP phases

---

## Risk Monitoring and Review

### Weekly Risk Review
- Review status of all HIGH priority risks
- Update probability/impact if circumstances change
- Report to stakeholders on risk status

### Monthly Risk Review
- Comprehensive review of all risks
- Identify new risks
- Update mitigation strategies
- Archive resolved risks

### Risk Response Procedures

**When Risk Materializes:**
1. Activate contingency plan immediately
2. Notify stakeholders within 2 hours
3. Document incident and response
4. Post-mortem after resolution
5. Update risk assessment with lessons learned

---

## Risk Budget Allocation

| Risk Category | Budget Allocated | Usage |
|---------------|------------------|-------|
| Security (RISK-005, RISK-008) | $15,000 | Penetration testing, audits, insurance |
| OCR Improvements (RISK-002) | $2,000 | Model training, testing |
| External Services (RISK-003, RISK-010) | $5,000 | Buffer for overages |
| Legal/Compliance (RISK-001, RISK-013) | $3,000 | Consultations, reviews |
| Contingency (General) | $5,000 | Unforeseen issues |
| **Total Risk Budget** | **$30,000** | |

---

## Risk Dashboard (Current Status)

🔴 **High Priority Risks:** 5 active  
🟡 **Medium Priority Risks:** 7 active  
🟢 **Low Priority Risks:** 3 monitoring  

**Overall Risk Level:** 🟡 MEDIUM (Manageable with active mitigation)

**Recommendation:** Proceed with development with close monitoring of HIGH priority risks, especially RISK-005 (Data Leakage) and RISK-002 (OCR Accuracy).

---

**Next Risk Review:** Week 2 of Development  
**Prepared By:** Planning Team  
**Approved By:** [Pending]  
**Date:** December 8, 2025
