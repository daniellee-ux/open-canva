import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Warm accent wash bleeding off the top-right corner */}
    <Ellipse x={760} y={-200} w={560} h={560} fill="var(--ox-accent)" opacity={0.55} />

    {/* Signature geometric motif: large circle outline, top-left */}
    <Ellipse x={68} y={92} w={150} h={150} fill="transparent" borderColor="var(--ox-fg)" borderWidth={3} />
    {/* Solid dot inside the circle outline */}
    <Ellipse x={128} y={152} w={30} h={30} fill="var(--ox-accent2)" />

    {/* Thin diagonal accent line motif — in the gap right of the attribution box */}
    <Line x={648} y={920} w={96} thickness={3} color="var(--ox-fg)" rotate={-34} />
    <Ellipse x={694} y={898} w={18} h={18} fill="var(--ox-fg)" />

    {/* Top eyebrow / category label */}
    <Text x={260} y={132} w={620} size={26} weight={500} color="var(--ox-muted)" uppercase letterSpacing={9} font="body">
      Hot Takes, vol. 07
    </Text>
    <Line x={260} y={182} w={120} thickness={4} color="var(--ox-accent2)" />

    {/* Issue / column tag, right-aligned */}
    <Text x={620} y={134} w={392} size={24} weight={500} color="var(--ox-muted)" align="right" italic font="display">
      on design
    </Text>

    {/* The opening quotation mark — oversized editorial flourish */}
    <Text x={60} y={236} w={220} size={300} weight={900} color="var(--ox-accent)" lineHeight={0.8} font="display">
      “
    </Text>

    {/* The hot take — the focal point */}
    <Text x={92} y={332} w={896} size={104} weight={900} color="var(--ox-fg)" lineHeight={0.96} font="display">
      {'A “quick logo\ntweak” has\nnever once\nbeen quick.'}
    </Text>

    {/* Supporting sub-line in italic serif */}
    <Text x={96} y={760} w={760} size={36} weight={400} color="var(--ox-muted)" italic lineHeight={1.25} font="display">
      And the round of feedback after “final” is where great design quietly goes to die.
    </Text>

    {/* Bold bordered attribution box — signature CTA-style frame */}
    <Box x={96} y={904} w={520} h={92} fill="transparent" radius={8} borderColor="var(--ox-fg)" borderWidth={3}>
      <Text x={28} y={0} w={464} h={92} valign="center" size={27} weight={600} color="var(--ox-fg)" uppercase letterSpacing={3} font="body">
        Overheard in the studio
      </Text>
    </Box>

    {/* Page / signature mark, bottom-right */}
    <Text x={760} y={946} w={168} size={26} weight={500} color="var(--ox-muted)" align="right" uppercase letterSpacing={4} font="body">
      No. 07
    </Text>
    <Ellipse x={948} y={940} w={44} h={44} fill="transparent" borderColor="var(--ox-fg)" borderWidth={3} />
    <Text x={948} y={940} w={44} h={44} align="center" valign="center" size={22} weight={900} color="var(--ox-fg)" font="display">
      ✶
    </Text>
  </>
);
Main.id = 'vintage-hottake';
Main.label = 'Vintage Hot Take';

export const design: DesignSystem = {
  palette: {
    bg: '#f5f3ee',
    fg: '#1a1a1a',
    muted: '#9b948a',
    accent: '#e8d4c0',
    accent2: '#c46a3f',
    surface: '#ece7dd',
  },
  fonts: {
    display: "'Fraunces', Georgia, serif",
    body: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 8,
};
export const meta: DesignMeta = {
  title: 'Vintage Hot Take',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
