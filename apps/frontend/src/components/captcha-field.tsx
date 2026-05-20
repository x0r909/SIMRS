"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { generateCaptcha } from "@/lib/captcha-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { FieldValues, UseFormSetValue, UseFormWatch } from "react-hook-form";

interface CaptchaFieldProps<T extends FieldValues> {
  control?: any;
  onCaptchaChange: (captchaId: string, captchaAnswer: string) => void;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  error?: string;
}

export function CaptchaField<T extends FieldValues>({
  onCaptchaChange,
  watch,
  setValue,
  error
}: CaptchaFieldProps<T>) {
  const [captchaId, setCaptchaId] = useState<string>("");
  const [localAnswer, setLocalAnswer] = useState<string>("");

  const { data: captcha, isLoading, refetch } = useQuery({
    queryKey: ["captcha"],
    queryFn: generateCaptcha,
    enabled: true
  });

  useEffect(() => {
    if (captcha) {
      setCaptchaId(captcha.captchaId);
      onCaptchaChange(captcha.captchaId, "");
      setLocalAnswer("");
    }
  }, [captcha, onCaptchaChange]);

  const handleAnswerChange = (value: string) => {
    setLocalAnswer(value);
    onCaptchaChange(captchaId, value);
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <FormItem>
        <FormLabel>Verifikasi Captcha</FormLabel>

        {captcha && (
          <div className="flex gap-3">
            <div className="flex-1 overflow-hidden rounded border">
              <img
                src={captcha.image}
                alt="Captcha"
                className="h-[100px] w-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-[100px]"
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        )}

        {captcha && (
          <div className="mt-2 text-xs text-muted-foreground">
            Jawab: {captcha.question} = ?
          </div>
        )}

        <FormControl>
          <Input
            type="text"
            placeholder="Jawaban"
            value={localAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={isLoading}
            inputMode="numeric"
          />
        </FormControl>

        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    </div>
  );
}
