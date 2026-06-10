import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientLabResultsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hasil Laboratorium</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Hasil lab yang sudah diverifikasi akan muncul di sini.
      </CardContent>
    </Card>
  );
}
