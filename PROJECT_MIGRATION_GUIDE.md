# 🚀 Project Plan Migration Guide

This guide will help you migrate all scattered project plans from various files into your centralized Vikunja project management system.

## 📋 What Will Be Migrated

### **9 Major Projects** with **25+ Tasks**

1. **Code Review Action Plan - Phase 1.5** [HIGH]
   - Fix 12 failing test suites
   - Reduce TypeScript errors to <5

2. **Tebra Debug Dashboard Refactor** [HIGH]
   - Fix "Sync Today" functionality (CRITICAL)
   - Break down 780-line monolith
   - Achieve >85% test coverage

3. **Dashboard Hook to Class Migration** [MEDIUM]
   - Convert remaining 13/22 components

4. **Redis Architecture Migration** [HIGH]
   - Complete design documentation
   - Implement Redis 2FA system (75% complete)

5. **Security & Compliance Remediation** [URGENT]
   - Fix endpoint authentication vulnerabilities (CRITICAL)
   - Implement audit logging

6. **Documentation Reorganization** [MEDIUM]
   - Restructure 130+ markdown files

7. **White Screen Issue Resolution** [HIGH]
   - 4-phase systematic debugging plan

8. **Website Architecture Overhaul** [MEDIUM]
   - Transform into 9+ specialized dashboards

9. **CLI Testing Framework** [MEDIUM]
   - Comprehensive CLI testing suite

### **Sprint Planning**

- **Sprint 1**: Critical fixes (Jan 6-19, 2025)
- **Sprint 2**: Architecture & testing (Jan 20 - Feb 2, 2025)

## 🛠️ Migration Steps

### Step 1: Ensure Vikunja is Running

```bash
# Check if Vikunja is running
$HOME/.workflow-bolt/vikunja-admin.sh status

# Start Vikunja if not running
$HOME/.workflow-bolt/vikunja-admin.sh start
```

### Step 2: Set Up Vikunja Account

1. **Visit**: <http://localhost:3456>
2. **Create account** (first user becomes admin)
3. **Go to Settings** → **API Tokens**
4. **Create new token** and copy it

### Step 3: Set Environment Variable

```bash
# Set your Vikunja API token
export VITE_VIKUNJA_TOKEN="your_token_here"

# Or add to your .envrc file
echo 'export VITE_VIKUNJA_TOKEN="your_token_here"' >> .envrc
direnv allow
```

### Step 4: Run Migration Script

```bash
# Navigate to project directory
cd /Users/ralfb.luknermdphd/PycharmProjects/workflow-bolt

# Run the migration
node scripts/migrate-plans.js
```

## 🎯 Expected Results

After successful migration, you'll have:

✅ **Master Project**: "Workflow-Bolt Master Plan" coordinating everything  
✅ **9 Individual Projects** with detailed descriptions and tasks  
✅ **25+ Development Tasks** with priorities and estimates  
✅ **2 Sprint Plans** ready for execution  
✅ **Migration Summary** documenting what was moved  

## 🚨 Immediate Priorities (After Migration)

The migration will highlight these critical items:

1. **🔥 CRITICAL**: Fix "Sync Today" Tebra functionality
2. **🚨 URGENT**: Resolve security vulnerabilities (HIPAA compliance)
3. **📊 HIGH**: Complete test suite repairs (12 failing suites)
4. **🖥️ HIGH**: Fix white screen issues

## 📊 Project Management Workflow

Once migrated, your workflow becomes:

```
Vikunja Dashboard
├── Master Plan (coordination)
├── Individual Projects (focused work)
├── Sprint Planning (time-boxed goals)
└── Task Tracking (progress monitoring)
```

## 🔄 Ongoing Management

After migration:

1. **Daily**: Check task progress in Vikunja
2. **Weekly**: Update task status and priorities  
3. **Sprint Reviews**: Assess completion and plan next sprint
4. **Monthly**: Archive completed projects, plan new ones

## 🆘 Troubleshooting

### Migration Script Fails

```bash
# Check Vikunja is running
curl http://localhost:3456/api/v1/info

# Verify token works
curl -H "Authorization: Bearer $VITE_VIKUNJA_TOKEN" http://localhost:3456/api/v1/user
```

### Token Issues

1. Make sure you're logged into Vikunja
2. Generate a new API token in Settings
3. Copy the exact token (no extra spaces)
4. Set the environment variable correctly

### Vikunja Not Accessible

```bash
# Restart Vikunja
$HOME/.workflow-bolt/vikunja-admin.sh restart

# Check logs
$HOME/.workflow-bolt/vikunja-admin.sh logs
```

## 📁 Source Files Being Migrated

The migration processes content from these files:

- `ACTION_PLAN.md` - 4-phase code review plan
- `docs/05-governance/ROADMAP.md` - Master roadmap
- `docs/03-application/tebra-debug-dashboard-implementation-plan.md` - Component refactor
- `docs/Redis-Implementation-Master-Plan.md` - Architecture migration  
- `docs/DOCUMENTATION_REORG_PLAN.md` - Doc reorganization
- `white_screen_assessment_plan.py` - Debugging plan
- `endpoint_authentication_plan.py` - Security fixes
- And several others...

## 🎉 Success Indicators

You'll know the migration worked when:

- ✅ You can see all projects in Vikunja dashboard
- ✅ Tasks have proper priorities and descriptions
- ✅ Sprint plans are created and organized
- ✅ You can assign team members to tasks
- ✅ Progress tracking is centralized in one place

## 🔮 Next Steps After Migration

1. **Review Projects**: Go through each project in Vikunja
2. **Assign Tasks**: Add team members to specific tasks
3. **Start Sprint 1**: Begin with critical fixes
4. **Update Original Files**: Mark them as "MIGRATED TO VIKUNJA"
5. **Establish Workflow**: Daily/weekly project management routine

---

**🚀 Ready to migrate? Run: `node scripts/migrate-plans.js`**
