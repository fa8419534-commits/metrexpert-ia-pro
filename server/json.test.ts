import { describe, expect, it } from "vitest";
import { parseJsonObjectFromLLM } from "./json";

describe("parseJsonObjectFromLLM", () => {
  it("removes prose before and after the JSON object", () => {
    expect(parseJsonObjectFromLLM('Voici le résultat : {"projectTitle":"Villa","measures":[]} Merci.')).toEqual({
      projectTitle: "Villa",
      measures: [],
    });
  });

  it("removes markdown fences around JSON", () => {
    expect(parseJsonObjectFromLLM('```json\n{"projectTitle":"Villa","measures":[]}\n```')).toEqual({
      projectTitle: "Villa",
      measures: [],
    });
  });

  it("accepts trailing commas outside string values", () => {
    expect(parseJsonObjectFromLLM('{"projectTitle":"Villa", "measures":[],}')).toEqual({
      projectTitle: "Villa",
      measures: [],
    });
  });

  it("does not silently accept an incomplete object", () => {
    expect(() => parseJsonObjectFromLLM('{"projectTitle":"Villa"')).toThrow(/incomplet/i);
  });
});
