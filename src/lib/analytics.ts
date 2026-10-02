/** First-pass page tracking. Events land in /api/track for later reporting. */
export function analyticsSnippet(site: string): string {
  const id = JSON.stringify(site);
  return `<script>
(function(){
  var site = ${id};
  window.__pagebuilder = window.__pagebuilder || { site: site, events: [] };
  function track(event, meta){
    var payload = { site: site, event: event, meta: meta || {}, t: Date.now() };
    window.__pagebuilder.events.push(payload);
    try { navigator.sendBeacon("/api/track", new Blob([JSON.stringify(payload)], { type: "application/json" })); } catch (e) {}
  }
  track("page_view");
  document.addEventListener("click", function(e){
    var node = e.target && e.target.closest ? e.target.closest("a,button") : null;
    if (node) track("click", { text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80) });
  }, true);
})();
</script>`;
}
