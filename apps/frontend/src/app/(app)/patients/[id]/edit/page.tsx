"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { PatientForm } from "@/components/patients/patient-form";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { getApiErrorMessage, getPatient, updatePatient } from "@/lib/simrs-api";

export default function EditPatientPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const patient = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatient(id)
  });

  const save = useMutation({
    mutationFn: (values: {
      mrn: string;
      name: string;
      phone?: string;
      address?: string;
      birthDate?: string;
    }) => updatePatient(id, values),
    onSuccess: async () => {
      toast.success("Patient updated");
      await qc.invalidateQueries({ queryKey: ["patients"] });
      await qc.invalidateQueries({ queryKey: ["patient", id] });
      router.replace("/patients");
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Edit patient" description="Update patient record" />

      <Card>
        <CardContent className="pt-6">
          {patient.isLoading ? <LoadingBlock label="Loading patient..." /> : null}
          {patient.isError ? <ErrorBlock message="Failed to load patient" onRetry={() => patient.refetch()} /> : null}

          {patient.data ? (
            <PatientForm
              defaultValues={{
                mrn: patient.data.mrn,
                name: patient.data.name,
                phone: patient.data.phone ?? "",
                address: patient.data.address ?? "",
                birthDate: patient.data.birthDate ? patient.data.birthDate.slice(0, 10) : ""
              }}
              onSubmit={(values) => save.mutate(values)}
              onCancel={() => router.back()}
              submitLabel="Save changes"
              pending={save.isPending}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

