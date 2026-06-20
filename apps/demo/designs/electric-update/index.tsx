import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ===== TOP PANEL (white) ===== */}
    <Box x={0} y={0} w={1920} h={520} fill="var(--ox-bg)" />

    {/* top-left brand mark */}
    <Box x={120} y={88} w={52} h={52} fill="var(--ox-accent)" radius={14} z={5} />
    <Text x={120} y={88} w={52} h={52} align="center" valign="center" size={30} weight={800} color="var(--ox-bg)" font="display" z={6}>
      V
    </Text>
    <Text x={188} y={88} w={420} h={52} valign="center" size={26} weight={800} color="var(--ox-fg)" font="display" letterSpacing={1}>
      VOLTA
    </Text>

    {/* top-right release tag */}
    <Box x={1568} y={90} w={232} h={50} fill="var(--ox-bg)" radius={25} borderColor="var(--ox-muted)" borderWidth={1.5} z={5} />
    <Text x={1568} y={90} w={232} h={50} align="center" valign="center" size={18} weight={700} color="var(--ox-fg)" uppercase letterSpacing={3} z={6}>
      Spring 2026
    </Text>

    {/* eyebrow */}
    <Text x={120} y={224} w={1000} size={22} weight={800} color="var(--ox-accent)" uppercase letterSpacing={8} font="display">
      Product Update / Volta 4.0
    </Text>

    {/* headline */}
    <Text x={118} y={272} w={1300} size={132} weight={800} lineHeight={0.92} color="var(--ox-fg)" font="display" letterSpacing={-3}>
      {"Ship faster.\nGuess less."}
    </Text>

    {/* seam accent bar */}
    <Box x={0} y={512} w={1920} h={8} fill="var(--ox-accent2)" z={4} />

    {/* ===== BOTTOM PANEL (electric blue) ===== */}
    <Box x={0} y={520} w={1920} h={560} fill="var(--ox-accent)" />

    {/* faint decorative rings, clipped by artboard */}
    <Ellipse x={1430} y={560} w={620} h={620} fill="var(--ox-accent)" borderColor="#7d93f6" borderWidth={2} opacity={0.5} z={1} />
    <Ellipse x={1600} y={730} w={420} h={420} fill="var(--ox-accent)" borderColor="#7d93f6" borderWidth={2} opacity={0.45} z={1} />

    {/* hero stat */}
    <Text x={120} y={596} w={760} size={300} weight={800} color="var(--ox-light, #ffffff)" font="display" lineHeight={0.9} letterSpacing={-8} z={3}>
      3.2×
    </Text>
    <Text x={132} y={918} w={620} size={26} weight={700} color="var(--ox-accent2)" uppercase letterSpacing={4} z={3}>
      Faster build pipelines
    </Text>

    {/* divider between stat and quote */}
    <Line x={912} y={612} w={400} thickness={2} color="#8ea0f5" rotate={90} z={3} />

    {/* hero quote */}
    <Text x={968} y={596} w={820} size={48} weight={500} color="var(--ox-light, #ffffff)" font="body" lineHeight={1.28} z={3}>
      {"“We rebuilt the engine from the\nground up — instant previews,\nzero-config deploys, and AI that\nactually reads your codebase.”"}
    </Text>

    {/* attribution */}
    <Box x={968} y={964} w={48} h={48} fill="var(--ox-accent2)" radius={24} z={3} />
    <Text x={968} y={964} w={48} h={48} align="center" valign="center" size={20} weight={800} color="var(--ox-fg)" z={4}>
      MR
    </Text>
    <Text x={1036} y={966} w={760} size={22} weight={700} color="var(--ox-light, #ffffff)" z={3}>
      Maya Reyes
    </Text>
    <Text x={1036} y={996} w={760} size={20} weight={500} color="#c3cdfb" z={3}>
      VP of Engineering, Volta
    </Text>
  </>
);
Main.id = 'electric-update';
Main.label = 'Electric Update Keynote';

export const design: DesignSystem = {
  palette: {
    bg: '#ffffff',
    fg: '#0a0a0a',
    muted: '#c7cdd6',
    accent: '#4361ee',
    accent2: '#d6ff3d',
    surface: '#f3f5fb',
  },
  fonts: {
    display: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    body: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 18,
};
export const meta: DesignMeta = {
  title: 'Volta 4.0 — Product Update',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1920, h: 1080 };
export default [Main] satisfies Scene[];
