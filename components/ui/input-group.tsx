import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="group" data-slot="input-group" className={cn("flex min-h-11 w-full min-w-0 items-center rounded-lg border border-white/15 bg-zinc-950 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20", className)} {...props} />;
}

export function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input-group-control" className={cn("h-11 w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none disabled:opacity-50", className)} {...props} />;
}

export function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-group-addon" className={cn("flex shrink-0 items-center pr-1.5", className)} {...props} />;
}

export function InputGroupButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button type="button" variant="ghost" size="icon" className={cn("text-zinc-400", className)} {...props} />;
}
