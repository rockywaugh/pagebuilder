/** Placeholder for later view/click monetization on published pages. */
export function monetizeSnippet(site: string): string {
  const id = JSON.stringify(site);
  return `<!-- PageBuilder monetization slot (views/clicks) -->
<div id="pb-monetize" data-site=${id} hidden></div>
<script>
(function(){
  try { navigator.sendBeacon("/api/monetize", new Blob([JSON.stringify({ site: ${id}, kind: "impression", t: Date.now() })], { type: "application/json" })); } catch (e) {}
})();
</script>`;
}
