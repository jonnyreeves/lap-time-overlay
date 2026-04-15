import { describe, expect, it } from "vitest";
import { renderStartupConfigErrorPage } from "../../src/web/startupConfigError.js";

describe("startup config error page", () => {
  it("renders the validation error and key candidates", () => {
    const html = renderStartupConfigErrorPage({
      message: "USER_SECRET_ENCRYPTION_KEY must decode to exactly 32 bytes",
      keyCandidates: [
        "4MRbHmSfjLnW1vhyqWo6qN8im4Fg0euYDcIaS4MZtZQ",
        "PHzQhNf1dmiTA-jMaBoWws_uYCAHZaVvOnlDywuxz8k",
        "pExSxNUQOgZJpsjyag1uS2U22UVn1yBtjcHQ7SS02pA",
      ],
    });

    expect(html).toContain("Configuration required");
    expect(html).toContain("USER_SECRET_ENCRYPTION_KEY must decode to exactly 32 bytes");
    expect(html).toContain(
      "USER_SECRET_ENCRYPTION_KEY=4MRbHmSfjLnW1vhyqWo6qN8im4Fg0euYDcIaS4MZtZQ"
    );
    expect(html).toContain(
      "USER_SECRET_ENCRYPTION_KEY=PHzQhNf1dmiTA-jMaBoWws_uYCAHZaVvOnlDywuxz8k"
    );
    expect(html).toContain(
      "USER_SECRET_ENCRYPTION_KEY=pExSxNUQOgZJpsjyag1uS2U22UVn1yBtjcHQ7SS02pA"
    );
  });

  it("escapes dynamic content", () => {
    const html = renderStartupConfigErrorPage({
      message: "<invalid>",
      keyCandidates: ['bad"key'],
    });

    expect(html).toContain("&lt;invalid&gt;");
    expect(html).toContain("bad&quot;key");
    expect(html).not.toContain("<invalid>");
  });
});
