function findJsonObjectEnd(source: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function removeTrailingCommas(source: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      output += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      output += character;
      continue;
    }
    if (character === ",") {
      const remainder = source.slice(index + 1);
      if (/^\s*[}\]]/.test(remainder)) continue;
    }
    output += character;
  }
  return output;
}

/**
 * Parse the first complete JSON object in an LLM response.
 * It tolerates prose/fences around the object and trailing commas, but still
 * delegates structural validation to JSON.parse so malformed content fails loudly.
 */
export function parseJsonObjectFromLLM(raw: string): unknown {
  const normalized = raw.replace(/^\uFEFF/, "").trim();
  const start = normalized.indexOf("{");
  if (start < 0) throw new SyntaxError("Aucun objet JSON trouvé dans la réponse de l’IA.");

  const end = findJsonObjectEnd(normalized, start);
  if (end < 0) throw new SyntaxError("Objet JSON incomplet dans la réponse de l’IA.");

  const candidate = removeTrailingCommas(normalized.slice(start, end + 1));
  return JSON.parse(candidate);
}
