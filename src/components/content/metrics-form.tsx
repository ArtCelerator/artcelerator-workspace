'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsFormProps {
  contentId: string;
  latestMetrics?: any;
  onSuccess?: () => void;
}

export function MetricsForm({ contentId, latestMetrics, onSuccess }: MetricsFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      likes: latestMetrics?.likes || 0,
      comments: latestMetrics?.comments || 0,
      shares: latestMetrics?.shares || 0,
      saves: latestMetrics?.saves || 0,
      reach: latestMetrics?.reach || 0,
      impressions: latestMetrics?.impressions || 0,
      clicks: latestMetrics?.clicks || 0,
      views: latestMetrics?.views || 0,
      watchTime: latestMetrics?.watchTime || 0,
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contents/${contentId}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast.success('Metrics berhasil diperbarui');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Gagal memperbarui metrics');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Update Metrics (Admin Only)</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1"><Label>❤️ Likes</Label><Input type="number" {...register('likes', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>💬 Comments</Label><Input type="number" {...register('comments', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>🔄 Shares</Label><Input type="number" {...register('shares', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>🔖 Saves</Label><Input type="number" {...register('saves', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>👥 Reach</Label><Input type="number" {...register('reach', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>👁️ Impressions</Label><Input type="number" {...register('impressions', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>🖱️ Clicks</Label><Input type="number" {...register('clicks', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>▶️ Views</Label><Input type="number" {...register('views', { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>⏱️ Watch Time (s)</Label><Input type="number" {...register('watchTime', { valueAsNumber: true })} /></div>
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Update Metrics'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
