import { useState } from "react";

export const useUnitSelection = () => {
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const handleToggleUnit = (unitId: number) => {
    setSelectedUnitIds((prev) =>
      prev?.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    );
  };

  return { selectedUnitIds, handleToggleUnit, setSelectedUnitIds };
};
