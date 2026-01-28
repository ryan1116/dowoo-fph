"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CostMasterItem {
  id: number;
  category: string;
  item: string;
  value: number;
  unit: string;
  description: string;
}

export async function getCostMasterItems(): Promise<CostMasterItem[]> {
  const items = await prisma.costMaster.findMany({
    orderBy: [{ category: "asc" }, { item: "asc" }],
  });
  return items.map((i: { id: number; category: string; item: string; value: number; unit: string; description: string }) => ({
    id: i.id,
    category: i.category,
    item: i.item,
    value: i.value,
    unit: i.unit,
    description: i.description,
  }));
}

export async function updateCostMasterItem(
  id: number,
  data: { value: number; unit?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.costMaster.update({
      where: { id },
      data: {
        value: data.value,
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCostMasterItem(data: {
  category: string;
  item: string;
  value: number;
  unit: string;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.costMaster.create({ data });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCostMasterItem(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.costMaster.delete({ where: { id } });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
