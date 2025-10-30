# ⚡ Agent Quick Reference - HRIS

## 🎯 Snabbkommandon

```bash
/flowchart-agent "uppgift"  # Flowchart & React Flow
/task-agent "uppgift"       # Tasks & tidsspårning
/tech-agent "uppgift"       # Tekniker & kompetens
/storage-agent "uppgift"    # Database & sync
/ui-agent "uppgift"         # UI/UX & design
/export-agent "uppgift"     # Rapporter & export
/test-agent "uppgift"       # Testing & validering
/meta-agent "uppgift"       # Koordinering (komplex)
```

## 🔥 Mest använda exempel

### Lägg till feature
```bash
/flowchart-agent "Implementera [feature]" &
/ui-agent "Skapa UI för [feature]" &
/test-agent "Skriv tester för [feature]"
```

### Fixa bug
```bash
/test-agent "Reproducera [bug]" &&
/meta-agent "Fix [bug] i alla lager"
```

### Optimera performance
```bash
/test-agent "Profile [område]" &&
/meta-agent "Optimera [område] baserat på profiling"
```

### Migrera data
```bash
/export-agent "Backup data" &&
/storage-agent "Migrera [data] till Supabase" &&
/test-agent "Verifiera migration"
```

## 🎨 Agent-specialiseringar

| Agent | Bäst för | Äger filer |
|-------|----------|------------|
| **flowchart** | React Flow, nodes, edges, grid | `/app/flowcharts/`, `/components/flowchart/` |
| **task** | Tasks, notes, time tracking | `step-detail-drawer.tsx`, task-komponenter |
| **tech** | Tekniker, kompetens, teams | `/app/technicians/`, `/components/technician/` |
| **storage** | Supabase, sync, offline | `/lib/supabase/`, storage utils |
| **ui** | Design, animations, responsive | `/components/ui/`, `/components/layout/` |
| **export** | PDF, Excel, rapporter | Export utils, `/app/api/export/` |
| **test** | E2E, unit tests, performance | `/__tests__/`, `/e2e/` |
| **meta** | Koordinering, komplexitet | Orchestrerar andra agenter |

## ⚡ Parallell körning

```bash
# Kör samtidigt med &
/agent1 "task" & /agent2 "task" & /agent3 "task"

# Kör i ordning med &&
/agent1 "task" && /agent2 "task" && /agent3 "task"

# Kombinera
(/agent1 "task" & /agent2 "task") && /agent3 "verify"
```

## 🚀 Snabba workflows

### Ny arbetsdag
```bash
/meta-agent "Vad behöver göras idag?"
```

### Före lunch
```bash
/test-agent "Kör alla tester och rapportera status"
```

### Innan commit
```bash
/test-agent "Verifiera alla ändringar"
```

### End of day
```bash
/export-agent "Daily report" && /storage-agent "Backup"
```

## ❓ Osäker?

```bash
# Låt meta-agent hjälpa
/meta-agent "Hjälp mig med [uppgift]"

# Eller fråga om agent-val
/meta-agent "Vilken agent för [uppgift]?"
```

## 🔴 Viktigt att komma ihåg

- ✅ Använd `&` för parallell körning
- ✅ Var specifik i instruktioner
- ✅ Använd rätt agent för jobbet
- ✅ Meta-agent för komplexitet
- ❌ Undvik filkollisioner
- ❌ Glöm inte tester

## 📁 Alla agent-filer

```
.claude/commands/
├── flowchart-agent.md    # Full spec
├── task-agent.md          # Full spec
├── tech-agent.md          # Full spec
├── storage-agent.md       # Full spec
├── ui-agent.md            # Full spec
├── export-agent.md        # Full spec
├── test-agent.md          # Full spec
├── meta-agent.md          # Full spec
├── AGENT-EXAMPLES.md      # Praktiska exempel
└── QUICK-REFERENCE.md     # Detta dokument
```

---

*Print denna för snabb referens vid utveckling!*