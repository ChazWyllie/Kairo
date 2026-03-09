import { describe, it, expect } from "vitest";
import { escapeHtml } from "./sanitize";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('a "b" c')).toBe("a &quot;b&quot; c");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("a 'b' c")).toBe("a &#39;b&#39; c");
  });

  it("escapes a script tag", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("escapes onclick attribute injection", () => {
    expect(escapeHtml('" onclick="alert(1)')).toBe(
      "&quot; onclick=&quot;alert(1)"
    );
  });

  it("handles strings with no special characters", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("handles empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes all special characters together", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
