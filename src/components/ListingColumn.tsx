import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Home, Building2, Building, MapPin, TreePine, Check, X, ChevronRight } from 'lucide-react';
import { Listing, DetailedListingStatus } from '@/contexts/ListingsContext';
import { formatDateBR } from '@/lib/utils';

interface ListingColumnProps {
  propertyType: 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara';
  brokerId: string;
  listings: Listing[];
  aggregateQuantity: number;
  onQuantityChange: (quantity: number) => void;
  statusQuantities: Record<DetailedListingStatus, number>;
  onStatusQuantityChange: (status: DetailedListingStatus, quantity: number) => void;
  onAddDetailed: () => void;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
}

const propertyIcons = {
  'Apartamento': Building2,
  'Casa': Home,
  'Sobrado': Building,
  'Lote': MapPin,
  'Chácara': TreePine,
};

const propertyColors = {
  'Apartamento': 'bg-blue-500',
  'Casa': 'bg-green-500',
  'Sobrado': 'bg-purple-500',
  'Lote': 'bg-orange-500',
  'Chácara': 'bg-emerald-500',
};

export const ListingColumn: React.FC<ListingColumnProps> = ({
  propertyType,
  brokerId,
  listings,
  aggregateQuantity,
  onQuantityChange,
  statusQuantities,
  onStatusQuantityChange,
  onAddDetailed,
  onEdit,
  onDelete,
}) => {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(aggregateQuantity.toString());
  const [editingStatus, setEditingStatus] = useState<DetailedListingStatus | null>(null);
  const [tempStatusQuantity, setTempStatusQuantity] = useState('0');
  const [expandedSections, setExpandedSections] = useState<Record<DetailedListingStatus, boolean>>(() => ({
    Ativo: false,
    Moderação: false,
    Vendido: false,
    Desativado: false,
  }));

  const Icon = propertyIcons[propertyType];
  const colorClass = propertyColors[propertyType];

  const statusConfigs: Array<{ status: DetailedListingStatus; label: string; headerClass: string; countClass: string }> = [
    { status: 'Ativo', label: 'Ativas', headerClass: 'bg-emerald-500/10', countClass: 'text-emerald-600 dark:text-emerald-300' },
    { status: 'Desativado', label: 'Desativadas', headerClass: 'bg-slate-500/10', countClass: 'text-slate-600 dark:text-slate-300' },
    { status: 'Moderação', label: 'Em moderação', headerClass: 'bg-amber-500/10', countClass: 'text-amber-600 dark:text-amber-300' },
    { status: 'Vendido', label: 'Vendidas', headerClass: 'bg-blue-500/10', countClass: 'text-blue-600 dark:text-blue-300' }
  ];

  // Filtrar apenas captações detalhadas deste tipo
  const detailedListings = listings.filter(
    l => l.propertyType === propertyType && !l.isAggregate
  );

  const listingsByStatus = statusConfigs.reduce<Record<DetailedListingStatus, Listing[]>>((acc, config) => {
    acc[config.status] = [];
    return acc;
  }, {} as Record<DetailedListingStatus, Listing[]>);

  detailedListings.forEach((listing) => {
    const status = listing.status as DetailedListingStatus;
    if (listingsByStatus[status]) {
      listingsByStatus[status].push(listing);
    }
  });

  const hasAnyListing = detailedListings.length > 0;

  const renderListingCard = (listing: Listing) => (
    <div
      key={listing.id}
      className="border rounded-lg p-3 space-y-2 hover:border-primary/50 transition-colors bg-card w-full"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {getStatusBadge(listing.status)}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(listing)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(listing.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {listing.propertyAddress && (
        <p className="text-xs text-foreground font-medium" title={listing.propertyAddress}>
          📍 {listing.propertyAddress}
        </p>
      )}

      {listing.propertyValue && (
        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
          💰 R$ {listing.propertyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDateBR(listing.listingDate)}</span>
        {listing.quantity > 1 && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            x{listing.quantity}
          </Badge>
        )}
      </div>
    </div>
  );

  // Calcular total de quantidades detalhadas ativas (para exibir separadamente)
  const detailedActiveTotal = detailedListings
    .filter(l => l.status === 'Ativo')
    .reduce((sum, l) => sum + (l.quantity || 1), 0);

  // Calcular total de TODAS as captações detalhadas (todos os status)
  const detailedTotalAll = detailedListings
    .reduce((sum, l) => sum + (l.quantity || 1), 0);

  // Total combinado: agregado manual + todas as detalhadas
  const totalQuantity = aggregateQuantity + detailedTotalAll;

  const handleQuantityBlur = () => {
    const newQuantity = parseInt(tempQuantity) || 0;
    if (newQuantity !== aggregateQuantity && newQuantity >= 0) {
      onQuantityChange(newQuantity);
    }
    setIsEditingQuantity(false);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantityBlur();
    } else if (e.key === 'Escape') {
      setTempQuantity(aggregateQuantity.toString());
      setIsEditingQuantity(false);
    }
  };

  const startEditingStatusQuantity = (status: DetailedListingStatus) => {
    setEditingStatus(status);
    setTempStatusQuantity(String(statusQuantities[status] ?? 0));
  };

  const cancelStatusQuantity = () => {
    setEditingStatus(null);
    setTempStatusQuantity('0');
  };

  const confirmStatusQuantity = () => {
    if (!editingStatus) return;
    const parsed = Math.max(0, parseInt(tempStatusQuantity, 10) || 0);
    if (parsed !== (statusQuantities[editingStatus] ?? 0)) {
      onStatusQuantityChange(editingStatus, parsed);
    }
    cancelStatusQuantity();
  };

  const handleStatusQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger onBlur which will save
    } else if (e.key === 'Escape') {
      cancelStatusQuantity();
    }
  };

  const handleStatusQuantityBlur = () => {
    if (!editingStatus) return;
    const parsed = Math.max(0, parseInt(tempStatusQuantity, 10) || 0);
    if (parsed !== (statusQuantities[editingStatus] ?? 0)) {
      onStatusQuantityChange(editingStatus, parsed);
    }
    cancelStatusQuantity();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'Ativo': { variant: 'default', label: 'Ativo' },
      'Desativado': { variant: 'outline', label: 'Desativado' },
      'Vendido': { variant: 'secondary', label: 'Vendido' },
      'Moderação': { variant: 'destructive', label: 'Moderação' },
    };
    const config = variants[status] || variants['Ativo'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const toggleSection = (status: DetailedListingStatus) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className={`${colorClass} text-white pb-3`}>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <CardTitle className="text-lg">{propertyType}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-4 space-y-4">
        {/* Contador Editável */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Quantidade Total:</span>
            {!isEditingQuantity ? (
              <div className="flex flex-col items-end">
                <button
                  onClick={() => {
                    setIsEditingQuantity(true);
                    setTempQuantity(aggregateQuantity.toString());
                  }}
                  className="text-xl font-bold underline decoration-2 decoration-primary/30 hover:decoration-primary underline-offset-4 hover:text-primary transition-colors"
                >
                  {totalQuantity}
                </button>
                {detailedTotalAll > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {aggregateQuantity} manual + {detailedTotalAll} detalhada{detailedTotalAll !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ) : (
              <Input
                type="number"
                min="0"
                value={tempQuantity}
                onChange={(e) => setTempQuantity(e.target.value)}
                onBlur={handleQuantityBlur}
                onKeyDown={handleQuantityKeyDown}
                className="w-20 h-8 text-right"
                autoFocus
              />
            )}
          </div>

          {expandedSections['Ativo'] && detailedActiveTotal > 0 && (
            <div className="text-xs text-muted-foreground">
              {detailedActiveTotal} cadastrada{detailedActiveTotal !== 1 ? 's' : ''} no status ativo
            </div>
          )}
        </div>

        {/* Botão Adicionar Captação Detalhada */}
        <Button
          onClick={onAddDetailed}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Captação
        </Button>

        {/* Lista de Captações Detalhadas */}
        <div className="space-y-3">
          {statusConfigs.map(({ status, label, headerClass, countClass }) => {
            const statusListings = listingsByStatus[status] ?? [];
            const manualQuantity = statusQuantities[status] ?? 0;
            const detailedCount = statusListings.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const isExpanded = expandedSections[status];

            return (
              <div key={status} className="rounded-lg border border-border/60">
                <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-t-lg ${headerClass}`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSection(status)}
                      className="text-muted-foreground hover:text-foreground transition-transform"
                      aria-label={`Alternar ${label}`}
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  {editingStatus === status ? (
                    <Input
                      type="number"
                      min="0"
                      value={tempStatusQuantity}
                      onChange={(e) => setTempStatusQuantity(e.target.value)}
                      onKeyDown={handleStatusQuantityKeyDown}
                      onBlur={handleStatusQuantityBlur}
                      className="h-7 w-16 px-2 text-right text-xs"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditingStatusQuantity(status)}
                      className={`flex items-center gap-1 text-xs font-semibold ${countClass} hover:underline`}
                    >
                      <span>{manualQuantity}</span>
                      <Edit className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {isExpanded && detailedCount > 0 && (
                  <div className="px-3 pt-2 text-[11px] text-muted-foreground">
                    {detailedCount} cadastrada{detailedCount !== 1 ? 's' : ''}
                  </div>
                )}

                {isExpanded && statusListings.length > 0 && (
                  <div className="space-y-2 border-t px-3 py-2">
                    {statusListings.map(renderListingCard)}
                  </div>
                )}

                {isExpanded && statusListings.length === 0 && detailedCount === 0 && (
                  <div className="border-t px-3 py-3 text-xs text-muted-foreground">
                    Nenhuma captação cadastrada neste status
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasAnyListing && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Nenhuma captação detalhada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
