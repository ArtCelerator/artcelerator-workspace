'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { WorkspaceRole } from '@prisma/client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { inviteMemberToWorkspace } from '@/app/(dashboard)/workspace/[workspaceId]/team/actions';

const inviteMemberSchema = z.object({
  email: z.string().email('Email tidak valid'),
  role: z.enum(['ADMIN', 'CREATIVE_DIRECTOR', 'TEAM'])
});

type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

export interface InviteMemberDialogProps {
  workspaceId: string;
  workspaceName: string;
  onSuccess?: () => void;
}

export function InviteMemberDialog({ workspaceId, workspaceName, onSuccess }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'TEAM'
    }
  });

  const selectedRole = watch('role');

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset(); // Reset form when closing
    }
  };

  const onSubmit = async (data: InviteMemberForm) => {
    setIsSubmitting(true);
    try {
      const result = await inviteMemberToWorkspace(
        workspaceId,
        data.email,
        data.role as WorkspaceRole
      );

      if (result.success) {
        toast.success(result.message || 'Berhasil mengirim undangan');
        handleOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Gagal mengirim undangan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2">
        <UserPlus className="w-4 h-4" />
        Invite Member
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member to {workspaceName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="nama@email.com" 
              disabled={isSubmitting}
              {...register('email')} 
            />
            {errors.email && (
              <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              disabled={isSubmitting} 
              value={selectedRole} 
              onValueChange={(val) => setValue('role', val as InviteMemberForm['role'])}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CREATIVE_DIRECTOR">Creative Director</SelectItem>
                <SelectItem value="TEAM">Team</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 font-medium">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
