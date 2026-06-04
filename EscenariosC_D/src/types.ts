/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number; // Día
  y: number; // Precio en Bs
}

export interface Product {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unit: string;
  points: Point[];
}

export interface StepNewton {
  level: number;
  values: number[]; // Valores en esa columna de diferencias divididas
}

export interface InterpolationValue {
  x: number;
  y: number;
  method: string;
}

export interface MetricSummary {
  productName: string;
  initialPrice: number;
  finalPrice: number;
  absoluteIncrease: number;
  percentageIncrease: number;
}
