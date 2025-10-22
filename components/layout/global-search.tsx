"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User, Users, Car, GraduationCap, Settings } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

type Technician = {
  id: string;
  initials: string;
  first_name: string;
  last_name: string;
  team_name: string;
  team_color: string;
};

// Mock data - will be replaced with real data from localStorage/Supabase
const mockTechnicians: Technician[] = [
  {
    id: "1",
    initials: "MRADR",
    first_name: "Markus",
    last_name: "Anderson",
    team_name: "Travel S",
    team_color: "#06b6d4",
  },
  {
    id: "2",
    initials: "CLEGR",
    first_name: "Carl Emil",
    last_name: "Gryme",
    team_name: "Travel S",
    team_color: "#06b6d4",
  },
  {
    id: "3",
    initials: "ANLRN",
    first_name: "Anders",
    last_name: "Larsson",
    team_name: "Travel U",
    team_color: "#0ea5e9",
  },
  {
    id: "4",
    initials: "JOHDA",
    first_name: "Johan",
    last_name: "Davidsson",
    team_name: "South 1",
    team_color: "#ef4444",
  },
  {
    id: "5",
    initials: "MIKAN",
    first_name: "Mikael",
    last_name: "Andersson",
    team_name: "North 1",
    team_color: "#a855f7",
  },
];

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const filteredTechnicians = React.useMemo(() => {
    if (!search) return mockTechnicians.slice(0, 5); // Show first 5 when no search

    const searchLower = search.toLowerCase();
    return mockTechnicians.filter((tech) => {
      return (
        tech.initials.toLowerCase().includes(searchLower) ||
        tech.first_name.toLowerCase().includes(searchLower) ||
        tech.last_name.toLowerCase().includes(searchLower) ||
        `${tech.first_name} ${tech.last_name}`.toLowerCase().includes(searchLower) ||
        tech.team_name.toLowerCase().includes(searchLower)
      );
    });
  }, [search]);

  const handleSelect = (technicianId: string) => {
    setOpen(false)
    setSearch("")
    router.push(`/technicians/${technicianId}`)
  }

  const handleNavigation = (path: string) => {
    setOpen(false)
    setSearch("")
    router.push(path)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className="hidden md:inline-flex">Search technicians...</span>
        <span className="md:hidden">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search technicians by initials, name, or team..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {filteredTechnicians.length > 0 && (
            <CommandGroup heading="Technicians">
              {filteredTechnicians.map((tech) => (
                <CommandItem
                  key={tech.id}
                  value={`${tech.initials} ${tech.first_name} ${tech.last_name} ${tech.team_name}`}
                  onSelect={() => handleSelect(tech.id)}
                  className="flex items-center gap-3 py-3"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: tech.team_color + "20",
                      color: tech.team_color,
                    }}
                  >
                    {tech.initials.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {tech.first_name} {tech.last_name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {tech.initials}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{tech.team_name}</div>
                  </div>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Quick Navigation">
            <CommandItem onSelect={() => handleNavigation("/")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/technicians")}>
              <Users className="mr-2 h-4 w-4" />
              <span>All Technicians</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/vehicles")}>
              <Car className="mr-2 h-4 w-4" />
              <span>Service Vehicles</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/training")}>
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>Training Overview</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/admin/teams")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin - Teams</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/admin/courses")}>
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>Admin - Courses</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
