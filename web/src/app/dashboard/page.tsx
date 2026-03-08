import { Suspense } from "react";
import { BoardView } from "@/components/board-view";

export default function DashboardBoardPage() {
  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <Suspense fallback={<div className="flex flex-1 items-center justify-center text-[var(--text-dim)]">Loading…</div>}>
        <BoardView />
      </Suspense>
    </div>
  );
}
