
const fs = require('fs');
const vm = require('vm');
function parseHtmlToFakeNodes(html) {
  const nodes = [];
  const tagRe = /<[a-zA-Z][^>]*>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const tagStr = m[0];
    const attrs = {};
    const attrRe = /([a-zA-Z0-9\-]+)="([^"]*)"/g;
    let am;
    while ((am = attrRe.exec(tagStr))) attrs[am[1]] = am[2];
    nodes.push({ tagStr, attrs });
  }
  return nodes;
}
function createApp() {
  const nodeRegistry = new Map();
  const app = {
    _html: '',
    get innerHTML(){ return this._html; },
    set innerHTML(v){ this._html = v; nodeRegistry.clear(); },
    querySelectorAll(sel) { return queryAll(this._html, sel); },
    querySelector(sel) { return queryAll(this._html, sel)[0] || null; },
  };
  return app;
  function queryAll(html, sel) {
    const nodes = parseHtmlToFakeNodes(html);
    let filtered;
    if (sel.startsWith('[') && sel.endsWith(']')) {
      const attrName = sel.slice(1, -1);
      filtered = nodes.filter(n => attrName in n.attrs);
    } else { filtered = []; }
    return filtered.map(n => getOrCreateNode(n));
  }
  function getOrCreateNode(n) {
    if (nodeRegistry.has(n.tagStr)) return nodeRegistry.get(n.tagStr);
    const attrs = n.attrs;
    const node = {
      getAttribute(k){ return attrs[k] !== undefined ? attrs[k] : null; },
      _handlers: {},
      addEventListener(type, fn){ node._handlers[type] = fn; },
      click(){ if (node._handlers.click) node._handlers.click(); },
    };
    nodeRegistry.set(n.tagStr, node);
    return node;
  }
}
const sandbox = {
  window: { matchMedia(){ return { matches: true }; } },
  document: { getElementById(id){ return id === 'app' ? sandbox.__app : null; }, documentElement: { classList: { add(){}, remove(){} } } },
  console: console,
  import: function() { return new Promise(() => {}); },
  setInterval: function() { return 0; },
};
sandbox.globalThis = sandbox;
sandbox.__app = createApp();
const dataCode = fs.readFileSync('azure-knowledge-platform/it-team-sim/data/sim-data.js', 'utf8');
const domainCode = fs.readFileSync('azure-knowledge-platform/it-team-sim/domain/sim-domain.js', 'utf8');
new vm.Script(dataCode).runInNewContext(sandbox);
new vm.Script(domainCode).runInNewContext(sandbox);
const uiCode = fs.readFileSync('azure-knowledge-platform/it-team-sim/ui/sim-ui.js', 'utf8');
new vm.Script(uiCode).runInNewContext(sandbox);
const app = sandbox.__app;

const vpnBtn = app.querySelectorAll('[data-open-case]').filter(b => b.getAttribute('data-open-case')==='vpn_outage')[0];
vpnBtn.click();

const orgIdx = app._html.indexOf('class="sim-org"');
const orgEndIdx = app._html.indexOf('class="sim-right-col"');
console.log(app._html.slice(orgIdx - 7, orgEndIdx));
