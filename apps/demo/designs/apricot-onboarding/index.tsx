import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ── Top-left checkerboard motif block ───────────────────── */}
    <Box x={0} y={0} w={64} h={64} fill="var(--ox-accent)" radius={0} z={1} />
    <Box x={64} y={0} w={64} h={64} fill="var(--ox-accent2)" radius={0} z={1} />
    <Box x={128} y={0} w={64} h={64} fill="var(--ox-accent)" radius={0} z={1} />
    <Box x={0} y={64} w={64} h={64} fill="var(--ox-accent2)" radius={0} z={1} />
    <Box x={64} y={64} w={64} h={64} fill="var(--ox-accent)" radius={0} z={1} />
    <Box x={0} y={128} w={64} h={64} fill="var(--ox-accent)" radius={0} z={1} />

    {/* ── Large signature arc bleeding off the top-right edge ──── */}
    <Box x={1240} y={-360} w={720} h={360} fill="var(--ox-accent2)" radius={0} z={1} />
    <Ellipse x={1240} y={-360} w={720} h={720} fill="var(--ox-accent2)" z={1} />

    {/* small arc accent nested inside the big one */}
    <Box x={1480} y={-120} w={240} h={120} fill="var(--ox-accent)" radius={0} z={2} />
    <Ellipse x={1480} y={-120} w={240} h={240} fill="var(--ox-accent)" z={2} />

    {/* ── Header ──────────────────────────────────────────────── */}
    <Text
      x={120}
      y={96}
      w={900}
      size={26}
      weight={700}
      color="var(--ox-accent)"
      uppercase
      letterSpacing={8}
      font="display"
      z={5}
    >
      Getting started
    </Text>
    <Text
      x={116}
      y={140}
      w={1080}
      size={104}
      weight={800}
      lineHeight={0.96}
      color="var(--ox-fg)"
      font="display"
      z={5}
    >
      How onboarding works
    </Text>
    <Line x={120} y={360} w={300} thickness={6} color="var(--ox-fg)" z={5} />
    <Text
      x={120}
      y={384}
      w={920}
      size={28}
      weight={500}
      lineHeight={1.35}
      color="var(--ox-muted)"
      font="body"
      z={5}
    >
      Three calm steps to take your team from sign-up to shipping — no manual setup, no guesswork.
    </Text>

    {/* ── Connector rule running behind the three cards ───────── */}
    <Line x={190} y={470} w={1220} thickness={4} color="var(--ox-fg)" dash="2 14" z={2} />

    {/* ════════════════ STEP 01 ════════════════ */}
    <Box x={120} y={470} w={420} h={360} fill="var(--ox-surface)" radius={28} z={4} />
    {/* arc tab on the card */}
    <Box x={120} y={470} w={200} h={100} fill="var(--ox-accent)" radius={0} z={5} />
    <Ellipse x={120} y={470} w={200} h={140} fill="var(--ox-accent)" z={5} />
    <Text
      x={120}
      y={486}
      w={200}
      h={120}
      align="center"
      valign="top"
      size={96}
      weight={800}
      color="var(--ox-surface)"
      font="display"
      z={6}
    >
      01
    </Text>
    <Text
      x={160}
      y={650}
      w={340}
      size={38}
      weight={700}
      lineHeight={1.05}
      color="var(--ox-fg)"
      font="display"
      z={6}
    >
      Create your workspace
    </Text>
    <Text
      x={160}
      y={732}
      w={340}
      size={23}
      weight={500}
      lineHeight={1.4}
      color="var(--ox-muted)"
      font="body"
      z={6}
    >
      Name your team, pick a color, and invite a teammate. It takes about two minutes.
    </Text>

    {/* ════════════════ STEP 02 ════════════════ */}
    <Box x={590} y={470} w={420} h={360} fill="var(--ox-accent2)" radius={28} z={4} />
    {/* arc tab on the card */}
    <Box x={590} y={470} w={200} h={100} fill="var(--ox-fg)" radius={0} z={5} />
    <Ellipse x={590} y={470} w={200} h={140} fill="var(--ox-fg)" z={5} />
    <Text
      x={590}
      y={486}
      w={200}
      h={120}
      align="center"
      valign="top"
      size={96}
      weight={800}
      color="var(--ox-bg)"
      font="display"
      z={6}
    >
      02
    </Text>
    <Text
      x={630}
      y={650}
      w={340}
      size={38}
      weight={700}
      lineHeight={1.05}
      color="var(--ox-fg)"
      font="display"
      z={6}
    >
      Connect your tools
    </Text>
    <Text
      x={630}
      y={732}
      w={340}
      size={23}
      weight={500}
      lineHeight={1.4}
      color="var(--ox-fg)"
      font="body"
      z={6}
    >
      Link GitHub, Slack, and Figma in one click. We sync your projects automatically.
    </Text>

    {/* ════════════════ STEP 03 ════════════════ */}
    <Box x={1060} y={470} w={420} h={360} fill="var(--ox-surface)" radius={28} z={4} />
    {/* arc tab on the card */}
    <Box x={1060} y={470} w={200} h={100} fill="var(--ox-accent)" radius={0} z={5} />
    <Ellipse x={1060} y={470} w={200} h={140} fill="var(--ox-accent)" z={5} />
    <Text
      x={1060}
      y={486}
      w={200}
      h={120}
      align="center"
      valign="top"
      size={96}
      weight={800}
      color="var(--ox-surface)"
      font="display"
      z={6}
    >
      03
    </Text>
    <Text
      x={1100}
      y={650}
      w={340}
      size={38}
      weight={700}
      lineHeight={1.05}
      color="var(--ox-fg)"
      font="display"
      z={6}
    >
      Ship your first task
    </Text>
    <Text
      x={1100}
      y={732}
      w={340}
      size={23}
      weight={500}
      lineHeight={1.4}
      color="var(--ox-muted)"
      font="body"
      z={6}
    >
      Assign work, track progress on the board, and watch it move to done. You are live.
    </Text>

    {/* ── Footer checkerboard rhythm strip ────────────────────── */}
    <Box x={120} y={808} w={36} h={36} fill="var(--ox-accent)" radius={0} z={3} />
    <Box x={156} y={808} w={36} h={36} fill="var(--ox-accent2)" radius={0} z={3} />
    <Box x={192} y={808} w={36} h={36} fill="var(--ox-accent)" radius={0} z={3} />

    {/* ── CTA pill bottom-right ───────────────────────────────── */}
    <Box x={1100} y={802} w={380} h={84} fill="var(--ox-accent)" radius={42} z={5}>
      <Text
        x={0}
        y={0}
        w={380}
        h={84}
        align="center"
        valign="center"
        size={30}
        weight={700}
        color="var(--ox-surface)"
        font="display"
      >
        Start onboarding →
      </Text>
    </Box>
  </>
);

Main.id = 'apricot-onboarding';
Main.label = 'How Onboarding Works';

export const design: DesignSystem = {
  palette: {
    bg: '#FFF8EE',
    fg: '#C7561E',
    muted: '#7A4A33',
    accent: '#F69834',
    accent2: '#F9C2BD',
    surface: '#FFFFFF',
  },
  fonts: {
    display: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 24,
};

export const meta: DesignMeta = {
  title: 'How Onboarding Works',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};

export const artboard: Artboard = { w: 1600, h: 900 };

export default [Main] satisfies Scene[];
