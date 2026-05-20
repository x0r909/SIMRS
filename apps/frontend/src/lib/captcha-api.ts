import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/types";

export interface CaptchaData {
  captchaId: string;
  image: string;
  question: string;
}

export async function generateCaptcha(): Promise<CaptchaData> {
  const response = await api.get<ApiEnvelope<CaptchaData>>("/captcha/generate");
  const data = response.data as CaptchaData | ApiEnvelope<CaptchaData>;

  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success === true &&
    "data" in data
  ) {
    return data.data as CaptchaData;
  }

  return data as CaptchaData;
}
