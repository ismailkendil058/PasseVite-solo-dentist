import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Search, Download, Users, DollarSign, Stethoscope, Calendar, MessageSquare, Star, Smile, Frown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CompletedClient {
  id: string;
  client_name: string;
  phone: string;
  client_id: string;
  state: string;
  treatment: string;
  total_amount: number;
  tranche_paid: number;
  completed_at: string;
  receptionist_id: string;
  doctor: { name: string; initial: string } | null;
  receptionist_name?: string;
}

interface ReviewSubmission {
  id: string;
  satisfied: boolean;
  patient_name: string | null;
  phone: string | null;
  feedback: string | null;
  created_at: string;
}

const Manager = () => {
  const { signOut } = useAuth();
  const [clients, setClients] = useState<CompletedClient[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [treatmentFilter, setTreatmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<ReviewSubmission[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, satisfied: 0, dissatisfied: 0 });

  const fetchData = async () => {
    setLoading(true);
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('completed_clients')
      .select('*, doctor:doctors(*)')
      .gte('completed_at', fromDate.toISOString())
      .lte('completed_at', toDate.toISOString())
      .order('completed_at', { ascending: false });

    if (data) {
      const uniqueIds = [...new Set(data.map(d => d.receptionist_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', uniqueIds);

      const profileMap = new Map(profiles?.map(p => {
        const name = p.full_name || p.email?.split('@')[0] || '—';
        return [p.id, name];
      }) || []);

      setClients(data.map(c => ({
        ...c,
        doctor: c.doctor as any,
        receptionist_name: profileMap.get(c.receptionist_id) || '—',
      })));
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('review_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as ReviewSubmission[]);
      const satisfied = data.filter(r => r.satisfied).length;
      setReviewStats({
        total: data.length,
        satisfied,
        dissatisfied: data.length - satisfied
      });
    }
  };

  useEffect(() => {
    supabase.from('doctors').select('id, name').then(({ data }) => {
      if (data) setDoctors(data);
    });
  }, []);

  useEffect(() => { fetchData(); fetchReviews(); }, [dateFrom, dateTo]);

  const treatments = useMemo(() => {
    const set = new Set(clients.map(c => c.treatment));
    return Array.from(set).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = !searchQuery ||
        c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.treatment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDoctor = doctorFilter === 'all' || c.doctor?.name === doctorFilter;
      const matchesTreatment = treatmentFilter === 'all' || c.treatment === treatmentFilter;
      return matchesSearch && matchesDoctor && matchesTreatment;
    });
  }, [clients, searchQuery, doctorFilter, treatmentFilter]);

  const analytics = useMemo(() => {
    const totalClients = filtered.length;
    const totalRevenue = filtered.reduce((s, c) => s + (c.total_amount || 0), 0);
    const totalPaid = filtered.reduce((s, c) => s + (c.tranche_paid || 0), 0);

    return { totalClients, totalRevenue, totalPaid };
  }, [filtered]);

  const exportExcel = () => {
    const headers = ['Nom', 'Téléphone', 'ID', 'Médecin', 'Traitement', 'Montant Total', 'Tranche Payée', 'Date'];
    const rows = filtered.map(c => [
      c.client_name,
      c.phone,
      c.client_id,
      c.doctor?.name || '',
      c.treatment,
      c.total_amount,
      c.tranche_paid,
      format(new Date(c.completed_at), 'dd/MM/yyyy HH:mm'),
    ]);

    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passevite-rapport-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-background z-10">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-primary italic">PasseVite</h1>
          <p className="text-[10px] text-muted-foreground uppercase">le soin qui passe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowReviews(true)} className="gap-2 font-bold text-xs h-9 sm:h-10">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="hidden sm:inline">Avis</span>
            <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px] bg-yellow-100 text-yellow-700 border-yellow-200">
              {reviewStats.satisfied}
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Date filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground mb-1 block">Du</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 sm:h-10 text-sm" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground mb-1 block">Au</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 sm:h-10 text-sm" />
          </div>
          <Button variant="outline" onClick={exportExcel} className="gap-1 h-9 sm:h-10 text-sm">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone, traitement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 sm:h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10 text-sm"><SelectValue placeholder="Traitement" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous traitements</SelectItem>
                {treatments.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-2">
              <div className="order-2 sm:order-1">
                <span className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">Patients</span>
                <p className="text-lg sm:text-3xl font-black text-primary leading-none sm:leading-tight">{analytics.totalClients}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center order-1 sm:order-2">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-2">
              <div className="order-2 sm:order-1">
                <span className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">Revenus</span>
                <p className="text-lg sm:text-3xl font-black text-foreground leading-none sm:leading-tight">
                  <span className="hidden sm:inline-block">{analytics.totalRevenue.toLocaleString()} <small className="text-sm font-normal text-muted-foreground">DZD</small></span>
                  <span className="sm:hidden">{Math.floor(analytics.totalRevenue / 1000)}k</span>
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center order-1 sm:order-2">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-2">
              <div className="order-2 sm:order-1">
                <span className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">Payé</span>
                <p className="text-lg sm:text-3xl font-black text-foreground leading-none sm:leading-tight">
                  <span className="hidden sm:inline-block">{analytics.totalPaid.toLocaleString()} <small className="text-sm font-normal text-muted-foreground">DZD</small></span>
                  <span className="sm:hidden">{Math.floor(analytics.totalPaid / 1000)}k</span>
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center order-1 sm:order-2">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <div className="sm:hidden space-y-2">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucune donnée</p>
          ) : (
            filtered.map(c => (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{c.client_name}</p>
                      <a href={`tel:${c.phone}`} className="text-sm text-primary font-medium">{c.phone}</a>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{c.total_amount?.toLocaleString()} DZD</p>
                      <p className="text-xs font-bold text-emerald-600">Payé: {c.tranche_paid?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <span className="truncate max-w-[150px]">{c.treatment}</span>
                    <span>{format(new Date(c.completed_at), 'dd/MM/yy HH:mm')}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="border-0 shadow-sm overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-bold">Patient</TableHead>
                  <TableHead className="font-bold text-center">Traitement</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                  <TableHead className="text-right font-bold">Payé</TableHead>
                  <TableHead className="text-right font-bold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <p className="text-muted-foreground animate-pulse">Chargement des données...</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucune donnée trouvée pour cette période.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(c => (
                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{c.client_name}</span>
                          <a href={`tel:${c.phone}`} className="text-xs text-primary font-medium">{c.phone}</a>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-secondary/50 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          {c.treatment}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-black text-primary">
                        {c.total_amount?.toLocaleString()} DZD
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {c.tranche_paid?.toLocaleString()} DZD
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-muted-foreground">
                        {format(new Date(c.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Reviews Dialog */}
        <Dialog open={showReviews} onOpenChange={setShowReviews}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl max-h-[85dvh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl">
            <DialogHeader className="p-6 bg-yellow-50/50 border-b border-yellow-100">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-xl font-black text-yellow-700 italic">
                  <Star className="h-6 w-6 fill-yellow-500" /> Analyse des Avis
                </DialogTitle>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-emerald-100 rounded-full flex items-center gap-1.5">
                    <Smile className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700">{reviewStats.satisfied}</span>
                  </div>
                  <div className="px-3 py-1 bg-rose-100 rounded-full flex items-center gap-1.5">
                    <Frown className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-black text-rose-700">{reviewStats.dissatisfied}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Messages Privés (Négatifs)</h3>

              {reviews.filter(r => !r.satisfied).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted rounded-3xl">
                  <MessageSquare className="h-10 w-10 text-muted mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground font-medium">Aucun retour négatif pour le moment</p>
                </div>
              ) : (
                reviews.filter(r => !r.satisfied).map((r) => (
                  <Card key={r.id} className="border-0 bg-secondary/30 shadow-none rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground text-sm">{r.patient_name || 'Patient Anonyme'}</p>
                          {r.phone && <a href={`tel:${r.phone}`} className="text-[10px] text-primary font-bold">{r.phone}</a>}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                          {format(new Date(r.created_at), 'dd/MM/yy HH:mm')}
                        </span>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-black/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        <p className="text-sm text-foreground/90 leading-relaxed italic">"{r.feedback}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {reviewStats.total > 0 && (
                <div className="pt-6 border-t">
                  <div className="bg-primary/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Taux de Satisfaction</p>
                      <p className="text-2xl font-black text-primary">
                        {Math.round((reviewStats.satisfied / reviewStats.total) * 100)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-primary fill-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Manager;
