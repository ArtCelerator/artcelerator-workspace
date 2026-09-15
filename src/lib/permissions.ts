import { WorkspaceRole, ContentStatus } from './constants';

export function canChangeStatus(
  role: WorkspaceRole,
  currentStatus: ContentStatus,
  newStatus: ContentStatus,
  isAssignedToUser: boolean
): boolean {
  if (role === 'ADMIN') return true;

  if (role === 'CREATIVE_DIRECTOR') {
    // Creative Director cannot jump straight from drafting to published without review
    if (currentStatus === 'DRAFTING' && newStatus === 'PUBLISHED') return false;
    return true;
  }

  if (role === 'TEAM') {
    if (!isAssignedToUser) return false;
    
    const allowedTransitions: Record<ContentStatus, ContentStatus[]> = {
      IDEA: ['DRAFTING'],
      DRAFTING: ['REVIEW'],
      REVIEW: ['DRAFTING'],
      SCHEDULED: [],
      PUBLISHED: [],
      ARCHIVED: []
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  return false;
}

export function canEditContent(
  role: WorkspaceRole,
  contentCreatedById: string,
  contentAssignedToId: string | null | undefined,
  contentStatus: ContentStatus,
  userId: string
): boolean {
  if (role === 'ADMIN' || role === 'CREATIVE_DIRECTOR') return true;

  if (role === 'TEAM') {
    return (
      contentAssignedToId === userId &&
      contentStatus !== 'REVIEW' &&
      contentStatus !== 'SCHEDULED' &&
      contentStatus !== 'PUBLISHED'
    );
  }

  return false;
}

export function canDeleteContent(role: WorkspaceRole): boolean {
  return role === 'ADMIN' || role === 'CREATIVE_DIRECTOR';
}

export function canViewContent(
  role: WorkspaceRole,
  contentAssignedToId: string | null | undefined,
  contentStatus: ContentStatus,
  userId: string
): boolean {
  if (role === 'ADMIN' || role === 'CREATIVE_DIRECTOR') return true;

  if (role === 'TEAM') {
    return contentAssignedToId === userId || contentStatus === 'PUBLISHED';
  }

  return false;
}
