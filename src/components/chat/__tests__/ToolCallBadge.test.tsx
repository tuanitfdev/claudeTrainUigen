import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getToolLabel pure function ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" })).toBe("Editing /App.jsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })).toBe("Editing /App.jsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading /App.jsx");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Undoing edit on /App.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/App.jsx" })).toBe("Deleting /App.jsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming /old.jsx → /new.jsx");
});

test("getToolLabel: unknown tool name falls back to tool name", () => {
  expect(getToolLabel("bash", { command: "run" })).toBe("bash");
});

test("getToolLabel: known tool with unknown command falls back to tool name", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown_cmd", path: "/App.jsx" })).toBe("str_replace_editor");
});

test("getToolLabel: missing path does not produce 'undefined'", () => {
  const label = getToolLabel("str_replace_editor", { command: "create" });
  expect(label).not.toContain("undefined");
  expect(label).toBe("Creating ");
});

// --- ToolCallBadge component ---

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: ToolInvocation["state"],
  result?: unknown
): ToolInvocation {
  return { toolCallId: "tc-1", toolName, args, state, result } as ToolInvocation;
}

test("ToolCallBadge shows spinner when state is 'call'", () => {
  const inv = makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call");
  const { container } = render(<ToolCallBadge toolInvocation={inv} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when state is 'partial-call'", () => {
  const inv = makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "partial-call");
  const { container } = render(<ToolCallBadge toolInvocation={inv} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows green dot when state is 'result' with non-null result", () => {
  const inv = makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", "Success");
  const { container } = render(<ToolCallBadge toolInvocation={inv} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner when state is 'result' but result is null", () => {
  const inv = makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", null);
  const { container } = render(<ToolCallBadge toolInvocation={inv} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge renders friendly label for str_replace_editor create", () => {
  const inv = makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", "ok");
  render(<ToolCallBadge toolInvocation={inv} />);
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("ToolCallBadge renders rename label with arrow", () => {
  const inv = makeInvocation("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, "result", "ok");
  render(<ToolCallBadge toolInvocation={inv} />);
  expect(screen.getByText("Renaming /old.jsx → /new.jsx")).toBeDefined();
});

test("ToolCallBadge renders raw tool name for unknown tool", () => {
  const inv = makeInvocation("bash", { command: "run" }, "result", "ok");
  render(<ToolCallBadge toolInvocation={inv} />);
  expect(screen.getByText("bash")).toBeDefined();
});
