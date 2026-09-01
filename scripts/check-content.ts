import path from "node:path";
import { siteContent } from "@/content/site";
import {
  contentHasTodo,
  validateSiteContent,
} from "@/content/content-validation";

const issues = validateSiteContent(siteContent, {
  publicDirectory: path.join(process.cwd(), "public"),
});

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`${issue.path}: ${issue.message}`);
  }
  process.exit(1);
}

if (siteContent.status === "draft" && contentHasTodo(siteContent)) {
  console.log(
    "Content is valid and remains in draft mode with TODO placeholders.",
  );
} else {
  console.log("Content is valid and ready for publication.");
}
