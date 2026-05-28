"use client";
import { useSelection, select } from "../lib/selection";
import { ARCHITECTURE } from "../data/architecture";

const SCOPE_LABEL = {
  internal: "internal module",
  external: "external dependency",
  deployment: "deployment surface",
} as const;

export default function SidePanel() {
  const sel = useSelection();
  if (!sel) return null;

  const sourceUrl =
    sel.sourceUrl ??
    (sel.path
      ? `${ARCHITECTURE.source_repo}/blob/${ARCHITECTURE.source_commit}/${sel.path}`
      : undefined);

  return (
    <div className="side-panel">
      <button className="side-panel-close" onClick={() => select(null)} aria-label="close">
        ×
      </button>
      <div className="side-panel-eyebrow">{SCOPE_LABEL[sel.scope]} · {sel.kind}</div>
      <h2 className="side-panel-title">{sel.label}</h2>
      {sel.path && (
        <div className="side-panel-row">
          <div className="side-panel-key">Path</div>
          <div className="side-panel-val">
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer">{sel.path}</a>
            ) : (
              sel.path
            )}
          </div>
        </div>
      )}
      {sel.purpose && (
        <div className="side-panel-row">
          <div className="side-panel-key">Purpose</div>
          <div className="side-panel-val">{sel.purpose}</div>
        </div>
      )}
      {sel.imports && sel.imports.length > 0 && (
        <div className="side-panel-row">
          <div className="side-panel-key">Imports</div>
          <div className="side-panel-val">
            <ul>{sel.imports.map((i) => <li key={i}><code>{i}</code></li>)}</ul>
          </div>
        </div>
      )}
      {sel.imported_by && sel.imported_by.length > 0 && (
        <div className="side-panel-row">
          <div className="side-panel-key">Imported by</div>
          <div className="side-panel-val">
            <ul>{sel.imported_by.map((i) => <li key={i}><code>{i}</code></li>)}</ul>
          </div>
        </div>
      )}
      {sel.consumed_by && sel.consumed_by.length > 0 && (
        <div className="side-panel-row">
          <div className="side-panel-key">Consumed by</div>
          <div className="side-panel-val">
            <ul>{sel.consumed_by.map((i) => <li key={i}><code>{i}</code></li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
