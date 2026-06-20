import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Soft inset surface framing the whole card */}
    <Box x={56} y={56} w={968} h={1238} fill="var(--ox-surface)" radius={14} borderColor="var(--ox-fg)" borderWidth={2} />

    {/* Faint oversized steam-ring motif, top right, structure not color */}
    <Ellipse x={748} y={108} w={200} h={200} fill="none" borderColor="var(--ox-muted)" borderWidth={2} opacity={0.55} />
    <Ellipse x={788} y={148} w={120} h={120} fill="none" borderColor="var(--ox-muted)" borderWidth={2} opacity={0.45} />

    {/* Kicker */}
    <Text x={108} y={132} w={700} size={24} weight={600} color="var(--ox-muted)" font="body" uppercase letterSpacing={10}>
      Est. 2014 · Pour-Over House
    </Text>

    {/* Focal headline */}
    <Text x={104} y={172} w={840} size={138} weight={700} lineHeight={0.9} font="display">
      Autumn
    </Text>
    <Text x={104} y={306} w={840} size={138} weight={700} lineHeight={0.9} font="display">
      Menu
    </Text>

    {/* Sub-lead */}
    <Text x={108} y={468} w={760} size={28} weight={400} color="var(--ox-muted)" font="body" lineHeight={1.45} italic>
      A small seasonal pour, stirred slow. Espresso, spice, and warm cream — served from first frost through the long evenings.
    </Text>

    {/* Top divider */}
    <Line x={108} y={584} w={864} thickness={2} color="var(--ox-fg)" />

    {/* ── Item 1 ── */}
    <Text x={108} y={618} w={620} size={44} weight={600} font="display" color="var(--ox-fg)">
      Maple Macchiato
    </Text>
    <Text x={108} y={674} w={620} size={23} weight={400} color="var(--ox-muted)" font="body" lineHeight={1.3}>
      Double ristretto, toasted maple, steamed cream
    </Text>
    <Text x={812} y={620} w={160} size={44} weight={600} font="display" align="right" color="var(--ox-fg)">
      6.50
    </Text>
    <Line x={108} y={732} w={864} thickness={1} color="var(--ox-muted)" dash="2 8" opacity={0.7} />

    {/* ── Item 2 ── */}
    <Text x={108} y={758} w={620} size={44} weight={600} font="display" color="var(--ox-fg)">
      Cinnamon Cortado
    </Text>
    <Text x={108} y={814} w={620} size={23} weight={400} color="var(--ox-muted)" font="body" lineHeight={1.3}>
      Equal parts espresso and milk, ground cassia
    </Text>
    <Text x={812} y={760} w={160} size={44} weight={600} font="display" align="right" color="var(--ox-fg)">
      5.25
    </Text>
    <Line x={108} y={872} w={864} thickness={1} color="var(--ox-muted)" dash="2 8" opacity={0.7} />

    {/* ── Item 3 ── */}
    <Text x={108} y={898} w={620} size={44} weight={600} font="display" color="var(--ox-fg)">
      Brown Butter Latte
    </Text>
    <Text x={108} y={954} w={620} size={23} weight={400} color="var(--ox-muted)" font="body" lineHeight={1.3}>
      Nutty browned butter, vanilla, micro-foam
    </Text>
    <Text x={812} y={900} w={160} size={44} weight={600} font="display" align="right" color="var(--ox-fg)">
      6.00
    </Text>
    <Line x={108} y={1012} w={864} thickness={1} color="var(--ox-muted)" dash="2 8" opacity={0.7} />

    {/* ── Item 4 ── */}
    <Text x={108} y={1038} w={620} size={44} weight={600} font="display" color="var(--ox-fg)">
      Spiced Cream Cold Brew
    </Text>
    <Text x={108} y={1094} w={620} size={23} weight={400} color="var(--ox-muted)" font="body" lineHeight={1.3}>
      18-hour cold brew, clove and cardamom cream
    </Text>
    <Text x={812} y={1040} w={160} size={44} weight={600} font="display" align="right" color="var(--ox-fg)">
      6.75
    </Text>
    <Line x={108} y={1152} w={864} thickness={1} color="var(--ox-muted)" dash="2 8" opacity={0.7} />

    {/* ── Item 5 ── */}
    <Text x={108} y={1178} w={620} size={44} weight={600} font="display" color="var(--ox-fg)">
      Almond Affogato
    </Text>
    <Text x={108} y={1234} w={620} size={23} weight={400} color="var(--ox-muted)" font="body" lineHeight={1.3}>
      Toasted almond gelato drowned in espresso
    </Text>
    <Text x={812} y={1180} w={160} size={44} weight={600} font="display" align="right" color="var(--ox-fg)">
      7.00
    </Text>

    {/* Footer mark */}
    <Text x={108} y={1300} w={864} size={20} weight={500} color="var(--ox-muted)" font="body" uppercase letterSpacing={6} align="center">
      The Slow Pour · Corner of Birch & Main · Open till dusk
    </Text>
  </>
);
Main.id = 'macchiato-menu';
Main.label = 'Autumn Menu';

export const design: DesignSystem = {
  palette: {
    bg: '#EDE7DD',
    fg: '#25211B',
    muted: '#6E6558',
    accent: '#9A917F',
    accent2: '#9A917F',
    surface: '#E5DECF',
  },
  fonts: {
    display: "'Fraunces', Georgia, serif",
    body: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 14,
};
export const meta: DesignMeta = { title: 'Autumn Menu', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1350 };
export default [Main] satisfies Scene[];
