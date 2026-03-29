import type { useProjectData } from "../../hooks";

interface UseCollaborateSectionParams {
  projectId: string;
  data: ReturnType<typeof useProjectData>;
}

export function useCollaborateSection({ projectId, data }: UseCollaborateSectionParams) {
  const { assignedUser, csrUser } = data;

  return {
    projectId,
    data,
    assignedUser,
    csrUser,
  };
}
