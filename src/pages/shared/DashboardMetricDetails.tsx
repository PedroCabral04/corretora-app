import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/Pagination";
import { useSales } from "@/contexts/SalesContext";
import { useListings } from "@/contexts/ListingsContext";
import { useBrokers } from "@/contexts/BrokersContext";
import { parseIsoDate } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR");
const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

type SortDirection = "asc" | "desc";

type SalesRow = {
  id: string;
  date: string;
  dateValue: number;
  client: string;
  property: string;
  value: number;
  commission: number;
  broker: string;
};

type ListingsRow = {
  id: string;
  date: string;
  dateValue: number;
  propertyAddress: string;
  propertyType: string;
  status: string;
  quantity: number;
  broker: string;
};

type TableRowType = SalesRow | ListingsRow;

type ColumnDefinition = {
  key: keyof (SalesRow & ListingsRow);
  label: string;
  isNumeric?: boolean;
  widthClass?: string;
};

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const formatDate = (isoDate: string) => {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return "-";
  }
  return DATE_FORMATTER.format(date);
};

const DashboardMetricDetails = () => {
  const { metricType } = useParams<{ metricType: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { sales, isLoading: salesLoading } = useSales();
  const { listings, isLoading: listingsLoading } = useListings();
  const { brokers } = useBrokers();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const selectedYearParam = searchParams.get("year");
  const selectedMonthParam = searchParams.get("month");
  const selectedBrokerParam = searchParams.get("brokerId");

  const selectedYear = Number.isNaN(Number(selectedYearParam)) || !selectedYearParam
    ? new Date().getFullYear()
    : Number(selectedYearParam);
  const selectedMonth = selectedMonthParam ?? "all";
  const selectedBroker = selectedBrokerParam ?? "all";

  const monthIndex = selectedMonth !== "all" ? Number.parseInt(selectedMonth, 10) : null;

  const { startDate, endDate } = useMemo(() => {
    if (!Number.isFinite(selectedYear)) {
      return { startDate: null as Date | null, endDate: null as Date | null };
    }

    if (monthIndex === null || Number.isNaN(monthIndex)) {
      return {
        startDate: new Date(selectedYear, 0, 1),
        endDate: new Date(selectedYear, 11, 31),
      };
    }

    return {
      startDate: new Date(selectedYear, monthIndex, 1),
      endDate: new Date(selectedYear, monthIndex + 1, 0),
    };
  }, [monthIndex, selectedYear]);

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) {
      return "Período selecionado";
    }
    return `${DATE_FORMATTER.format(startDate)} a ${DATE_FORMATTER.format(endDate)}`;
  }, [endDate, startDate]);

  const brokerNameMap = useMemo(() => {
    return brokers.reduce<Record<string, string>>((acc, broker) => {
      acc[broker.id] = broker.name;
      return acc;
    }, {});
  }, [brokers]);

  const selectedBrokerLabel = selectedBroker === "all"
    ? "Todos os Corretores"
    : brokerNameMap[selectedBroker] ?? "Corretor não encontrado";

  const brokerFilterFn = useMemo(() => {
    if (selectedBroker === "all") {
      return () => true;
    }
    return (brokerId: string) => brokerId === selectedBroker;
  }, [selectedBroker]);

  const dateFilterFn = useMemo(() => {
    if (!startDate || !endDate) {
      return () => true;
    }

    const startTime = new Date(startDate).setHours(0, 0, 0, 0);
    const endTime = new Date(endDate).setHours(23, 59, 59, 999);

    return (isoDate: string) => {
      const parsed = parseIsoDate(isoDate);
      if (!parsed) {
        return false;
      }
      const time = parsed.getTime();
      return time >= startTime && time <= endTime;
    };
  }, [endDate, startDate]);

  const salesRows = useMemo<SalesRow[]>(() => {
    return sales
      .filter((sale) => brokerFilterFn(sale.brokerId) && dateFilterFn(sale.saleDate))
      .map((sale) => {
        const saleDate = parseIsoDate(sale.saleDate);
        return {
          id: sale.id,
          date: sale.saleDate,
          dateValue: saleDate ? saleDate.getTime() : 0,
          client: sale.clientName || "Cliente não informado",
          property: sale.propertyAddress || "-",
          value: sale.saleValue || 0,
          commission: sale.commission || 0,
          broker: brokerNameMap[sale.brokerId] ?? "-",
        };
      });
  }, [brokerFilterFn, brokerNameMap, dateFilterFn, sales]);

  const listingsRows = useMemo<ListingsRow[]>(() => {
    return listings
      .filter((listing) => brokerFilterFn(listing.brokerId) && dateFilterFn(listing.listingDate))
      .filter((listing) => !(listing.status === "Agregado" && listing.isAggregate))
      .map((listing) => {
        const listingDate = parseIsoDate(listing.listingDate);
        return {
          id: listing.id,
          date: listing.listingDate,
          dateValue: listingDate ? listingDate.getTime() : 0,
          propertyAddress: listing.propertyAddress || "-",
          propertyType: listing.propertyType,
          status: listing.status,
          quantity: Number.isFinite(listing.quantity) ? listing.quantity : 1,
          broker: brokerNameMap[listing.brokerId] ?? "-",
        };
      });
  }, [brokerFilterFn, brokerNameMap, dateFilterFn, listings]);

  const metricKey = metricType === "vendas" ? "sales" : metricType === "captacoes" ? "listings" : null;

  const columns = useMemo<ColumnDefinition[]>(() => {
    if (metricKey === "sales") {
      return [
        { key: "property", label: "Endereço do Imóvel" },
        { key: "date", label: "Data" },
        { key: "client", label: "Cliente" },
        { key: "broker", label: "Corretor" },
        { key: "value", label: "Valor", isNumeric: true },
        { key: "commission", label: "Comissão", isNumeric: true },
      ];
    }

    if (metricKey === "listings") {
      return [
        { key: "propertyAddress", label: "Endereço do Imóvel" },
        { key: "date", label: "Data" },
        { key: "propertyType", label: "Tipo" },
        { key: "status", label: "Status" },
        { key: "quantity", label: "Quantidade", isNumeric: true },
        { key: "broker", label: "Corretor" },
      ];
    }

    return [];
  }, [metricKey]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [metricKey, location.search, itemsPerPage]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }

      return {
        key,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  const sortedRows = useMemo<TableRowType[]>(() => {
    const baseRows = metricKey === "sales" ? salesRows : metricKey === "listings" ? listingsRows : [];

    if (!sortConfig) {
      return baseRows;
    }

    const { key, direction } = sortConfig;

    return [...baseRows].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[key];
      const bValue = (b as Record<string, unknown>)[key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue, "pt-BR", { sensitivity: "base" })
          : bValue.localeCompare(aValue, "pt-BR", { sensitivity: "base" });
      }

      return 0;
    });
  }, [metricKey, salesRows, listingsRows, sortConfig]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedRows.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, sortedRows]);

  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const summary = useMemo(() => {
    if (metricKey === "sales") {
      const totalValue = salesRows.reduce((acc, row) => acc + row.value, 0);
      const totalCommission = salesRows.reduce((acc, row) => acc + row.commission, 0);
      return {
        title: "Detalhamento de Vendas",
        subtitle: `Período: ${periodLabel}`,
        extraInfo: `Corretor: ${selectedBrokerLabel}`,
        stats: [
          { label: "Total de Vendas", value: salesRows.length.toString() },
          { label: "Valor Total", value: CURRENCY_FORMATTER.format(totalValue) },
          { label: "Comissões", value: CURRENCY_FORMATTER.format(totalCommission) },
        ],
      };
    }

    if (metricKey === "listings") {
      const totalQuantity = listingsRows.reduce((acc, row) => acc + row.quantity, 0);
      return {
        title: "Detalhamento de Captações",
        subtitle: `Período: ${periodLabel}`,
        extraInfo: `Corretor: ${selectedBrokerLabel}`,
        stats: [
          { label: "Registros", value: listingsRows.length.toString() },
          { label: "Total de Captações", value: totalQuantity.toString() },
        ],
      };
    }

    return {
      title: "Detalhes",
      subtitle: periodLabel,
      extraInfo: selectedBrokerLabel,
      stats: [],
    };
  }, [listingsRows, metricKey, periodLabel, salesRows, selectedBrokerLabel]);

  const isLoading = metricKey === "sales" ? salesLoading : metricKey === "listings" ? listingsLoading : false;

  const metricBreadcrumbLabel = useMemo(() => {
    if (metricKey === "sales") {
      return `Detalhamento de Vendas (${periodLabel})`;
    }
    if (metricKey === "listings") {
      const monthLabel = monthIndex !== null && !Number.isNaN(monthIndex)
        ? monthNames[monthIndex]
        : "Ano Completo";
      return `Detalhamento de Captações (${monthLabel})`;
    }
    return "Detalhamento";
  }, [metricKey, monthIndex, periodLabel]);

  if (!metricKey) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métrica não encontrada</CardTitle>
              <CardDescription>
                Verifique se o link está correto ou retorne ao dashboard principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar para o Dashboard</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: metricBreadcrumbLabel },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{summary.title}</h1>
            <p className="text-muted-foreground mt-1">{summary.subtitle}</p>
            <p className="text-muted-foreground text-sm">{summary.extraInfo}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {summary.stats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
              ))}
              {summary.stats.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma estatística disponível para esta métrica.
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            ) : (totalItems === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado para o período selecionado.</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => {
                        const isSorted = sortConfig?.key === column.key;
                        const direction = isSorted ? sortConfig?.direction : undefined;

                        return (
                          <TableHead
                            key={column.key as string}
                            className={`cursor-pointer select-none ${column.isNumeric ? "text-right" : "text-left"}`}
                            onClick={() => handleSort(column.key as string)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{column.label}</span>
                              {isSorted ? (
                                direction === "asc" ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )
                              ) : null}
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row) => (
                      <TableRow key={row.id}>
                        {columns.map((column) => {
                          const rawValue = (row as Record<string, unknown>)[column.key as string];

                          if (column.key === "date") {
                            return (
                              <TableCell key={column.key as string}>{formatDate((row as SalesRow).date)}</TableCell>
                            );
                          }

                          if (column.key === "value" || column.key === "commission") {
                            return (
                              <TableCell key={column.key as string} className="text-right font-medium">
                                {CURRENCY_FORMATTER.format(Number(rawValue || 0))}
                              </TableCell>
                            );
                          }

                          if (column.key === "quantity") {
                            return (
                              <TableCell key={column.key as string} className="text-right font-medium">
                                {rawValue as number}
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={column.key as string} className={column.isNumeric ? "text-right" : "text-left"}>
                              {(rawValue ?? "-") as string | number}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardMetricDetails;
