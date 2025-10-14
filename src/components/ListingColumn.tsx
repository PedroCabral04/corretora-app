import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Home, Building2, Building, MapPin, TreePine } from 'lucide-react';
import { Listing } from '@/contexts/ListingsContext';

interface ListingColumnProps {
  propertyType: 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara';
  brokerId: string;
  listings: Listing[];
  aggregateQuantity: number;
  onQuantityChange: (quantity: number) => void;
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
  onAddDetailed,
  onEdit,
  onDelete,
}) => {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(aggregateQuantity.toString());

  const Icon = propertyIcons[propertyType];
  const colorClass = propertyColors[propertyType];

  // Filtrar apenas captações detalhadas deste tipo
  const detailedListings = listings.filter(
    l => l.propertyType === propertyType && !l.isAggregate
  );

  // Calcular total de quantidades detalhadas ativas
  const detailedTotal = detailedListings
    .filter(l => l.status === 'Ativo')
    .reduce((sum, l) => sum + (l.quantity || 1), 0);

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
              <button
                onClick={() => {
                  setIsEditingQuantity(true);
                  setTempQuantity(aggregateQuantity.toString());
                }}
                className="text-xl font-bold underline decoration-2 decoration-primary/30 hover:decoration-primary underline-offset-4 hover:text-primary transition-colors"
              >
                {aggregateQuantity}
              </button>
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

          {detailedTotal > 0 && (
            <div className="text-xs text-muted-foreground">
              + {detailedTotal} detalhada{detailedTotal !== 1 ? 's' : ''}
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
        <div className="space-y-2">
          {detailedListings.length > 0 ? (
            <>
              <div className="text-xs font-medium text-muted-foreground uppercase">
                Captações Detalhadas ({detailedListings.length})
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {detailedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="border rounded-lg p-3 space-y-2 hover:border-primary/50 transition-colors bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(listing.status)}
                          {listing.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              x{listing.quantity}
                            </Badge>
                          )}
                        </div>
                        {listing.propertyAddress && (
                          <p className="text-xs text-foreground font-medium mb-1 truncate" title={listing.propertyAddress}>
                            📍 {listing.propertyAddress}
                          </p>
                        )}
                        {listing.propertyValue && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">
                            💰 R$ {listing.propertyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(listing.listingDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
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
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma captação detalhada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
