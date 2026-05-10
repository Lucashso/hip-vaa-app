// PageScaffold — wrapper compartilhado pelas páginas mobile.
// Header opcional + main + tabbar.

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { TabBar } from "@/components/TabBar";
import { HVIcon } from "@/lib/HVIcon";

interface Props {
  eyebrow?: string;
  title: string;
  back?: boolean;
  trailing?: ReactNode;
  children: ReactNode;
  showTabBar?: boolean;
}

export function PageScaffold({ eyebrow, title, back, trailing, children, showTabBar = true }: Props) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-hv-surface border-b border-hv-line sticky top-0 z-30">
        <div className="max-w-md mx-auto px-5 py-3.5 flex items-center gap-3">
          {back && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center hover:bg-hv-foam"
            >
              <HVIcon name="chevron-left" size={18} />
            </button>
          )}
          <div className="flex-1 leading-tight">
            {eyebrow && <div className="hv-eyebrow">{eyebrow}</div>}
            <h1 className="font-display text-[22px] leading-tight mt-0.5">{title}</h1>
          </div>
          {trailing}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {children}
      </main>

      {showTabBar && <TabBar />}
    </div>
  );
}
