/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/staff/nursing/page.tsx
 * @description Staff perawat: asuhan dan kunjungan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NursingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stasiun Keperawatan</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Triase, vital sign, dan catatan keperawatan.
      </CardContent>
    </Card>
  );
}
