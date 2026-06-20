import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ── Top cobalt header band ───────────────────────────── */}
    <Box x={0} y={0} w={1080} h={250} fill="var(--ox-accent)" />

    {/* Eyebrow inside the cobalt band */}
    <Text x={80} y={64} w={920} size={26} weight={800} color="var(--ox-bg)" uppercase letterSpacing={10} font="body">
      Est. 2014 · Pacific Coast
    </Text>

    {/* Club name lockup in the band */}
    <Text x={80} y={108} w={920} size={84} weight={800} color="var(--ox-bg)" lineHeight={0.92} font="display" letterSpacing={1}>
      Riptide Surf Club
    </Text>

    {/* Thin paper rule under the wordmark */}
    <Line x={84} y={210} w={360} thickness={4} color="var(--ox-bg)" />

    {/* ── Cream main field is the artboard bg ──────────────── */}

    {/* Big interlocking cobalt corner block (signature color-block) */}
    <Box x={0} y={250} w={300} h={360} fill="var(--ox-accent)" />
    <Box x={0} y={610} w={300} h={120} fill="var(--ox-accent2)" />

    {/* Vertical season label inside the cobalt corner block */}
    <Text x={-117} y={416} w={360} size={40} weight={800} color="var(--ox-bg)" uppercase letterSpacing={8} font="display" rotate={-90} align="center">
      Sessions
    </Text>

    {/* ── Hero headline ────────────────────────────────────── */}
    <Text x={340} y={300} w={680} size={36} weight={800} color="var(--ox-accent2)" uppercase letterSpacing={6} font="body">
      Summer
    </Text>
    <Text x={336} y={350} w={700} size={210} weight={800} color="var(--ox-fg)" lineHeight={0.84} font="display" letterSpacing={-2}>
      {"Catch\nthe\nSwell"}
    </Text>

    {/* Flat geometric wave motif — stacked chunky bars */}
    <Box x={340} y={912} w={620} h={20} fill="var(--ox-accent)" />
    <Box x={340} y={946} w={460} h={20} fill="var(--ox-accent2)" />
    <Box x={340} y={980} w={300} h={20} fill="var(--ox-accent)" />

    {/* Cobalt circle accent (sun / wax disc) bleeding off right edge */}
    <Ellipse x={1000} y={270} w={300} h={300} fill="var(--ox-accent)" />
    <Ellipse x={1060} y={330} w={180} h={180} fill="var(--ox-bg)" />

    {/* ── Lower info panel: paper mount carries the details ── */}
    <Box x={80} y={1060} w={920} h={210} fill="var(--ox-surface)" borderColor="var(--ox-fg)" borderWidth={4} radius={0} />

    {/* Left detail column */}
    <Text x={120} y={1092} w={300} size={22} weight={800} color="var(--ox-accent)" uppercase letterSpacing={4} font="body">
      When
    </Text>
    <Text x={120} y={1122} w={320} size={36} weight={800} color="var(--ox-fg)" lineHeight={1.0} font="display">
      {"July 11 – Aug 30\nSat & Sun · 7AM"}
    </Text>

    {/* Divider rule inside panel */}
    <Line x={460} y={1092} w={1} h={148} thickness={3} color="var(--ox-fg)" rotate={90} />
    <Box x={459} y={1092} w={3} h={148} fill="var(--ox-fg)" />

    {/* Right detail column */}
    <Text x={500} y={1092} w={300} size={22} weight={800} color="var(--ox-accent)" uppercase letterSpacing={4} font="body">
      Where
    </Text>
    <Text x={500} y={1122} w={240} size={18} weight={800} color="var(--ox-fg)" lineHeight={1.0} font="display">
      {"Cobalt Bay Pier\nLineup 4 · All levels"}
    </Text>

    {/* CTA cobalt button bleeding into the panel */}
    <Box x={760} y={1090} w={200} h={152} fill="var(--ox-accent)">
      <Text x={0} y={36} w={200} size={30} weight={800} color="var(--ox-bg)" align="center" uppercase letterSpacing={2} font="display">
        {"Book\na\nBoard"}
      </Text>
    </Box>

    {/* Footer URL strip on cream */}
    <Text x={80} y={1300} w={920} size={22} weight={700} color="var(--ox-fg)" uppercase letterSpacing={6} font="body" align="center">
      riptidesurf.club · @riptidesurfclub · drop in anytime
    </Text>
  </>
);
Main.id = 'riptide-surf';
Main.label = 'Riptide Surf Club';

export const design: DesignSystem = {
  palette: {
    bg: '#FDF0E0',
    fg: '#1A2240',
    muted: '#8A93B8',
    accent: '#375DFE',
    accent2: '#2741C0',
    surface: '#FFFFFF',
  },
  fonts: {
    display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 0,
};
export const meta: DesignMeta = {
  title: 'Riptide Surf Club — Summer Sessions',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1350 };
export default [Main] satisfies Scene[];
