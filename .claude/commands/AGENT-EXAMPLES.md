# 🎯 Praktiska Agent-exempel för HRIS Development

## Vanliga utvecklingsscenarier

### 1. Lägga till ny feature i flowchart

**Scenario:** Du vill lägga till möjlighet att kopiera steg mellan olika flowcharts

```bash
# Steg 1: Implementera backend-logik
/flowchart-agent "Implementera copy/paste funktionalitet för steg mellan flowcharts"

# Steg 2: Lägg till UI parallellt
/ui-agent "Skapa copy/paste knappar med keyboard shortcuts (Ctrl+C/Ctrl+V)"

# Steg 3: Testa
/test-agent "Skriv E2E test för cross-flowchart copy/paste"
```

---

### 2. Förbättra performance

**Scenario:** Flowchart-editorn är seg med många steg

```bash
# Analysera först
/test-agent "Profile flowchart rendering performance med 100+ steg"

# Implementera förbättringar parallellt
/flowchart-agent "Implementera virtualization för React Flow nodes" &
/ui-agent "Lägg till loading skeleton för steg som renderas" &
/storage-agent "Implementera query caching för flowchart data"

# Verifiera förbättring
/test-agent "Mät performance improvement efter optimering"
```

---

### 3. Fixa en bug

**Scenario:** Bug #123 - Tasks försvinner när man byter service type

```bash
# Steg 1: Reproducera
/test-agent "Reproducera bug #123 - tasks försvinner vid service type byte"

# Steg 2: Fixa parallellt i olika lager
/task-agent "Fix task filtering logic för service types" &
/flowchart-agent "Fix state management för service type changes" &
/ui-agent "Fix visual update när service type ändras"

# Steg 3: Verifiera
/test-agent "Verifiera att bug #123 är löst och kör regression tests"
```

---

### 4. Migrera till Supabase

**Scenario:** Migrera all data från localStorage till Supabase

```bash
# Använd meta-agent för komplex koordinering
/meta-agent "Migrera hela applikationen från localStorage till Supabase med zero downtime"

# Eller gör det manuellt:
# 1. Backup först
/export-agent "Skapa komplett JSON backup av all localStorage data"

# 2. Setup database
/storage-agent "Skapa Supabase projekt och database schema"

# 3. Migrera data parallellt
/storage-agent "Migrera flowchart data" &
/tech-agent "Migrera technician data" &
/task-agent "Migrera task och bug report data"

# 4. Implementera real-time
/storage-agent "Implementera real-time subscriptions för collaborative editing"

# 5. Testa allt
/test-agent "Kör full E2E test suite för att verifiera migration"
```

---

### 5. Implementera mobil-version

**Scenario:** Gör appen fullt mobil-optimerad

```bash
# Koordinera med meta-agent
/meta-agent "Optimera hela appen för mobil och tablets med touch support"

# Eller specifika uppgifter:
/ui-agent "Implementera responsive layout för mobil < 768px" &
/ui-agent "Lägg till touch gestures för flowchart (pinch zoom, swipe)" &
/flowchart-agent "Implementera mobil-optimerad flowchart view" &
/test-agent "Testa på olika device sizes (iPhone, iPad, Android)"
```

---

### 6. Skapa rapporter

**Scenario:** Generera månadsrapport för alla completed flowcharts

```bash
# Enkel rapport
/export-agent "Generera PDF månadsrapport för oktober med alla completed flowcharts"

# Komplex dashboard
/export-agent "Skapa Excel dashboard med KPIs och charts" &
/ui-agent "Skapa interactive dashboard view i appen" &
/test-agent "Verifiera att all data i rapporten är korrekt"
```

---

### 7. Implementera ny kompetensberäkning

**Scenario:** Uppdatera kompetensmatris med nya kriterier

```bash
# Parallell implementation
/tech-agent "Uppdatera kompetensberäkning med nya Vestas-kriterier" &
/ui-agent "Uppdatera kompetensmatris UI med nya fält" &
/export-agent "Uppdatera training reports med nya kompetenskrav" &
/test-agent "Skriv unit tests för nya beräkningar"
```

---

### 8. Lägg till offline support

**Scenario:** Full offline-funktionalitet

```bash
# Meta-agent hanterar komplexiteten
/meta-agent "Implementera complete offline mode med sync när online"

# Eller detaljerat:
/storage-agent "Implementera IndexedDB för offline storage" &
/ui-agent "Lägg till offline status indicators" &
/flowchart-agent "Hantera offline editing med conflict resolution" &
/test-agent "Testa offline/online transitions"
```

---

### 9. Säkerhet och authentication

**Scenario:** Lägg till user authentication

```bash
# Koordinerat arbete
/storage-agent "Implementera Supabase Auth med RLS" &&
/ui-agent "Skapa login/register UI" &&
/tech-agent "Koppla technicians till user accounts" &&
/test-agent "Testa auth flows och permissions"
```

---

### 10. Refaktorering

**Scenario:** Refaktorera gamla komponenter

```bash
# Använd meta-agent
/meta-agent "Refaktorera alla Class components till functional med hooks"

# Eller specifikt:
/flowchart-agent "Refaktorera flowchart-editor till hooks" &
/ui-agent "Modernisera styling till Tailwind v4" &
/test-agent "Uppdatera alla tester för nya komponenter"
```

---

## Tips för effektiv agent-användning

### 1. Kombinera agenter för kraft

```bash
# Bra - parallell execution
/flowchart-agent "Backend" & /ui-agent "Frontend" & /test-agent "Tests"

# Dåligt - sekventiell när det inte behövs
/flowchart-agent "Backend" && /ui-agent "Frontend" && /test-agent "Tests"
```

### 2. Använd meta-agent för komplexitet

```bash
# Istället för att koordinera själv:
/meta-agent "Implementera [komplex feature] med tests och dokumentation"
```

### 3. Var specifik

```bash
# Bra
/ui-agent "Lägg till 200ms slide-in animation för step-detail-drawer från höger"

# Dåligt
/ui-agent "Förbättra UI"
```

### 4. Testa alltid

```bash
# Efter varje implementation
/test-agent "Verifiera senaste implementation och kör regression tests"
```

### 5. Dokumentera

```bash
# Efter större features
/export-agent "Generera teknisk dokumentation för [ny feature]"
```

---

## Troubleshooting

### "Vilken agent ska jag använda?"

```bash
# Låt meta-agent bestämma
/meta-agent "Hjälp mig välja rätt agent för [din uppgift]"
```

### "Agenter kolliderar"

```bash
# Använd meta-agent för koordinering
/meta-agent "Koordinera [uppgift] utan filkollisioner"
```

### "För komplex uppgift"

```bash
# Meta-agent bryter ner det
/meta-agent "Bryt ner [komplex uppgift] i mindre delar"
```

---

## Daglig workflow

### Morgon - Planering
```bash
/meta-agent "Analysera vad som behöver göras idag baserat på current state"
```

### Implementation
```bash
# Jobba med flera agenter parallellt
/flowchart-agent "Feature A" &
/ui-agent "UI för Feature A" &
/test-agent "Tests för Feature A"
```

### Lunch - Status check
```bash
/test-agent "Kör alla tester och rapportera status"
```

### Eftermiddag - Polish
```bash
/ui-agent "Polish UI baserat på feedback" &
/export-agent "Uppdatera dokumentation"
```

### Kväll - Wrap up
```bash
/export-agent "Generera daily progress report" &&
/test-agent "Kör full test suite" &&
/storage-agent "Backup all data"
```

---

*Senast uppdaterad: 2025-10-31*