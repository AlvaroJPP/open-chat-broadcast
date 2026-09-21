import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeaderIconButtonProps extends React.ComponentProps<"button"> {
    label: string;
    active?: boolean;
    variant?: "default" | "danger";
}

export function HeaderIconButton({
    label,
    active,
    variant = "default",
    className,
    children,
    ...props
}: HeaderIconButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant={variant === "danger" ? "destructive" : "icon"}
                    size="icon"
                    aria-label={label}
                    className={cn(
                        "rounded-xl",
                        active && variant !== "danger" && "border-primary/60 bg-primary/15 text-primary",
                        className,
                    )}
                    {...props}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}