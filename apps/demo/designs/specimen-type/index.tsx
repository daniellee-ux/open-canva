import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* paper field is the artboard bg; a few rotated label blocks for depth */}
    <Box x={812} y={120} w={300} h={120} fill="var(--ox-accent2)" rotate={-7} z={1} />
    <Box x={-40} y={1066} w={360} h={120} fill="var(--ox-accent)" rotate={5} z={1} />

    {/* top rule + foundry mark */}
    <Line x={84} y={96} w={912} thickness={4} color="var(--ox-fg)" z={2} />
    <Text x={84} y={116} w={500} size={26} weight={800} color="var(--ox-fg)" uppercase letterSpacing={6} font="display">
      Halvar Foundry
    </Text>
    <Text x={596} y={116} w={400} size={26} weight={600} color="var(--ox-fg)" uppercase letterSpacing={6} align="right" font="body">
      Vol. 07 — 2026
    </Text>

    {/* category label on yellow block */}
    <Box x={84} y={188} w={372} h={96} fill="var(--ox-accent2)" z={3}>
      <Text x={0} y={0} w={372} h={96} align="center" valign="center" size={40} weight={800} color="var(--ox-fg)" uppercase letterSpacing={4} font="display">
        Typeface
      </Text>
    </Box>
    <Text x={476} y={196} w={520} size={34} weight={600} color="var(--ox-fg)" lineHeight={1.05} font="body">
      Grotesk Display{'\n'}Variable · 9 weights
    </Text>

    {/* THE focal letterform on the green block */}
    <Box x={84} y={320} w={912} h={620} fill="var(--ox-accent)" z={3} shadow="0 20px 48px rgba(0,0,0,0.28)" />
    <Text x={84} y={236} w={912} h={760} align="center" valign="center" size={720} weight={800} color="var(--ox-fg)" lineHeight={0.9} font="display">
      G
    </Text>
    {/* glyph index tags inside the block corners */}
    <Text x={120} y={356} w={200} size={30} weight={700} color="var(--ox-fg)" uppercase letterSpacing={3} font="body">
      U+0047
    </Text>
    <Text x={760} y={356} w={200} size={30} weight={700} color="var(--ox-fg)" uppercase letterSpacing={3} align="right" font="body">
      Lat / Cap
    </Text>
    <Text x={760} y={880} w={200} size={30} weight={700} color="var(--ox-fg)" align="right" font="body">
      064 / 240
    </Text>

    {/* the quote, set large on paper */}
    <Line x={84} y={992} w={120} thickness={6} color="var(--ox-accent)" z={2} />
    <Text x={84} y={1024} w={912} size={68} weight={800} color="var(--ox-fg)" lineHeight={1.0} font="display">
      “Letters are the{'\n'}skeleton of a voice.”
    </Text>
    <Text x={84} y={1238} w={912} size={28} weight={600} color="var(--ox-muted)" uppercase letterSpacing={4} font="body">
      — Margaux Pellet, Punchcutter
    </Text>

    {/* small specimen alphabet strip on a blue block */}
    <Box x={596} y={1224} w={400} h={64} fill="var(--ox-accent2)" rotate={-3} z={2}>
      <Text x={0} y={0} w={400} h={64} align="center" valign="center" size={30} weight={800} color="var(--ox-fg)" letterSpacing={5} font="display">
        AaBbGg 0123
      </Text>
    </Box>
  </>
);
Main.id = 'specimen-type';
Main.label = 'Type Specimen — G';

export const design: DesignSystem = {
  palette: {
    bg: '#F3F3F3',
    fg: '#2E302E',
    muted: '#6B6E6B',
    accent: '#3EC06A',
    accent2: '#FBEF4A',
    surface: '#E7E7E3',
  },
  fonts: {
    display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 0,
};
export const meta: DesignMeta = { title: 'Type Specimen — G', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1350 };
export default [Main] satisfies Scene[];
