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
