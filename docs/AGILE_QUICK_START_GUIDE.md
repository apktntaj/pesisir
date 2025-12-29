# Quick Start Guide: Implementing Agile Scrum for PESISIR

**Target Audience**: Product Owner, Scrum Master, Development Team  
**Purpose**: Step-by-step guide untuk memulai Agile development  
**Timeline**: Sprint 0 preparation (1 week)

---

## 🎯 Sprint 0: Getting Ready (Week -1 to 0)

Sprint 0 adalah pre-development phase untuk setup Agile infrastructure dan align team.

### Day 1-2: Team Onboarding & Setup

#### ✅ Action Items:

1. **Assign Scrum Roles**
   - [ ] Designate Product Owner (PO)
   - [ ] Designate Scrum Master (SM) - bisa dual role dengan Tech Lead
   - [ ] Identify Development Team members (3-4 people)
   - [ ] Document roles and responsibilities

2. **Scrum Training** (2 hours session)
   - [ ] Overview Agile principles
   - [ ] Explain Scrum framework
   - [ ] Review sprint ceremonies
   - [ ] Discuss team working agreements
   - [ ] Q&A session

3. **Setup Communication Channels**
   - [ ] Create Slack/Teams workspace
   - [ ] Setup daily standup time (same time every day)
   - [ ] Schedule sprint ceremonies:
     - Sprint Planning: Every other Monday, 9-11 AM
     - Daily Standup: Every day, 10-10:15 AM
     - Sprint Review: Every other Friday, 2-3 PM
     - Sprint Retrospective: Every other Friday, 3-4 PM
     - Backlog Refinement: Every other Wednesday, 2-3 PM

### Day 3-4: Project Management Tool Setup

#### ✅ Action Items:

1. **Choose Project Management Tool**
   - Recommended: Jira or Azure DevOps
   - Alternative: GitHub Projects, Trello (simpler)

2. **Create Project Board**
   ```
   Backlog → To Do → In Progress → Review → Done
   ```

3. **Import User Stories**
   - [ ] Create Epic: "PESISIR MVP"
   - [ ] Import 10 user stories dari PRD
   - [ ] Add story details:
     - Description
     - Acceptance criteria
     - Priority (Must/Should/Could)
     - Story points (placeholder, akan refined)

4. **Configure Board Settings**
   - [ ] Enable story points field
   - [ ] Setup sprint view
   - [ ] Configure workflow transitions
   - [ ] Add custom fields jika needed

### Day 5: Backlog Refinement Session

#### ✅ Action Items:

1. **Story Points Estimation Workshop** (2 hours)
   - [ ] Explain Fibonacci sequence (1,2,3,5,8,13,21)
   - [ ] Conduct Planning Poker for all 10 stories
   - [ ] Document estimates dalam tool
   - [ ] Identify stories yang >13 points (perlu split)

2. **Prioritize Backlog**
   - [ ] Product Owner ranks stories by business value
   - [ ] Consider dependencies
   - [ ] Mark Sprint 1 candidates

3. **Define Sprint 1 Goal**
   - Draft goal: "Users can register, login, dan receive initial balance"
   - Target stories: PESISIR-001, PESISIR-002, plus technical setup

### Day 6-7: Technical Setup

#### ✅ Action Items:

1. **Development Environment**
   - [ ] Setup GitHub repository (already done ✅)
   - [ ] Create development branches strategy (Git Flow)
   - [ ] Setup local development environment docs
   - [ ] Docker Compose for local dependencies

2. **CI/CD Pipeline Basic**
   - [ ] Setup GitHub Actions workflow
   - [ ] Configure automated build
   - [ ] Configure automated tests
   - [ ] Setup deployment to staging (basic)

3. **Definition of Done Documentation**
   - [ ] Create DoD checklist template
   - [ ] Share with team for review
   - [ ] Get team agreement

4. **Sprint Board Preparation**
   - [ ] Create Sprint 1 dalam tool
   - [ ] Set sprint dates (Week 1-2)
   - [ ] Add initial stories ke sprint backlog

---

## 🚀 Sprint 1 Kick-off (Week 1, Day 1)

### Sprint Planning Meeting (2 hours)

#### Agenda:

**Part 1: What to Build (1 hour)**
1. Product Owner presents Sprint 1 goal
2. Review user stories untuk Sprint 1:
   - PESISIR-001: User Registration (8 points)
   - PESISIR-002: Initial Balance (5 points)
   - Technical: Database setup (5 points)
   - Technical: Authentication infrastructure (8 points)
3. Team asks clarifying questions
4. Team commits to story points (target: 20-25 points)

**Part 2: How to Build (1 hour)**
1. Break down stories menjadi tasks
2. Assign tasks (self-assignment)
3. Identify dependencies dan risks
4. Team confirms commitment

#### Output:
- [ ] Sprint 1 goal documented
- [ ] Sprint backlog finalized (committed stories)
- [ ] Tasks created dan assigned
- [ ] Team confidence vote: 👍 (yes) or 🤔 (concerns)

---

## 📅 Daily Routine During Sprint

### Daily Standup (15 minutes, 10:00 AM)

**Format** (round-robin, each person answers):
1. What did I complete yesterday?
2. What will I work on today?
3. Any blockers or impediments?

**Scrum Master Responsibilities**:
- Timebox to 15 minutes
- Document blockers
- Follow up on blockers offline
- Update sprint board

### Throughout the Day

**Developers**:
- Update task status dalam sprint board
- Move cards: To Do → In Progress → Review → Done
- Create pull requests untuk code review
- Review teammates' PRs
- Communicate updates dalam Slack

**Product Owner**:
- Available untuk clarifying questions
- Review dan accept completed stories
- Monitor sprint progress

---

## 🎬 End of Sprint 1 (Week 2, Friday)

### Sprint Review (1 hour, 2:00 PM)

**Agenda**:
1. Demo working software (30 min)
   - Show user registration flow
   - Show initial balance allocation
   - Show authentication working
2. Stakeholder feedback (15 min)
3. Product backlog update (15 min)

**Who Attends**: Entire team + stakeholders + interested users

### Sprint Retrospective (1 hour, 3:00 PM)

**Agenda**:
1. What went well? (20 min)
2. What can be improved? (20 min)
3. Action items untuk next sprint (20 min)

**Format**: Use retrospective techniques
- Start-Stop-Continue
- Glad-Sad-Mad
- 4Ls (Liked, Learned, Lacked, Longed for)

**Output**: 2-3 action items for improvement

---

## 📊 Metrics to Track (From Sprint 1)

### Sprint Metrics
- [ ] Committed story points: ___
- [ ] Completed story points: ___
- [ ] Sprint commitment accuracy: ____%
- [ ] Sprint goal achieved: Yes/No

### Team Health
- [ ] Team satisfaction rating: ___/5
- [ ] Number of blockers: ___
- [ ] Average blocker resolution time: ___ hours

### Code Quality
- [ ] Unit test coverage: ____%
- [ ] Code review turnaround: ___ hours
- [ ] Build success rate: ____%

---

## 🛠️ Recommended Tools

### Must Have:
- **Project Management**: Jira, Azure DevOps, or GitHub Projects
- **Communication**: Slack or Microsoft Teams
- **Code Repository**: GitHub (already in use)
- **CI/CD**: GitHub Actions
- **Video Calls**: Zoom or Microsoft Teams

### Nice to Have:
- **Planning Poker**: PlanningPoker.com or Jira built-in
- **Retrospective**: Miro, Mural, or FunRetro
- **Documentation**: Notion, Confluence, or GitHub Wiki
- **Time Tracking**: Toggl or built-in tool

---

## ⚠️ Common Pitfalls & How to Avoid

### Pitfall 1: Skipping Daily Standups
❌ "We're all in the same room, we know what everyone's doing"  
✅ **Solution**: Standups provide structure, surface blockers, and build team rhythm

### Pitfall 2: Sprint Planning Takes Too Long
❌ Spending 4+ hours in planning  
✅ **Solution**: Do backlog refinement mid-sprint, planning should just finalize

### Pitfall 3: Scope Creep During Sprint
❌ Adding new stories mid-sprint  
✅ **Solution**: Protect sprint commitment, new stories go to backlog

### Pitfall 4: No Clear Definition of Done
❌ "It's done... well, mostly done..."  
✅ **Solution**: Strict DoD checklist, story not done until ALL criteria met

### Pitfall 5: Retrospectives Become Blame Sessions
❌ "You didn't deliver on time!"  
✅ **Solution**: Focus on process, not people. What can WE improve?

---

## 📖 Recommended Reading

**Books**:
- "Scrum: The Art of Doing Twice the Work in Half the Time" - Jeff Sutherland
- "User Stories Applied" - Mike Cohn
- "Agile Estimating and Planning" - Mike Cohn

**Articles**:
- [Scrum Guide](https://scrumguides.org/) (official, 20 pages)
- [Agile Manifesto](https://agilemanifesto.org/)

**Videos**:
- Scrum in 15 Minutes (YouTube)
- Atlassian Agile Coach tutorials

---

## ✅ Sprint 0 Completion Checklist

Before starting Sprint 1, verify:

- [ ] All team members assigned Scrum roles
- [ ] Project management tool configured
- [ ] All 10 user stories imported dengan story points
- [ ] Sprint ceremonies scheduled (recurring)
- [ ] Communication channels setup
- [ ] CI/CD pipeline basic working
- [ ] Definition of Done documented dan agreed
- [ ] Sprint 1 planning meeting scheduled
- [ ] Development environment ready
- [ ] Team excited dan confident! 🎉

---

## 🎯 Success Criteria

**Sprint 0 Success** = Ready to start Sprint 1 development

**Sprint 1 Success** = 
- Working authentication system
- Users can register dan login
- Initial balance allocated
- Sprint goal achieved
- Team velocity baseline established

---

## 📞 Need Help?

**Scrum Master**: Handle day-to-day Scrum process questions  
**Product Owner**: Handle product/business questions  
**Tech Lead**: Handle technical architecture questions

**External Resources**:
- Scrum.org community forums
- Agile coaching services (if budget allows)

---

**Remember**: Agile is about **inspect and adapt**. Don't expect perfection in Sprint 1. Each sprint akan better dari previous sprint. Focus on continuous improvement! 🚀

---

*Last Updated*: December 29, 2025  
*Version*: 1.0  
*Next Review*: End of Sprint 1
