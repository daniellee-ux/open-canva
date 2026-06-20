import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* solid cobalt edge bar climbing the right side */}
    <Box x={1012} y={0} w={68} h={1350} fill="var(--ox-accent)" z={2} />

    {/* recessed deeper-blush block, top-left */}
    <Box x={0} y={0} w={1012} h={236} fill="var(--ox-accent2)" z={1} />

    {/* top masthead row */}
    <Text x={64} y={70} w={620} size={30} weight={800} color="var(--ox-fg)" font="display" uppercase letterSpacing={6}>
      Maison Atelier
    </Text>
    <Text x={64} y={120} w={620} size={26} weight={500} color="var(--ox-fg)" font="body" letterSpacing={2}>
      The Spring Summer Edit — Issue No. 14
    </Text>
    <Text x={648} y={80} w={300} h={90} align="right" valign="center" size={26} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
      Paris · Milan{'\n'}06.2026
    </Text>

    {/* cobalt rule under masthead */}
    <Line x={64} y={196} w={884} thickness={3} color="var(--ox-accent)" z={3} />

    {/* eyebrow */}
    <Text x={64} y={296} w={700} size={34} weight={800} color="var(--ox-accent)" font="display" uppercase letterSpacing={10}>
      Fashion Week
    </Text>

    {/* MEGA headline */}
    <Text x={56} y={372} w={952} size={196} weight={900} color="var(--ox-fg)" font="display" lineHeight={0.82} uppercase letterSpacing={-4}>
      Spring{'\n'}Summer
    </Text>

    {/* giant year numeral as solid hero anchor */}
    <Text x={56} y={826} w={760} size={360} weight={900} color="var(--ox-accent)" font="display" lineHeight={0.78} letterSpacing={-12}>
      26
    </Text>

    {/* cobalt underline bar beneath the numeral */}
    <Box x={64} y={1188} w={520} h={16} fill="var(--ox-accent)" z={3} />

    {/* word climbing the edge, rotated vertical */}
    <Text x={788} y={830} w={520} size={68} weight={900} color="var(--ox-accent)" font="display" uppercase letterSpacing={14} rotate={-90} z={4}>
      Bloom
    </Text>

    {/* paper panel — collections list (right of numeral) */}
    <Box x={636} y={856} w={332} h={304} fill="var(--ox-surface)" radius={0} borderColor="var(--ox-accent)" borderWidth={4} z={3}>
      <Text x={28} y={26} w={276} size={21} weight={800} color="var(--ox-fg)" font="display" uppercase letterSpacing={2}>
        On The Runway
      </Text>
      <Line x={28} y={64} w={276} thickness={3} color="var(--ox-accent)" />
      <Text x={28} y={88} w={276} size={24} weight={600} color="var(--ox-fg)" font="body" lineHeight={1.55}>
        01 — Tailored Linen{'\n'}02 — Cobalt Satin{'\n'}03 — Blush Resort{'\n'}04 — Sculpted Knits{'\n'}05 — Open Atelier
      </Text>
    </Box>

    {/* footer paper banner */}
    <Box x={64} y={1232} w={904} h={84} fill="var(--ox-surface)" radius={0} borderColor="var(--ox-accent)" borderWidth={4} z={3}>
      <Text x={28} y={0} w={520} h={84} valign="center" size={24} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
        Spotlight: Cobalt Bloom
      </Text>
      <Text x={556} y={0} w={320} h={84} align="right" valign="center" size={24} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
        maison-atelier.co
      </Text>
    </Box>
  </>
);
Main.id = 'cobalt-fashion';
Main.label = 'Cobalt Bloom Fashion Week SS26';

export const design: DesignSystem = {
  palette: {
    bg: '#DDA8A2',
    fg: '#171717',
    muted: '#B98A84',
    accent: '#4746C6',
    accent2: '#CE968F',
    surface: '#F4EFE9',
  },
  fonts: {
    display: "'Archivo Black', 'Syne', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 0,
};
export const meta: DesignMeta = {
  title: 'Cobalt Bloom Fashion Week SS26',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1350 };
export default [Main] satisfies Scene[];
