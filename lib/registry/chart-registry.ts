import dynamic from "next/dynamic";

const BarChartRenderer = dynamic(() => import("@/components/charts/renderers/BarChartRenderer"), { ssr: false });
const LineChartRenderer = dynamic(() => import("@/components/charts/renderers/LineChartRenderer"), { ssr: false });
const AreaChartRenderer = dynamic(() => import("@/components/charts/renderers/AreaChartRenderer"), { ssr: false });
const PieChartRenderer = dynamic(() => import("@/components/charts/renderers/PieChartRenderer"), { ssr: false });
const ScatterChartRenderer = dynamic(() => import("@/components/charts/renderers/ScatterChartRenderer"), { ssr: false });
const BubbleChartRenderer = dynamic(() => import("@/components/charts/renderers/BubbleChartRenderer"), { ssr: false });
const RadarChartRenderer = dynamic(() => import("@/components/charts/renderers/RadarChartRenderer"), { ssr: false });
const ComposedChartRenderer = dynamic(() => import("@/components/charts/renderers/ComposedChartRenderer"), { ssr: false });
const FunnelRenderer = dynamic(() => import("@/components/charts/renderers/FunnelRenderer"), { ssr: false });
const HeatmapRenderer = dynamic(() => import("@/components/charts/renderers/HeatmapRenderer"), { ssr: false });
const SunburstRenderer = dynamic(() => import("@/components/charts/renderers/SunburstRenderer"), { ssr: false });
const TreemapRenderer = dynamic(() => import("@/components/charts/renderers/TreemapRenderer"), { ssr: false });

export const chartRegistry = {
  bar: BarChartRenderer,
  line: LineChartRenderer,
  area: AreaChartRenderer,
  pie: PieChartRenderer,
  scatter: ScatterChartRenderer,
  bubble: BubbleChartRenderer,
  radar: RadarChartRenderer,
  composed: ComposedChartRenderer,
  funnel: FunnelRenderer,
  heatmap: HeatmapRenderer,
  sunburst: SunburstRenderer,
  treemap: TreemapRenderer,
} as const;

export type ChartType = keyof typeof chartRegistry;
