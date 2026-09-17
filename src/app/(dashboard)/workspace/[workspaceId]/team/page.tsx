import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { WorkspaceRole } from "@prisma/client";

interface TeamPageProps {
  params: {
    workspaceId: string;
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await auth();

  // 1. Check authentication
  if (!session?.user?.email) {
    redirect("/");
  }

  // 2. Fetch workspace data
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  // 3. Handle not found
  if (!workspace) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Workspace Tidak Ditemukan</h2>
        <p className="text-muted-foreground">Workspace yang Anda cari tidak ada atau telah dihapus.</p>
      </div>
    );
  }

  // 4. Find current user
  const currentUserMember = workspace.members.find(
    (m) => m.user.email === session.user?.email
  );

  // 5. Check if user is member
  if (!currentUserMember) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">Anda bukan anggota resmi dari workspace ini.</p>
      </div>
    );
  }

  const isAdmin = currentUserMember.role === "ADMIN";

  const getRoleBadgeColor = (role: WorkspaceRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "CREATIVE_DIRECTOR":
        return "bg-blue-100 text-blue-800";
      case "TEAM":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: WorkspaceRole) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "CREATIVE_DIRECTOR":
        return "Creative Director";
      case "TEAM":
        return "Team Member";
      default:
        return role;
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tim & Anggota</h2>
          <p className="text-muted-foreground">
            Kelola akses dan peran anggota di dalam {workspace.name}.
          </p>
        </div>
        
        {isAdmin && (
          <InviteMemberDialog 
            workspaceId={workspace.id} 
            workspaceName={workspace.name} 
          />
        )}
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anggota</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Bergabung</TableHead>
              {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspace.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center text-muted-foreground">
                  Belum ada anggota. {isAdmin && "Undang seseorang untuk memulai!"}
                </TableCell>
              </TableRow>
            ) : (
              workspace.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-3 py-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.user.image || undefined} alt={member.user.name || "Avatar"} />
                      <AvatarFallback>
                        {member.user.name ? member.user.name.charAt(0).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{member.user.name || "Tanpa Nama"}</span>
                  </TableCell>
                  
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(member.role)}`}>
                      {getRoleDisplayName(member.role)}
                    </span>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {member.joinedAt ? format(new Date(member.joinedAt), "d MMM yyyy", { locale: id }) : "Menunggu"}
                  </TableCell>

                  {isAdmin && (
                    <TableCell className="text-right">
                      {member.id !== currentUserMember.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
