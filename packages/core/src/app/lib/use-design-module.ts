import { useEffect, useState } from 'react';
import { loadDesign } from 'virtual:opencanva/designs';
import type { DesignModule } from '../../sdk';

/** Loads a design module by id and live-reloads it when the source changes. */
export function useDesignModule(id: string): { design: DesignModule | null; error: string | null } {
  const [design, setDesign] = useState<DesignModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const run = () => {
      loadDesign(id)
        .then((m) => {
          if (alive) {
            setDesign(m as DesignModule);
            setError(null);
          }
        })
        .catch((e) => {
          if (alive) {
            setDesign(null);
            setError(String(e?.message ?? e));
          }
        });
    };
    run();

    const hot = import.meta.hot;
    hot?.on('opencanva:design-changed', run);
    return () => {
      alive = false;
      hot?.off('opencanva:design-changed', run);
    };
  }, [id]);

  return { design, error };
}
