import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ===== Background glow blooms ===== */}
    <Ellipse x={-260} y={-220} w={760} h={760} fill="radial-gradient(circle, rgba(0,255,204,0.30) 0%, rgba(0,255,204,0) 70%)" />
    <Ellipse x={640} y={1280} w={820} h={820} fill="radial-gradient(circle, rgba(255,0,170,0.28) 0%, rgba(255,0,170,0) 70%)" />
    <Ellipse x={560} y={-180} w={560} h={560} fill="radial-gradient(circle, rgba(255,0,170,0.20) 0%, rgba(255,0,170,0) 70%)" />

    {/* ===== Grid pattern ===== */}
    <Box x={0} y={0} w={1080} h={1920} fill="repeating-linear-gradient(0deg, rgba(0,255,204,0.06) 0px, rgba(0,255,204,0.06) 1px, transparent 1px, transparent 90px), repeating-linear-gradient(90deg, rgba(0,255,204,0.06) 0px, rgba(0,255,204,0.06) 1px, transparent 1px, transparent 90px)" opacity={0.9} />

    {/* ===== Particles ===== */}
    <Ellipse x={150} y={520} w={10} h={10} fill="var(--ox-accent)" opacity={0.9} shadow="0 0 16px rgba(0,255,204,0.9)" />
    <Ellipse x={910} y={420} w={7} h={7} fill="var(--ox-accent2)" opacity={0.9} shadow="0 0 14px rgba(255,0,170,0.9)" />
    <Ellipse x={820} y={700} w={6} h={6} fill="var(--ox-accent)" opacity={0.8} shadow="0 0 12px rgba(0,255,204,0.9)" />
    <Ellipse x={240} y={1180} w={8} h={8} fill="var(--ox-accent2)" opacity={0.85} shadow="0 0 14px rgba(255,0,170,0.9)" />
    <Ellipse x={90} y={870} w={5} h={5} fill="var(--ox-accent)" opacity={0.8} shadow="0 0 10px rgba(0,255,204,0.9)" />
    <Ellipse x={980} y={1120} w={9} h={9} fill="var(--ox-accent)" opacity={0.85} shadow="0 0 14px rgba(0,255,204,0.9)" />
    <Ellipse x={520} y={300} w={5} h={5} fill="var(--ox-accent2)" opacity={0.8} shadow="0 0 10px rgba(255,0,170,0.9)" />
    <Ellipse x={700} y={1550} w={7} h={7} fill="var(--ox-accent)" opacity={0.85} shadow="0 0 12px rgba(0,255,204,0.9)" />

    {/* ===== Top eyebrow chip ===== */}
    <Box x={80} y={150} w={460} h={70} fill="rgba(0,255,204,0.08)" radius={35} borderColor="var(--ox-accent)" borderWidth={1.5} shadow="0 0 28px rgba(0,255,204,0.35)">
      <Ellipse x={28} y={30} w={11} h={11} fill="var(--ox-accent)" shadow="0 0 12px rgba(0,255,204,0.9)" />
      <Text x={54} y={0} w={400} h={70} valign="center" size={24} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={5}>
        48-Hour Build Sprint
      </Text>
    </Box>

    <Text x={960} y={170} w={60} h={40} align="right" size={24} weight={800} color="var(--ox-muted)" font="body" uppercase letterSpacing={3}>
      26
    </Text>

    {/* ===== Focal title ===== */}
    <Text x={78} y={258} w={940} size={42} weight={600} color="var(--ox-muted)" font="body" uppercase letterSpacing={14}>
      Global Online + Onsite
    </Text>

    <Text x={74} y={326} w={960} size={196} weight={700} lineHeight={0.9} color="var(--ox-fg)" font="display" uppercase letterSpacing={-2} shadow="0 0 50px rgba(0,255,204,0.45)">
      Hack the
    </Text>
    <Text x={74} y={520} w={960} size={196} weight={700} lineHeight={0.9} color="var(--ox-accent)" font="display" uppercase letterSpacing={-2} shadow="0 0 60px rgba(0,255,204,0.65)">
      Future
    </Text>

    <Box x={78} y={744} w={236} h={92} fill="linear-gradient(120deg, var(--ox-accent) 0%, var(--ox-accent2) 100%)" radius={18} shadow="0 0 40px rgba(255,0,170,0.45)">
      <Text x={0} y={0} w={236} h={92} align="center" valign="center" size={70} weight={700} color="#05070f" font="display">
        2026
      </Text>
    </Box>
    <Text x={336} y={748} w={620} h={92} valign="center" size={32} weight={500} color="var(--ox-muted)" font="body" lineHeight={1.25}>
      Where builders, designers and AI engineers ship the impossible.
    </Text>

    <Line x={80} y={896} w={920} thickness={2} color="rgba(0,255,204,0.35)" />

    {/* ===== Stat cards row ===== */}
    {/* Prize */}
    <Box x={80} y={948} w={446} h={300} fill="var(--ox-surface)" radius={28} borderColor="rgba(255,0,170,0.45)" borderWidth={1.5} shadow="0 0 50px rgba(255,0,170,0.20)">
      <Text x={36} y={36} w={380} size={24} weight={700} color="var(--ox-accent2)" font="body" uppercase letterSpacing={5}>
        Prize Pool
      </Text>
      <Text x={34} y={86} w={400} size={134} weight={700} color="var(--ox-fg)" font="display" letterSpacing={-3} shadow="0 0 36px rgba(255,0,170,0.55)">
        $120K
      </Text>
      <Line x={36} y={232} w={120} thickness={3} color="var(--ox-accent2)" />
      <Text x={36} y={252} w={380} size={26} weight={500} color="var(--ox-muted)" font="body">
        Cash + cloud credits + accelerator slots
      </Text>
    </Box>

    {/* Date */}
    <Box x={554} y={948} w={446} h={300} fill="var(--ox-surface)" radius={28} borderColor="rgba(0,255,204,0.45)" borderWidth={1.5} shadow="0 0 50px rgba(0,255,204,0.20)">
      <Text x={36} y={36} w={380} size={24} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={5}>
        Mark the Date
      </Text>
      <Text x={34} y={92} w={400} size={120} weight={700} color="var(--ox-fg)" font="display" letterSpacing={-3} shadow="0 0 36px rgba(0,255,204,0.55)">
        SEP 18
      </Text>
      <Line x={36} y={232} w={120} thickness={3} color="var(--ox-accent)" />
      <Text x={36} y={252} w={380} size={26} weight={500} color="var(--ox-muted)" font="body">
        Fri 6PM to Sun 6PM, 2026 (PST)
      </Text>
    </Box>

    {/* ===== Tracks strip ===== */}
    <Text x={80} y={1296} w={920} size={24} weight={700} color="var(--ox-muted)" font="body" uppercase letterSpacing={6}>
      Tracks
    </Text>
    <Box x={80} y={1340} w={290} h={86} fill="rgba(0,255,204,0.08)" radius={43} borderColor="rgba(0,255,204,0.5)" borderWidth={1.5}>
      <Text x={0} y={0} w={290} h={86} align="center" valign="center" size={30} weight={600} color="var(--ox-accent)" font="body">
        AI Agents
      </Text>
    </Box>
    <Box x={395} y={1340} w={290} h={86} fill="rgba(255,0,170,0.08)" radius={43} borderColor="rgba(255,0,170,0.5)" borderWidth={1.5}>
      <Text x={0} y={0} w={290} h={86} align="center" valign="center" size={30} weight={600} color="var(--ox-accent2)" font="body">
        Climate Tech
      </Text>
    </Box>
    <Box x={710} y={1340} w={290} h={86} fill="rgba(0,255,204,0.08)" radius={43} borderColor="rgba(0,255,204,0.5)" borderWidth={1.5}>
      <Text x={0} y={0} w={290} h={86} align="center" valign="center" size={30} weight={600} color="var(--ox-accent)" font="body">
        Open Hardware
      </Text>
    </Box>

    {/* ===== Register CTA ===== */}
    <Box x={80} y={1520} w={920} h={170} fill="linear-gradient(120deg, var(--ox-accent) 0%, var(--ox-accent2) 100%)" radius={30} shadow="0 0 70px rgba(0,255,204,0.55)">
      <Text x={0} y={0} w={920} h={170} align="center" valign="center" size={70} weight={700} color="#05070f" font="display" uppercase letterSpacing={2}>
        Register Now
      </Text>
    </Box>

    <Text x={80} y={1726} w={920} h={60} align="center" valign="center" size={32} weight={600} color="var(--ox-fg)" font="body" letterSpacing={1}>
      hackthefuture.dev/2026
    </Text>
    <Text x={80} y={1792} w={920} h={50} align="center" valign="center" size={26} weight={500} color="var(--ox-muted)" font="body" uppercase letterSpacing={4}>
      Free entry  ·  Teams of 1 to 4  ·  Apply by Sep 1
    </Text>
  </>
);
Main.id = 'neon-hackathon';
Main.label = 'Hack the Future 2026';

export const design: DesignSystem = {
  palette: {
    bg: '#0a0f1c',
    fg: '#eafffb',
    muted: '#7c8aa6',
    accent: '#00ffcc',
    accent2: '#ff00aa',
    surface: '#111a2e',
  },
  fonts: {
    display: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    body: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 28,
};
export const meta: DesignMeta = { title: 'Hack the Future 2026', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1920 };
export default [Main] satisfies Scene[];
