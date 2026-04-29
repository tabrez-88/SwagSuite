import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Calendar, CheckCircle2, Clock, Edit2, ExternalLink,
  Loader2, MapPin, Plus, RefreshCw, Send, Ship, Trash2, Truck,
} from "lucide-react";
import type { OrderShipment } from "@shared/schema";
import { STATUS_OPTIONS } from "../types";

function getStatusBadge(status: string | null) {
  const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
  return <Badge className={`${opt.color} text-xs`}>{opt.label}</Badge>;
}

const fmtDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--";

interface ShipmentTrackingCardProps {
  shipments: OrderShipment[];
  shipmentsLoading: boolean;
  showShipmentTracking: boolean;
  isLocked?: boolean;
  deliveredCount: number;
  totalShippingCost: number;
  getTrackingUrl: (carrier: string | null, tracking: string | null) => string | null;
  openNew: () => void;
  openEdit: (s: OrderShipment) => void;
  setDeleteTarget: (s: OrderShipment | null) => void;
  setNotifyShipment: (s: OrderShipment | null) => void;
  isShipStationConnected?: boolean;
  onSyncShipStation?: () => void;
  isSyncingShipStation?: boolean;
}

export function ShipmentTrackingCard({
  shipments,
  shipmentsLoading,
  showShipmentTracking,
  isLocked,
  deliveredCount,
  totalShippingCost,
  getTrackingUrl,
  openNew,
  openEdit,
  setDeleteTarget,
  setNotifyShipment,
  isShipStationConnected,
  onSyncShipStation,
  isSyncingShipStation,
}: ShipmentTrackingCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              Shipment Tracking
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {shipments.length} shipment{shipments.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isShipStationConnected && onSyncShipStation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onSyncShipStation} disabled={isSyncingShipStation}>
                      {isSyncingShipStation ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Sync ShipStation
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Pull latest tracking data from ShipStation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button size="sm" onClick={openNew} disabled={isLocked}>
              <Plus className="w-4 h-4 mr-2" /> Add Shipment
            </Button>
          </div>
        </div>
        {showShipmentTracking && (
          <div className="space-y-3 mt-2">
            {shipmentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : shipments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No shipments yet</h3>
                  <p className="text-sm text-gray-500">Shipments will appear here once orders are shipped</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {shipments.map((s) => {
                    const trackUrl = getTrackingUrl(s.carrier, s.trackingNumber);
                    return (
                      <Card key={s.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(s.status)}
                                {s.carrier && <span className="text-sm font-medium">{s.carrier}</span>}
                                {s.shippingMethod && <span className="text-xs text-gray-500">{s.shippingMethod}</span>}
                                {s.shipstationShipmentId && (
                                  <Badge variant="outline" className="text-[10px] gap-1 text-indigo-600 border-indigo-200 bg-indigo-50">
                                    <Ship className="w-2.5 h-2.5" /> ShipStation
                                  </Badge>
                                )}
                              </div>
                              {s.trackingNumber && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-gray-500">Tracking:</span>
                                  <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{s.trackingNumber}</code>
                                  {trackUrl && (
                                    <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs">
                                      Track <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {s.shipDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ship: {fmtDate(s.shipDate)}</span>}
                                {s.estimatedDelivery && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ETA: {fmtDate(s.estimatedDelivery)}</span>}
                                {s.actualDelivery && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Delivered: {fmtDate(s.actualDelivery)}</span>}
                              </div>
                              {(s.shipToName || s.shipToCompany || s.shipToAddress) && (
                                <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>{[s.shipToName, s.shipToCompany, s.shipToAddress].filter(Boolean).join(" - ")}</span>
                                </div>
                              )}
                              {s.notes && <p className="mt-2 text-xs text-gray-500 italic">{s.notes}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {s.shippingCost && parseFloat(s.shippingCost) > 0 && (
                                <span className="text-sm font-semibold">${parseFloat(s.shippingCost).toFixed(2)}</span>
                              )}
                              {s.trackingNumber && (
                                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setNotifyShipment(s)}>
                                  <Send className="w-3 h-3" /> Notify Client
                                </Button>
                              )}
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => openEdit(s)}>
                                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLocked} onClick={() => setDeleteTarget(s)}>
                                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <Card className="bg-blue-50/60">
                  <CardContent className="p-4">
                    <dl className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-5">
                        <div><dt className="text-gray-500 text-xs">Shipments</dt><dd className="font-semibold">{shipments.length}</dd></div>
                        <div><dt className="text-gray-500 text-xs">Delivered</dt><dd className="font-semibold text-green-600">{deliveredCount} / {shipments.length}</dd></div>
                      </div>
                      <div className="text-right">
                        <dt className="text-xs text-gray-500">Total Shipping</dt>
                        <dd className="text-lg font-bold text-blue-600">${totalShippingCost.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
