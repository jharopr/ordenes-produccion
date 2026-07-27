import { Add, Assignment, Business, CloudUpload, Dashboard as DashboardIcon, Delete, Download, Edit, Menu as MenuIcon, PlayArrow, Save, Visibility } from '@mui/icons-material';
import {
  Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, FormControl, Grid, IconButton, InputLabel, MenuItem, Pagination, Paper, Select,
  Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Toolbar, Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, apiMessage, assetUrl, type Customer, type Location, type OrderStatus, type Page, type PaymentStatus, type ProductionOrder } from './lib/api';

const theme = createTheme({
  palette: { primary: { main: '#9f2028' }, secondary: { main: '#374151' }, background: { default: '#f5f6f8' } },
  typography: { fontFamily: '"Inter", "Segoe UI", sans-serif', h4: { fontWeight: 800 }, h5: { fontWeight: 700 }, button: { fontWeight: 700 } },
  shape: { borderRadius: 10 },
});
const drawerWidth = 245;
const statusLabel: Record<OrderStatus, string> = { DRAFT: 'Borrador', ORDERED: 'Ordenada', CANCELLED: 'Cancelada' };
const statusColor: Record<OrderStatus, 'default' | 'success' | 'error'> = { DRAFT: 'default', ORDERED: 'success', CANCELLED: 'error' };
const paymentLabel: Record<PaymentStatus, string> = { UNPAID: 'No pagada', PARTIALLY_PAID: 'Parcialmente pagada', PAID: 'Pagada' };
const paymentColor: Record<PaymentStatus, 'error' | 'warning' | 'success'> = { UNPAID: 'error', PARTIALLY_PAID: 'warning', PAID: 'success' };
const money = (value: string | number = 0) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value));
const date = (value?: string) => value ? new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : '—';

function Loading() { return <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>; }
function Empty({ text }: { text: string }) { return <Box sx={{ textAlign: 'center', py: 7, color: 'text.secondary' }}><Assignment sx={{ fontSize: 48, opacity: .25 }} /><Typography>{text}</Typography></Box>; }
function Title({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} gap={2}><Typography variant="h4">{children}</Typography>{action}</Stack>;
}

function Layout() {
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const nav = [{ to: '/', label: 'Dashboard', icon: <DashboardIcon /> }, { to: '/clientes', label: 'Clientes', icon: <Business /> }, { to: '/ordenes', label: 'Órdenes', icon: <Assignment /> }];
  const menu = <Box><Toolbar><Typography fontWeight={900} fontSize={20} color="primary">ÓRDENES DE PRODUCCIÓN</Typography></Toolbar><Divider />{nav.map((item) =>
    <Button key={item.to} component={Link} to={item.to} onClick={() => setMobile(false)} startIcon={item.icon}
      sx={{ justifyContent: 'flex-start', mx: 1.5, my: .5, px: 2, py: 1.3, width: 'calc(100% - 24px)', color: location.pathname === item.to ? 'primary.main' : 'text.secondary', bgcolor: location.pathname === item.to ? 'rgba(159,32,40,.08)' : 'transparent' }}>{item.label}</Button>)}</Box>;
  return <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', ml: { md: `${drawerWidth}px` }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
      <Toolbar><IconButton onClick={() => setMobile(true)} sx={{ display: { md: 'none' }, mr: 1 }}><MenuIcon /></IconButton><Typography fontWeight={700}>Gestión de producción</Typography></Toolbar>
    </AppBar>
    <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: drawerWidth, '& .MuiDrawer-paper': { width: drawerWidth } }}>{menu}</Drawer>
    <Drawer open={mobile} onClose={() => setMobile(false)} sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}>{menu}</Drawer>
    <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 }, mt: 8, maxWidth: 1500 }}><RoutesContent /></Box>
  </Box>;
}

function RoutesContent() {
  return <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/clientes" element={<Customers />} />
    <Route path="/clientes/nuevo" element={<CustomerForm />} />
    <Route path="/clientes/:id/editar" element={<CustomerSettings />} />
    <Route path="/ordenes" element={<Orders />} />
    <Route path="/ordenes/nueva" element={<OrderForm />} />
    <Route path="/ordenes/:id" element={<OrderDetail />} />
    <Route path="/ordenes/:id/editar" element={<OrderForm />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>;
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/production-orders/dashboard').then((r) => r.data) });
  if (isLoading) return <Loading />;
  if (error) return <Alert severity="error">{apiMessage(error)}</Alert>;
  const cards = [
    ['Total de órdenes', data.totalOrders, '#374151'], ['Borradores', data.byStatus.DRAFT ?? 0, '#6b7280'],
    ['Ordenadas', data.byStatus.ORDERED ?? 0, '#15803d'], ['Canceladas', data.byStatus.CANCELLED ?? 0, '#b91c1c'],
    ['Monto acumulado', money(data.totalAmount), '#9f2028'],
  ];
  return <><Title>Resumen general</Title><Grid container spacing={2} mb={4}>{cards.map(([label, value, color]) =>
    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }} key={String(label)}><Card sx={{ borderTop: `4px solid ${color}`, height: '100%' }}><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h5" mt={1}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
    <Paper><Box p={2.5}><Typography variant="h6" fontWeight={700}>Últimas órdenes</Typography></Box><Divider />{data.recent.length ? <TableContainer><Table><TableHead><TableRow><TableCell>Número</TableCell><TableCell>Cliente</TableCell><TableCell>Título</TableCell><TableCell>Estado</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>{data.recent.map((o: ProductionOrder) => <TableRow key={o.id} hover><TableCell><Button component={Link} to={`/ordenes/${o.id}`}>{o.orderNumber}</Button></TableCell><TableCell>{o.customer.businessName}</TableCell><TableCell>{o.title}</TableCell><TableCell><Chip size="small" label={statusLabel[o.status]} color={statusColor[o.status]} /></TableCell><TableCell align="right">{money(o.total)}</TableCell></TableRow>)}</TableBody></Table></TableContainer> : <Empty text="Aún no hay órdenes registradas." />}</Paper></>;
}

function Customers() {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({ queryKey: ['customers', search, page], queryFn: () => api.get<Page<Customer>>('/customers', { params: { search, page, limit: 10 } }).then((r) => r.data) });
  return <><Title>Clientes</Title>
    <Paper sx={{ p: 2, mb: 2 }}><TextField fullWidth size="small" label="Buscar por razón social, nombre comercial o RUC" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></Paper>
    <Paper>{isLoading ? <Loading /> : error ? <Alert severity="error">{apiMessage(error)}</Alert> : !data?.data.length ? <Empty text="No se encontraron clientes." /> :
      <><TableContainer><Table><TableHead><TableRow><TableCell>Razón social</TableCell><TableCell>Nombre comercial</TableCell><TableCell>RUC</TableCell><TableCell>Ciudad</TableCell><TableCell>Teléfono</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead><TableBody>{data.data.map((c) => <TableRow hover key={c.id}><TableCell><Stack direction="row" gap={1} alignItems="center"><b>{c.businessName}</b>{c.isDefault && <Chip size="small" color="primary" label="Predeterminado" />}</Stack></TableCell><TableCell>{c.tradeName || '—'}</TableCell><TableCell>{c.taxId || '—'}</TableCell><TableCell>{c.city || '—'}</TableCell><TableCell>{c.phone || '—'}</TableCell><TableCell align="right"><Button component={Link} to={`/clientes/${c.id}/editar`} startIcon={<Edit />}>Configurar</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer><Stack alignItems="center" p={2}><Pagination page={page} count={data.meta.pages || 1} onChange={(_, p) => setPage(p)} /></Stack></>}</Paper></>;
}

type CustomerFormValues = Omit<Customer, 'id'>;
function CustomerForm() {
  const { id } = useParams(); const navigate = useNavigate(); const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({ defaultValues: { businessName: '' } });
  const customer = useQuery({ queryKey: ['customer', id], enabled: !!id, queryFn: () => api.get<Customer>(`/customers/${id}`).then((r) => r.data) });
  useEffect(() => { if (customer.data) reset(customer.data); }, [customer.data, reset]);
  const mutation = useMutation({ mutationFn: (values: CustomerFormValues) => id ? api.patch(`/customers/${id}`, values) : api.post('/customers', values), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); navigate('/clientes'); } });
  return <><Title>{id ? 'Editar cliente' : 'Nuevo cliente'}</Title><Paper component="form" onSubmit={handleSubmit((v) => mutation.mutate(v))} sx={{ p: { xs: 2, md: 4 } }}>
    {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>{apiMessage(mutation.error)}</Alert>}
    <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Razón social *" {...register('businessName', { required: true, minLength: 2 })} error={!!errors.businessName} /></Grid>
    <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Nombre comercial" {...register('tradeName')} /></Grid><Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="RUC / documento fiscal" {...register('taxId')} /></Grid>
    <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Ciudad" {...register('city')} /></Grid><Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Teléfono" {...register('phone')} /></Grid>
    <Grid size={{ xs: 12 }}><TextField fullWidth label="Dirección" {...register('address')} /></Grid><Grid size={{ xs: 12, md: 6 }}><TextField fullWidth type="email" label="Correo" {...register('email')} /></Grid>
    <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Persona de contacto" {...register('contactName')} /></Grid></Grid>
    <Stack direction="row" justifyContent="flex-end" gap={1} mt={3}><Button onClick={() => navigate(-1)}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<Save />} disabled={mutation.isPending}>Guardar</Button></Stack></Paper></>;
}

type SettingsFormValues = Pick<Customer, 'businessName' | 'tradeName' | 'taxId' | 'address' | 'city' | 'phone' | 'email' | 'contactName'>;
function CustomerSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [logo, setLogo] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>();
  const customer = useQuery({
    queryKey: ['customer', id],
    enabled: !!id,
    queryFn: () => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  });
  useEffect(() => {
    if (customer.data) reset({
      businessName: customer.data.businessName,
      tradeName: customer.data.tradeName ?? '',
      taxId: customer.data.taxId ?? '',
      address: customer.data.address ?? '',
      city: customer.data.city ?? '',
      phone: customer.data.phone ?? '',
      email: customer.data.email ?? '',
      contactName: customer.data.contactName ?? '',
    });
  }, [customer.data, reset]);
  const mutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!customer.data) throw new Error('Cliente no disponible');
      await api.patch(`/customers/${customer.data.id}`, {
        ...values,
        email: values.email || undefined,
      });
      if (logo) {
        const data = new FormData();
        data.append('logo', logo);
        await api.post(`/customers/${customer.data.id}/logo`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    },
    onSuccess: async () => {
      setLogo(null); setSaved(true);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['customer', id] }),
        qc.invalidateQueries({ queryKey: ['customer', 'default'] }),
        qc.invalidateQueries({ queryKey: ['customers'] }),
      ]);
    },
  });
  if (customer.isLoading) return <Loading />;
  return <><Title>Editar cliente</Title><Paper component="form" onSubmit={handleSubmit((values) => mutation.mutate(values))} sx={{ p: { xs: 2, md: 4 } }}>
    {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>{apiMessage(mutation.error)}</Alert>}
    <Stack direction="column" alignItems="flex-start" gap={2} mb={4}>
      <Box sx={{ width: 'min(540px, 100%)', aspectRatio: '540 / 150', border: '1px dashed', borderColor: 'divider', borderRadius: 2, display: 'grid', placeItems: 'center', overflow: 'hidden', bgcolor: '#fafafa' }}>
        {(logo || customer.data?.logoPath) ? <Box component="img" src={logo ? URL.createObjectURL(logo) : assetUrl(customer.data?.logoPath)} alt="Logo del cliente" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Typography variant="body2" color="text.secondary">Sin logo</Typography>}
      </Box>
      <Box><Button component="label" variant="outlined" startIcon={<CloudUpload />}>Seleccionar logo<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} /></Button><Typography variant="caption" display="block" color="text.secondary" mt={1}>Tamaño recomendado: 540 × 150 px. PNG, JPG o WEBP. Máximo 5 MB.</Typography></Box>
    </Stack>
    <Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Razón social *" {...register('businessName', { required: true, minLength: 2 })} error={!!errors.businessName} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Nombre comercial" {...register('tradeName')} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="RUC" {...register('taxId')} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Ciudad" {...register('city')} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Teléfono" {...register('phone')} /></Grid>
      <Grid size={{ xs: 12 }}><TextField fullWidth label="Dirección" {...register('address')} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth type="email" label="Correo" {...register('email')} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Persona de contacto" {...register('contactName')} /></Grid>
    </Grid>
    <Stack direction="row" justifyContent="flex-end" gap={1} mt={3}><Button onClick={() => navigate('/clientes')}>Volver</Button><Button type="submit" variant="contained" startIcon={<Save />} disabled={mutation.isPending}>Guardar cliente</Button></Stack>
  </Paper><Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)} message="Cliente actualizado." /></>;
}

function Orders() {
  const [filters, setFilters] = useState({ search: '', status: '', locationId: '' }); const [page, setPage] = useState(1);
  const [paymentOrder, setPaymentOrder] = useState<ProductionOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', filters, page],
    queryFn: () => api.get<Page<ProductionOrder>>('/production-orders', {
      params: Object.fromEntries(Object.entries({ ...filters, page, limit: 10 }).filter(([, value]) => value !== '')),
    }).then((r) => r.data),
  });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api.get<Location[]>('/locations').then((r) => r.data) });
  const payment = useMutation({
    mutationFn: () => api.post(`/production-orders/${paymentOrder?.id}/payments`, {
      amount: paymentAmount,
      notes: paymentNotes || undefined,
    }),
    onSuccess: async () => {
      setPaymentOrder(null); setPaymentAmount(''); setPaymentNotes('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['orders'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
  return <><Title>Órdenes de producción <Button component={Link} to="/ordenes/nueva" variant="contained" startIcon={<Add />}>Nueva orden</Button></Title>
    <Paper sx={{ p: 2, mb: 2 }}><Grid container spacing={2}><Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" label="Buscar número, cliente o título" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></Grid>
    <Grid size={{ xs: 6, md: 3 }}><FormControl fullWidth size="small"><InputLabel>Estado</InputLabel><Select label="Estado" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><MenuItem value="">Todos</MenuItem>{Object.entries(statusLabel).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</Select></FormControl></Grid>
    <Grid size={{ xs: 6, md: 3 }}><FormControl fullWidth size="small"><InputLabel>Sede</InputLabel><Select label="Sede" value={filters.locationId} onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}><MenuItem value="">Todas</MenuItem>{locations.data?.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}</Select></FormControl></Grid></Grid></Paper>
    <Paper>{isLoading ? <Loading /> : error ? <Alert severity="error">{apiMessage(error)}</Alert> : !data?.data.length ? <Empty text="No se encontraron órdenes." /> : <><TableContainer><Table><TableHead><TableRow><TableCell>Número</TableCell><TableCell>Título / Cliente</TableCell><TableCell>Sede</TableCell><TableCell>Inicio</TableCell><TableCell>Estado</TableCell><TableCell>Pago</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead><TableBody>{data.data.map((o) => <TableRow hover key={o.id}><TableCell><b>{o.orderNumber}</b></TableCell><TableCell><b>{o.title}</b><Typography variant="caption" display="block" color="text.secondary">{o.customer.businessName}</Typography></TableCell><TableCell>{o.location?.name || '—'}</TableCell><TableCell>{date(o.startDate)}</TableCell><TableCell><Chip size="small" label={statusLabel[o.status]} color={statusColor[o.status]} /></TableCell><TableCell><Chip size="small" variant="outlined" label={paymentLabel[o.paymentStatus]} color={paymentColor[o.paymentStatus]} /></TableCell><TableCell align="right">{money(o.total)}</TableCell><TableCell align="right"><Button size="small" onClick={() => setPaymentOrder(o)} disabled={o.status === 'CANCELLED' || o.paymentStatus === 'PAID'}>Pago</Button><IconButton component={Link} to={`/ordenes/${o.id}`}><Visibility /></IconButton><IconButton component={Link} to={`/ordenes/${o.id}/editar`} disabled={o.status === 'CANCELLED'}><Edit /></IconButton><IconButton component="a" href={`${api.defaults.baseURL}/production-orders/${o.id}/pdf`}><Download /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer><Stack alignItems="center" p={2}><Pagination page={page} count={data.meta.pages || 1} onChange={(_, p) => setPage(p)} /></Stack></>}</Paper>
    <Dialog open={!!paymentOrder} onClose={() => setPaymentOrder(null)} fullWidth maxWidth="xs"><DialogTitle>Registrar pago</DialogTitle><DialogContent><Stack gap={2} mt={1}>{payment.error && <Alert severity="error">{apiMessage(payment.error)}</Alert>}<Typography variant="body2"><b>{paymentOrder?.title}</b><br />Total: {money(paymentOrder?.total)} · Estado: {paymentOrder ? paymentLabel[paymentOrder.paymentStatus] : ''}</Typography><TextField autoFocus type="number" label="Importe del pago *" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} slotProps={{ htmlInput: { min: .01, step: .01 } }} /><TextField multiline minRows={2} label="Nota (opcional)" value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} /><Alert severity="info">La fecha del pago se registrará automáticamente.</Alert></Stack></DialogContent><DialogActions><Button onClick={() => setPaymentOrder(null)}>Cancelar</Button><Button variant="contained" disabled={!paymentAmount || payment.isPending} onClick={() => payment.mutate()}>Registrar pago</Button></DialogActions></Dialog></>;
}

type OrderFormValues = {
  customerId: string; locationId?: string; title: string; executionAddress?: string; startDate?: string;
  estimatedCompletionDate?: string; requestedBy?: string; notes?: string; discount: string;
  items: { description: string; quantity: string; unitPrice: string; displayOrder?: number }[];
  initialPayment?: { amount?: string; notes?: string };
};

function OrderForm() {
  const { id } = useParams(); const navigate = useNavigate(); const qc = useQueryClient();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OrderFormValues>({
    defaultValues: {
      customerId: '', title: '', startDate: today, discount: '0',
      items: [{ description: '', quantity: '1', unitPrice: '0' }],
    },
  });
  const fields = useFieldArray({ control, name: 'items' });
  const defaultCustomer = useQuery({ queryKey: ['customer', 'default'], queryFn: () => api.get<Customer>('/customers/default').then((r) => r.data) });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api.get<Location[]>('/locations').then((r) => r.data) });
  const order = useQuery({ queryKey: ['order', id], enabled: !!id, queryFn: () => api.get<ProductionOrder>(`/production-orders/${id}`).then((r) => r.data) });
  useEffect(() => {
    if (order.data) reset({ ...order.data, locationId: order.data.locationId ?? '' });
  }, [order.data, reset]);
  useEffect(() => {
    if (!id && defaultCustomer.data) setValue('customerId', defaultCustomer.data.id);
  }, [defaultCustomer.data, id, setValue]);
  const values = watch();
  const subtotal = useMemo(() => values.items?.reduce((sum, item) =>
    sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) ?? 0, [values.items]);
  const mutation = useMutation({ mutationFn: (values: OrderFormValues) => {
    const payload = {
      ...values,
      initialPayment: !id && values.initialPayment?.amount
        ? { amount: values.initialPayment.amount, notes: values.initialPayment.notes || undefined }
        : undefined,
    };
    return id ? api.patch(`/production-orders/${id}`, payload) : api.post('/production-orders', payload);
  }, onSuccess: (r) => { void qc.invalidateQueries({ queryKey: ['orders'] }); navigate(`/ordenes/${r.data.id}`); } });
  return <><Title>{id ? 'Editar orden' : 'Nueva orden de producción'}</Title><Paper component="form" onSubmit={handleSubmit((v) => mutation.mutate(v))} sx={{ p: { xs: 2, md: 4 } }}>
    {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>{apiMessage(mutation.error)}</Alert>}
    <input type="hidden" {...register('customerId', { required: true })} />
    <Typography variant="h6" mb={2}>1. Datos generales</Typography><Grid container spacing={2}>
      <Grid size={{ xs: 12 }}><Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}><Stack direction="row" gap={2} alignItems="center">{(defaultCustomer.data?.logoPath || order.data?.customer.logoPath) && <Box component="img" src={assetUrl(defaultCustomer.data?.logoPath ?? order.data?.customer.logoPath)} alt="" sx={{ width: 144, height: 40, objectFit: 'contain' }} />}<Box><Typography variant="caption" color="text.secondary">CLIENTE</Typography><Typography fontWeight={800}>{defaultCustomer.data?.businessName ?? order.data?.customer.businessName ?? 'Cargando Salabus…'}</Typography><Typography variant="body2" color="text.secondary">RUC {defaultCustomer.data?.taxId ?? order.data?.customer.taxId ?? '—'} · {defaultCustomer.data?.address ?? order.data?.customer.address ?? 'Lima'}</Typography></Box></Stack></Paper></Grid>
      <Grid size={{ xs: 12, md: 6 }}><Controller name="locationId" control={control} render={({ field }) => <FormControl fullWidth><InputLabel>Sede</InputLabel><Select {...field} label="Sede"><MenuItem value="">Sin sede</MenuItem>{locations.data?.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}</Select></FormControl>} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Título del trabajo *" {...register('title', { required: true, minLength: 2 })} error={!!errors.title} /></Grid>
      <Grid size={{ xs: 12 }}><TextField fullWidth label="Dirección de ejecución" {...register('executionAddress')} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth type="date" label="Fecha de inicio" slotProps={{ inputLabel: { shrink: true } }} {...register('startDate')} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth type="date" label="Terminación estimada (opcional)" slotProps={{ inputLabel: { shrink: true } }} {...register('estimatedCompletionDate')} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Solicitado por (opcional)" {...register('requestedBy')} /></Grid>
    </Grid><Divider sx={{ my: 4 }} /><Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}><Box><Typography variant="h6">2. Características</Typography><Typography variant="body2" color="text.secondary">La descripción acepta varias líneas. Use Enter o Shift+Enter para insertar un salto.</Typography></Box><Button startIcon={<Add />} onClick={() => fields.append({ description: '', quantity: '1', unitPrice: '0' })}>Agregar característica</Button></Stack>
    <TableContainer sx={{ mb: 3 }}><Table size="small"><TableHead><TableRow><TableCell>Descripción</TableCell><TableCell width={120}>Cantidad</TableCell><TableCell width={150}>Precio unitario</TableCell><TableCell width={130} align="right">Subtotal</TableCell><TableCell width={55} /></TableRow></TableHead><TableBody>{fields.fields.map((field, index) => { const item = values.items?.[index]; return <TableRow key={field.id}><TableCell><TextField fullWidth multiline minRows={2} size="small" placeholder={'Cualquiera 1\\nCualquiera 2'} {...register(`items.${index}.description`, { required: true, minLength: 2 })} /></TableCell><TableCell><TextField size="small" type="number" slotProps={{ htmlInput: { min: .01, step: .01 } }} {...register(`items.${index}.quantity`, { required: true })} /></TableCell><TableCell><TextField size="small" type="number" slotProps={{ htmlInput: { min: 0, step: .01 } }} {...register(`items.${index}.unitPrice`, { required: true })} /></TableCell><TableCell align="right">{money((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0))}</TableCell><TableCell><IconButton color="error" onClick={() => fields.remove(index)} disabled={fields.fields.length === 1}><Delete /></IconButton></TableCell></TableRow>; })}</TableBody></Table></TableContainer>
    <Grid container spacing={3} mt={1}><Grid size={{ xs: 12, md: 7 }}><Typography variant="h6" mb={2}>3. Observaciones y pago <Typography component="span" variant="body2" color="text.secondary">(opcional)</Typography></Typography><TextField fullWidth multiline minRows={3} label="Observaciones de la orden" {...register('notes')} />{!id && <Grid container spacing={2} mt={.5}><Grid size={{ xs: 12, sm: 5 }}><TextField fullWidth type="number" label="Pago inicial" slotProps={{ htmlInput: { min: .01, step: .01 } }} {...register('initialPayment.amount')} /></Grid><Grid size={{ xs: 12, sm: 7 }}><TextField fullWidth label="Nota del pago" {...register('initialPayment.notes')} /></Grid></Grid>}<Alert severity="info" sx={{ mt: 2 }}>{id ? 'Los pagos adicionales se registran desde la lista de órdenes.' : 'El pago es opcional y su fecha se registrará automáticamente.'}</Alert></Grid>
    <Grid size={{ xs: 12, md: 5 }}><Paper variant="outlined" sx={{ p: 3, bgcolor: '#fafafa' }}><Stack gap={1.5}><Stack direction="row" justifyContent="space-between"><span>Subtotal</span><b>{money(subtotal)}</b></Stack><TextField type="number" label="Descuento" size="small" {...register('discount')} /><Divider /><Stack direction="row" justifyContent="space-between"><Typography variant="h6">TOTAL</Typography><Typography variant="h5" color="primary" fontWeight={800}>{money(Math.max(0, subtotal - Number(values.discount || 0)))}</Typography></Stack></Stack></Paper></Grid></Grid>
    <Stack direction="row" justifyContent="flex-end" gap={1} mt={4}><Button onClick={() => navigate(-1)}>Cancelar</Button><Button variant="contained" type="submit" startIcon={<Save />} disabled={mutation.isPending}>Guardar orden</Button></Stack></Paper></>;
}

function OrderDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const qc = useQueryClient(); const [message, setMessage] = useState('');
  const order = useQuery({ queryKey: ['order', id], queryFn: () => api.get<ProductionOrder>(`/production-orders/${id}`).then((r) => r.data) });
  const status = useMutation({ mutationFn: (payload: { status: OrderStatus }) => api.patch(`/production-orders/${id}/status`, payload), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['order', id] }); void qc.invalidateQueries({ queryKey: ['dashboard'] }); setMessage('Estado actualizado.'); } });
  const remove = useMutation({ mutationFn: () => api.delete(`/production-orders/${id}`), onSuccess: () => navigate('/ordenes') });
  if (order.isLoading) return <Loading />; if (order.error || !order.data) return <Alert severity="error">{apiMessage(order.error)}</Alert>;
  const o = order.data;
  return <><Title>{o.orderNumber}<Stack direction="row" gap={1} flexWrap="wrap"><Button component="a" href={`${api.defaults.baseURL}/production-orders/${o.id}/pdf`} variant="outlined" startIcon={<Download />}>Descargar PDF</Button>{o.status !== 'CANCELLED' && <Button component={Link} to={`/ordenes/${o.id}/editar`} variant="contained" startIcon={<Edit />}>Editar</Button>}</Stack></Title>
    {(status.error || remove.error) && <Alert severity="error" sx={{ mb: 2 }}>{apiMessage(status.error || remove.error)}</Alert>}
    <Paper sx={{ overflow: 'hidden' }}><Box sx={{ p: { xs: 2, md: 4 }, borderTop: '6px solid', borderColor: 'primary.main' }}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}><Stack direction="row" gap={2} alignItems="center">{o.customer.logoPath && <Box component="img" src={assetUrl(o.customer.logoPath)} alt="" sx={{ width: 180, height: 50, objectFit: 'contain' }} />}<Box><Typography variant="overline" color="primary">Orden de producción</Typography><Typography variant="h4">{o.title}</Typography><Typography color="text.secondary" mt={1}>{o.customer.businessName} · {o.customer.taxId || 'Sin RUC'}</Typography></Box></Stack><Stack gap={1} alignItems="flex-end"><Chip label={statusLabel[o.status]} color={statusColor[o.status]} /><Chip variant="outlined" label={paymentLabel[o.paymentStatus]} color={paymentColor[o.paymentStatus]} /></Stack></Stack>
    <Divider sx={{ my: 3 }} /><Grid container spacing={3}>{[['Sede', o.location?.name], ['Dirección de ejecución', o.executionAddress], ['Fecha de inicio', date(o.startDate)], ['Terminación estimada', date(o.estimatedCompletionDate)], ['Terminación real', date(o.completionDate)], ['Solicitado por', o.requestedBy]].map(([l, v]) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography fontWeight={600}>{v || '—'}</Typography></Grid>)}</Grid>
    <Typography variant="h6" mt={4} mb={2}>Características solicitadas</Typography><TableContainer><Table><TableHead><TableRow><TableCell>Descripción</TableCell><TableCell align="right">Cantidad</TableCell><TableCell align="right">Precio unitario</TableCell><TableCell align="right">Subtotal</TableCell></TableRow></TableHead><TableBody>{o.items.map((i, n) => <TableRow key={i.id ?? n}><TableCell><Typography sx={{ whiteSpace: 'pre-wrap' }}>{i.description}</Typography></TableCell><TableCell align="right">{i.quantity}</TableCell><TableCell align="right">{money(i.unitPrice)}</TableCell><TableCell align="right">{money(i.subtotal)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <Stack alignItems="flex-end" mt={3}><Box sx={{ width: { xs: '100%', sm: 330 } }}><Stack direction="row" justifyContent="space-between"><span>Subtotal</span><b>{money(o.subtotal)}</b></Stack><Stack direction="row" justifyContent="space-between"><span>Descuento</span><b>{money(o.discount)}</b></Stack><Divider sx={{ my: 1 }} /><Stack direction="row" justifyContent="space-between"><Typography variant="h6">TOTAL</Typography><Typography variant="h5" color="primary" fontWeight={800}>{money(o.total)}</Typography></Stack></Box></Stack>
    {o.notes && <><Typography variant="h6" mt={4}>Observaciones</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{o.notes}</Typography></>}
    {!!o.payments?.length && <><Typography variant="h6" mt={4}>Pagos registrados</Typography><Table size="small"><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Nota</TableCell><TableCell align="right">Importe</TableCell></TableRow></TableHead><TableBody>{o.payments.map((payment) => <TableRow key={payment.id}><TableCell>{new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(payment.paidAt))}</TableCell><TableCell>{payment.notes || '—'}</TableCell><TableCell align="right">{money(payment.amount)}</TableCell></TableRow>)}</TableBody></Table></>}
    <Divider sx={{ my: 3 }} /><Stack direction="row" gap={1} flexWrap="wrap">{o.status === 'DRAFT' && <><Button variant="contained" startIcon={<PlayArrow />} onClick={() => status.mutate({ status: 'ORDERED' })}>Marcar como ordenada</Button><Button color="error" onClick={() => status.mutate({ status: 'CANCELLED' })}>Cancelar orden</Button><Button color="error" variant="outlined" onClick={() => { if (confirm('¿Eliminar esta orden en borrador?')) remove.mutate(); }}>Eliminar</Button></>}{o.status === 'ORDERED' && <Button color="error" onClick={() => status.mutate({ status: 'CANCELLED' })}>Cancelar orden</Button>}</Stack></Box></Paper>
    <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage('')} message={message} /></>;
}

export default function App() { return <ThemeProvider theme={theme}><Layout /></ThemeProvider>; }
