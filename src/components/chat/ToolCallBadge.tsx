import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const path = (args.path as string | undefined) ?? "";

  if (toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    switch (command) {
      case "create":     return `Creating ${path}`;
      case "str_replace":
      case "insert":     return `Editing ${path}`;
      case "view":       return `Reading ${path}`;
      case "undo_edit":  return `Undoing edit on ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string | undefined;
    const newPath = (args.new_path as string | undefined) ?? "";
    switch (command) {
      case "delete": return `Deleting ${path}`;
      case "rename": return `Renaming ${path} → ${newPath}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getToolLabel(toolName, args as Record<string, unknown>);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
