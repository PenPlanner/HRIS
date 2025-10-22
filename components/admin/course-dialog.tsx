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
import { type Course } from "@/app/admin/courses/page";

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.enum(['internal', 'external']),
  validity_period_months: z.number().nullable().optional(),
  prerequisites: z.string().optional(),
  description: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

const CATEGORIES = [
  "Safety & GWO",
  "Electrical",
  "Turbine-Specific",
  "Lifts & Equipment",
  "Specialized",
  "External"
];

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSave: (course: any) => void;
}

export function CourseDialog({ open, onOpenChange, course, onSave }: CourseDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      name: "",
      code: "",
      category: "Safety & GWO",
      type: "internal",
      validity_period_months: null,
      prerequisites: "",
      description: "",
    },
  });

  const courseType = watch("type");

  const onSubmit = (data: CourseFormData) => {
    if (course) {
      onSave({ ...course, ...data });
    } else {
      onSave(data);
    }
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "Create Course"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" {...register("code")} placeholder="e.g., GWO-BST" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                {...register("type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="internal">Vestas Internal</option>
                <option value="external">External</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity_period_months">Validity Period (months)</Label>
            <Input
              id="validity_period_months"
              type="number"
              {...register("validity_period_months", {
                setValueAs: (v) => v === "" ? null : parseInt(v, 10)
              })}
              placeholder="e.g., 24 for 2 years, leave empty if no expiry"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if course has no expiration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prerequisites">Prerequisites</Label>
            <Input
              id="prerequisites"
              {...register("prerequisites")}
              placeholder="e.g., Minimum 100 points in Electrical matrix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Course description..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {course ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
