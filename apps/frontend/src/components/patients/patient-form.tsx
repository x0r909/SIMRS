"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const patientFormSchema = z.object({
  mrn: z.string().min(3, "MRN minimal 3 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional()
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export function PatientForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  pending
}: {
  defaultValues: PatientFormValues;
  onSubmit: (values: PatientFormValues) => void;
  onCancel: () => void;
  submitLabel: string;
  pending?: boolean;
}) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues
  });

  return (
    <Form {...form}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="mrn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MRN</FormLabel>
              <FormControl>
                <Input id="mrn" {...field} placeholder="MRN0002" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input id="name" {...field} placeholder="Nama pasien" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input id="phone" {...field} value={field.value ?? ""} placeholder="08xxxxxxxxxx" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birth date</FormLabel>
              <FormControl>
                <Input id="birthDate" {...field} value={field.value ?? ""} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input id="address" {...field} value={field.value ?? ""} placeholder="Alamat" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2 flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
