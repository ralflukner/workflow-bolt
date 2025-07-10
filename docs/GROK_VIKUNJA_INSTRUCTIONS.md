# Vikunja Task Management Instructions for Grok

**Version**: 1.0  
**Created**: 2025-07-10  
**For**: Grok AI Assistant  

## Overview

This document provides step-by-step instructions for Grok to interact with the Vikunja task management system used in this project. Vikunja is a self-hosted task management platform that tracks development work, issues, and project planning.

## Vikunja System Configuration

### **API Details**

- **Base URL**: `http://localhost:3456/api/v1`
- **Authentication Token**: `tk_556fc1cf49295b3c8637506e57877c21f863ec16`
- **Project ID**: `3` (cursor-gpt-4.1-max Tasks)
- **Web Interface**: `http://localhost:3456`

### **Available Scripts**

- **Main script**: `/scripts/vikunja-authentication-tasks.cjs`
- **Alternative scripts**: Check `/scripts/` directory for other Vikunja utilities

## Basic Vikunja Operations for Grok

### 1. Creating Tasks

**Command Pattern**:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task Title Here",
    "description": "Detailed task description with markdown support",
    "priority": 5
  }' \
  "http://localhost:3456/api/v1/projects/3/tasks"
```

**Priority Levels**:

- `5` = Highest (Critical/Urgent)
- `4` = High (Important)
- `3` = Medium (Normal)
- `2` = Low (Nice to have)
- `1` = Lowest (Future consideration)

**Example Task Creation**:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix authentication bug reported by Grok",
    "description": "## Issue\nAuthentication flow fails under specific conditions\n\n## Steps to Reproduce\n1. User logs in\n2. Token expires\n3. Error occurs\n\n## Expected Resolution\nImplement proper token refresh mechanism",
    "priority": 4
  }' \
  "http://localhost:3456/api/v1/projects/3/tasks"
```

### 2. Listing Tasks

**Get All Tasks**:

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects/3/tasks"
```

**Get Recent Tasks (with formatting)**:

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects/3/tasks" | \
  jq '.[] | {id: .id, title: .title, priority: .priority, done: .done, created: .created}' | \
  head -20
```

### 3. Adding Comments to Tasks

**Add Comment Pattern**:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Your comment text here with **markdown** support"
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}/comments"
```

**Example Comment**:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "✅ **Work completed by Grok**\n\n## Summary\n- Fixed authentication issue\n- Added proper error handling\n- Updated documentation\n\n## Files Modified\n- `src/auth/authService.ts`\n- `src/utils/tokenManager.ts`\n\n## Testing\n- All authentication tests passing\n- Manual testing completed\n\n**Status**: Ready for review"
  }' \
  "http://localhost:3456/api/v1/tasks/3039/comments"
```

### 4. Updating Tasks

**Mark Task as Complete**:

```bash
curl -X POST \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "done": true
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}"
```

**Update Task Priority**:

```bash
curl -X POST \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 5
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}"
```

**Update Task Description**:

```bash
curl -X POST \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description with new information"
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}"
```

## Grok Workflow Patterns

### Pattern 1: Starting New Work

1. **Check existing tasks** to avoid duplicates:

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects/3/tasks" | \
  jq '.[] | select(.done == false) | {id: .id, title: .title}'
```

2. **Create new task** if none exists:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[GROK] Your task title here",
    "description": "## Objective\nWhat you are trying to accomplish\n\n## Approach\nHow you plan to solve it\n\n## Files Involved\n- List of files you expect to modify\n\n## Success Criteria\n- How to know when task is complete",
    "priority": 3
  }' \
  "http://localhost:3456/api/v1/projects/3/tasks"
```

### Pattern 2: Updating Progress

**Add progress comment**:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "🔄 **Progress Update**\n\n## Current Status\n- Analyzed the issue\n- Identified root cause in `filename.ts:line`\n- Working on solution\n\n## Next Steps\n- Implement fix\n- Add test coverage\n- Update documentation\n\n**ETA**: 30 minutes"
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}/comments"
```

### Pattern 3: Completing Work

1. **Add completion comment**:

```bash
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "✅ **COMPLETED by Grok**\n\n## Work Summary\n- Brief description of what was accomplished\n\n## Files Modified\n- `file1.ts` - Description of changes\n- `file2.test.ts` - Added test coverage\n\n## Verification\n- Tests passing: ✅\n- Manual testing: ✅\n- Documentation updated: ✅\n\n## Impact\nPositive outcome achieved"
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}/comments"
```

2. **Mark task complete**:

```bash
curl -X POST \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "done": true
  }' \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}"
```

## Task Categories and Labeling

### **Task Title Prefixes**

Use these prefixes to categorize your work:

- `[GROK-BUG]` - Bug fixes
- `[GROK-FEATURE]` - New features
- `[GROK-REFACTOR]` - Code refactoring
- `[GROK-TEST]` - Testing improvements
- `[GROK-DOCS]` - Documentation
- `[GROK-SECURITY]` - Security improvements
- `[GROK-PERFORMANCE]` - Performance optimizations
- `[GROK-ANALYSIS]` - Code analysis or investigation

### **Example Task Titles**

```
✅ Good Examples:
- "[GROK-BUG] Fix authentication token refresh issue"
- "[GROK-FEATURE] Add user preference management"
- "[GROK-TEST] Improve test coverage for payment processing"
- "[GROK-SECURITY] Implement rate limiting for API endpoints"

❌ Avoid:
- "Fix bug" (too vague)
- "Update code" (no specific purpose)
- "Work on authentication" (no clear outcome)
```

## Working with Existing Tasks

### **Finding Tasks by Keywords**

```bash
# Search for authentication-related tasks
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects/3/tasks" | \
  jq '.[] | select(.title | contains("auth")) | {id: .id, title: .title, done: .done}'

# Search for incomplete tasks
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects/3/tasks" | \
  jq '.[] | select(.done == false) | {id: .id, title: .title, priority: .priority}'
```

### **Getting Task Details**

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}"
```

### **Getting Task Comments**

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/tasks/{TASK_ID}/comments"
```

## Error Handling

### **Common Errors and Solutions**

1. **401 Unauthorized**
   - Check that the Bearer token is correct
   - Ensure the token is included in the Authorization header

2. **404 Not Found**
   - Verify the task ID exists
   - Check that the project ID (3) is correct

3. **400 Bad Request**
   - Verify JSON formatting in request body
   - Check that required fields are included

### **Testing API Connection**

```bash
# Simple connectivity test
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects" | jq '.'
```

## Integration with Development Workflow

### **When to Create Tasks**

- Starting work on a new feature or bug fix
- When user reports an issue that needs tracking
- For complex work that spans multiple steps
- When collaborating or handoff is needed

### **When to Update Tasks**

- Before starting work (add progress comment)
- At significant milestones (25%, 50%, 75% complete)
- When encountering blockers or issues
- Upon completion (final summary comment)

### **Best Practices**

1. **Be specific** in task titles and descriptions
2. **Include context** - what, why, and how
3. **Update regularly** - keep stakeholders informed
4. **Link to code** - mention file names and line numbers when relevant
5. **Document decisions** - explain your approach and reasoning
6. **Test thoroughly** - include verification steps
7. **Close promptly** - mark tasks complete when done

## Quick Reference Commands

### **Create Task**

```bash
curl -X PUT -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" -H "Content-Type: application/json" -d '{"title":"[GROK] Task Title","description":"Task description","priority":3}' "http://localhost:3456/api/v1/projects/3/tasks"
```

### **Add Comment**

```bash
curl -X PUT -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" -H "Content-Type: application/json" -d '{"comment":"Your comment here"}' "http://localhost:3456/api/v1/tasks/{TASK_ID}/comments"
```

### **Complete Task**

```bash
curl -X POST -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" -H "Content-Type: application/json" -d '{"done":true}' "http://localhost:3456/api/v1/tasks/{TASK_ID}"
```

### **List Open Tasks**

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" "http://localhost:3456/api/v1/projects/3/tasks" | jq '.[] | select(.done == false) | {id: .id, title: .title, priority: .priority}'
```

## Example Complete Workflow

Here's a complete example of how Grok should interact with Vikunja:

```bash
# 1. Check for existing related tasks
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  "http://localhost:3456/api/v1/projects/3/tasks" | \
  jq '.[] | select(.title | contains("authentication")) | {id: .id, title: .title, done: .done}'

# 2. Create new task (if needed)
TASK_RESPONSE=$(curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[GROK-BUG] Fix JWT token validation edge case",
    "description": "## Issue\nJWT tokens with special characters in payload fail validation\n\n## Steps to Reproduce\n1. Generate token with unicode characters\n2. Attempt validation\n3. Validation fails incorrectly\n\n## Expected Fix\nUpdate validation regex to handle unicode properly",
    "priority": 4
  }' \
  "http://localhost:3456/api/v1/projects/3/tasks")

# 3. Extract task ID from response
TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')

# 4. Add progress comment
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "🔄 **Starting work on JWT validation fix**\n\n## Analysis\n- Located issue in `src/auth/tokenValidator.ts:42`\n- Regex pattern too restrictive\n- Need to update to support unicode\n\n## Plan\n1. Update regex pattern\n2. Add test cases for unicode characters\n3. Verify backward compatibility"
  }' \
  "http://localhost:3456/api/v1/tasks/$TASK_ID/comments"

# 5. Work on the actual code changes (not shown)
# ... implement fix ...

# 6. Add completion comment
curl -X PUT \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "✅ **COMPLETED by Grok**\n\n## Work Summary\n- Fixed JWT validation regex to support unicode characters\n- Added comprehensive test coverage\n- Verified backward compatibility\n\n## Files Modified\n- `src/auth/tokenValidator.ts` - Updated regex pattern\n- `src/auth/__tests__/tokenValidator.test.ts` - Added unicode test cases\n\n## Testing\n- All existing tests still pass: ✅\n- New unicode tests pass: ✅\n- Manual testing with various character sets: ✅\n\n## Impact\nJWT validation now properly handles international characters, improving user experience for global users."
  }' \
  "http://localhost:3456/api/v1/tasks/$TASK_ID/comments"

# 7. Mark task complete
curl -X POST \
  -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{"done": true}' \
  "http://localhost:3456/api/v1/tasks/$TASK_ID"
```

## Additional Resources

- **Vikunja API Documentation**: Available at `http://localhost:3456/api/v1/docs` (if enabled)
- **Web Interface**: `http://localhost:3456` for visual task management
- **Project Scripts**: Check `/scripts/` directory for additional Vikunja utilities
- **Existing Tasks**: Review completed tasks for examples of good documentation

## Support

If you encounter issues with the Vikunja API:

1. Check that the Vikunja service is running on localhost:3456
2. Verify the authentication token is still valid
3. Ensure the project ID (3) exists and is accessible
4. Check the API response for specific error messages

Remember: Good task management helps the entire team understand what work has been done, what's in progress, and what needs attention. Your detailed documentation in Vikunja creates valuable project history and knowledge sharing.
