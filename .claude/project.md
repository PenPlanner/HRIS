# HRIS Project - Claude Configuration

## Auto-read on startup

När du startar en ny Claude-session i detta projekt, läs följande filer i ordning:

1. `/README-CLAUDE-START.md` - Översikt och instruktioner
2. `/CURRENT_WORK_STATUS.md` - Aktuell projektstatus
3. `.claude/commands/QUICK-REFERENCE.md` - Agent quick reference

## Project Context

**Project:** HRIS för Vestas Vindturbinservice
**Tech Stack:** Next.js 16, TypeScript, React Flow, Tailwind CSS
**Status:** Agent-system implementerat, PWA klar men TypeScript build-fel kvarstår

## Agent System

8 specialiserade agenter för parallell utveckling utan filkollisioner:
- `/flowchart-agent` - Flowchart & React Flow
- `/task-agent` - Task management
- `/tech-agent` - Tekniker & kompetens
- `/storage-agent` - Database & sync
- `/ui-agent` - UI/UX design
- `/export-agent` - Rapporter & export
- `/test-agent` - Testing & validering
- `/meta-agent` - Koordinering

## Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production (currently failing)
npm start                # Start production server

# Agents
/meta-agent "task"       # Complex coordination
/[agent-name] "task"     # Specific agent
agent1 & agent2          # Parallel execution
```

## Important Files

- `CURRENT_WORK_STATUS.md` - Always check this first!
- `.claude/commands/*.md` - All agent documentation
- `PROJECT_SPECS.md` - Original specifications
- `PWA_DEPLOYMENT.md` - PWA deployment guide

## Current Issues

- TypeScript build errors preventing production build
- Need to fix before PWA can be tested
- See `CURRENT_WORK_STATUS.md` for details

## User Preferences

- Speaks Swedish primarily
- Wants efficient parallel development
- Prefers agents to work without file collisions
- Values clear documentation

---

*This file helps Claude understand the project context immediately upon starting a new session.*