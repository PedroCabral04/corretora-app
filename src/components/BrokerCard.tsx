import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, TrendingUp, Home, DollarSign } from "lucide-react";

interface BrokerCardProps {
  broker: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    totalSales: number;
    totalListings: number;
    monthlyExpenses: number;
    totalValue: number;
  };
  onViewDetails: (brokerId: string) => void;
  onEdit?: (brokerId: string) => void;
  onDelete?: (brokerId: string) => void;
}

export const BrokerCard = ({ broker, onViewDetails, onEdit, onDelete }: BrokerCardProps) => {
  return (
  <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary-600/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{broker.name}</CardTitle>
              <div className="flex flex-col gap-1 mt-1">
                {broker.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    {broker.email}
                  </div>
                )}
                {broker.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    {broker.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(broker.id); }} className="text-sm text-primary hover:underline mr-2">Editar</button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(broker.id); }} className="text-sm text-destructive hover:underline">Excluir</button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm font-semibold">{broker.totalSales}</p>
              <p className="text-xs text-muted-foreground">Vendas</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Home className="h-4 w-4 text-info" />
            <div>
              <p className="text-sm font-semibold">{broker.totalListings}</p>
              <p className="text-xs text-muted-foreground">Captações</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Valor total: </span>
            <span className="font-semibold text-success">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(broker.totalValue)}
            </span>
          </div>
        </div>

        <Button 
          onClick={() => onViewDetails(broker.id)}
          className="w-full"
          variant="outline"
        >
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};