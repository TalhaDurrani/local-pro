
"use client";

import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Star, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const data = [
  { name: 'Mon', completed: 4 },
  { name: 'Tue', completed: 7 },
  { name: 'Wed', completed: 5 },
  { name: 'Thu', completed: 9 },
  { name: 'Fri', completed: 12 },
  { name: 'Sat', completed: 15 },
  { name: 'Sun', completed: 8 },
];

export default function PerformanceMetrics() {
  const { t, isGlobalKillSwitchActive } = useAppContext();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle className="text-pro-sage flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t.metricsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-xs text-pro-sage/60 block mb-1 uppercase tracking-wider">{t.delivered}</span>
              <span className="text-2xl font-bold text-pro-sage">124</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-xs text-pro-sage/60 block mb-1 uppercase tracking-wider">{t.rating}</span>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-pro-sage">
                4.8 <Star className="h-5 w-5 fill-pro-sage text-pro-sage" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-pro-sage/80 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.trialStatus}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGlobalKillSwitchActive ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-400'}`}>
                {isGlobalKillSwitchActive ? t.terminated : '12 Days Left'}
              </span>
            </div>
            <Progress value={isGlobalKillSwitchActive ? 0 : 60} className="h-2 bg-white/10" />
            {isGlobalKillSwitchActive && (
              <p className="text-[10px] text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Trial terminated by administrator.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle className="text-pro-sage text-sm font-medium">Activity Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#cad2c5', fontSize: 10}} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{backgroundColor: '#2f3e46', border: '1px solid #cad2c5', borderRadius: '8px', color: '#cad2c5'}}
              />
              <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#cad2c5" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
