import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
  "img",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "width", "height", "style", "class"];

export function sanitizeEmailHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ALLOWED_ATTR,
    },
    allowedSchemes: ["http", "https", "mailto", "cid"],
    allowProtocolRelative: false,
  });
}
