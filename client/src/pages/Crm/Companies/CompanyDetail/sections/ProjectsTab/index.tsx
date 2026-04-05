import { ArrowRight, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "@/components/shared/StageBadge";
import { format } from "date-fns";
import { useProjectsTab } from "./hooks";
import type { ProjectsTabProps } from "./types";

export default function ProjectsTab({
  companyId,
  onCreateProject,
  onNavigate,
}: ProjectsTabProps) {
  const { projectsWithStage, formatCurrency } = useProjectsTab(companyId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Projects
          </CardTitle>
          <Button
            size="sm"
            className="bg-swag-primary hover:bg-swag-primary/90"
            onClick={onCreateProject}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projectsWithStage.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-2">Order #</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">In-Hands Date</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            {projectsWithStage.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-12 gap-4 items-center py-2 border-b last:border-0 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => onNavigate(`/projects/${project.id}`)}
              >
                <div className="col-span-2 text-sm font-medium text-swag-orange">
                  #{project.orderNumber}
                </div>
                <div className="col-span-3 text-sm truncate">
                  {project.projectName || "Untitled"}
                </div>
                <div className="col-span-2">
                  {project._determinedStage && (
                    <StageBadge stage={project._determinedStage} size="sm" showSubStatus={false} />
                  )}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {project.inHandsDate
                    ? format(new Date(project.inHandsDate), "MMM d, yyyy")
                    : "—"}
                </div>
                <div className="col-span-2 text-sm font-medium text-right">
                  {project.total ? formatCurrency(project.total) : "—"}
                </div>
                <div className="col-span-1 flex justify-end">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create the first project for this company.
            </p>
            <Button
              size="sm"
              onClick={onCreateProject}
              className="bg-swag-primary hover:bg-swag-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Project
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
