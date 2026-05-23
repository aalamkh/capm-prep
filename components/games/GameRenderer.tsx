"use client";

import type { GameData } from "@/lib/curriculum";
import { MatchPairs } from "./MatchPairs";
import { PutInOrder } from "./PutInOrder";
import { TapTheRight } from "./TapTheRight";

interface Props {
  game: GameData;
}

export function GameRenderer({ game }: Props) {
  switch (game.type) {
    case "match":
      return <MatchPairs data={game} />;
    case "order":
      return <PutInOrder data={game} />;
    case "tap":
      return <TapTheRight data={game} />;
    default:
      return (
        <p className="text-sm text-destructive">
          Unsupported game type: {(game as { type: string }).type}
        </p>
      );
  }
}
