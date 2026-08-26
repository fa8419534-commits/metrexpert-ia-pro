import { describe, expect, it } from "vitest";
import { validateUploadedDataUrl } from "./routers";

describe("validateUploadedDataUrl", () => {
  it("accepts a PDF whose magic bytes match the declared MIME", () => {
    expect(() => validateUploadedDataUrl({
      mimeType: "application/pdf",
      dataUrl: "data:application/pdf;base64," + Buffer.from("%PDF-1.7\n").toString("base64"),
    })).not.toThrow();
  });

  it("rejects a payload whose declared MIME does not match its bytes", () => {
    expect(() => validateUploadedDataUrl({
      mimeType: "application/pdf",
      dataUrl: "data:application/pdf;base64," + Buffer.from("not a pdf").toString("base64"),
    })).toThrow("ne correspond pas");
  });

  it("rejects a data URL with an unexpected media type", () => {
    expect(() => validateUploadedDataUrl({
      mimeType: "image/png",
      dataUrl: "data:image/jpeg;base64,/9j/4AAQ",
    })).toThrow("malformé");
  });
});
