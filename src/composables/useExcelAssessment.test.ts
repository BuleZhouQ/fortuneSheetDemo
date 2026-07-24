import { describe, expect, it } from "vitest";
import { useExcelAssessment } from "./useExcelAssessment";

describe("assessment workbook identity", () => {
  it("uses a stable sheet id for collaboration patches", () => {
    const { getCleanInitialSheetData } = useExcelAssessment();

    expect(getCleanInitialSheetData()[0]?.id).toBe("assessment-sheet");
  });
});
