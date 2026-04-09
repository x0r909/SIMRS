"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import {
  createRole,
  createUser,
  getApiErrorMessage,
  listPermissions,
  listRoles,
  listUsers,
  setRolePermissions
} from "@/lib/simrs-api";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  roleKeys: z.string().optional()
});

const createRoleSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional()
});

const setPermissionSchema = z.object({
  roleId: z.string().min(1),
  permissionKeys: z.string().min(1)
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
type SetPermissionFormValues = z.infer<typeof setPermissionSchema>;

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const qc = useQueryClient();

  const users = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers });
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: listRoles });
  const permissions = useQuery({ queryKey: ["admin", "permissions"], queryFn: listPermissions });

  const userForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", name: "", password: "", roleKeys: "staff" }
  });

  const roleForm = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { key: "", name: "", description: "" }
  });

  const rolePermForm = useForm<SetPermissionFormValues>({
    resolver: zodResolver(setPermissionSchema),
    defaultValues: { roleId: "", permissionKeys: "patients.read,patients.write" }
  });

  const createUserMutation = useMutation({
    mutationFn: (values: CreateUserFormValues) =>
      createUser({
        email: values.email,
        name: values.name,
        password: values.password,
        roleKeys: values.roleKeys ? splitCsv(values.roleKeys) : undefined
      }),
    onSuccess: async () => {
      toast.success("User created");
      userForm.reset({ email: "", name: "", password: "", roleKeys: "staff" });
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      toast.success("Role created");
      roleForm.reset({ key: "", name: "", description: "" });
      await qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const setRolePermMutation = useMutation({
    mutationFn: (values: SetPermissionFormValues) =>
      setRolePermissions(values.roleId, splitCsv(values.permissionKeys)),
    onSuccess: async () => {
      toast.success("Role permissions updated");
      await qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Users and Roles" description="Manajemen akun, role, dan permission" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create user</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...userForm}>
              <form className="space-y-4" onSubmit={userForm.handleSubmit((values) => createUserMutation.mutate(values))}>
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="roleKeys"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role keys (comma separated)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createUserMutation.isPending}>{createUserMutation.isPending ? "Saving..." : "Create user"}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create role</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...roleForm}>
              <form className="space-y-4" onSubmit={roleForm.handleSubmit((values) => createRoleMutation.mutate(values))}>
                <FormField
                  control={roleForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="nurse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nurse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createRoleMutation.isPending}>{createRoleMutation.isPending ? "Saving..." : "Create role"}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Set role permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...rolePermForm}>
            <form className="grid gap-4 md:grid-cols-[220px_1fr_auto]" onSubmit={rolePermForm.handleSubmit((values) => setRolePermMutation.mutate(values))}>
              <FormField
                control={rolePermForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="roleId">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(roles.data ?? []).map((role) => (
                          <SelectItem key={role.id} value={role.id}>{role.key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rolePermForm.control}
                name="permissionKeys"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permission keys (comma separated)</FormLabel>
                    <FormControl>
                      <Input id="permissionKeys" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={setRolePermMutation.isPending}>{setRolePermMutation.isPending ? "Saving..." : "Apply"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(users.isLoading || roles.isLoading || permissions.isLoading) ? <LoadingBlock label="Loading admin data..." /> : null}
      {(users.isError || roles.isError || permissions.isError) ? <ErrorBlock message="Failed to load admin data" /> : null}

      {users.data && roles.data && permissions.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.data.map((user) => (
                <div key={user.id} className="rounded-md border p-3">
                  <div className="font-medium">{user.name} · {user.email}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role.key} variant="outline">{role.key}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.data.map((role) => (
                <div key={role.id} className="rounded-md border p-3">
                  <div className="font-medium">{role.name} ({role.key})</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(role.permissions ?? []).length} permission(s)
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Permission catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {permissions.data.map((permission) => (
                  <Badge key={permission.id} variant="outline">{permission.key}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
