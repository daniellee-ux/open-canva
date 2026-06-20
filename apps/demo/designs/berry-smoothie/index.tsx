import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* periwinkle soft field, top-left bleed */}
    <Ellipse x={-180} y={-200} w={620} h={620} fill="var(--ox-accent2)" opacity={0.55} />
    {/* periwinkle dot accent, bottom-right */}
    <Ellipse x={760} y={840} w={180} h={180} fill="var(--ox-accent2)" opacity={0.7} />
    <Ellipse x={930} y={930} w={90} h={90} fill="var(--ox-muted)" />

    {/* ── Header band ─────────────────────────────── */}
    <Box x={64} y={64} w={952} h={88} fill="var(--ox-surface)" radius={20} />
    <Ellipse x={84} y={84} w={48} h={48} fill="var(--ox-accent)" />
    <Text x={92} y={84} w={32} h={48} align="center" valign="center" size={26} weight={800} color="var(--ox-surface)">
      B
    </Text>
    <Text x={148} y={64} w={400} h={88} valign="center" size={28} weight={800} color="var(--ox-accent)" font="display" letterSpacing={1}>
      Bramble & Co.
    </Text>
    <Text x={616} y={64} w={384} h={88} align="right" valign="center" size={20} weight={700} color="var(--ox-fg)" uppercase letterSpacing={3}>
      New Drop · 2026
    </Text>

    {/* ── Hero berry block ────────────────────────── */}
    <Box x={64} y={188} w={952} h={520} fill="var(--ox-accent)" radius={36} shadow="0 24px 60px rgba(110,30,58,0.35)" />

    {/* eyebrow */}
    <Text x={112} y={236} w={520} size={22} weight={800} color="var(--ox-accent2)" uppercase letterSpacing={6}>
      Cold-pressed · Vegan
    </Text>

    {/* big title */}
    <Text x={108} y={278} w={880} size={150} weight={800} lineHeight={0.86} color="var(--ox-fg)" font="display">
      {'Berry\nBliss'}
    </Text>

    {/* supporting line */}
    <Text x={112} y={604} w={520} size={26} weight={500} lineHeight={1.25} color="var(--ox-accent2)" font="body">
      Three wild berries, oat milk & a whisper of vanilla. Bottled fresh, never from concentrate.
    </Text>

    {/* glass / product motif on the right of hero */}
    <Box x={744} y={246} w={210} h={404} fill="var(--ox-accent2)" radius={28} opacity={0.95} />
    <Box x={744} y={246} w={210} h={150} fill="var(--ox-muted)" radius={28} />
    <Ellipse x={788} y={300} w={122} h={122} fill="var(--ox-fg)" opacity={0.85} />
    <Text x={744} y={336} w={210} h={56} align="center" valign="center" size={30} weight={800} color="var(--ox-accent)" font="display">
      450ml
    </Text>
    <Line x={772} y={470} w={154} thickness={4} color="var(--ox-surface)" />
    <Text x={744} y={494} w={210} h={40} align="center" valign="center" size={18} weight={700} color="var(--ox-surface)" uppercase letterSpacing={3}>
      Bottle No.
    </Text>
    <Text x={744} y={530} w={210} h={70} align="center" valign="center" size={56} weight={800} color="var(--ox-surface)" font="display">
      001
    </Text>

    {/* ── Ingredient chips ────────────────────────── */}
    <Box x={64} y={742} w={296} h={88} fill="var(--ox-surface)" radius={22} borderColor="var(--ox-accent2)" borderWidth={2}>
      <Text x={0} y={0} w={296} h={88} align="center" valign="center" size={24} weight={700} color="var(--ox-accent)">
        Blackberry
      </Text>
    </Box>
    <Box x={392} y={742} w={296} h={88} fill="var(--ox-accent)" radius={22}>
      <Text x={0} y={0} w={296} h={88} align="center" valign="center" size={24} weight={700} color="var(--ox-accent2)">
        Raspberry
      </Text>
    </Box>
    <Box x={720} y={742} w={296} h={88} fill="var(--ox-surface)" radius={22} borderColor="var(--ox-accent2)" borderWidth={2}>
      <Text x={0} y={0} w={296} h={88} align="center" valign="center" size={24} weight={700} color="var(--ox-accent)">
        Blueberry
      </Text>
    </Box>

    {/* ── Footer: price + CTA ─────────────────────── */}
    <Text x={64} y={874} w={300} size={20} weight={700} color="var(--ox-muted)" uppercase letterSpacing={3}>
      Launch price
    </Text>
    <Text x={60} y={900} w={360} size={96} weight={800} color="var(--ox-accent)" font="display" lineHeight={0.95}>
      $7
    </Text>
    <Text x={360} y={928} w={200} size={26} weight={600} color="var(--ox-muted)" font="body">
      per bottle
    </Text>

    <Box x={584} y={902} w={432} h={120} fill="var(--ox-accent)" radius={60} shadow="0 16px 36px rgba(110,30,58,0.32)">
      <Text x={0} y={0} w={432} h={120} align="center" valign="center" size={38} weight={800} color="var(--ox-accent2)">
        Order Now →
      </Text>
    </Box>
  </>
);
Main.id = 'berry-smoothie';
Main.label = 'Berry Bliss Smoothie Launch';

export const design: DesignSystem = {
  palette: {
    bg: '#FFFFFF',
    fg: '#FFFFFF',
    muted: '#9DB0E8',
    accent: '#9E2B50',
    accent2: '#C7D2F0',
    surface: '#FBF3F6',
  },
  fonts: {
    display: "'Syne', ui-sans-serif, system-ui, sans-serif",
    body: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 22,
};
export const meta: DesignMeta = {
  title: 'Berry Bliss Smoothie Launch',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
