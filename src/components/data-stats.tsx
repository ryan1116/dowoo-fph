"use client";

import { Database, DollarSign, Route, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DataStats } from "@/app/data/_actions/upload";

interface DataStatsDisplayProps {
  stats: DataStats;
  onRefresh: () => void;
  onClearMarketData: () => void;
  isRefreshing: boolean;
}

export function DataStatsDisplay({ stats, onRefresh, onClearMarketData, isRefreshing }: DataStatsDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Current Database</h3>
        <div className="flex gap-2">
          {stats.marketDataCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearMarketData}>
              <Trash2 className="mr-1 h-3 w-3" />
              Clear Market Data
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Market Data</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.marketDataCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">historical records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Variables</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.costMasterCount}</div>
            <p className="text-xs text-muted-foreground">configured items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Route Standards</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.routeStandardCount}</div>
            <p className="text-xs text-muted-foreground">calculated routes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
