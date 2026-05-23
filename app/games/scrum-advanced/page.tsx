import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getGame } from "@/lib/games-data";
import { ScenarioGameView } from "@/components/games/ScenarioGameView";

export default function ScrumAdvancedGamePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>
      <ScenarioGameView game={getGame("scrumAdvanced")} />
    </div>
  );
}
