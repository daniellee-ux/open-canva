import { Box, Ellipse, Group, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

/**
 * A reusable subcomponent that shares STYLE, not position. It defines the shared
 * look of a step (number + title + body) at coordinates relative to its parent;
 * each instance is wrapped below in its own <Group x={…} y={…}> whose literal
 * position the inspector rewrites independently. So: edit the styling here once and
 * all steps update, but drag a step on the canvas and only that one moves.
 */
function StepBody({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <>
      <Text x={0} y={0} w={780} size={27} weight={700} color="var(--ox-fg)" font="display">
        {`${n}    ${title}`}
      </Text>
      <Text x={0} y={40} w={780} size={21} weight={400} color="var(--ox-muted)" font="body">
        {body}
      </Text>
    </>
  );
}

// The one design that ships with the open-source workspace: a getting-started
// guide that is itself a design. Open it at /d/start-here, then make your own.
// It also shows the editor's structural features — <Group>s (click to select and
// move a whole unit; marquee or shift-click several objects, then Group/Ungroup)
// and the reused <Step> subcomponent above.
const Main: Scene = () => (
  <>
    {/* faint decorative bleed, top-right */}
    <Ellipse x={1480} y={-320} w={760} h={760} fill="var(--ox-accent)" opacity={0.1} z={0} />

    {/* ── brand row — a Group: the logo + wordmark select / move as one unit ── */}
    <Group x={120} y={96} name="Brand">
      <Box x={0} y={0} w={56} h={56} radius={14} fill="var(--ox-accent)">
        <Text x={0} y={0} w={56} h={56} align="center" valign="center" size={30} weight={800} color="var(--ox-bg)" font="display">
          ✦
        </Text>
      </Box>
      <Text x={72} y={0} w={420} h={56} valign="center" size={30} weight={800} color="var(--ox-fg)" font="display" letterSpacing={1}>
        OpenCanva
      </Text>
    </Group>

    {/* ── headline block — eyebrow + heading + body + rule, grouped ── */}
    <Group x={116} y={236} name="Headline">
      <Text x={6} y={0} w={800} size={22} weight={700} color="var(--ox-accent)" uppercase letterSpacing={6} font="display">
        Getting started
      </Text>
      <Text x={0} y={48} w={780} size={124} weight={800} lineHeight={0.92} color="var(--ox-fg)" font="display" letterSpacing={-2}>
        {'Design\nas code.'}
      </Text>
      <Text x={6} y={324} w={812} size={28} weight={500} lineHeight={1.4} color="var(--ox-muted)" font="body">
        Every graphic here is a small React component — rendered live on this canvas, editable by clicking straight to its source, and exported to PNG, SVG, or PDF.
      </Text>
      {/* short accent rule in open space */}
      <Line x={6} y={480} w={132} thickness={4} color="var(--ox-accent)" />
    </Group>

    {/* ── three pointers — each its own <Group> (independent position), all sharing
        one <StepBody> (shared style). Drag a step: only it moves. Restyle StepBody: all change. ── */}
    <Group x={122} y={752} name="Step 01">
      <StepBody n="01" title="Open a design" body={'Each one lives in designs/<id>/index.tsx'} />
    </Group>
    <Group x={122} y={842} name="Step 02">
      <StepBody n="02" title="Edit on the canvas" body="Click any object to jump straight to its code" />
    </Group>
    <Group x={122} y={932} name="Step 03">
      <StepBody n="03" title="Make your own" body="Ask the agent, or copy a design folder and start placing objects" />
    </Group>

    {/* ── code card (right) — designs are just components ── */}
    <Box x={1016} y={236} w={784} h={560} radius={20} fill="var(--ox-surface)" borderColor="var(--ox-muted)" borderWidth={1} shadow="0 24px 60px rgba(20,20,30,0.14)" z={2}>
      {/* window controls — a small Group of three dots */}
      <Group x={28} y={30} name="Window controls">
        <Ellipse x={0} y={0} w={14} h={14} fill="#FF5F56" />
        <Ellipse x={24} y={0} w={14} h={14} fill="#FFBD2E" />
        <Ellipse x={48} y={0} w={14} h={14} fill="#27C93F" />
      </Group>
      <Text x={112} y={24} w={520} h={24} valign="center" size={17} weight={600} color="var(--ox-muted)" font="body">
        designs/poster/index.tsx
      </Text>
      <Line x={0} y={72} w={784} thickness={1} color="var(--ox-muted)" opacity={0.4} z={1} />

      <Text x={40} y={114} w={704} size={22} weight={500} color="var(--ox-muted)" font="body">
        {'export const Poster = () => ('}
      </Text>
      <Text x={40} y={158} w={704} size={22} weight={500} color="var(--ox-fg)" font="body">
        {'  <Box x={80} y={80} radius={32}'}
      </Text>
      <Text x={40} y={202} w={704} size={22} weight={500} color="var(--ox-accent)" font="body">
        {'       fill="var(--ox-accent)">'}
      </Text>
      <Text x={40} y={246} w={704} size={22} weight={500} color="var(--ox-fg)" font="body">
        {'    <Text size={96}>Big idea</Text>'}
      </Text>
      <Text x={40} y={290} w={704} size={22} weight={500} color="var(--ox-fg)" font="body">
        {'  </Box>'}
      </Text>
      <Text x={40} y={334} w={704} size={22} weight={500} color="var(--ox-muted)" font="body">
        {');'}
      </Text>

      <Line x={40} y={418} w={704} thickness={1} color="var(--ox-muted)" opacity={0.3} z={1} />
      <Text x={40} y={446} w={704} size={19} weight={400} lineHeight={1.4} color="var(--ox-muted)" font="body">
        That snippet renders a rounded accent box with a headline — drag it on the canvas and the numbers above rewrite themselves.
      </Text>
    </Box>

    {/* footer note — explains the empty workspace */}
    <Text x={1016} y={820} w={784} size={20} weight={500} color="var(--ox-muted)" font="body" z={1}>
      This starter is the only design that ships — add your own under designs/.
    </Text>
  </>
);

Main.id = 'start-here';
Main.label = 'Start Here';

export const meta: DesignMeta = {
  theme: 'blueprint',
  title: 'Start Here — OpenCanva',
  author: 'OpenCanva',
  createdAt: '2026-06-20T18:37:03.950Z',
};

export const artboard: Artboard = { w: 1920, h: 1080 };

export default [Main] satisfies Scene[];
