import { deletionTiming } from '../../constants/timing';
// Owner-approved Phase 5 undo window. Pending state is never persisted.
export const DELETION_UNDO_SECONDS = deletionTiming.undoWindowSeconds;
