import { describe, expect, it } from "vitest";
import { isSchoolClassRequestStatus } from "./schoolClassRequestStatus";

describe("isSchoolClassRequestStatus", () => {
  it.each(["pending", "approved", "rejected", "cancelled"])(
    "%s は学級申請のステータスとみなす",
    (value) => {
      expect(isSchoolClassRequestStatus(value)).toBe(true);
    },
  );

  it.each(["", "unknown", "PENDING", "requested"])(
    "%s は学級申請のステータスとみなさない",
    (value) => {
      expect(isSchoolClassRequestStatus(value)).toBe(false);
    },
  );
});
