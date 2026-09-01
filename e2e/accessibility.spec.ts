import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("has no automated accessibility violations in light and dark themes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((value) => localStorage.setItem("theme", value), theme);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    const projectDisclosure = page.locator(
      'section[aria-labelledby="projects-heading"] summary',
    );
    if ((await projectDisclosure.count()) > 0) {
      await projectDisclosure.click();
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${theme} theme violations`).toEqual([]);
  }
});
