import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Top red full-bleed eyebrow band */}
    <Box x={0} y={0} w={1240} h={92} fill="var(--ox-accent)" />
    <Text x={80} y={0} w={760} h={92} valign="center" size={30} weight={800} color="var(--ox-bg)" uppercase letterSpacing={10} font="body">
      Studio North — Careers 2026
    </Text>
    <Text x={840} y={0} w={320} h={92} valign="center" align="right" size={30} weight={800} color="var(--ox-bg)" uppercase letterSpacing={6} font="body">
      Issue No. 04
    </Text>

    {/* Eyebrow line + label */}
    <Text x={80} y={150} w={1080} size={34} weight={800} color="var(--ox-accent)" uppercase letterSpacing={12} font="body">
      We are open
    </Text>
    <Line x={80} y={208} w={1080} thickness={3} color="var(--ox-fg)" />

    {/* NOW HIRING — display headline with hard offset shadow on the red word */}
    <Text x={80} y={250} w={1100} size={210} weight={900} lineHeight={0.86} color="var(--ox-fg)" uppercase letterSpacing={-4} font="display">
      Now
    </Text>
    {/* shadow draw of HIRING in dark, offset */}
    <Text x={92} y={462} w={1100} size={210} weight={900} lineHeight={0.86} color="var(--ox-fg)" uppercase letterSpacing={-4} font="display">
      Hiring
    </Text>
    {/* real red HIRING on top */}
    <Text x={80} y={450} w={1100} size={210} weight={900} lineHeight={0.86} color="var(--ox-accent)" uppercase letterSpacing={-4} font="display">
      Hiring
    </Text>

    {/* Role line */}
    <Text x={80} y={700} w={1100} size={96} weight={900} lineHeight={0.94} color="var(--ox-fg)" uppercase letterSpacing={-2} font="display">
      Senior Product Designer
    </Text>

    {/* Subhead / pitch */}
    <Text x={80} y={918} w={1000} size={36} weight={500} lineHeight={1.3} color="var(--ox-fg)" font="body">
      Own the craft end to end. Shape products used by millions, ship loud ideas, and set the bar for the whole design team.
    </Text>

    {/* Details panel — warm off-white stripe */}
    <Box x={0} y={1058} w={1240} h={360} fill="var(--ox-surface)" />

    {/* Detail column 1 */}
    <Text x={80} y={1100} w={520} size={26} weight={800} color="var(--ox-accent)" uppercase letterSpacing={6} font="body">
      The Role
    </Text>
    <Line x={80} y={1142} w={520} thickness={2} color="var(--ox-fg)" />
    <Text x={80} y={1166} w={520} size={30} weight={600} lineHeight={1.45} color="var(--ox-fg)" font="body">
      8+ years in product design{'\n'}Fluency in systems & prototyping{'\n'}A portfolio that argues a point{'\n'}Mentors the people around you
    </Text>

    {/* Detail column 2 */}
    <Text x={680} y={1100} w={480} size={26} weight={800} color="var(--ox-accent)" uppercase letterSpacing={6} font="body">
      The Package
    </Text>
    <Line x={680} y={1142} w={480} thickness={2} color="var(--ox-fg)" />
    <Text x={680} y={1166} w={480} size={30} weight={600} lineHeight={1.45} color="var(--ox-fg)" font="body">
      $160k–$210k + equity{'\n'}Remote-first, four-day Fridays{'\n'}Top-tier hardware & tooling{'\n'}Real budget for your craft
    </Text>

    {/* Big red number motif */}
    <Ellipse x={968} y={150} w={196} h={196} fill="var(--ox-accent)" />
    <Text x={968} y={150} w={196} h={196} align="center" valign="center" size={120} weight={900} color="var(--ox-bg)" font="display">
      01
    </Text>

    {/* Bottom CTA bar */}
    <Box x={0} y={1418} w={1240} h={336} fill="var(--ox-fg)" />
    <Text x={80} y={1470} w={760} size={34} weight={800} color="var(--ox-accent)" uppercase letterSpacing={8} font="body">
      Apply before July 31
    </Text>
    <Text x={80} y={1550} w={760} size={56} weight={900} lineHeight={0.92} color="var(--ox-bg)" uppercase letterSpacing={-2} font="display">
      studionorth.co/jobs
    </Text>

    {/* CTA button */}
    <Box x={868} y={1500} w={292} h={132} fill="var(--ox-accent)" radius={0}>
      <Text x={0} y={0} w={292} h={132} align="center" valign="center" size={42} weight={900} color="var(--ox-bg)" uppercase letterSpacing={2} font="display">
        Pitch us
      </Text>
    </Box>
  </>
);
Main.id = 'bold-hiring';
Main.label = 'Now Hiring — Senior Designer';

export const design: DesignSystem = {
  palette: {
    bg: '#FFFFFF',
    fg: '#1C1410',
    muted: '#8A8178',
    accent: '#D8000F',
    accent2: '#D8000F',
    surface: '#F5F2EF',
  },
  fonts: {
    display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 0,
};
export const meta: DesignMeta = { title: 'Now Hiring — Senior Designer', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1240, h: 1754 };
export default [Main] satisfies Scene[];
