import { expect, test } from "@playwright/test";
import { siteContent } from "@/content/site";

test("renders compact core content and native disclosures without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tito Osemobor", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByText("Software Engineer", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Now & before" }),
  ).toBeVisible();
  if (siteContent.projects.length > 0) {
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Projects" })).toHaveCount(
      0,
    );
  }
  const firstPreviousExperience = siteContent.experience[3];
  if (!firstPreviousExperience)
    throw new Error("Previous experience fixture missing");
  await page.getByText("Previous experience", { exact: true }).click();
  await expect(
    page.locator(`[data-company-id="${firstPreviousExperience.id}"]`),
  ).toBeVisible();
  if (siteContent.projects.length > 3) {
    const firstAdditionalProject = siteContent.projects[3];
    if (!firstAdditionalProject)
      throw new Error("Additional project fixture missing");
    await page
      .getByText(
        `Show ${siteContent.projects.length - 3} more project${siteContent.projects.length - 3 === 1 ? "" : "s"}`,
        { exact: false },
      )
      .click();
    await expect(
      page.locator(`[data-project-slug="${firstAdditionalProject.slug}"]`),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Send a message" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("supports explicit theme selection, system defaults, and persistence", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Open site controls" }).click();
  await expect(
    page.getByRole("button", { name: "Use system theme" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Use light theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
    "light",
  );
});

test("company journeys and optional project disclosures work from the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const journeyExperience = siteContent.experience.find(
    ({ positions }) => positions.length > 1,
  );
  if (!journeyExperience)
    throw new Error("Multi-role experience fixture missing");
  const journeyIndex = siteContent.experience.indexOf(journeyExperience);
  if (journeyIndex >= 3) {
    await page.getByText("Previous experience", { exact: true }).click();
  }
  const journeyRow = page.locator(
    `[data-company-id="${journeyExperience.id}"]`,
  );
  const journey = journeyRow.locator("summary");
  await journey.focus();
  await page.keyboard.press("Enter");
  await expect(
    journeyRow.getByRole("list", {
      name: `${journeyExperience.company} roles`,
    }),
  ).toBeVisible();
  await expect(journey).toBeFocused();

  const projectSection = page.locator(
    'section[aria-labelledby="projects-heading"]',
  );
  if (siteContent.projects.length === 0) {
    await expect(projectSection).toHaveCount(0);
  } else {
    await expect(projectSection.locator("article:visible")).toHaveCount(
      Math.min(3, siteContent.projects.length),
    );
    if (siteContent.projects.length > 3) {
      const more = projectSection
        .locator("summary")
        .filter({ hasText: "Show" });
      await more.focus();
      await page.keyboard.press("Enter");
      await expect(projectSection.locator("article:visible")).toHaveCount(
        siteContent.projects.length,
      );
      await expect(more).toBeFocused();
    }
  }
});

test("marks current experience and exposes configured company websites", async ({
  page,
}) => {
  await page.goto("/");
  const currentExperience = siteContent.experience.find(
    ({ positions }) => positions[0]?.end === "present",
  );
  if (!currentExperience) throw new Error("Current experience fixture missing");
  const currentRow = page.locator(
    `[data-company-id="${currentExperience.id}"][data-current="true"]`,
  );
  await expect(currentRow.getByText("Current", { exact: true })).toBeVisible();
  if (!currentExperience.url) throw new Error("Current company URL missing");
  await expect(
    currentRow.getByRole("link", {
      name: `Visit ${currentExperience.company} website`,
    }),
  ).toHaveAttribute("href", currentExperience.url);
  const datesBox = await currentRow
    .locator("[data-experience-dates]")
    .boundingBox();
  const companyLinkBox = await currentRow
    .getByRole("link", {
      name: `Visit ${currentExperience.company} website`,
    })
    .boundingBox();
  expect(datesBox).not.toBeNull();
  expect(companyLinkBox).not.toBeNull();
  expect(companyLinkBox!.x).toBeGreaterThanOrEqual(
    datesBox!.x + datesBox!.width,
  );
});

test("the spark dock opens, closes, and hands off to footer controls", async ({
  page,
}) => {
  await page.goto("/");
  const dock = page.getByTestId("spark-dock");
  const footerControls = page.getByTestId("footer-controls");
  const trigger = page.getByRole("button", { name: "Open site controls" });
  await trigger.click();
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open site controls" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toBeHidden();

  await page.getByLabel("Name").focus();
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(dock).toHaveAttribute("aria-hidden", "true");
  await expect(footerControls).toHaveAttribute("aria-hidden", "false");
  await expect(
    footerControls.getByRole("link", { name: "GitHub" }),
  ).toBeVisible();
  await expect(dock.locator("button").last()).toHaveAttribute("tabindex", "-1");
});

test("external links are safe and unavailable stars never block projects", async ({
  page,
}) => {
  await page.goto("/");
  const externalLinks = page.locator('a[target="_blank"]');
  expect(await externalLinks.count()).toBeGreaterThan(0);
  for (const link of await externalLinks.all()) {
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  }
  const repositoryCount = siteContent.projects.filter(
    ({ githubRepo }) => githubRepo,
  ).length;
  await expect(page.getByLabel(/source on GitHub/)).toHaveCount(
    repositoryCount,
  );
  if (repositoryCount === 0) {
    await expect(page.getByLabel(/GitHub stars/)).toHaveCount(0);
  } else {
    await expect(page.getByLabel("0 GitHub stars")).toBeAttached();
  }
  await expect(page.locator("body")).not.toContainText(/\bX\b|résumé|resume/i);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
});

test("exposes launch-ready search, sharing, manifest, and icon metadata", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(siteContent.seo.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    siteContent.seo.description,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /index, follow/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteContent.seo.canonicalUrl,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    siteContent.seo.socialImage.alt,
  );
  await expect(page.locator('meta[name^="twitter:"]')).toHaveCount(0);
  await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld\+json"]')).toHaveCount(
    1,
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('link[rel="icon"]')).not.toHaveCount(0);

  for (const asset of [
    "/icons/favicon.ico",
    "/icons/favicon-16x16.png",
    "/icons/favicon-32x32.png",
    "/icons/apple-touch-icon.png",
    "/icons/android-chrome-192x192.png",
    "/icons/android-chrome-512x512.png",
    "/manifest.webmanifest",
    "/social-image",
  ]) {
    const response = await request.get(asset);
    expect(response.ok(), `${asset} should resolve`).toBe(true);
  }
});

test("validates, disables duplicate submission, reports success, and resets", async ({
  page,
}) => {
  await page.goto("/");
  const submit = page.getByRole("button", { name: "Send message" });
  await submit.click();
  await expect(
    page.getByText("Please review the highlighted fields."),
  ).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await page.getByLabel("Name").fill("A Visitor");
  await page.getByLabel("Email").fill("visitor@example.com");
  await page.getByLabel("Subject").fill("Working together");
  await page
    .locator('textarea[name="message"]')
    .fill("I would like to talk about a new product opportunity.");
  await submit.click();
  await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
  await expect(
    page.getByText("Thanks — your message has been sent."),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("");
});

test("shows safe retryable delivery feedback", async ({ page }) => {
  await page.goto("/");
  await page.locator("form").evaluate((form) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "_e2eMode";
    input.value = "retryable";
    form.append(input);
  });
  await page.getByLabel("Name").fill("A Visitor");
  await page.getByLabel("Email").fill("visitor@example.com");
  await page.getByLabel("Subject").fill("Working together");
  await page
    .locator('textarea[name="message"]')
    .fill("I would like to talk about a new product opportunity.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText(
      "Your message could not be sent. Please try again in a moment.",
    ),
  ).toBeVisible();
});

test("honors reduced motion and has no horizontal mobile overflow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const animatedControl = page.getByRole("button", {
    name: "Open site controls",
  });
  const duration = await animatedControl.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(["0s", "0.00001s", "1e-05s", "1e-08s"]).toContain(duration);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
