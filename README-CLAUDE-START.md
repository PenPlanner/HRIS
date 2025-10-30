# 🤖 CLAUDE - LÄS DETTA FÖRST VID NY SESSION!

## ⚡ Snabbstart - Läs dessa filer direkt:

```bash
# VIKTIGT: Kör detta kommando först för att förstå projektet och agent-systemet:
cat CURRENT_WORK_STATUS.md
```

Detta ger dig:
- Aktuell status på projektet
- Översikt av agent-systemet
- Vad som gjorts senast

## 🎯 Om användaren vill jobba med agenterna:

Läs då även:
```bash
# För att se alla tillgängliga agenter och hur de används:
cat .claude/commands/QUICK-REFERENCE.md

# För praktiska exempel:
cat .claude/commands/AGENT-EXAMPLES.md
```

## 📚 Projekt-översikt

**HRIS för Vestas Vindturbinservice**
- Next.js 16 app med TypeScript
- Flowchart system för service-procedurer
- Tekniker-hantering och kompetensmatris
- PWA med offline support

## 🤖 Agent-system (implementerat 2025-10-31)

**8 specialiserade agenter** för parallell utveckling:

| Agent | Kommando | Fokus |
|-------|----------|-------|
| Flowchart | `/flowchart-agent` | React Flow, steg-hantering |
| Task | `/task-agent` | Task management, tidsspårning |
| Tech | `/tech-agent` | Tekniker-data, kompetens |
| Storage | `/storage-agent` | Supabase, databas |
| UI | `/ui-agent` | UX, design, responsiv |
| Export | `/export-agent` | PDF/Excel rapporter |
| Test | `/test-agent` | Testing, validering |
| Meta | `/meta-agent` | Koordinering av andra agenter |

## ⚠️ Viktiga filer att känna till:

```bash
# Projektstatus och pågående arbete:
CURRENT_WORK_STATUS.md

# Agent-dokumentation:
.claude/commands/flowchart-agent.md
.claude/commands/task-agent.md
.claude/commands/tech-agent.md
.claude/commands/storage-agent.md
.claude/commands/ui-agent.md
.claude/commands/export-agent.md
.claude/commands/test-agent.md
.claude/commands/meta-agent.md

# Hjälpdokument:
.claude/commands/AGENT-EXAMPLES.md    # Praktiska exempel
.claude/commands/QUICK-REFERENCE.md   # Snabbreferens

# Projekt-specs:
PROJECT_SPECS.md                      # Original specifikation
PWA_DEPLOYMENT.md                     # PWA deployment guide
WORK_HISTORY_README.md                 # Work history system
```

## 🚀 Vanliga kommandon användaren kör:

```bash
# Starta development server
npm run dev

# Bygga för produktion (har TypeScript-fel just nu)
npm run build

# Använda agenter
/meta-agent "Implementera [feature]"
/flowchart-agent "Lägg till [funktionalitet]"
/test-agent "Testa [område]"
```

## 💡 Tips för att hjälpa användaren effektivt:

1. **Alltid läs `CURRENT_WORK_STATUS.md` först** - innehåller senaste status
2. **Använd agent-systemet** för utveckling - undviker filkollisioner
3. **Kör agenter parallellt** med `&` när möjligt
4. **Meta-agent** är bäst för komplexa uppgifter

## 🔧 Utvecklingsmiljö:

- **OS:** WSL2 på Windows
- **Path:** `/mnt/d/Dev folder/HRIS/`
- **Node:** v20+
- **Package Manager:** npm
- **Framework:** Next.js 16 med App Router

## 📝 Senaste större ändringar:

- 2025-10-31: Implementerade komplett agent-system
- 2025-10-27: PWA implementation (klar men build failar)
- Work History system för tekniker-aktivitet
- Flowchart system med React Flow

---

**NÄSTA STEG:** Läs `CURRENT_WORK_STATUS.md` för att se exakt var projektet står nu!