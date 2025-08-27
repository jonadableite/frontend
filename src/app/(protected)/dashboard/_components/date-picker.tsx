"use client";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X as ClearIcon } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const defaultFrom = subDays(new Date(), 30);
  const defaultTo = new Date();

  const [from, setFrom] = useQueryState(
    "from",
    parseAsIsoDate.withDefault(defaultFrom),
  );
  const [to, setTo] = useQueryState(
    "to",
    parseAsIsoDate.withDefault(defaultTo),
  );

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    setFrom(dateRange?.from || null, { shallow: false });
    setTo(dateRange?.to || null, { shallow: false });
  };

  const handleQuickSelect = (rangeName: string) => {
    let newFrom: Date | null = null;
    let newTo: Date | null = null;
    const today = new Date();

    switch (rangeName) {
      case "last7Days":
        newFrom = subDays(today, 7);
        newTo = today;
        break;
      case "last30Days":
        newFrom = subDays(today, 30);
        newTo = today;
        break;
      case "thisMonth":
        newFrom = startOfMonth(today);
        newTo = endOfMonth(today);
        break;
      case "lastMonth":
        newFrom = startOfMonth(subMonths(today, 1));
        newTo = endOfMonth(subMonths(today, 1));
        break;
      case "allTime":
        newFrom = null;
        newTo = null;
        break;
      default:
        break;
    }
    setFrom(newFrom, { shallow: false });
    setTo(newTo, { shallow: false });
  };

  const date = {
    from,
    to,
  };
  const hasSelectedRange = from && to;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            // Adicione 'relative' para posicionar o ícone de limpar absolutamente
            className={cn(
              "w-[280px] justify-start text-left font-normal relative",
              !hasSelectedRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {hasSelectedRange ? (
              <>
                {format(date.from!, "LLL dd, y", { locale: ptBR })} -{" "}
                {format(date.to!, "LLL dd, y", { locale: ptBR })}
              </>
            ) : (
              <span>Selecione um período</span>
            )}
            {hasSelectedRange && (
              // Use um span com role="button" e estilos para o ícone de limpar
              <span
                role="button"
                aria-label="Limpar seleção de data"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer
                           text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation(); // Previne que o popover abra
                  handleQuickSelect("allTime"); // Limpa a seleção
                }}
              >
                <ClearIcon className="h-4 w-4" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto p-0" align="end">
          <div className="flex flex-col border-r p-2">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickSelect("last7Days")}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickSelect("last30Days")}
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickSelect("thisMonth")}
            >
              Este mês
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickSelect("lastMonth")}
            >
              Mês passado
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickSelect("allTime")}
            >
              Todo o período
            </Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || defaultFrom}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
