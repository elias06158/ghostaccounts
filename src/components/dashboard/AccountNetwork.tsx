"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { lookupService, type ServiceCategory } from "@/lib/services-db";
import type { ScanResult } from "@/types/database";

export interface AccountNetworkProps {
  results: ScanResult[];
  email: string;
  locale: string;
  categoryFilter?: ServiceCategory | "all";
}

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: "email" | "service";
  risk: "high" | "medium" | "low";
  category: ServiceCategory | "email";
  domain?: string;
  evidenceCount: number;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  risk: "high" | "medium" | "low";
}

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

function getNodeRisk(r: ScanResult): "high" | "medium" | "low" {
  if (r.breach_status === "breached") return "high";
  if (!r.last_email_date || Date.now() - new Date(r.last_email_date).getTime() > THREE_YEARS_MS) return "medium";
  return "low";
}

const RISK_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const CATEGORY_COLORS: Record<ServiceCategory | "email", string> = {
  email: "#818cf8",
  social: "#ec4899",
  shopping: "#f97316",
  work: "#3b82f6",
  finance: "#10b981",
  streaming: "#a855f7",
  gaming: "#06b6d4",
  travel: "#84cc16",
  tools: "#6b7280",
  ai: "#8b5cf6",
  other: "#64748b",
};

export function AccountNetwork({ results, email, locale, categoryFilter = "all" }: AccountNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Only active accounts with verified signals
  const active = useMemo(
    () => results.filter((r) => r.deletion_status === "active"),
    [results]
  );

  useEffect(() => {
    if (!svgRef.current || active.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Build nodes
    const emailNode: NetworkNode = {
      id: "email-center",
      label: email,
      type: "email",
      risk: "low",
      category: "email",
      evidenceCount: active.length,
      x: width / 2,
      y: height / 2,
      fx: width / 2,
      fy: height / 2,
    };

    const serviceNodes: NetworkNode[] = active.map((r) => {
      const info = lookupService(r.service_domain ?? r.service_name);
      return {
        id: r.id,
        label: r.service_name,
        type: "service" as const,
        risk: getNodeRisk(r),
        category: info?.category ?? "other",
        domain: r.service_domain ?? undefined,
        evidenceCount: r.evidence_count ?? 1,
      };
    });

    const nodes: NetworkNode[] = [emailNode, ...serviceNodes];

    const links: NetworkLink[] = serviceNodes.map((n) => ({
      source: "email-center",
      target: n.id,
      risk: n.risk,
    }));

    // Force simulation
    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(links).id((d) => d.id).distance(110).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<NetworkNode>().radius((d) => nodeRadius(d) + 12));

    function nodeRadius(d: NetworkNode) {
      if (d.type === "email") return 28;
      return Math.max(14, Math.min(26, 12 + d.evidenceCount * 2));
    }

    // Zoom container
    const g = svg
      .append("g")
      .attr("class", "zoom-container");

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // Defs for glow filters
    const defs = svg.append("defs");
    (["high", "medium", "low"] as const).forEach((risk) => {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${risk}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Links
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.35)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => RISK_COLORS[d.risk])
      .attr("stroke-width", (d) => (d.risk === "high" ? 2 : 1.2));

    // Node groups
    const node = g
      .append("g")
      .selectAll<SVGGElement, NetworkNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", (d) => d.type === "service" ? "pointer" : "grab")
      .call(
        d3
          .drag<SVGGElement, NetworkNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            // Mark drag start position for click detection
            (d as NetworkNode & { _dragStartX?: number; _dragStartY?: number })._dragStartX = event.x;
            (d as NetworkNode & { _dragStartX?: number; _dragStartY?: number })._dragStartY = event.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (d.type !== "email") {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Circle background
    node
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => (d.type === "email" ? "url(#email-grad)" : CATEGORY_COLORS[d.category]))
      .attr("fill-opacity", (d) => (d.type === "email" ? 1 : 0.18))
      .attr("stroke", (d) => (d.type === "email" ? "#818cf8" : RISK_COLORS[d.risk]))
      .attr("stroke-width", (d) => (d.type === "email" ? 2.5 : d.risk === "high" ? 2.5 : 1.5))
      .attr("filter", (d) => (d.risk === "high" ? "url(#glow-high)" : d.type === "email" ? "url(#glow-low)" : null));

    // Favicon images for service nodes
    node
      .filter((d) => d.type === "service" && !!d.domain)
      .append("image")
      .attr("href", (d) => `https://www.google.com/s2/favicons?domain=${d.domain}&sz=32`)
      .attr("x", (d) => -nodeRadius(d) * 0.45)
      .attr("y", (d) => -nodeRadius(d) * 0.45)
      .attr("width", (d) => nodeRadius(d) * 0.9)
      .attr("height", (d) => nodeRadius(d) * 0.9)
      .attr("clip-path", (d) => `circle(${nodeRadius(d) * 0.45}px)`)
      .style("pointer-events", "none");

    // Emoji for email center
    node
      .filter((d) => d.type === "email")
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "18px")
      .text("👤")
      .style("pointer-events", "none");

    // Letter fallback for services without domain
    node
      .filter((d) => d.type === "service" && !d.domain)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", (d) => `${Math.max(10, nodeRadius(d) * 0.6)}px`)
      .attr("fill", (d) => RISK_COLORS[d.risk])
      .attr("font-weight", "700")
      .text((d) => d.label.charAt(0).toUpperCase())
      .style("pointer-events", "none");

    // Risk indicator dot for high-risk nodes
    node
      .filter((d) => d.type === "service" && d.risk === "high")
      .append("circle")
      .attr("r", 5)
      .attr("cx", (d) => nodeRadius(d) - 4)
      .attr("cy", (d) => -(nodeRadius(d) - 4))
      .attr("fill", "#ef4444")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.5)
      .style("pointer-events", "none");

    // Labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", (d) => nodeRadius(d) + 14)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .text((d) => {
        const maxLen = 14;
        return d.label.length > maxLen ? d.label.slice(0, maxLen) + "…" : d.label;
      })
      .style("pointer-events", "none");

    // Tooltip interactions
    const tooltip = d3.select(tooltipRef.current);

    node
      .on("mouseover", (event: MouseEvent, d: NetworkNode) => {
        if (d.type === "email") return;
        tooltip
          .style("opacity", "1")
          .style("pointer-events", "none")
          .html(`
            <div class="font-semibold text-sm text-white mb-0.5">${d.label}</div>
            ${d.domain ? `<div class="text-xs text-slate-400">${d.domain}</div>` : ""}
            <div class="flex items-center gap-1.5 mt-1.5">
              <span class="w-2 h-2 rounded-full inline-block" style="background:${RISK_COLORS[d.risk]}"></span>
              <span class="text-xs capitalize" style="color:${RISK_COLORS[d.risk]}">${d.risk === "high" ? (locale === "de" ? "Hohes Risiko" : "High risk") : d.risk === "medium" ? (locale === "de" ? "Mittleres Risiko" : "Medium risk") : (locale === "de" ? "Geringes Risiko" : "Low risk")}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1">${d.evidenceCount} ${locale === "de" ? "Signal(e)" : "signal(s)"}</div>
          `);
      })
      .on("mousemove", (event: MouseEvent) => {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        tooltip
          .style("left", `${event.clientX - svgRect.left + 12}px`)
          .style("top", `${event.clientY - svgRect.top - 8}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", "0");
      })
      .on("click", (event: MouseEvent, d: NetworkNode) => {
        if (d.type !== "service") return;
        // Only navigate if the mouse didn't move significantly (click, not drag)
        const nd = d as NetworkNode & { _dragStartX?: number; _dragStartY?: number };
        const dx = Math.abs(event.x - (nd._dragStartX ?? event.x));
        const dy = Math.abs(event.y - (nd._dragStartY ?? event.y));
        if (dx > 5 || dy > 5) return;
        router.push(`/${locale}/dashboard/accounts/${d.id}`);
      });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NetworkNode).x ?? 0)
        .attr("y1", (d) => (d.source as NetworkNode).y ?? 0)
        .attr("x2", (d) => (d.target as NetworkNode).x ?? 0)
        .attr("y2", (d) => (d.target as NetworkNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, email, locale]);

  // React to category filter changes without re-running simulation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll<SVGGElement, NetworkNode>(".node-group").each(function(d) {
      const isMatch = categoryFilter === "all" || d.type === "email" || d.category === categoryFilter;
      d3.select(this)
        .transition()
        .duration(250)
        .style("opacity", isMatch ? 1 : 0.12)
        .style("pointer-events", isMatch ? "all" : "none");
    });

    svg.selectAll<SVGLineElement, NetworkLink>("line").each(function(d) {
      const target = d.target as NetworkNode;
      const isMatch = categoryFilter === "all" || target.category === categoryFilter;
      d3.select(this)
        .transition()
        .duration(250)
        .attr("stroke-opacity", isMatch ? 0.35 : 0.05);
    });
  }, [categoryFilter]);

  if (active.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        {locale === "de"
          ? "Keine aktiven Konten für die Visualisierung."
          : "No active accounts to visualize."}
      </div>
    );
  }

  return (
    <div className="relative w-full h-72 sm:h-80 md:h-[580px]">
      <svg
        ref={svgRef}
        className="w-full h-full rounded-2xl bg-background/60 border border-border/50"
        style={{ display: "block" }}
      />
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none z-50 px-3 py-2 rounded-xl bg-slate-900 border border-border/60 shadow-xl transition-opacity duration-150"
        style={{ opacity: 0, minWidth: 140, maxWidth: 220 }}
      />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 p-2 sm:p-3 rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground/80 mb-0.5">
          {locale === "de" ? "Risiko" : "Risk"}
        </p>
        {(["high", "medium", "low"] as const).map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: RISK_COLORS[r] }} />
            <span className="text-[10px] sm:text-xs">
              {r === "high"
                ? locale === "de" ? "Hoch" : "High"
                : r === "medium"
                ? locale === "de" ? "Mittel" : "Medium"
                : locale === "de" ? "Gering" : "Low"}
            </span>
          </div>
        ))}
        <p className="text-muted-foreground/60 mt-0.5 text-[10px] hidden sm:block">
          {locale === "de" ? "Ziehen · Scrollen zum Zoomen" : "Drag · Scroll to zoom"}
        </p>
      </div>
      {/* Counter */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 text-xs text-muted-foreground">
        {active.length} {locale === "de" ? "Konten" : "accounts"}
      </div>
    </div>
  );
}
