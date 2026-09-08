import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  ArrowLeft, ArrowUpLeft, BarChart3, Bell, CalendarDays, Check, ChevronRight,
  CircleHelp, Coins, Crown, Gem, Home as HomeIcon, Info, LayoutGrid, Medal,
  MessageCircle, MoreHorizontal, Plus, RefreshCw, Search, Settings, ShieldCheck,
  ShoppingBag, Spade, Sparkles, Swords, Target, Trophy, Users, X, Zap,
} from 'lucide-react';
import {
  getGetDailyRewardQueryKey, getGetLobbySummaryQueryKey, getGetMyProfileQueryKey,
  getGetRoomQueryKey, getGetShopCatalogQueryKey, getGetTableStateQueryKey, getListRankingsQueryKey, getListRoomsQueryKey,
  useClaimDailyReward, useCreateRoom, useGetDailyReward, useGetLobbySummary,
  useGetMyProfile, useGetRoom, useGetShopCatalog, useGetTableState, useJoinRoom, useListRankings, useListRooms,
  usePlayCard, usePurchaseShopItem,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'میدان اصلی', icon: HomeIcon },
  { href: '/rooms', label: 'اتاق‌ها', icon: LayoutGrid },
  { href: '/shop', label: 'بازارچه', icon: ShoppingBag },
  { href: '/rankings', label: 'نردبان', icon: Trophy },
  { href: '/profile', label: 'پروفایل من', icon: Medal },
];

function initials(value = 'ه') { return value.split(' ').map((part) => part[0]).slice(0, 2).join(''); }
function errorText(error: unknown) { return error instanceof Error ? error.message : 'خطایی پیش آمد. دوباره تلاش کنید.'; }
function formatNumber(value: number | undefined) { return new Intl.NumberFormat('fa-IR').format(value ?? 0); }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[hsl(var(--muted))] ${className}`} />;
}

function Feedback({ kind, message, onClose }: { kind: 'success' | 'error'; message: string; onClose: () => void }) {
  return (
    <div data-testid="status-feedback" className={`fixed bottom-5 left-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl ${kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
      {kind === 'success' ? <Check size={17} /> : <Info size={17} />}
      <span className="flex-1">{message}</span>
      <button data-testid="button-close-feedback" onClick={onClose} aria-label="بستن"><X size={16} /></button>
    </div>
  );
}

function Avatar({ name, size = 'md', online = false }: { name?: string; size?: 'sm' | 'md' | 'lg'; online?: boolean }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-lg' };
  return (
    <div className="relative shrink-0">
      <div data-testid={`img-avatar-${name ?? 'player'}`} className={`flex items-center justify-center rounded-full bg-[hsl(var(--primary))] font-extrabold text-[hsl(var(--primary-foreground))] ${sizes[size]}`}>{initials(name)}</div>
      {online && <span className="pulse-dot absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--card))] bg-emerald-500" />}
    </div>
  );
}

function Shell({ children, onFeedback }: { children: React.ReactNode; onFeedback?: (kind: 'success' | 'error', message: string) => void }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileQuery = useGetMyProfile();
  const profile = profileQuery.data;
  return (
    <div dir="rtl" className="arena-shell grain text-[hsl(var(--foreground))]">
      <aside className={`fixed inset-y-0 right-0 z-30 flex w-[252px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="mb-11 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]"><Swords size={23} /></div>
            <div><div className="font-display text-2xl tracking-tight">حُکم</div><div className="text-[10px] font-bold tracking-[.28em] text-[hsl(var(--primary))]">ARENA</div></div>
          </Link>
          <button data-testid="button-close-mobile-nav" onClick={() => setMobileOpen(false)} className="md:hidden"><X size={19} /></button>
        </div>
        <nav className="space-y-1.5">
          <div className="mb-3 px-3 text-[10px] font-bold tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.45)]">منوی بازی</div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} data-testid={`link-nav-${href === '/' ? 'home' : href.slice(1)}`} onClick={() => setMobileOpen(false)} className={`nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === href ? 'bg-[hsl(var(--sidebar-primary)/.16)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
              <Icon size={18} strokeWidth={location === href ? 2.4 : 1.8} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-9 border-t border-[hsl(var(--sidebar-border))] pt-6">
          <div className="mb-3 px-3 text-[10px] font-bold tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.45)]">سرویس</div>
          <Link href="/rooms" data-testid="link-quick-match" className="nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))]"><Zap size={18} className="text-[hsl(var(--primary))]" /><span>بازی سریع</span></Link>
          <button data-testid="button-help" onClick={() => onFeedback?.('success', 'راهنمای بازی به‌زودی در دسترس است.')} className="nav-link mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))]"><CircleHelp size={18} /><span>راهنما و قوانین</span></button>
        </div>
        <div className="mt-auto rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.7)] p-3">
          <div className="flex items-center gap-2.5"><Avatar name={profile?.displayName ?? 'بازیکن'} size="sm" online /><div className="min-w-0"><div className="truncate text-xs font-bold">{profile?.displayName ?? 'در حال ورود...'}</div><div className="text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">{profile ? `سطح ${formatNumber(profile.level)}` : 'عضو میدان'}</div></div><Settings size={15} className="mr-auto text-[hsl(var(--sidebar-foreground)/.45)]" /></div>
        </div>
      </aside>
      {mobileOpen && <button data-testid="button-mobile-overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-[hsl(var(--sidebar)/.5)] md:hidden" aria-label="بستن منو" />}
      <main className="min-h-[100dvh] md:mr-[252px]">
        <header className="sticky top-0 z-10 flex h-[74px] items-center justify-between border-b border-[hsl(var(--border)/.65)] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur-xl sm:px-8">
          <button data-testid="button-open-mobile-nav" onClick={() => setMobileOpen(true)} className="rounded-xl border border-[hsl(var(--border))] p-2 md:hidden"><MoreHorizontal size={18} /></button>
          <div className="hidden text-sm font-semibold text-[hsl(var(--muted-foreground))] sm:block">چهارشنبه، شبِ بازی</div>
          <div className="mr-auto flex items-center gap-2 sm:mr-0">
            <button data-testid="button-notifications" onClick={() => onFeedback?.('success', 'اعلان تازه‌ای ندارید.')} className="relative rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" /></button>
            <div className="mx-1 hidden h-7 w-px bg-[hsl(var(--border))] sm:block" />
            <Link href="/profile" data-testid="link-header-profile" className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-[hsl(var(--muted))]"><div className="hidden text-left sm:block"><div className="text-xs font-bold">{profile?.displayName ?? 'بازیکن میدان'}</div><div className="text-[10px] text-[hsl(var(--muted-foreground))]">{profile?.handle ?? '@arena_player'}</div></div><Avatar name={profile?.displayName ?? 'بازیکن میدان'} size="sm" online /></Link>
          </div>
        </header>
        <div className="mx-auto max-w-[1420px] px-5 py-7 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div>{eyebrow && <div className="mb-1 text-[10px] font-extrabold tracking-[.2em] text-[hsl(var(--accent))]">{eyebrow}</div>}<h2 className="font-display text-2xl font-normal text-[hsl(var(--foreground))]">{title}</h2></div>{action}</div>;
}

function Home() {
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string }>();
  const profileQuery = useGetMyProfile();
  const lobbyQuery = useGetLobbySummary();
  const roomsQuery = useListRooms();
  const rankingsQuery = useListRankings();
  const rewardQuery = useGetDailyReward();
  const claimReward = useClaimDailyReward();
  const qc = useQueryClient();
  const profile = profileQuery.data;
  const lobby = lobbyQuery.data;
  const rooms = roomsQuery.data ?? [];
  const rankings = rankingsQuery.data ?? [];
  const reward = rewardQuery.data;
  const claim = () => claimReward.mutate(undefined, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetDailyRewardQueryKey() }); qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() }); setFeedback({ kind: 'success', message: 'پاداش امروز به کیف شما اضافه شد.' }); },
    onError: (error) => setFeedback({ kind: 'error', message: errorText(error) }),
  });
  return (
    <Shell onFeedback={(kind, message) => setFeedback({ kind, message })}>
      <div className="reveal mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[hsl(var(--accent))]"><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> میدان زنده است</div><h1 data-testid="text-greeting" className="font-display text-4xl leading-[1.2] sm:text-5xl">خوش آمدی، {profile?.displayName?.split(' ')[0] ?? 'رفیق'}.</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">یک دست خوب، از همین‌جا شروع می‌شود.</p></div>
        <Link href="/rooms" data-testid="link-start-playing" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-extrabold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/.18)] transition-transform hover:-translate-y-0.5"><Zap size={17} /> شروع بازی <ArrowLeft size={16} /></Link>
      </div>
      <div className="reveal-2 mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: 'بازیکن آنلاین', value: lobby?.onlinePlayers, icon: Users, color: 'text-[hsl(var(--accent))]' }, { label: 'میزهای در جریان', value: lobby?.liveTables, icon: Spade, color: 'text-[hsl(var(--primary))]' }, { label: 'اتاق باز', value: lobby?.openRooms, icon: LayoutGrid, color: 'text-emerald-700' }, { label: 'ورود سریع', value: lobby?.quickMatchSeconds ? `${lobby.quickMatchSeconds} ثانیه` : undefined, icon: Zap, color: 'text-sky-700' }].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">{label}</span><Icon size={17} className={color} /></div><div data-testid={`stat-${label}`} className="text-2xl font-extrabold">{value === undefined ? <Skeleton className="h-7 w-16" /> : formatNumber(value as number)}</div></div>)}
      </div>
      <div className="grid gap-7 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-7">
          <section className="reveal-2 relative overflow-hidden rounded-[26px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-8"><div className="pattern-khatam absolute inset-0 opacity-20" /><div className="relative max-w-xl"><div className="mb-7 flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]"><Sparkles size={15} /> رویداد ویژه این هفته</div><h2 data-testid="text-featured-event" className="font-display text-3xl leading-tight sm:text-4xl">{lobby?.featuredEvent?.title ?? 'جام شب‌های تهران'}</h2><p className="mt-3 max-w-md text-sm leading-7 text-[hsl(var(--sidebar-foreground)/.65)]">{lobby?.featuredEvent?.subtitle ?? 'در جدول ویژه بدرخش و نامت را بالاتر از همیشه بنویس.'}</p><div className="mt-7 flex flex-wrap items-center gap-3"><button data-testid="button-join-event" onClick={() => setFeedback({ kind: 'success', message: 'ثبت‌نام رویداد برای شما فعال شد.' })} className="rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-extrabold text-[hsl(var(--primary-foreground))]">ورود به رویداد</button><span className="flex items-center gap-1.5 text-xs text-[hsl(var(--sidebar-foreground)/.6)]"><CalendarDays size={14} /> {formatNumber(lobby?.featuredEvent?.daysLeft)} روز مانده</span></div></div><div className="float-soft absolute -left-8 -bottom-10 flex h-40 w-40 items-center justify-center rounded-full border border-[hsl(var(--primary)/.25)] text-[hsl(var(--primary)/.65)]"><Crown size={72} strokeWidth={1} /></div></section>
          <section className="reveal-3"><SectionHeader eyebrow="برای شروع" title="اتاق‌های باز" action={<Link href="/rooms" data-testid="link-view-all-rooms" className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--accent))]">همه اتاق‌ها <ArrowLeft size={14} /></Link>} /><div className="space-y-3">{rooms.slice(0, 3).map((room) => <RoomRow key={room.id} room={room} onFeedback={(kind, message) => setFeedback({ kind, message })} />)}{!roomsQuery.isLoading && rooms.length === 0 && <EmptyState icon={LayoutGrid} title="اتاقی منتظر نیست" detail="اولین اتاق را شما بسازید." href="/rooms" action="ساخت اتاق" />}{roomsQuery.isLoading && [1, 2, 3].map((n) => <Skeleton key={n} className="h-[74px]" />)}</div></section>
        </div>
        <div className="space-y-7">
          <section className="reveal-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><div className="mb-5 flex items-start justify-between"><div><div className="mb-1 text-[10px] font-extrabold tracking-[.18em] text-[hsl(var(--accent))]">پاداش روزانه</div><h2 className="font-display text-2xl">زنجیره‌ات را نگه دار</h2></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]"><Coins size={21} /></div></div>{rewardQuery.isLoading ? <Skeleton className="h-24" /> : <><div className="mb-4 grid grid-cols-7 gap-1.5">{Array.from({ length: reward?.totalDays ?? 7 }, (_, i) => <div key={i} className={`flex h-9 items-center justify-center rounded-lg text-[10px] font-bold ${i + 1 <= (reward?.day ?? 1) ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>{i + 1 === reward?.day && !reward?.claimed ? <Target size={13} /> : formatNumber(i + 1)}</div>)}</div><div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-4"><div><div className="text-xs text-[hsl(var(--muted-foreground))]">{reward?.claimed ? 'پاداش امروز دریافت شد' : reward?.label ?? 'پاداش امروز'}</div><div className="mt-1 text-sm font-extrabold">{formatNumber(reward?.rewardCoins)} سکه</div></div><button data-testid="button-claim-reward" disabled={reward?.claimed || claimReward.isPending} onClick={claim} className="rounded-xl bg-[hsl(var(--primary))] px-3.5 py-2 text-xs font-extrabold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-45">{reward?.claimed ? 'دریافت شد' : claimReward.isPending ? 'در حال ثبت...' : 'دریافت'}</button></div></>}</section>
          <section className="reveal-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><SectionHeader eyebrow="این هفته" title="نردبان برتر" action={<Link href="/rankings" data-testid="link-view-rankings" className="text-xs font-bold text-[hsl(var(--accent))]">مشاهده کامل</Link>} /><div className="space-y-1">{rankings.slice(0, 4).map((entry, i) => <RankingRow key={`${entry.rank}-${entry.player}`} entry={entry} highlight={i === 0} />)}{rankingsQuery.isLoading && [1, 2, 3].map((n) => <Skeleton key={n} className="h-12" />)}</div></section>
        </div>
      </div>
      {feedback && <Feedback {...feedback} onClose={() => setFeedback(undefined)} />}
    </Shell>
  );
}

function RoomRow({ room, onFeedback }: { room: any; onFeedback: (kind: 'success' | 'error', message: string) => void }) {
  const join = useJoinRoom();
  const qc = useQueryClient();
  const handleJoin = () => join.mutate({ roomId: room.id }, { onSuccess: (joined) => { qc.invalidateQueries({ queryKey: getListRoomsQueryKey() }); qc.invalidateQueries({ queryKey: getGetRoomQueryKey(room.id) }); onFeedback('success', `به ${joined.name ?? room.name} پیوستید.`); }, onError: (error) => onFeedback('error', errorText(error)) });
  return <div data-testid={`card-room-${room.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 shadow-sm transition-transform hover:-translate-y-0.5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--accent))]"><Spade size={17} /></div><div className="min-w-0"><div className="truncate text-sm font-bold">{room.name}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]"><span>{room.mode === 'classic' ? 'کلاسیک' : room.mode}</span><span className="h-1 w-1 rounded-full bg-[hsl(var(--border))]" /><span>{formatNumber(room.stake)} سکه ورود</span></div></div></div><div className="flex items-center gap-3"><div className="hidden text-left sm:block"><div className="text-[10px] text-[hsl(var(--muted-foreground))]">بازیکن</div><div className="text-xs font-bold">{formatNumber(room.players)} / {formatNumber(room.maxPlayers)}</div></div><button data-testid={`button-join-room-${room.id}`} onClick={handleJoin} disabled={join.isPending || room.players >= room.maxPlayers} className="rounded-xl border border-[hsl(var(--primary)/.4)] px-3 py-2 text-xs font-extrabold text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] disabled:opacity-45">{join.isPending ? '...' : 'ورود'}</button></div></div>;
}

function EmptyState({ icon: Icon, title, detail, href, action }: { icon: typeof LayoutGrid; title: string; detail: string; href: string; action: string }) {
  return <div className="flex flex-col items-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center"><Icon size={24} className="mb-3 text-[hsl(var(--muted-foreground))]" /><div className="text-sm font-bold">{title}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{detail}</div><Link href={href} data-testid={`link-empty-${action}`} className="mt-4 text-xs font-bold text-[hsl(var(--accent))]">{action}</Link></div>;
}

function RankingRow({ entry, highlight = false }: { entry: any; highlight?: boolean }) {
  return <div data-testid={`row-ranking-${entry.rank}`} className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${highlight ? 'bg-[hsl(var(--primary)/.11)]' : ''}`}><div className={`w-5 text-center text-xs font-extrabold ${entry.rank <= 3 ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>{formatNumber(entry.rank)}</div><Avatar name={entry.player} size="sm" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{entry.player}</div><div className="truncate text-[10px] text-[hsl(var(--muted-foreground))]">{entry.title}</div></div><div className="text-left"><div className="text-xs font-extrabold">{formatNumber(entry.rating)}</div><div className={`text-[10px] ${entry.trend?.includes('-') ? 'text-red-600' : 'text-emerald-700'}`}>{entry.trend}</div></div></div>;
}

function Rooms() {
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string }>();
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState('classic');
  const [stake, setStake] = useState('50');
  const roomsQuery = useListRooms();
  const create = useCreateRoom();
  const qc = useQueryClient();
  const rooms = roomsQuery.data ?? [];
  const submit = () => { if (!name.trim()) { setFeedback({ kind: 'error', message: 'نام اتاق را وارد کنید.' }); return; } create.mutate({ data: { name: name.trim(), mode, stake: Number(stake) } }, { onSuccess: (room) => { qc.invalidateQueries({ queryKey: getListRoomsQueryKey() }); setOpenCreate(false); setName(''); setFeedback({ kind: 'success', message: `اتاق «${room.name}» ساخته شد.` }); }, onError: (error) => setFeedback({ kind: 'error', message: errorText(error) }) }); };
  return <Shell onFeedback={(kind, message) => setFeedback({ kind, message })}><div className="reveal mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 text-[10px] font-extrabold tracking-[.2em] text-[hsl(var(--accent))]">اتاق‌های بازی</div><h1 className="font-display text-4xl">جای خودت را پیدا کن</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">از بین میزهای باز انتخاب کن، یا رفقایت را دعوت کن.</p></div><button data-testid="button-open-create-room" onClick={() => setOpenCreate(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-extrabold text-[hsl(var(--primary-foreground))]"><Plus size={18} /> ساخت اتاق جدید</button></div><div className="mb-6 flex flex-wrap items-center gap-2"><div className="relative flex-1 sm:max-w-xs"><Search size={16} className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))]" /><input data-testid="input-search-rooms" placeholder="جست‌وجوی اتاق یا کد..." className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pr-9 pl-3 text-sm outline-none ring-[hsl(var(--primary))] focus:ring-2" /></div><button data-testid="button-filter-classic" className="rounded-xl border border-[hsl(var(--primary)/.45)] bg-[hsl(var(--primary)/.1)] px-4 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]">کلاسیک</button><button data-testid="button-filter-all" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--muted-foreground))]">همه میزها</button></div><div className="grid gap-3 lg:grid-cols-2">{roomsQuery.isLoading ? [1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-[105px]" />) : rooms.map((room) => <RoomRow key={room.id} room={room} onFeedback={(kind, message) => setFeedback({ kind, message })} />)}</div>{!roomsQuery.isLoading && rooms.length === 0 && <div className="mt-3"><EmptyState icon={Spade} title="هنوز میزی باز نیست" detail="یک اتاق بساز و اولین دست را شروع کن." href="/rooms" action="ساخت اتاق" /></div>}{openCreate && <div className="fixed inset-0 z-40 flex items-center justify-center bg-[hsl(var(--sidebar)/.55)] p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><div className="mb-1 text-[10px] font-bold tracking-[.18em] text-[hsl(var(--accent))]">میز تازه</div><h2 className="font-display text-2xl">اتاقت را بچین</h2></div><button data-testid="button-close-create-room" onClick={() => setOpenCreate(false)}><X size={19} /></button></div><label className="mb-4 block text-xs font-bold">نام اتاق<input data-testid="input-room-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً دورهمی پنجشنبه" className="mt-2 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" /></label><div className="mb-4 grid grid-cols-2 gap-3"><label className="text-xs font-bold">نوع بازی<select data-testid="select-room-mode" value={mode} onChange={(event) => setMode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm"><option value="classic">کلاسیک</option><option value="quick">سریع</option></select></label><label className="text-xs font-bold">ورودی<select data-testid="select-room-stake" value={stake} onChange={(event) => setStake(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm"><option value="0">رایگان</option><option value="50">۵۰ سکه</option><option value="100">۱۰۰ سکه</option></select></label></div><button data-testid="button-submit-create-room" disabled={create.isPending} onClick={submit} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-sm font-extrabold text-[hsl(var(--primary-foreground))]">{create.isPending ? 'در حال ساخت...' : <><Plus size={17} /> ساخت اتاق</>}</button></div></div>}{feedback && <Feedback {...feedback} onClose={() => setFeedback(undefined)} />}</Shell>;
}

function Profile() {
  const query = useGetMyProfile();
  const profile = query.data;
  const progress = profile ? Math.min(100, (profile.xp / Math.max(profile.xp + profile.xpToNext, 1)) * 100) : 0;
  return <Shell><div className="reveal mb-7 flex flex-col gap-5 rounded-[26px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:flex-row sm:items-center sm:p-8"><Avatar name={profile?.displayName ?? 'بازیکن میدان'} size="lg" online /><div className="flex-1"><div className="mb-1 text-[10px] font-bold tracking-[.2em] text-[hsl(var(--primary))]">پروفایل بازیکن</div><h1 data-testid="text-profile-name" className="font-display text-3xl">{profile?.displayName ?? 'بازیکن میدان'}</h1><div className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/.6)]">{profile?.handle ?? '@arena_player'} · {profile?.levelTitle ?? 'تازه‌وارد میدان'}</div><div className="mt-5 max-w-md"><div className="mb-1.5 flex justify-between text-[10px] text-[hsl(var(--sidebar-foreground)/.6)]"><span>سطح {formatNumber(profile?.level)}</span><span>{formatNumber(profile?.xp)} / {formatNumber((profile?.xp ?? 0) + (profile?.xpToNext ?? 0))} تجربه</span></div><div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--sidebar-foreground)/.14)]"><div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all" style={{ width: `${progress}%` }} /></div></div></div><div className="flex gap-2"><div className="rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.8)] px-4 py-3 text-center"><Coins size={17} className="mx-auto mb-1 text-[hsl(var(--primary))]" /><div className="text-sm font-extrabold">{formatNumber(profile?.coins)}</div><div className="text-[9px] text-[hsl(var(--sidebar-foreground)/.55)]">سکه</div></div><div className="rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.8)] px-4 py-3 text-center"><Gem size={17} className="mx-auto mb-1 text-[hsl(var(--accent))]" /><div className="text-sm font-extrabold">{formatNumber(profile?.gems)}</div><div className="text-[9px] text-[hsl(var(--sidebar-foreground)/.55)]">الماس</div></div></div></div><div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: 'امتیاز', value: profile?.rating, icon: Trophy }, { label: 'بردها', value: profile?.wins, icon: Swords }, { label: 'کوت', value: profile?.koots, icon: Target }, { label: 'زنجیره برد', value: profile?.streak, icon: Zap }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"><Icon size={17} className="mb-4 text-[hsl(var(--accent))]" /><div data-testid={`profile-stat-${label}`} className="text-xl font-extrabold">{query.isLoading ? <Skeleton className="h-6 w-14" /> : formatNumber(value)}</div><div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{label}</div></div>)}</div><div className="grid gap-7 lg:grid-cols-[1fr_1.3fr]"><section><SectionHeader eyebrow="کلکسیون" title="دستاوردها" /><div className="grid grid-cols-2 gap-3"><Achievement icon={Crown} title="شاهِ میز" detail="رسیدن به سطح ۱۰" active={Boolean(profile && profile.level >= 10)} /><Achievement icon={Target} title="کوتِ تمیز" detail="ثبت ۵ کوت" active={Boolean(profile && profile.koots >= 5)} /><Achievement icon={Zap} title="داغ و پیوسته" detail="هفت برد پشت‌سرهم" active={Boolean(profile && profile.streak >= 7)} /><Achievement icon={ShieldCheck} title="بازیکن منصف" detail="۱۰۰ بازی کامل" active={Boolean(profile && profile.wins >= 100)} /></div></section><section><SectionHeader eyebrow="آخرین بازی‌ها" title="تاریخچه مسابقه" action={<Link href="/rooms" data-testid="link-profile-play" className="text-xs font-bold text-[hsl(var(--accent))]">بازی تازه</Link>} /><div className="space-y-2"><MatchHistory result="برد" room="میز رفقای قدیمی" score="۷ — ۴" time="امروز، ۲۰:۴۰" /><MatchHistory result="برد" room="جام شبانه" score="۷ — ۲" time="دیروز، ۲۲:۱۰" /><MatchHistory result="باخت" room="اتاق کد ۴۹۱" score="۳ — ۷" time="دوشنبه، ۱۸:۳۵" /></div></section></div></Shell>;
}

function Achievement({ icon: Icon, title, detail, active }: { icon: typeof Crown; title: string; detail: string; active: boolean }) {
  return <div data-testid={`achievement-${title}`} className={`rounded-2xl border p-4 ${active ? 'border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.09)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] opacity-55'}`}><Icon size={21} className={active ? 'mb-5 text-[hsl(var(--primary))]' : 'mb-5 text-[hsl(var(--muted-foreground))]'} /><div className="text-xs font-extrabold">{title}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{detail}</div></div>;
}

function MatchHistory({ result, room, score, time }: { result: string; room: string; score: string; time: string }) {
  return <div data-testid={`match-history-${room}`} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${result === 'برد' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{result === 'برد' ? <ArrowUpLeft size={16} /> : <ArrowLeft size={16} />}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{room}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{time}</div></div><div className="text-left"><div className={`text-xs font-extrabold ${result === 'برد' ? 'text-emerald-700' : 'text-red-700'}`}>{result}</div><div className="mt-1 text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{score}</div></div></div>;
}

function Rankings() {
  const query = useListRankings();
  const entries = query.data ?? [];
  return <Shell><div className="reveal mb-8 flex items-end justify-between"><div><div className="mb-2 text-[10px] font-extrabold tracking-[.2em] text-[hsl(var(--accent))]">فصل بهار · هفته سوم</div><h1 className="font-display text-4xl">نردبان نام‌آوران</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">هر دست، یک پله. هر شب، یک روایت.</p></div><div className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold sm:flex"><CalendarDays size={15} className="text-[hsl(var(--accent))]" /> این هفته</div></div><div className="grid gap-7 lg:grid-cols-[1.25fr_1fr]"><section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><div><div className="text-[10px] font-bold tracking-[.18em] text-[hsl(var(--accent))]">رقابت نزدیک است</div><h2 className="mt-1 font-display text-2xl">برترین‌ها</h2></div><button data-testid="button-refresh-rankings" onClick={() => query.refetch()} className="rounded-xl border border-[hsl(var(--border))] p-2 text-[hsl(var(--muted-foreground))]"><RefreshCw size={16} /></button></div>{query.isLoading ? [1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="mb-2 h-14" />) : entries.map((entry) => <RankingRow key={`${entry.rank}-${entry.player}`} entry={entry} highlight={entry.rank <= 3} />)}</section><section className="rounded-3xl bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]"><div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]"><Trophy size={24} /></div><h2 className="font-display text-3xl">جای تو اینجاست</h2><p className="mt-3 text-sm leading-7 text-[hsl(var(--sidebar-foreground)/.65)]">با چند دست خوب، امتیازت را بالا ببر و در جمع نام‌آوران فصل قرار بگیر.</p><div className="mt-9 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] p-4"><BarChart3 size={16} className="mb-3 text-[hsl(var(--primary))]" /><div className="text-lg font-extrabold">+۱۲٪</div><div className="mt-1 text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">رشد این هفته</div></div><div className="rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] p-4"><Users size={16} className="mb-3 text-[hsl(var(--accent))]" /><div className="text-lg font-extrabold">{formatNumber(entries.length)}</div><div className="mt-1 text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">بازیکن فعال</div></div></div></section></div></Shell>;
}

function Shop() {
  const catalogQuery = useGetShopCatalog();
  const profileQuery = useGetMyProfile();
  const purchase = usePurchaseShopItem();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string }>();
  const catalog = catalogQuery.data ?? [];
  const buy = (item: any) => {
    if (item.owned) {
      setFeedback({ kind: 'success', message: 'این آیتم از قبل در کلکسیون شماست.' });
      return;
    }
    purchase.mutate(
      { itemId: item.id, data: { currency: item.currency as 'coins' | 'gems' } },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getGetShopCatalogQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          setFeedback({ kind: 'success', message: result.message });
        },
        onError: (error) => setFeedback({ kind: 'error', message: errorText(error) }),
      },
    );
  };
  return (
    <Shell>
      <div className="reveal mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><div className="mb-2 text-[10px] font-extrabold tracking-[.2em] text-[hsl(var(--accent))]">بازارچه‌ی میدان</div><h1 className="font-display text-4xl">چیزی برای میزت</h1><p className="mt-2 max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">کارت‌ها، میزها و جلوه‌هایی که داستان هر دستت را شخصی می‌کنند.</p></div>
        <div className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-xs font-bold"><Coins size={16} className="text-[hsl(var(--primary))]" /> {formatNumber(profileQuery.data?.coins)} <span className="mx-1 text-[hsl(var(--border))]">·</span><Gem size={16} className="text-[hsl(var(--accent))]" /> {formatNumber(profileQuery.data?.gems)}</div>
      </div>
      <section className="reveal-2 mb-7 rounded-[26px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-8"><div className="pattern-khatam absolute opacity-10" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]"><Sparkles size={15} /> انتخاب امروز</div><h2 className="font-display text-3xl">هر دست یک امضای تازه</h2><p className="mt-2 max-w-md text-sm leading-7 text-[hsl(var(--sidebar-foreground)/.6)]">آیتم‌های محدود امروز را بگیر تا میزت را از هر میز دیگری جدا کنی.</p></div><div className="flex items-center gap-2 text-xs text-[hsl(var(--sidebar-foreground)/.55)]"><CalendarDays size={15} /> تازه‌سازی در ۱۸ ساعت</div></div></section>
      {catalogQuery.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <Skeleton key={n} className="h-64" />)}</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{catalog.map((item: any) => <article key={item.id} className="group overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm transition-transform hover:-translate-y-1"><div className={`relative flex h-36 items-center justify-center ${item.category === 'میز' ? 'table-felt' : 'bg-[hsl(var(--muted))]'}`}><div className="h-20 w-28 rounded-2xl border-2 border-[hsl(var(--primary)/.45)] bg-[hsl(var(--sidebar)/.75)] shadow-xl transition-transform group-hover:rotate-3 group-hover:scale-105">{item.category === 'پشت کارت' && <div className="pattern-khatam h-full rounded-2xl opacity-70" />}{item.category !== 'پشت کارت' && <div className="flex h-full items-center justify-center text-[hsl(var(--primary))]"><Crown size={34} strokeWidth={1.2} /></div>}</div><div className="absolute right-3 top-3 rounded-lg bg-[hsl(var(--card)/.88)] px-2 py-1 text-[9px] font-bold text-[hsl(var(--accent))]">{item.rarity}</div>{item.featured && <div className="absolute left-3 top-3 rounded-lg bg-[hsl(var(--primary))] px-2 py-1 text-[9px] font-extrabold text-[hsl(var(--primary-foreground))]">انتخاب امروز</div>}</div><div className="p-4"><div className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{item.category}</div><h2 className="mt-1 text-sm font-extrabold">{item.name}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{item.description}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-3"><div className="flex items-center gap-1.5 text-sm font-extrabold">{item.currency === 'gems' ? <Gem size={15} className="text-[hsl(var(--accent))]" /> : <Coins size={15} className="text-[hsl(var(--primary))]" />}{formatNumber(item.price)}</div><button data-testid={`button-buy-${item.id}`} disabled={purchase.isPending || item.owned} onClick={() => buy(item)} className="rounded-xl bg-[hsl(var(--primary))] px-3 py-2 text-xs font-extrabold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-45">{item.owned ? 'در کلکسیون' : purchase.isPending ? 'در حال ثبت...' : 'افزودن'}</button></div></div></article>)}</div>}
      {feedback && <Feedback {...feedback} onClose={() => setFeedback(undefined)} />}
    </Shell>
  );
}

const localHand = ['آس', 'شاه', '۱۰', '۷', '۵'];
const suits = ['دل', 'خشت', 'پیک', 'گشنیز'];
function Table() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? 'arena-table';
  const roomQuery = useGetRoom(id, { query: { enabled: id !== 'arena-table', queryKey: getGetRoomQueryKey(id) } });
  const tableQuery = useGetTableState(id, { query: { queryKey: getGetTableStateQueryKey(id), refetchInterval: 3000 } });
  const playCard = usePlayCard();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState(['به‌به، چه دستی!', 'حواست به حکم باشه']);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string }>();
  const room = roomQuery.data;
  const table = tableQuery.data;
  const tableName = room?.name ?? table?.roomName ?? 'میز شب‌نشینی';
  const hand = table?.hand ?? localHand.map((rank, index) => ({ id: `fallback-${index}`, rank, suit: suits[index % suits.length], color: index % 2 === 0 ? 'red' : 'black' }));
  const players = table?.players ?? [
    { id: 'player-shayda', name: 'شیدا کریمی', seat: 0, team: 'blue', connected: true, isHakem: true },
    { id: 'player-navid', name: 'نوید اکبری', seat: 1, team: 'red', connected: true, isHakem: false },
    { id: 'player-amir', name: 'تو', seat: 2, team: 'blue', connected: true, isHakem: false },
    { id: 'player-sara', name: 'سارا نادری', seat: 3, team: 'red', connected: true, isHakem: false },
  ];
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const configuredWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
    const socket = new WebSocket(
      configuredWsUrl ?? `${protocol}//${window.location.host}/api/ws`,
    );
    socket.addEventListener('open', () => setRealtimeConnected(true));
    socket.addEventListener('close', () => setRealtimeConnected(false));
    socket.addEventListener('error', () => setRealtimeConnected(false));
    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; data?: unknown };
        if (payload.type === 'table:state' && payload.data) {
          queryClient.setQueryData(getGetTableStateQueryKey(id), payload.data);
        }
      } catch {
        setRealtimeConnected(false);
      }
    });
    return () => socket.close();
  }, [id, queryClient]);
  const play = () => {
    if (selected === null) {
      setFeedback({ kind: 'error', message: 'اول یک کارت از دستت انتخاب کن.' });
      return;
    }
    const card = hand[selected];
    if (!card) return;
    playCard.mutate(
      { tableId: id, data: { cardId: card.id } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetTableStateQueryKey(id), updated);
          setFeedback({ kind: 'success', message: `کارت ${card.rank} بازی شد.` });
          setSelected(null);
        },
        onError: (error) => setFeedback({ kind: 'error', message: errorText(error) }),
      },
    );
  };
  const send = () => { if (!message.trim()) return; setChat((items) => [...items, message.trim()]); setMessage(''); };
  return (
    <Shell onFeedback={(kind, text) => setFeedback({ kind, message: text })}>
      <div className="reveal mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/rooms" data-testid="link-back-rooms" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2"><ChevronRight size={18} /></Link>
          <div><div className="text-[10px] font-extrabold tracking-[.2em] text-[hsl(var(--accent))]">میز زنده · کلاسیک</div><h1 data-testid="text-table-name" className="font-display text-2xl">{tableName}</h1></div>
        </div>
         <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold">
           <span className={`pulse-dot h-2 w-2 rounded-full ${realtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} /> دست {formatNumber(table?.trick ?? 1)} از {formatNumber(table?.totalTricks ?? 7)} <span className="text-[hsl(var(--muted-foreground))]">·</span> کد {room?.code ?? table?.code ?? '۸۲۱۴'}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_290px]">
        <section className="table-felt relative min-h-[650px] overflow-hidden rounded-[30px] border-8 border-[hsl(var(--primary)/.17)] p-4 text-[hsl(var(--sidebar-foreground))] sm:p-7">
          <div className="absolute left-1/2 top-1/2 h-[88%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-[40%] border border-[hsl(var(--primary)/.2)]" />
          <div className="relative flex h-full min-h-[590px] flex-col items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <Avatar name={players[0]?.name} size="sm" online />
              <div className="rounded-xl bg-[hsl(var(--sidebar)/.65)] px-3 py-1 text-[10px]">{players[0]?.name} · تیم آبی</div>
              <div className="flex gap-1"><span className="h-1.5 w-7 rounded-full bg-[hsl(var(--primary))]" /><span className="h-1.5 w-7 rounded-full bg-[hsl(var(--sidebar-foreground)/.2)]" /></div>
            </div>
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2"><Avatar name={players[1]?.name} size="sm" online /><div className="rounded-xl bg-[hsl(var(--sidebar)/.65)] px-3 py-1 text-[10px]">{players[1]?.name}</div></div>
            <div className="absolute left-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2"><Avatar name={players[3]?.name} size="sm" online /><div className="rounded-xl bg-[hsl(var(--sidebar)/.65)] px-3 py-1 text-[10px]">{players[3]?.name}</div></div>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-5">
              <div className="text-center"><div className="mb-2 text-[9px] font-bold text-[hsl(var(--sidebar-foreground)/.55)]">تیم آبی</div><div data-testid="score-blue-team" className="font-display text-4xl text-[hsl(var(--primary))]">{formatNumber(table?.teamScores?.blue ?? 2)}</div></div>
              <div className="h-12 w-px bg-[hsl(var(--sidebar-foreground)/.2)]" />
              <div className="text-center"><div className="mb-2 text-[9px] font-bold text-[hsl(var(--sidebar-foreground)/.55)]">تیم قرمز</div><div data-testid="score-red-team" className="font-display text-4xl text-[hsl(var(--accent))]">{formatNumber(table?.teamScores?.red ?? 1)}</div></div>
            </div>
            <div className="relative z-10 mt-auto w-full max-w-[570px]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold"><Avatar name="تو" size="sm" online /><span>دست تو · تیم آبی</span></div>
                <div className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${table?.currentTurn === 'player-amir' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--sidebar-foreground)/.15)] text-[hsl(var(--sidebar-foreground)/.6)]'}`}>{table?.currentTurn === 'player-amir' ? 'نوبت تو' : 'نوبت حریف'}</div>
              </div>
              <div className="flex justify-center gap-1 sm:gap-2">
                {hand.map((card, index) => (
                  <button key={card.id} data-testid={`button-card-${index}`} disabled={table?.currentTurn !== 'player-amir' || playCard.isPending} onClick={() => setSelected(index)} className={`playing-card flex h-[116px] w-[58px] flex-col items-center justify-between rounded-xl border-2 border-[hsl(var(--sidebar)/.18)] bg-[#fbf7ed] p-2 text-[#29304b] sm:h-[142px] sm:w-[78px] ${card.color === 'red' ? 'text-[#b44d5e]' : ''} ${selected === index ? 'selected' : ''} disabled:cursor-not-allowed disabled:opacity-55`}>
                    <span className="self-start text-xs font-extrabold sm:text-sm">{card.rank}</span><span className="font-display text-xl">{card.suit}</span><span className="self-end rotate-180 text-[10px] font-extrabold">{card.rank}</span>
                  </button>
                ))}
              </div>
              <button data-testid="button-play-card" disabled={playCard.isPending || table?.currentTurn !== 'player-amir'} onClick={play} className="mx-auto mt-4 flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-xs font-extrabold text-[hsl(var(--primary-foreground))] shadow-lg disabled:cursor-not-allowed disabled:opacity-50">{playCard.isPending ? 'در حال ثبت...' : 'بازی کردن'} <ArrowLeft size={14} /></button>
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><Sparkles size={16} className="text-[hsl(var(--primary))]" /> حکم دست</div><span data-testid="text-trick-counter" className="rounded-lg bg-[hsl(var(--muted))] px-2 py-1 text-[10px] font-bold">{formatNumber(table?.trick ?? 2)} / {formatNumber(table?.totalTricks ?? 7)}</span></div>
            <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar))] p-3 text-[hsl(var(--sidebar-foreground))]"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.15)] text-lg font-bold text-[hsl(var(--accent))]">{table?.trumpSuit ?? 'دل'}</div><div><div className="text-sm font-bold">حکم {table?.trumpSuit ?? 'دل'}</div><div className="mt-1 text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">انتخاب شده توسط {players[0]?.name}</div></div></div>
          </div>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><MessageCircle size={16} className="text-[hsl(var(--accent))]" /> گفت‌وگوی میز</div><span className="text-[10px] text-[hsl(var(--muted-foreground))]">زنده</span></div>
            <div className="scrollbar-thin mb-3 max-h-48 space-y-2 overflow-y-auto">{chat.map((item, index) => <div key={`${item}-${index}`} data-testid={`chat-message-${index}`} className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2 text-xs">{item}</div>)}</div>
            <div className="flex gap-2"><input data-testid="input-chat-message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="پیامت را بنویس..." className="min-w-0 flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs outline-none" /><button data-testid="button-send-chat" onClick={send} className="rounded-xl bg-[hsl(var(--secondary))] px-3 text-[hsl(var(--secondary-foreground))]"><ArrowLeft size={15} /></button></div>
          </div>
          <button data-testid="button-leave-table" onClick={() => setFeedback({ kind: 'success', message: 'برای خروج، دست فعلی را تمام کنید.' })} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 text-xs font-bold text-[hsl(var(--muted-foreground))]"><X size={15} /> ترک میز</button>
        </aside>
      </div>
      {feedback && <Feedback {...feedback} onClose={() => setFeedback(undefined)} />}
    </Shell>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/rooms" component={Rooms} /><Route path="/shop" component={Shop} /><Route path="/rankings" component={Rankings} /><Route path="/profile" component={Profile} /><Route path="/table/:id" component={Table} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;