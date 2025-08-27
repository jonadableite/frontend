// src/app/(protected)/whatsapp/components/tooltip-action-button.tsx
import { Loader2 } from "lucide-react";
import * as React from "react";

import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipActionButtonProps extends ButtonProps {
  tooltip: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function TooltipActionButton({
  tooltip,
  isLoading = false,
  children,
  onClick,
  disabled,
  ...props
}: TooltipActionButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      e.preventDefault(); // Impede o clique se estiver carregando
      return;
    }
    onClick?.(e);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            onClick={handleClick}
            disabled={disabled || isLoading}
            {...props}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              children
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
