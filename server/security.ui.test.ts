import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GenerationErrorAlert } from "../client/src/pages/Home";

describe("generation quota UI errors", () => {
  it("renders the hourly limit message in the visible generation alert", () => {
    const markup = renderToStaticMarkup(React.createElement(GenerationErrorAlert, { message: "Limite atteinte : 5 générations par heure." }));
    expect(markup).toContain("Limite atteinte : 5 générations par heure.");
    expect(markup).toContain("Génération interrompue");
  });

  it("renders the daily quota message in the visible generation alert", () => {
    const markup = renderToStaticMarkup(React.createElement(GenerationErrorAlert, { message: "Quota global atteint : 50 générations pour aujourd’hui." }));
    expect(markup).toContain("Quota global atteint : 50 générations pour aujourd’hui.");
    expect(markup).toContain("Génération interrompue");
  });
});
