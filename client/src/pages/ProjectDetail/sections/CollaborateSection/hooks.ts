import type { useProjectData } from "../../hooks";

interface UseCollaborateSectionParams {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export function useCollaborateSection({ orderId, data }: UseCollaborateSectionParams) {
  const { assignedUser, csrUser } = data;

  return {
    orderId,
    data,
    assignedUser,
    csrUser,
  };
}
