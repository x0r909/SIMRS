import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Pasien</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Edit profil dan data kontak.
      </CardContent>
    </Card>
  );
}
