import { Unit } from "./unit";

export type Course = {
  id: number;
  level_number: number;
  level_name: string;
  description: string;
  units: Unit[];
};
