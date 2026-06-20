import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ── soft lime bleed decoration top-right ── */}
    <Ellipse x={1480} y={-260} w={760} h={760} fill="var(--ox-accent)" opacity={0.55} z={0} />
    <Ellipse x={1620} y={620} w={520} h={520} fill="var(--ox-accent)" opacity={0.4} z={0} />

    {/* ── thin top rule + brand row ── */}
    <Line x={96} y={84} w={1728} thickness={2} color="var(--ox-fg)" z={1} />

    <Box x={96} y={112} w={56} h={56} radius={14} fill="var(--ox-fg)" z={2}>
      <Text x={0} y={0} w={56} h={56} align="center" valign="center" size={30} weight={900} color="var(--ox-accent)" font="display">
        S
      </Text>
    </Box>
    <Text x={168} y={120} w={300} h={44} valign="center" size={32} weight={900} color="var(--ox-fg)" font="display" letterSpacing={1}>
      Ship
    </Text>

    {/* nav-ish chips */}
    <Box x={1330} y={116} w={150} h={48} radius={24} fill="none" borderColor="var(--ox-muted)" borderWidth={2} z={2}>
      <Text x={0} y={0} w={150} h={48} align="center" valign="center" size={20} weight={600} color="var(--ox-fg)" font="body">
        Changelog
      </Text>
    </Box>
    <Box x={1494} y={116} w={120} h={48} radius={24} fill="none" borderColor="var(--ox-muted)" borderWidth={2} z={2}>
      <Text x={0} y={0} w={120} h={48} align="center" valign="center" size={20} weight={600} color="var(--ox-fg)" font="body">
        Pricing
      </Text>
    </Box>
    <Box x={1628} y={116} w={196} h={48} radius={24} fill="var(--ox-fg)" z={2}>
      <Text x={0} y={0} w={196} h={48} align="center" valign="center" size={20} weight={700} color="var(--ox-accent)" font="body">
        Sign in →
      </Text>
    </Box>

    {/* ── eyebrow pill ── */}
    <Box x={96} y={250} w={372} h={50} radius={25} fill="var(--ox-fg)" z={2}>
      <Text x={0} y={0} w={372} h={50} align="center" valign="center" size={19} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={3}>
        ● Now in public beta
      </Text>
    </Box>

    {/* ── HERO headline (focal point) ── */}
    <Text x={92} y={318} w={1180} size={156} weight={900} lineHeight={0.9} color="var(--ox-fg)" font="display" letterSpacing={-3}>
      {'Ship code\nat lightspeed.'}
    </Text>

    {/* ── sub copy ── */}
    <Text x={98} y={636} w={880} size={30} weight={500} lineHeight={1.35} color="var(--ox-muted)" font="body">
      The dev platform that builds, previews and deploys every push in under nine seconds — no YAML, no babysitting, no cold starts.
    </Text>

    {/* ── CTA buttons ── */}
    <Box x={98} y={848} w={330} h={86} radius={18} fill="var(--ox-fg)" z={3}>
      <Text x={0} y={0} w={330} h={86} align="center" valign="center" size={28} weight={800} color="var(--ox-accent)" font="display">
        Start deploying
      </Text>
    </Box>
    <Box x={450} y={848} w={300} h={86} radius={18} fill="none" borderColor="var(--ox-fg)" borderWidth={2} z={3}>
      <Text x={0} y={0} w={300} h={86} align="center" valign="center" size={28} weight={700} color="var(--ox-fg)" font="display">
        Read the docs
      </Text>
    </Box>

    {/* trust line */}
    <Text x={100} y={968} w={780} size={20} weight={600} color="var(--ox-muted)" font="body" uppercase letterSpacing={2}>
      Trusted by 14,000+ teams · Vercel · Linear · Raycast · Retool
    </Text>

    {/* ════════════ RIGHT: white product / terminal card ════════════ */}
    <Box x={1108} y={252} w={716} h={520} radius={20} fill="#ffffff" borderColor="var(--ox-muted)" borderWidth={2} shadow="0 24px 60px rgba(10,10,5,0.18)" z={4}>
      {/* terminal chrome dots */}
      <Ellipse x={28} y={28} w={16} h={16} fill="#FF5F56" z={1} />
      <Ellipse x={52} y={28} w={16} h={16} fill="#FFBD2E" z={1} />
      <Ellipse x={76} y={28} w={16} h={16} fill="#27C93F" z={1} />
      <Text x={120} y={26} w={400} h={22} valign="center" size={18} weight={600} color="var(--ox-muted)" font="body">
        ship deploy — production
      </Text>

      <Line x={0} y={72} w={716} thickness={2} color="#ECEBDF" z={1} />

      {/* log lines */}
      <Text x={32} y={104} w={650} size={22} weight={500} color="var(--ox-muted)" font="body">
        $ ship up
      </Text>
      <Text x={32} y={148} w={650} size={22} weight={600} color="var(--ox-fg)" font="body">
        ✓ Building 312 modules
      </Text>
      <Text x={32} y={192} w={650} size={22} weight={600} color="var(--ox-fg)" font="body">
        ✓ Edge functions warmed (12 regions)
      </Text>
      <Text x={32} y={236} w={650} size={22} weight={600} color="var(--ox-fg)" font="body">
        ✓ Preview ready · pr-204.ship.dev
      </Text>

      {/* deploy success chip */}
      <Box x={32} y={300} w={652} h={88} radius={14} fill="var(--ox-accent)" z={1}>
        <Text x={28} y={0} w={400} h={88} valign="center" size={28} weight={900} color="var(--ox-fg)" font="display">
          Deployed in 8.4s
        </Text>
        <Box x={476} y={22} w={148} h={44} radius={22} fill="var(--ox-fg)" z={1}>
          <Text x={0} y={0} w={148} h={44} align="center" valign="center" size={18} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={1}>
            Live
          </Text>
        </Box>
      </Box>

      {/* footer meta */}
      <Text x={32} y={420} w={650} size={20} weight={500} color="var(--ox-muted)" font="body">
        commit a1f9c2 · main · auto-rollback armed
      </Text>
    </Box>

    {/* ── three flat metric pills under the card ── */}
    <Box x={1108} y={808} w={224} h={156} radius={16} fill="#ffffff" borderColor="var(--ox-muted)" borderWidth={2} z={4}>
      <Text x={24} y={26} w={180} size={56} weight={900} color="var(--ox-fg)" font="display">
        8.4s
      </Text>
      <Text x={24} y={102} w={180} size={19} weight={600} color="var(--ox-muted)" font="body" uppercase letterSpacing={1}>
        Avg deploy
      </Text>
    </Box>
    <Box x={1354} y={808} w={224} h={156} radius={16} fill="var(--ox-fg)" z={4}>
      <Text x={20} y={32} w={200} size={48} weight={900} color="var(--ox-accent)" font="display">
        99.99%
      </Text>
      <Text x={24} y={102} w={180} size={19} weight={600} color="var(--ox-accent)" font="body" uppercase letterSpacing={1}>
        Uptime
      </Text>
    </Box>
    <Box x={1600} y={808} w={224} h={156} radius={16} fill="#ffffff" borderColor="var(--ox-muted)" borderWidth={2} z={4}>
      <Text x={24} y={26} w={180} size={56} weight={900} color="var(--ox-fg)" font="display">
        0
      </Text>
      <Text x={24} y={102} w={180} size={19} weight={600} color="var(--ox-muted)" font="body" uppercase letterSpacing={1}>
        Config files
      </Text>
    </Box>

    {/* ── bottom rule ── */}
    <Line x={96} y={1014} w={1728} thickness={2} color="var(--ox-fg)" z={1} />
  </>
);
Main.id = 'lime-saas';
Main.label = 'Ship — Launch Slide';

export const design: DesignSystem = {
  palette: {
    bg: '#EEFA79',
    fg: '#0A0A05',
    muted: '#9A9A86',
    accent: '#EEFA79',
    accent2: '#FFFFF2',
    surface: '#FFFFF2',
  },
  fonts: {
    display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 16,
};
export const meta: DesignMeta = { title: 'Ship — Launch Slide', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1920, h: 1080 };
export default [Main] satisfies Scene[];
