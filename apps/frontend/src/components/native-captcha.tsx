"use client";

import { RefreshCcw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NativeCaptchaProps = {
  className?: string;
  onChange?: (state: { solved: boolean; answer: string }) => void;
};

type Challenge = {
  left: number;
  right: number;
  answer: number;
};

function createChallenge(): Challenge {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 1;

  return {
    left,
    right,
    answer: left + right
  };
}

export function NativeCaptcha({ className, onChange }: NativeCaptchaProps) {
  const [mounted, setMounted] = React.useState(false);
  const [challenge, setChallenge] = React.useState<Challenge | null>(null);
  const [answer, setAnswer] = React.useState("");
  const challengeAnswer = challenge?.answer ?? null;
  const solved = challengeAnswer !== null && answer.trim() !== "" && Number(answer) === challengeAnswer;

  const emitChange = React.useCallback(
    (nextAnswer: string, nextChallenge: Challenge | null) => {
      const nextSolved =
        nextChallenge !== null && nextAnswer.trim() !== "" && Number(nextAnswer) === nextChallenge.answer;

      onChange?.({ solved: nextSolved, answer: nextAnswer });
    },
    [onChange]
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    const nextChallenge = createChallenge();
    setChallenge(nextChallenge);
    setAnswer("");
    emitChange("", nextChallenge);
  }, [emitChange, mounted]);

  const regenerate = () => {
    const next = createChallenge();
    setChallenge(next);
    setAnswer("");
    emitChange("", next);
  };

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextAnswer = event.target.value;
    setAnswer(nextAnswer);
    emitChange(nextAnswer, challenge);
  };

  return (
    <div className={cn("rounded-lg border border-border/70 bg-muted/40 px-2.5 py-2.5 sm:px-3", className)} aria-busy={!challenge}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Verifikasi keamanan</p>
          <p className="text-xs text-muted-foreground">
            {challenge
              ? `Hitung hasil berikut untuk melanjutkan login: ${challenge.left} + ${challenge.right} = ?`
              : "Memuat captcha..."}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={regenerate}
          aria-label="Ganti captcha"
          disabled={!challenge}
        >
          <RefreshCcw className="size-4" />
        </Button>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Jawaban"
          value={answer}
          onChange={handleAnswerChange}
          className="sm:max-w-32"
          disabled={!challenge}
        />

        <span className={cn("text-sm font-medium", solved ? "text-emerald-600" : "text-muted-foreground") }>
          {solved ? "Captcha valid" : "Captcha belum valid"}
        </span>
      </div>
    </div>
  );
}