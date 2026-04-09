"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Indicator } from "@/lib/types";

interface IndicatorsTableProps {
  indicators: Indicator[];
  loading: boolean;
  onEdit: (indicator: Indicator) => void;
  onRefresh: () => void;
}

export function IndicatorsTable({
  indicators,
  loading,
  onEdit,
  onRefresh,
}: IndicatorsTableProps) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const supabase = createClient();

  async function handleToggleED(indicator: Indicator) {
    setToggling(indicator.id);
    const { error } = await supabase
      .from("indicators")
      .update({ show_on_executive: !indicator.show_on_executive })
      .eq("id", indicator.id);
    setToggling(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    onRefresh();
  }

  async function handleRemove(indicator: Indicator) {
    if (indicator.is_core) return;
    setRemoving(indicator.id);
    const { error } = await supabase
      .from("indicators")
      .update({ is_active: false })
      .eq("id", indicator.id);
    setRemoving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${indicator.name}" removed`);
    onRefresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading indicators...
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No indicators configured for this program.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead>Indicator Name</TableHead>
          <TableHead>Data Type</TableHead>
          <TableHead>Options</TableHead>
          <TableHead>Executive Dashboard</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {indicators.map((ind) => (
          <TableRow key={ind.id}>
            <TableCell>
              <GripVertical className="size-4 text-muted-foreground" />
            </TableCell>
            <TableCell className="font-medium">{ind.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {ind.data_type === "numeric" ? "Numeric" : "Categorical"}
              </Badge>
            </TableCell>
            <TableCell>
              {ind.data_type === "categorical" && ind.options?.length > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {ind.options.slice(0, 3).join(", ")}
                  {ind.options.length > 3 && ` +${ind.options.length - 3} more`}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell>
              <Switch
                checked={ind.show_on_executive}
                onCheckedChange={() => handleToggleED(ind)}
                disabled={toggling === ind.id}
                size="sm"
              />
            </TableCell>
            <TableCell>
              <Badge variant={ind.is_core ? "default" : "outline"}>
                {ind.is_core ? "Core" : "Custom"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(ind)}
                  title="Edit indicator"
                >
                  <Pencil className="size-3.5" />
                </Button>
                {!ind.is_core && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(ind)}
                    disabled={removing === ind.id}
                    title="Remove indicator"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
