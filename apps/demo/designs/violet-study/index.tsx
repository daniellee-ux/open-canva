import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Top violet header band */}
    <Box x={0} y={0} w={1080} h={232} fill="var(--ox-accent)" radius={0} />

    {/* Kicker chip on the band */}
    <Box x={72} y={62} w={306} h={56} fill="#000000" radius={6}>
      <Text x={0} y={0} w={306} h={56} align="center" valign="center" size={22} weight={700} color="var(--ox-accent2)" font="body" uppercase letterSpacing={4}>
        Finals Week 2026
      </Text>
    </Box>

    {/* Small handwritten-ish label, right side of band */}
    <Text x={680} y={70} w={328} h={40} align="right" valign="center" size={24} weight={600} color="#000000" font="body">
      open to all majors
    </Text>
    <Line x={680} y={116} w={328} thickness={4} color="#000000" />

    {/* Band headline */}
    <Text x={72} y={140} w={760} size={62} weight={800} color="#000000" font="display" lineHeight={0.96}>
      Cram Club
    </Text>

    {/* ── Main title block ── */}
    <Text x={72} y={300} w={940} size={150} weight={800} color="var(--ox-fg)" font="display" lineHeight={0.9}>
      STUDY
    </Text>

    {/* GROUP with lime highlighter punch behind it */}
    <Box x={64} y={470} w={636} h={130} fill="var(--ox-accent2)" radius={4} rotate={-1.5} />
    <Text x={72} y={462} w={940} size={150} weight={800} color="var(--ox-fg)" font="display" lineHeight={0.9}>
      GROUP
    </Text>

    {/* Subtitle / dek */}
    <Text x={74} y={636} w={620} size={29} weight={500} color="var(--ox-muted)" font="body" lineHeight={1.32}>
      Three nights of focused co-working, free coffee, and quiet corners before the storm of exams.
    </Text>

    {/* Lime accent ticks near subtitle */}
    <Line x={742} y={650} w={56} thickness={8} color="var(--ox-accent2)" rotate={-40} />
    <Line x={792} y={650} w={56} thickness={8} color="var(--ox-accent2)" rotate={-40} />
    <Line x={842} y={650} w={56} thickness={8} color="var(--ox-accent2)" rotate={-40} />

    {/* ── Detail cards row ── */}
    {/* When card */}
    <Box x={72} y={772} w={290} h={196} fill="var(--ox-surface)" radius={10} borderColor="#000000" borderWidth={2}>
      <Text x={24} y={22} w={242} size={20} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={3}>
        When
      </Text>
      <Text x={24} y={62} w={242} size={42} weight={800} color="#000000" font="display" lineHeight={1.0}>
        Dec 8–10
      </Text>
      <Text x={24} y={138} w={242} size={24} weight={500} color="var(--ox-muted)" font="body">
        6 PM – Midnight
      </Text>
    </Box>

    {/* Where card */}
    <Box x={395} y={772} w={290} h={196} fill="var(--ox-surface)" radius={10} borderColor="#000000" borderWidth={2}>
      <Text x={24} y={22} w={242} size={20} weight={700} color="var(--ox-accent)" font="body" uppercase letterSpacing={3}>
        Where
      </Text>
      <Text x={24} y={62} w={242} size={42} weight={800} color="#000000" font="display" lineHeight={1.0}>
        Hale Library
      </Text>
      <Text x={24} y={150} w={242} size={24} weight={500} color="var(--ox-muted)" font="body">
        3rd Floor, Rm 314
      </Text>
    </Box>

    {/* Bring card — violet block for emphasis */}
    <Box x={718} y={772} w={290} h={196} fill="var(--ox-accent)" radius={10}>
      <Text x={24} y={22} w={242} size={20} weight={700} color="#000000" font="body" uppercase letterSpacing={3}>
        Bring
      </Text>
      <Text x={24} y={62} w={242} size={42} weight={800} color="#000000" font="display" lineHeight={1.0}>
        Notes &amp; a Friend
      </Text>
      <Text x={24} y={150} w={242} size={22} weight={600} color="#000000" font="body">
        snacks provided
      </Text>
    </Box>

    {/* Bottom RSVP bar */}
    <Box x={72} y={1000} w={648} h={56} fill="#000000" radius={6}>
      <Text x={0} y={0} w={648} h={56} align="center" valign="center" size={24} weight={700} color="var(--ox-fg)" font="body" letterSpacing={1}>
        RSVP @ studyclub.kstate.edu/cram
      </Text>
    </Box>

    {/* Lime sign-off chip */}
    <Box x={744} y={1000} w={264} h={56} fill="var(--ox-accent2)" radius={6}>
      <Text x={0} y={0} w={264} h={56} align="center" valign="center" size={24} weight={800} color="#000000" font="display" letterSpacing={1}>
        You got this.
      </Text>
    </Box>

    {/* Decorative violet dot, top-right bleed */}
    <Ellipse x={944} y={-70} w={200} h={200} fill="var(--ox-accent2)" opacity={0.9} />
  </>
);
Main.id = 'violet-study';
Main.label = 'Cram Club Study Group';

export const design: DesignSystem = {
  palette: {
    bg: '#FFFFFF',
    fg: '#000000',
    muted: '#666463',
    accent: '#C5A1FF',
    accent2: '#CFEE30',
    surface: '#FAFAF8',
  },
  fonts: {
    display: "'Archivo Black', 'Space Grotesk', system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 10,
};
export const meta: DesignMeta = { title: 'Cram Club Study Group', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
