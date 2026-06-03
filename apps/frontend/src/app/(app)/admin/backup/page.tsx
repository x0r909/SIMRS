'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Trash2, RotateCcw } from 'lucide-react';
import {
  createBackup,
  listBackups,
  restoreBackup,
  downloadBackup,
  deleteBackup,
  downloadBackupFile,
  DatabaseBackup
} from '@/lib/backup-api';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function BackupPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [description, setDescription] = useState('');

  // Fetch backups
  const backups = useQuery({
    queryKey: ['backups', page],
    queryFn: () => listBackups(page, 20)
  });

  // Create backup mutation
  const createMutation = useMutation({
    mutationFn: () => createBackup(description),
    onSuccess: () => {
      toast.success('Backup berhasil dibuat');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal membuat backup');
    }
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreBackup(id),
    onSuccess: () => {
      toast.success('Database berhasil di-restore dari backup');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal restore backup');
    }
  });

  // Delete backup mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBackup(id),
    onSuccess: () => {
      toast.success('Backup berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus backup');
    }
  });

  // Download backup mutation
  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const backup = backups.data?.data.find((b) => b.id === id);
      if (!backup) throw new Error('Backup not found');

      const blob = await downloadBackup(id);
      downloadBackupFile(blob, backup.filename);
    },
    onSuccess: () => {
      toast.success('Backup berhasil diunduh');
    },
    onError: (error: any) => {
      toast.error('Gagal mengunduh backup');
    }
  });

  const handleRestore = (id: string) => {
    if (
      window.confirm(
        'Perhatian: Data database saat ini akan diganti dengan backup ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?'
      )
    ) {
      restoreMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Backup akan dihapus secara permanen. Lanjutkan?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Backup</h1>
          <p className="mt-2 text-muted-foreground">
            Kelola backup database dan restore data
          </p>
        </div>
      </div>

      {/* Create Backup Card */}
      <Card>
        <CardHeader>
          <CardTitle>Buat Backup Baru</CardTitle>
          <CardDescription>Buat snapshot database terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Input
                id="description"
                placeholder="Misal: Backup mingguan atau sebelum update"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createMutation.isPending ? 'Membuat Backup...' : 'Buat Backup Sekarang'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Backup</CardTitle>
          <CardDescription>
            Total: {backups.data?.meta.total || 0} backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : backups.isError ? (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              Gagal memuat backup. Silakan coba lagi.
            </div>
          ) : backups.data?.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada backup. Buat backup pertama Anda sekarang.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Dibuat oleh</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.data?.data.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-mono text-sm">
                        {backup.filename}
                      </TableCell>
                      <TableCell>{formatSize(backup.size)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {backup.description || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {backup.createdBy?.name || 'System'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(backup.createdAt), {
                          addSuffix: true,
                          locale: idLocale
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            backup.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : backup.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {backup.status === 'COMPLETED'
                            ? 'Selesai'
                            : backup.status === 'FAILED'
                            ? 'Gagal'
                            : 'Menunggu'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Download backup"
                            onClick={() => downloadMutation.mutate(backup.id)}
                            disabled={downloadMutation.isPending}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            title="Restore dari backup"
                            onClick={() => handleRestore(backup.id)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            title="Hapus backup"
                            onClick={() => handleDelete(backup.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {backups.data && backups.data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Halaman {page} dari {backups.data.meta.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(backups.data?.meta.totalPages || 1, p + 1)
                    )
                  }
                  disabled={page === backups.data?.meta.totalPages}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Backup:</strong> Membuat snapshot database lengkap yang dapat digunakan
            untuk recovery jika terjadi masalah.
          </p>
          <p>
            <strong>Restore:</strong> Mengembalikan database ke state sebelumnya menggunakan
            backup yang tersimpan.
          </p>
          <p>
            <strong>Rekomendasi:</strong> Buat backup secara berkala, terutama sebelum
            melakukan update atau perubahan besar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
