import { useState } from "react";

// initialIds は、最初から選択済みにする単元(省略時は何も選択しない)
export const useUnitSelection = (initialIds: number[] = []) => {
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>(initialIds);
  const handleToggleUnit = (unitId: number) => {
    setSelectedUnitIds((prev) =>
      prev?.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    );
  };

  return { selectedUnitIds, handleToggleUnit, setSelectedUnitIds };
};
