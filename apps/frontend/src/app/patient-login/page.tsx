import { PatientLoginForm } from "@/components/patient-login-form";

export default function PatientLoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-start bg-muted px-6 py-8 md:justify-center md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <PatientLoginForm />
      </div>
    </div>
  );
}
