import { Router, type IRouter } from "express";
import {
  ClaimDailyRewardResponse,
  CreateRoomBody,
  CreateRoomResponse,
  GetDailyRewardResponse,
  GetLobbySummaryResponse,
  GetMyProfileResponse,
  GetRoomParams,
  GetRoomResponse,
  GetTableStateParams,
  GetTableStateResponse,
  JoinRoomParams,
  JoinRoomResponse,
  ListRankingsResponse,
  ListRoomsResponse,
  PlayCardBody,
  PlayCardParams,
  PlayCardResponse,
  PurchaseShopItemBody,
  PurchaseShopItemParams,
  PurchaseShopItemResponse,
  GetShopCatalogResponse,
} from "@workspace/api-zod";
import { getTableState, playTableCard } from "../game/table";
import { RuleError } from "../game/rules";

type Room = {
  id: string;
  code: string;
  name: string;
  mode: string;
  stake: number;
  host: string;
  players: number;
  maxPlayers: number;
  status: string;
  createdAt: string;
};

const profile = {
  id: "player-amir",
  displayName: "Amir",
  handle: "@amir_hokm",
  level: 27,
  levelTitle: "بازی‌خوان",
  xp: 6840,
  xpToNext: 8200,
  coins: 12450,
  gems: 86,
  rating: 1482,
  wins: 128,
  koots: 14,
  streak: 6,
};

const rooms: Room[] = [
  {
    id: "room-yalda",
    code: "YALDA7",
    name: "شب یلدا",
    mode: "کلاسیک ۲ در برابر ۲",
    stake: 250,
    host: "مریم",
    players: 3,
    maxPlayers: 4,
    status: "در انتظار",
    createdAt: new Date().toISOString(),
  },
  {
    id: "room-tehran",
    code: "TEH88",
    name: "تهران شبانه",
    mode: "کلاسیک ۲ در برابر ۲",
    stake: 100,
    host: "سینا",
    players: 2,
    maxPlayers: 4,
    status: "در انتظار",
    createdAt: new Date().toISOString(),
  },
  {
    id: "room-ostad",
    code: "OSTAD1",
    name: "میز استادها",
    mode: "امتیازی",
    stake: 1000,
    host: "پارسا",
    players: 4,
    maxPlayers: 4,
    status: "در حال بازی",
    createdAt: new Date().toISOString(),
  },
];

let dailyReward = {
  day: 4,
  totalDays: 7,
  claimed: false,
  rewardCoins: 400,
  label: "سکه‌ی روز چهارم",
  nextReward: 600,
};

const shopItems = [
  { id: "back-sheikh-lotfollah", name: "گنبد شیخ لطف‌الله", category: "پشت کارت", rarity: "افسانه‌ای", price: 70, currency: "gems", owned: false, featured: true, description: "نقش کاشی‌کاری برای دستی که مثل موزه می‌درخشد." },
  { id: "table-kashan", name: "فرش کاشان", category: "میز", rarity: "کمیاب", price: 2200, currency: "coins", owned: false, featured: true, description: "رنگ‌های گرم و حاشیه‌های اسلیمی برای میز شبانه." },
  { id: "frame-eslimi", name: "قاب اسلیمی طلایی", category: "قاب آواتار", rarity: "کمیاب", price: 45, currency: "gems", owned: true, featured: false, description: "حاشیه‌ی طلایی دور نامت در میدان." },
  { id: "effect-simorgh", name: "پرواز سیمرغ", category: "جشن کوت", rarity: "افسانه‌ای", price: 120, currency: "gems", owned: false, featured: true, description: "پس از کوت، بال‌های سیمرغ روی میز باز می‌شود." },
  { id: "avatar-gordafarid", name: "گردآفرید", category: "آواتار", rarity: "حماسی", price: 3800, currency: "coins", owned: false, featured: false, description: "یک قهرمان برای هر دست سخت." },
  { id: "chat-tea", name: "چایخانه‌ی رفیقانه", category: "حباب گفتگو", rarity: "معمولی", price: 500, currency: "coins", owned: false, featured: false, description: "حبابی با حال‌وهوای استکان چای تازه‌دم." },
];

const router: IRouter = Router();

router.get("/profile/me", (_req, res) => {
  res.json(GetMyProfileResponse.parse(profile));
});

router.get("/lobby/summary", (_req, res) => {
  res.json(
    GetLobbySummaryResponse.parse({
      onlinePlayers: 1842,
      liveTables: 327,
      openRooms: rooms.filter((room) => room.status === "در انتظار").length,
      quickMatchSeconds: 18,
      featuredEvent: {
        title: "جام پادشاهی یلدا",
        subtitle: "با هر برد، یک دانه انار به جام اضافه کن",
        daysLeft: 6,
        accent: "pomegranate",
      },
      recentActivity: [
        { id: "activity-1", text: "نگار در جدول دوستان از تو جلو زد", time: "۲ دقیقه پیش" },
        { id: "activity-2", text: "میز «شب یلدا» یک جای خالی دارد", time: "۵ دقیقه پیش" },
        { id: "activity-3", text: "پاداش روزانه‌ات آماده‌ی دریافت است", time: "امروز" },
      ],
    }),
  );
});

router.get("/rooms", (_req, res) => {
  res.json(ListRoomsResponse.parse(rooms));
});

router.post("/rooms", (req, res) => {
  const input = CreateRoomBody.parse(req.body);
  const id = `room-${Date.now()}`;
  const room: Room = {
    id,
    code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    name: input.name,
    mode: input.mode,
    stake: input.stake,
    host: profile.displayName,
    players: 1,
    maxPlayers: 4,
    status: "در انتظار",
    createdAt: new Date().toISOString(),
  };
  rooms.unshift(room);
  res.status(201).json(CreateRoomResponse.parse(room));
});

router.get("/rooms/:roomId", (req, res) => {
  const params = GetRoomParams.parse(req.params);
  const room = rooms.find((item) => item.id === params.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(GetRoomResponse.parse(room));
});

router.post("/rooms/:roomId/join", (req, res) => {
  const params = JoinRoomParams.parse(req.params);
  const room = rooms.find((item) => item.id === params.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.players < room.maxPlayers) {
    room.players += 1;
    if (room.players === room.maxPlayers) room.status = "آماده‌ی شروع";
  }
  res.json(JoinRoomResponse.parse(room));
});

router.get("/rankings", (_req, res) => {
  res.json(
    ListRankingsResponse.parse([
      { rank: 1, player: "سارا", title: "شاهنشاه", rating: 1840, wins: 306, trend: "up" },
      { rank: 2, player: "پارسا", title: "استاد بزرگ", rating: 1778, wins: 288, trend: "up" },
      { rank: 3, player: "مریم", title: "بُرش‌زن", rating: 1692, wins: 251, trend: "same" },
      { rank: 4, player: "نگار", title: "حکم‌خوان", rating: 1604, wins: 208, trend: "up" },
      { rank: 27, player: profile.displayName, title: profile.levelTitle, rating: profile.rating, wins: profile.wins, trend: "up" },
    ]),
  );
});

router.get("/rewards/daily", (_req, res) => {
  res.json(GetDailyRewardResponse.parse(dailyReward));
});

router.post("/rewards/daily", (_req, res) => {
  if (!dailyReward.claimed) {
    dailyReward = { ...dailyReward, claimed: true };
    profile.coins += dailyReward.rewardCoins;
  }
  res.json(ClaimDailyRewardResponse.parse(dailyReward));
});

router.get("/tables/:tableId/state", (req, res) => {
  const params = GetTableStateParams.parse(req.params);
  const state = getTableState();
  if (params.tableId !== state.id && params.tableId !== "arena-table") {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(GetTableStateResponse.parse({
    ...state,
    id: params.tableId,
    seedCommitment: undefined,
    seedRevealed: undefined,
    leadSuit: undefined,
    currentTrick: undefined,
  }));
});

router.post("/tables/:tableId/play", (req, res) => {
  const params = PlayCardParams.parse(req.params);
  const body = PlayCardBody.parse(req.body);
  const state = getTableState();
  if (params.tableId !== state.id && params.tableId !== "arena-table") {
    res.status(400).json({ error: "Table is not active" });
    return;
  }
  try {
    const nextState = playTableCard("player-amir", body.cardId);
    res.json(PlayCardResponse.parse({
      ...nextState,
      id: params.tableId,
      seedCommitment: undefined,
      seedRevealed: undefined,
      leadSuit: undefined,
      currentTrick: undefined,
    }));
  } catch (error) {
    if (error instanceof RuleError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }
    res.status(500).json({ error: "Unable to apply card play" });
    return;
  }
});

router.get("/shop/catalog", (_req, res) => {
  res.json(GetShopCatalogResponse.parse(shopItems));
});

router.post("/shop/items/:itemId/purchase", (req, res) => {
  const params = PurchaseShopItemParams.parse(req.params);
  const body = PurchaseShopItemBody.parse(req.body);
  const item = shopItems.find((candidate) => candidate.id === params.itemId);
  if (!item) {
    res.status(400).json({ error: "Item not found" });
    return;
  }
  if (item.owned) {
    res.status(400).json({ error: "Item already owned" });
    return;
  }
  if (body.currency !== item.currency) {
    res.status(400).json({ error: "Use the currency shown for this item" });
    return;
  }
  if (body.currency === "coins" && profile.coins < item.price) {
    res.status(400).json({ error: "Not enough coins" });
    return;
  }
  if (body.currency === "gems" && profile.gems < item.price) {
    res.status(400).json({ error: "Not enough gems" });
    return;
  }
  if (body.currency === "coins") profile.coins -= item.price;
  if (body.currency === "gems") profile.gems -= item.price;
  item.owned = true;
  res.json(
    PurchaseShopItemResponse.parse({
      item,
      coins: profile.coins,
      gems: profile.gems,
      message: `آیتم «${item.name}» به کلکسیون شما اضافه شد.`,
    }),
  );
});

export default router;