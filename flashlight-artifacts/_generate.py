"""Post-process the analysis Markdown into flashlight-shaped sidecar artifacts.

Run with: `uv run python flashlight-artifacts/_generate.py`

Inputs:
  - flashlight-artifacts/service_discovery/components.json
  - flashlight-artifacts/service_analyses/centaur-3d.md  (## Citations + ## Analysis Data)
  - all source files referenced in citations

Outputs:
  - flashlight-artifacts/service_analyses/centaur-3d.json   (parsed Analysis Data)
  - flashlight-artifacts/service_analyses/citations.json    (validated citations)
  - flashlight-artifacts/dependency_graphs/graph.json       (unified KG)
  - flashlight-artifacts/dependency_graphs/analysis_order.json
  - flashlight-artifacts/architecture_docs/architecture.md  (synthesis)
  - flashlight-artifacts/architecture_docs/quick_reference.md
  - data/architecture.ts                                    (graph for the viz)
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ART = REPO / "flashlight-artifacts"
SRC_COMMIT = "f6f270691ff7eebd948f7ba43d3893b210db7383"
SRC_REPO = "https://github.com/shwniscool/centaur-3d"

CITATIONS_RE = re.compile(
    r"^## Citations\b.*?```json\s*\n(.*?)\n\s*```",
    re.MULTILINE | re.DOTALL,
)
ANALYSIS_DATA_RE = re.compile(
    r"^## Analysis Data\b.*?```json\s*\n(.*?)\n\s*```",
    re.MULTILINE | re.DOTALL,
)


def load_components() -> dict:
    return json.loads((ART / "service_discovery" / "components.json").read_text())


def parse_analysis(md_path: Path) -> tuple[list[dict], dict]:
    text = md_path.read_text()
    cm = CITATIONS_RE.search(text)
    am = ANALYSIS_DATA_RE.search(text)
    if not cm:
        raise SystemExit(f"no ## Citations block in {md_path}")
    if not am:
        raise SystemExit(f"no ## Analysis Data block in {md_path}")
    return json.loads(cm.group(1)), json.loads(am.group(1))


def validate_citations(cites: list[dict]) -> list[dict]:
    out: list[dict] = []
    for c in cites:
        fp = REPO / c["file_path"]
        if not fp.exists():
            print(f"  MISS file: {c['file_path']}", file=sys.stderr)
            continue
        lines = fp.read_text().splitlines()
        n = len(lines)
        s, e = c["start_line"], c["end_line"]
        if s < 1 or e < s or e > n:
            print(f"  BAD range: {c['file_path']}:{s}-{e} (file has {n} lines)", file=sys.stderr)
            continue
        snippet = "\n".join(lines[s - 1 : e])
        out.append(
            {
                **c,
                "snippet": snippet[:240],
                "source_url": f"{SRC_REPO}/blob/{SRC_COMMIT}/{c['file_path']}#L{s}"
                + (f"-L{e}" if e != s else ""),
            }
        )
    return out


def build_graph(components: dict, analysis: dict) -> dict:
    comps = components["components"]
    nodes_components = {c["name"]: c for c in comps}

    # External services in the graph are the deps + hosting/ci nodes
    external_services: dict[str, dict] = {}
    for em in analysis["external_modules"]:
        external_services[em["id"]] = {
            "id": em["id"],
            "name": em["label"],
            "category": em["kind"],
            "node_type": "external_service",
            "description": em.get("purpose", ""),
        }

    edges: list[dict] = []
    # Component-level: centaur-3d depends on each external service (flashlight-level edges)
    for em in analysis["external_modules"]:
        edges.append(
            {
                "source": "centaur-3d",
                "target": em["id"],
                "type": "integrates_with" if em["kind"] in ("hosting-cdn", "ci-runtime") else "depends_on",
                "confidence": 1.0,
            }
        )

    return {
        "schema_version": "2.0.0",
        "source_repo": SRC_REPO,
        "source_commit": SRC_COMMIT,
        "nodes": {"components": nodes_components, "external_services": external_services},
        "edges": edges,
        "analysis": {"centaur-3d": analysis},
        "metadata": {
            "component_count": len(nodes_components),
            "external_service_count": len(external_services),
            "edge_count": len(edges),
            "analyzed_count": 1,
            "by_kind": {"frontend": 1},
            "by_edge_type": {
                "depends_on": sum(1 for e in edges if e["type"] == "depends_on"),
                "integrates_with": sum(1 for e in edges if e["type"] == "integrates_with"),
            },
        },
    }


def write_analysis_order() -> dict:
    # Single component, no internal dependencies → depth 0 only
    return {
        "schema_version": "2.0.0",
        "depth_levels": [["centaur-3d"]],
        "total_components": 1,
        "total_depth_levels": 1,
    }


def write_ts_data(analysis: dict, ts_path: Path) -> None:
    """Render the analysis into a TS module the viz consumes."""
    payload = {
        "source_repo": SRC_REPO,
        "source_commit": SRC_COMMIT,
        "summary": analysis["summary"],
        "architecture_pattern": analysis["architecture_pattern"],
        "tech_stack": analysis["tech_stack"],
        "internal_modules": analysis["internal_modules"],
        "external_modules": analysis["external_modules"],
    }
    body = json.dumps(payload, indent=2)
    ts_path.parent.mkdir(parents=True, exist_ok=True)
    ts_path.write_text(
        "// AUTO-GENERATED from flashlight-artifacts/. Do not edit by hand.\n"
        "// Regenerate with: uv run python flashlight-artifacts/_generate.py\n"
        f"export const ARCHITECTURE = {body} as const;\n"
        "export type Architecture = typeof ARCHITECTURE;\n"
        "export type InternalModule = (typeof ARCHITECTURE)[\"internal_modules\"][number];\n"
        "export type ExternalModule = (typeof ARCHITECTURE)[\"external_modules\"][number];\n"
    )


def write_architecture_md(comps: dict, analysis: dict) -> str:
    lines = []
    lines.append("# centaur-3d — architecture\n")
    lines.append(f"_Generated by flashlight-shaped pipeline at commit `{SRC_COMMIT[:10]}`._\n")
    lines.append(f"\n**Summary.** {analysis['summary']}\n")
    lines.append(f"\n**Pattern.** {analysis['architecture_pattern']}\n")
    lines.append("\n## Component inventory\n")
    for c in comps["components"]:
        lines.append(f"- **{c['name']}** ({c['kind']}, {c['type']}) — {c['description']}")
    lines.append("\n## Internal modules\n")
    lines.append("| Module | Path | Imports | Imported by |")
    lines.append("|---|---|---|---|")
    for m in analysis["internal_modules"]:
        imp = ", ".join(m["imports"]) or "—"
        by = ", ".join(m["imported_by"]) or "—"
        lines.append(f"| `{m['id']}` ({m['kind']}) | `{m['path']}` | {imp} | {by} |")
    lines.append("\n## External dependencies\n")
    lines.append("| Dep | Kind | Purpose | Consumed by |")
    lines.append("|---|---|---|---|")
    for em in analysis["external_modules"]:
        cons = ", ".join(em["consumed_by"]) or "—"
        lines.append(f"| `{em['label']}` | {em['kind']} | {em['purpose']} | {cons} |")
    lines.append("\n## Tech stack\n")
    for t in analysis["tech_stack"]:
        lines.append(f"- {t}")
    return "\n".join(lines) + "\n"


def write_quick_ref(analysis: dict) -> str:
    n_int = len(analysis["internal_modules"])
    n_ext = len(analysis["external_modules"])
    return (
        "# centaur-3d — quick reference\n\n"
        f"- **Kind:** static-export Next.js 14 frontend\n"
        f"- **Internal modules:** {n_int}\n"
        f"- **External dependencies:** {n_ext}\n"
        f"- **Architecture pattern:** {analysis['architecture_pattern']}\n"
        f"- **Deploy target:** GitHub Pages (basePath `/centaur-3d`)\n"
        f"- **Build:** `next build` with `output: \"export\"`\n"
        f"- **Entry:** `app/page.tsx` → `<Scene />` (ssr: false) → one of three view components\n"
        f"- **Primitives:** `components/Node.tsx`, `components/Edge.tsx`\n"
    )


def main() -> None:
    components = load_components()
    cites_raw, analysis = parse_analysis(ART / "service_analyses" / "centaur-3d.md")
    cites = validate_citations(cites_raw)

    # citations.json
    (ART / "service_analyses" / "citations.json").write_text(
        json.dumps({"source_repo": SRC_REPO, "source_commit": SRC_COMMIT, "citations": cites}, indent=2)
    )
    print(f"validated {len(cites)}/{len(cites_raw)} citations")

    # analysis sidecar
    (ART / "service_analyses" / "centaur-3d.json").write_text(json.dumps(analysis, indent=2))

    # graph.json
    graph = build_graph(components, analysis)
    (ART / "dependency_graphs" / "graph.json").write_text(json.dumps(graph, indent=2))

    # analysis_order.json
    (ART / "dependency_graphs" / "analysis_order.json").write_text(
        json.dumps(write_analysis_order(), indent=2)
    )

    # architecture docs
    (ART / "architecture_docs" / "architecture.md").write_text(
        write_architecture_md(components, analysis)
    )
    (ART / "architecture_docs" / "quick_reference.md").write_text(write_quick_ref(analysis))

    # viz data
    write_ts_data(analysis, REPO / "data" / "architecture.ts")
    print("wrote data/architecture.ts")


if __name__ == "__main__":
    main()
