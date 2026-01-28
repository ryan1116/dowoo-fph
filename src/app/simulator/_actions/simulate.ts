"use server";

import { calculateFPHPrice } from "@/lib/pricing-engine";

/**
 * Next.js Server Action - Simulation Wrapper
 * 타입을 직접 참조하지 않고 내부에서 처리하여 Turbopack의 ReferenceError를 방지합니다.
 */
export async function runSimulation(input: any): Promise<any> {
  try {
    const result = await calculateFPHPrice(input);
    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    console.error("Simulation Engine Error:", error);
    throw new Error(error.message || "시뮬레이션 계산 중 오류가 발생했습니다.");
  }
}

/**
 * Batch simulation — process multiple route inputs at once.
 */
export async function runBatchSimulation(
  inputs: any[]
): Promise<{ results: any[]; errors: { index: number; route: string; message: string }[] }> {
  const results: any[] = [];
  const errors: { index: number; route: string; message: string }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    try {
      const result = await calculateFPHPrice(input);
      results.push(JSON.parse(JSON.stringify(result)));
    } catch (error: any) {
      errors.push({
        index: i,
        route: `${input.origin ?? "?"} → ${input.destination ?? "?"}`,
        message: error.message || "Calculation failed",
      });
    }
  }

  return { results, errors };
}