import type { ReactNode } from "react";

type ModuleScaffoldProps = {
  title: string;
  subtitle: string;
  hideHeader?: boolean;
  children?: ReactNode;
};

const ModuleScaffold = ({ title, subtitle, hideHeader = false, children }: ModuleScaffoldProps) => {
  return (
    <section className="space-y-5">
      {!hideHeader ? (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:p-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm font-normal text-txt-3 sm:text-[15px]">{subtitle}</p>
        </div>
      ) : null}
      <div className="rounded-[18px] border border-white/10 bg-[#0B3D0B]/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl transition-all duration-300 sm:p-5">{children}</div>
    </section>
  );
};

export default ModuleScaffold;