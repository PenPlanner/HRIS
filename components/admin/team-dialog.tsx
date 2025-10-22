"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Team } from "@/app/admin/teams/page";
import { useState } from "react";

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  organization: z.string().min(1, "Organization is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  supervisor_initials: z.string().min(1, "Supervisor initials required"),
  dispatcher_initials: z.string().min(1, "Dispatcher initials required"),
});

type TeamFormData = z.infer<typeof teamSchema>;

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
];

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onSave: (team: any) => void;
}

export function TeamDialog({ open, onOpenChange, team, onSave }: TeamDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: team || {
      name: "",
      organization: "Travel",
      color: "#06b6d4",
      supervisor_initials: "",
      dispatcher_initials: "",
    },
  });

  const selectedColor = watch("color");

  const onSubmit = (data: TeamFormData) => {
    if (team) {
      onSave({ ...team, ...data });
    } else {
      onSave(data);
    }
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "Create Team"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization/Region</Label>
            <select
              id="organization"
              {...register("organization")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="South">South</option>
              <option value="North">North</option>
              <option value="Travel">Travel</option>
              <option value="Special">Special</option>
            </select>
            {errors.organization && (
              <p className="text-sm text-destructive">{errors.organization.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor_initials">Supervisor Initials</Label>
            <Input
              id="supervisor_initials"
              {...register("supervisor_initials")}
              placeholder="MRADR"
              maxLength={5}
              className="uppercase"
            />
            {errors.supervisor_initials && (
              <p className="text-sm text-destructive">
                {errors.supervisor_initials.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispatcher_initials">Dispatcher Initials</Label>
            <Input
              id="dispatcher_initials"
              {...register("dispatcher_initials")}
              placeholder="TEORY"
              maxLength={5}
              className="uppercase"
            />
            {errors.dispatcher_initials && (
              <p className="text-sm text-destructive">
                {errors.dispatcher_initials.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Team Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                {...register("color")}
                type="text"
                placeholder="#06b6d4"
                maxLength={7}
                className="w-32"
              />
              <div
                className="h-10 w-16 rounded border"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
            <div className="grid grid-cols-9 gap-2 pt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className="h-8 w-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "#000" : "transparent",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {team ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
