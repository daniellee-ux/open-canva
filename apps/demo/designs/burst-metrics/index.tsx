import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ===== Board frame ===== */}
    <Box x={48} y={48} w={1824} h={984} fill="transparent" radius={28} borderColor="var(--ox-fg)" borderWidth={6} z={1} />

    {/* ===== Decorative bursts ===== */}
    <Ellipse x={1560} y={-90} w={360} h={360} fill="var(--ox-accent)" opacity={0.55} z={0} />
    <Ellipse x={-80} y={760} w={320} h={320} fill="var(--ox-accent2)" opacity={0.5} z={0} />

    {/* ===== Header band ===== */}
    <Box x={96} y={96} w={1728} h={196} fill="var(--ox-fg)" radius={20} z={2} />
    <Box x={120} y={120} w={116} h={148} fill="var(--ox-accent)" radius={14} borderColor="var(--ox-bg)" borderWidth={4} z={3}>
      <Text x={0} y={0} w={116} h={148} align="center" valign="center" size={70} weight={800} color="#1E1E1E" font="display">
        Q3
      </Text>
    </Box>
    <Text x={238} y={128} w={1100} size={84} weight={800} color="var(--ox-bg)" font="display" lineHeight={0.95}>
      Metrics That Shout
    </Text>
    <Text x={240} y={224} w={900} size={28} weight={600} color="var(--ox-surface)" uppercase letterSpacing={6} font="body">
      Growth Report · Jul–Sep 2026
    </Text>
    <Box x={1500} y={142} w={300} h={104} fill="var(--ox-accent)" radius={52} borderColor="var(--ox-bg)" borderWidth={3} z={3}>
      <Text x={0} y={0} w={300} h={104} align="center" valign="center" size={30} weight={800} color="#1E1E1E" font="display" uppercase letterSpacing={2}>
        All-time high
      </Text>
    </Box>

    {/* ===== Stat block 1 — Revenue (big lavender feature) ===== */}
    <Box x={96} y={328} w={862} h={392} fill="var(--ox-accent2)" radius={22} borderColor="var(--ox-fg)" borderWidth={6} z={2} />
    <Text x={132} y={362} w={560} size={32} weight={700} color="#1E1E1E" font="display" uppercase letterSpacing={4}>
      Total Revenue
    </Text>
    <Box x={690} y={346} w={228} h={70} fill="var(--ox-accent)" radius={35} borderColor="var(--ox-fg)" borderWidth={4} z={3}>
      <Text x={0} y={0} w={228} h={70} align="center" valign="center" size={30} weight={800} color="#1E1E1E" font="display">
        ▲ 38.4%
      </Text>
    </Box>
    <Text x={128} y={418} w={820} size={210} weight={800} color="#1E1E1E" font="display" lineHeight={0.9} letterSpacing={-4}>
      $4.82M
    </Text>
    <Line x={132} y={648} w={794} thickness={3} color="var(--ox-fg)" z={3} />
    <Text x={132} y={668} w={794} size={26} weight={600} color="#1E1E1E" font="body">
      Up from $3.48M last quarter — 11 straight months of gains.
    </Text>

    {/* ===== Stat block 2 — New Customers (ink card, role-swap) ===== */}
    <Box x={994} y={328} w={830} h={392} fill="var(--ox-fg)" radius={22} borderColor="var(--ox-fg)" borderWidth={6} z={2} />
    <Text x={1030} y={362} w={520} size={32} weight={700} color="var(--ox-bg)" font="display" uppercase letterSpacing={4}>
      New Customers
    </Text>
    <Box x={1556} y={346} w={228} h={70} fill="var(--ox-accent2)" radius={35} borderColor="var(--ox-bg)" borderWidth={3} z={3}>
      <Text x={0} y={0} w={228} h={70} align="center" valign="center" size={30} weight={800} color="#1E1E1E" font="display">
        ▲ 5.2K
      </Text>
    </Box>
    <Text x={1026} y={418} w={780} size={210} weight={800} color="var(--ox-accent)" font="display" lineHeight={0.9} letterSpacing={-4}>
      18,940
    </Text>
    <Line x={1030} y={648} w={760} thickness={3} color="var(--ox-surface)" z={3} />
    <Text x={1030} y={668} w={760} size={26} weight={600} color="var(--ox-surface)" font="body">
      Net-new signups across 27 markets, led by EMEA expansion.
    </Text>

    {/* ===== Stat block 3 — Retention (lavender) ===== */}
    <Box x={96} y={756} w={560} h={236} fill="var(--ox-surface)" radius={22} borderColor="var(--ox-fg)" borderWidth={6} z={2} />
    <Text x={128} y={788} w={420} size={28} weight={700} color="#1E1E1E" font="display" uppercase letterSpacing={3}>
      Net Retention
    </Text>
    <Text x={124} y={822} w={520} size={140} weight={800} color="#1E1E1E" font="display" lineHeight={0.9} letterSpacing={-3}>
      127%
    </Text>
    <Box x={470} y={762} w={156} h={62} fill="var(--ox-accent)" radius={31} borderColor="var(--ox-fg)" borderWidth={4} z={3}>
      <Text x={0} y={0} w={156} h={62} align="center" valign="center" size={28} weight={800} color="#1E1E1E" font="display">
        ▲ 9 pts
      </Text>
    </Box>

    {/* ===== Stat block 4 — NPS (mint live accent) ===== */}
    <Box x={688} y={756} w={560} h={236} fill="var(--ox-accent)" radius={22} borderColor="var(--ox-fg)" borderWidth={6} z={2} />
    <Text x={720} y={788} w={420} size={28} weight={700} color="#1E1E1E" font="display" uppercase letterSpacing={3}>
      NPS Score
    </Text>
    <Text x={716} y={822} w={520} size={140} weight={800} color="#1E1E1E" font="display" lineHeight={0.9} letterSpacing={-3}>
      +72
    </Text>
    <Box x={1058} y={794} w={164} h={62} fill="var(--ox-bg)" radius={31} borderColor="var(--ox-fg)" borderWidth={4} z={3}>
      <Text x={0} y={0} w={164} h={62} align="center" valign="center" size={26} weight={800} color="#1E1E1E" font="display">
        World-class
      </Text>
    </Box>

    {/* ===== Stat block 5 — Churn (ink mini, role-swap) ===== */}
    <Box x={1280} y={756} w={544} h={236} fill="var(--ox-fg)" radius={22} borderColor="var(--ox-fg)" borderWidth={6} z={2} />
    <Text x={1312} y={788} w={420} size={28} weight={700} color="var(--ox-bg)" font="display" uppercase letterSpacing={3}>
      Monthly Churn
    </Text>
    <Text x={1308} y={822} w={520} size={140} weight={800} color="var(--ox-accent)" font="display" lineHeight={0.9} letterSpacing={-3}>
      1.3%
    </Text>
    <Box x={1646} y={794} w={148} h={62} fill="var(--ox-accent)" radius={31} borderColor="var(--ox-bg)" borderWidth={3} z={3}>
      <Text x={0} y={0} w={148} h={62} align="center" valign="center" size={28} weight={800} color="#1E1E1E" font="display">
        ▼ 0.6%
      </Text>
    </Box>
  </>
);
Main.id = 'burst-metrics';
Main.label = 'Q3 Burst Metrics';

export const design: DesignSystem = {
  palette: {
    bg: '#FBD65A',
    fg: '#1E1E1E',
    muted: '#BD89E4',
    accent: '#AAE4BA',
    accent2: '#CFACE8',
    surface: '#CFACE8',
  },
  fonts: {
    display: "'Archivo Black', 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 18,
};
export const meta: DesignMeta = { title: 'Q3 Burst Metrics', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1920, h: 1080 };
export default [Main] satisfies Scene[];
