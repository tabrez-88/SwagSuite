import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Pencil, UserX } from "lucide-react";
import type { TeamMemberPickerProps } from "../../types";

interface TeamMemberPickerComponentProps extends TeamMemberPickerProps {
  teamMembers: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  isLocked: boolean;
  openPopover: "salesRep" | "csr" | null;
  setOpenPopover: (val: "salesRep" | "csr" | null) => void;
  onReassign: (vars: { field: "assignedUserId" | "csrUserId"; userId: string | null }) => void;
}

export default function TeamMemberPicker({
  role,
  field,
  currentUser,
  teamMembers,
  isLocked,
  openPopover,
  setOpenPopover,
  onReassign,
}: TeamMemberPickerComponentProps) {
  const popoverId = field === "assignedUserId" ? "salesRep" : "csr";

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{role}</span>
      <Popover
        open={openPopover === popoverId}
        onOpenChange={(open) => setOpenPopover(open ? popoverId : null)}
      >
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <UserAvatar size="xs" user={currentUser} />
              <span className="text-sm font-medium">
                {currentUser.firstName} {currentUser.lastName}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">Unassigned</span>
          )}
          {!isLocked && (
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
          )}
        </div>
        <PopoverContent className="p-0 w-60" align="end">
          <Command>
            <CommandInput placeholder="Search team..." />
            <CommandList>
              <CommandEmpty>No team members found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => onReassign({ field, userId: null })}
                  className="flex items-center gap-2"
                >
                  <UserX className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unassign</span>
                </CommandItem>
                {teamMembers.map((member) => {
                  const isSelected = currentUser?.id === member.id;
                  return (
                    <CommandItem
                      key={member.id}
                      value={`${member.firstName} ${member.lastName} ${member.email}`}
                      onSelect={() => onReassign({ field, userId: member.id })}
                      className="flex items-center gap-2"
                    >
                      <UserAvatar size="xs" user={{ ...member, firstName: member.firstName ?? undefined, lastName: member.lastName ?? undefined }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
