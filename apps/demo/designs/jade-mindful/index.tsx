import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Two large jade masses, overlapping, anchored to the lower-right */}
    <Ellipse x={470} y={520} w={620} h={620} fill="var(--ox-accent)" />
    <Ellipse x={760} y={300} w={560} h={560} fill="var(--ox-accent2)" />

    {/* The signature lens: a deeper-green solid in the overlap zone */}
    <Ellipse x={772} y={520} w={310} h={340} fill="var(--ox-muted)" rotate={28} />

    {/* A small quiet jade dot in the upper margin for balance */}
    <Ellipse x={120} y={150} w={70} h={70} fill="var(--ox-accent2)" />

    {/* Eyebrow / kicker */}
    <Text x={122} y={258} w={760} size={26} weight={700} color="#0E5A3C" uppercase letterSpacing={9}>
      Pause · Breathe · Reset
    </Text>

    {/* Focal display headline */}
    <Text x={118} y={312} w={840} size={130} weight={800} lineHeight={0.94} font="display" color="var(--ox-fg)">
      {'Ten quiet\nminutes'}
    </Text>

    {/* Serene single line beneath the headline */}
    <Text x={122} y={612} w={620} size={32} weight={400} lineHeight={1.45} font="body" color="var(--ox-fg)">
      A daily reset that fits between meetings — one breath at a time.
    </Text>

    {/* Big stat numeral inside the lens, on light putty */}
    <Text x={772} y={580} w={310} h={150} align="center" valign="center" size={130} weight={800} font="display" color="var(--ox-bg)">
      10
    </Text>
    <Text x={772} y={726} w={310} h={40} align="center" valign="center" size={24} weight={700} uppercase letterSpacing={6} color="var(--ox-bg)">
      min reset
    </Text>

    {/* Quiet divider rule in the lower margin */}
    <Line x={122} y={838} w={300} thickness={3} color="var(--ox-fg)" />

    {/* CTA pill button */}
    <Box x={122} y={892} w={376} h={104} fill="var(--ox-accent)" radius={52}>
      <Text x={0} y={0} w={376} h={104} align="center" valign="center" size={34} weight={700} color="var(--ox-bg)">
        Start your reset
      </Text>
    </Box>

    {/* App name lockup, small in the corner */}
    <Text x={538} y={920} w={420} h={48} valign="center" size={26} weight={700} letterSpacing={2} color="var(--ox-fg)">
      Stillwater · free for 7 days
    </Text>
  </>
);
Main.id = 'jade-mindful';
Main.label = 'Jade Mindful — Ten Quiet Minutes';

export const design: DesignSystem = {
  palette: {
    bg: '#F5F1EE',
    fg: '#1E2421',
    muted: '#08754C',
    accent: '#2BA483',
    accent2: '#2CAE8C',
    surface: '#EBE6E1',
  },
  fonts: {
    display: "'Fraunces', Georgia, serif",
    body: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 24,
};
export const meta: DesignMeta = {
  title: 'Jade Mindful — Ten Quiet Minutes',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
