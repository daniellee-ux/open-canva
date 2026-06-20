import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Airy lime decoration bleeding off the top-right corner */}
    <Ellipse x={760} y={-220} w={620} h={620} fill="var(--ox-accent2)" opacity={0.55} z={1} />
    <Ellipse x={930} y={70} w={120} h={120} fill="var(--ox-accent)" opacity={0.12} z={2} />

    {/* Top kicker on the white page — blue ink */}
    <Text x={80} y={92} w={940} size={26} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={10} z={5}>
      Riverside Community Co-op presents
    </Text>

    {/* Thin lime rule under the kicker */}
    <Line x={84} y={146} w={250} thickness={6} color="var(--ox-accent2)" z={5} />

    {/* Oversized display headline — blue carries the type */}
    <Text x={78} y={172} w={940} size={170} weight={800} lineHeight={0.9} color="var(--ox-accent)" font="display" z={6}>
      {'Sunday\nFarmers\nMarket'}
    </Text>

    {/* Lime date chip — the punch */}
    <Box x={80} y={696} w={620} h={92} fill="var(--ox-accent2)" radius={8} z={6}>
      <Text x={0} y={0} w={620} h={92} align="center" valign="center" size={38} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={3}>
        Every Sunday · 8am–1pm
      </Text>
    </Box>

    {/* Bold blue surface band carrying the details — text in lime + white */}
    <Box x={0} y={800} w={1080} h={248} fill="var(--ox-accent)" radius={0} z={5}>
      {/* Big lime display numeral / focal stat on the blue fill */}
      <Text x={56} y={40} w={460} size={150} weight={800} lineHeight={0.9} color="var(--ox-accent2)" font="display">
        45+
      </Text>
      <Text x={62} y={196} w={440} size={28} weight={600} color="var(--ox-bg)" font="body" uppercase letterSpacing={4}>
        local growers & makers
      </Text>

      {/* Thin lime divider rule */}
      <Line x={560} y={56} w={4} h={136} thickness={4} color="var(--ox-accent2)" rotate={90} />

      {/* Right column of market details in white body type */}
      <Text x={596} y={56} w={440} size={30} weight={700} color="var(--ox-accent2)" font="body">
        Maple Street Green
      </Text>
      <Text x={596} y={104} w={440} size={26} weight={500} color="var(--ox-bg)" font="body" lineHeight={1.25}>
        {'Fresh produce · sourdough\nflowers · coffee · live music'}
      </Text>
      <Text x={596} y={196} w={440} size={24} weight={600} color="var(--ox-accent2)" font="body" uppercase letterSpacing={3}>
        riversidemarket.org
      </Text>
    </Box>

    {/* Free-entry tag — lime accent chip on white, top-right */}
    <Ellipse x={812} y={420} w={196} h={196} fill="var(--ox-accent)" z={6} />
    <Text x={812} y={478} w={196} size={30} weight={800} align="center" color="var(--ox-accent2)" font="display" uppercase letterSpacing={2} z={7}>
      {'Free\nEntry'}
    </Text>
  </>
);
Main.id = 'avocado-market';
Main.label = 'Sunday Farmers Market';

export const design: DesignSystem = {
  palette: {
    bg: '#FFFFFF',
    fg: '#0055A4',
    muted: '#9CC0E0',
    accent: '#0055A4',
    accent2: '#DCF4A2',
    surface: '#F2F8FF',
  },
  fonts: {
    display: "'Archivo Black', 'Syne', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 8,
};
export const meta: DesignMeta = {
  title: 'Sunday Farmers Market',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
