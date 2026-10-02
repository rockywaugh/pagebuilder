import { publicCatalog, publicFonts, publicMoods } from "@/lib/ui-source";

export async function GET() {
  return Response.json({
    source: "PageBuilder professional UI library",
    note: "These are market layout systems, not scraped copies of live websites.",
    patterns: publicCatalog(),
    moods: publicMoods(),
    fonts: publicFonts(),
  });
}
