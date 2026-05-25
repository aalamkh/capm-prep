import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getGame } from "@/lib/games-data";
import { getGameTeaching } from "@/lib/game-teaching";
import { ScenarioGameView } from "@/components/games/ScenarioGameView";

export default function XpGamePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>
      <ScenarioGameView
        game={getGame("xp")}
        teaching={getGameTeaching("xp")}
      />
    </div>
  );
}
