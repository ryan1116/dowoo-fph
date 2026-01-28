"use client";

import { useState, useTransition } from "react";
import { Pencil, Save, X, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CostMasterItem,
  updateCostMasterItem,
  createCostMasterItem,
  deleteCostMasterItem,
  getCostMasterItems,
} from "@/app/settings/_actions/cost-master";

interface CostMasterTableProps {
  initialItems: CostMasterItem[];
}

const CATEGORIES = ["Variable", "Fixed", "Policy", "Risk"];

function categoryBadge(category: string) {
  switch (category) {
    case "Variable":
      return <Badge variant="default">{category}</Badge>;
    case "Fixed":
      return <Badge variant="secondary">{category}</Badge>;
    case "Policy":
      return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">{category}</Badge>;
    case "Risk":
      return <Badge variant="destructive">{category}</Badge>;
    default:
      return <Badge variant="outline">{category}</Badge>;
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === "%" || unit.includes("%")) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function CostMasterTable({ initialItems }: CostMasterTableProps) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState("Variable");
  const [newItem, setNewItem] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEdit(item: CostMasterItem) {
    setEditingId(item.id);
    setEditValue(String(item.value));
    setEditUnit(item.unit);
    setEditDesc(item.description);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSave(id: number) {
    const val = parseFloat(editValue);
    if (isNaN(val)) return;

    startTransition(async () => {
      const res = await updateCostMasterItem(id, {
        value: val,
        unit: editUnit,
        description: editDesc,
      });
      if (res.success) {
        const updated = await getCostMasterItems();
        setItems(updated);
        setEditingId(null);
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this cost variable?")) return;
    startTransition(async () => {
      const res = await deleteCostMasterItem(id);
      if (res.success) {
        const updated = await getCostMasterItems();
        setItems(updated);
      }
    });
  }

  function handleAdd() {
    const val = parseFloat(newValue);
    if (!newItem.trim() || isNaN(val) || !newUnit.trim()) return;

    startTransition(async () => {
      const res = await createCostMasterItem({
        category: newCategory,
        item: newItem.trim(),
        value: val,
        unit: newUnit.trim(),
        description: newDesc.trim() || newItem.trim(),
      });
      if (res.success) {
        const updated = await getCostMasterItems();
        setItems(updated);
        setShowAdd(false);
        setNewItem("");
        setNewValue("");
        setNewUnit("");
        setNewDesc("");
      }
    });
  }

  // Group by category
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} variables configured. Changes take effect immediately in the pricing engine.
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Variable
        </Button>
      </div>

      {/* Add new row */}
      {showAdd && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <p className="text-sm font-medium">New Cost Variable</p>
          <div className="grid gap-3 md:grid-cols-5">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="item_key" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <Input placeholder="Value" type="number" step="any" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
            <Input placeholder="Unit (KRW/L, %)" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
            <Input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Category</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((group) =>
              group.items.map((item, idx) => (
                <TableRow key={item.id}>
                  {idx === 0 ? (
                    <TableCell rowSpan={group.items.length} className="align-top">
                      {categoryBadge(group.category)}
                    </TableCell>
                  ) : null}

                  <TableCell className="font-mono text-sm">{item.item}</TableCell>

                  {editingId === item.id ? (
                    <>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="any"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-28 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(item.id)} disabled={isPending}>
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right font-mono">
                        {formatValue(item.value, item.unit)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.unit}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
