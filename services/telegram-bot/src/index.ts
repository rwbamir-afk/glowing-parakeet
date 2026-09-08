import express from "express";
import { Bot, InlineKeyboard, webhookCallback, type Context } from "grammy";
import pino from "pino";

const logger = pino({ name: "hokm-telegram-bot" });

const token = process.env["TELEGRAM_BOT_TOKEN"];
if (!token) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN is required. Add it in Replit Secrets or Render environment variables.",
  );
}

const apiBaseUrl = (process.env["API_BASE_URL"] ?? "http://localhost:5000").replace(
  /\/$/,
  "",
);
const webAppUrl = process.env["WEB_APP_URL"];
const port = Number(process.env["PORT"] ?? "8080");
const bot = new Bot(token);

type Profile = {
  displayName?: string;
  handle?: string;
  level?: number;
  levelTitle?: string;
  coins?: number;
  gems?: number;
  rating?: number;
  wins?: number;
  koots?: number;
  streak?: number;
};

type Room = {
  id: string;
  name: string;
  code: string;
  mode: string;
  stake: number;
  players: number;
  maxPlayers: number;
  status: string;
};

type DailyReward = {
  day: number;
  totalDays: number;
  claimed: boolean;
  rewardCoins: number;
  label: string;
  nextReward: number;
};

function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

function appKeyboard(): InlineKeyboard {
  if (!webAppUrl) {
    return new InlineKeyboard().text("Open the arena", "missing_web_app_url");
  }

  return new InlineKeyboard().webApp("Open Hokm Arena", webAppUrl);
}

function inviteKeyboard(username: string | undefined): InlineKeyboard {
  const botUsername = username ?? process.env["TELEGRAM_BOT_USERNAME"];
  if (!botUsername) return appKeyboard();

  const inviteUrl = `https://t.me/${botUsername}?start=invite`;
  return new InlineKeyboard().url("Invite a friend", inviteUrl);
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

async function apiPost<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

function userName(ctx: Context): string {
  return ctx.from?.first_name ?? "friend";
}

async function replyServiceError(ctx: Context): Promise<void> {
  await ctx.reply(
    "The arena service is temporarily unavailable. Please try again in a moment.",
  );
}

bot.command("start", async (ctx) => {
  const firstName = userName(ctx);
  await ctx.reply(
    `Welcome, ${firstName}, to Hokm Arena.\n\nPlay classic Persian Hokm, claim daily rewards, and build your place on the ladder.`,
    { reply_markup: appKeyboard() },
  );
});

bot.command("play", async (ctx) => {
  await ctx.reply(
    webAppUrl
      ? "Your table is ready. Open the arena to play."
      : "The arena link is not configured yet. Set WEB_APP_URL before using /play.",
    { reply_markup: appKeyboard() },
  );
});

bot.command("profile", async (ctx) => {
  try {
    const profile = await apiGet<Profile>("/api/profile/me");
    await ctx.reply(
      `Profile: ${profile.displayName ?? userName(ctx)}\n` +
        `Level: ${formatNumber(profile.level)} · ${profile.levelTitle ?? "Player"}\n` +
        `Rating: ${formatNumber(profile.rating)}\n` +
        `Wins: ${formatNumber(profile.wins)} · Koot: ${formatNumber(profile.koots)}\n` +
        `Coins: ${formatNumber(profile.coins)} · Gems: ${formatNumber(profile.gems)}\n` +
        `Win streak: ${formatNumber(profile.streak)}`,
    );
  } catch (error) {
    logger.warn({ error }, "Profile command failed");
    await replyServiceError(ctx);
  }
});

bot.command("stats", async (ctx) => {
  try {
    const profile = await apiGet<Profile>("/api/profile/me");
    await ctx.reply(
      `Your Hokm stats\n\n` +
        `Rating ${formatNumber(profile.rating)}\n` +
        `${formatNumber(profile.wins)} wins\n` +
        `${formatNumber(profile.koots)} Koots\n` +
        `${formatNumber(profile.streak)}-match streak`,
    );
  } catch (error) {
    logger.warn({ error }, "Stats command failed");
    await replyServiceError(ctx);
  }
});

bot.command("shop", async (ctx) => {
  try {
    const items = await apiGet<
      Array<{
        name: string;
        category: string;
        price: number;
        currency: string;
        owned: boolean;
      }>
    >("/api/shop/catalog");
    const featured = items.filter((item) => !item.owned).slice(0, 5);
    const lines = featured.length
      ? featured.map(
          (item) =>
            `• ${item.name} — ${formatNumber(item.price)} ${item.currency === "gems" ? "gems" : "coins"}`,
        )
      : ["The shop is currently empty."];
    await ctx.reply(`Today in the shop\n\n${lines.join("\n")}`, {
      reply_markup: appKeyboard(),
    });
  } catch (error) {
    logger.warn({ error }, "Shop command failed");
    await replyServiceError(ctx);
  }
});

bot.command("daily", async (ctx) => {
  try {
    const reward = await apiGet<DailyReward>("/api/rewards/daily");
    if (reward.claimed) {
      await ctx.reply(
        `Day ${formatNumber(reward.day)} is already claimed. Come back tomorrow for ${formatNumber(reward.nextReward)} coins.`,
      );
      return;
    }

    const claimed = await apiPost<DailyReward>("/api/rewards/daily");
    await ctx.reply(
      `Daily reward claimed: ${formatNumber(claimed.rewardCoins)} coins.\n` +
        `Day ${formatNumber(claimed.day)} of ${formatNumber(claimed.totalDays)} complete.`,
    );
  } catch (error) {
    logger.warn({ error }, "Daily command failed");
    await replyServiceError(ctx);
  }
});

bot.command("invite", async (ctx) => {
  const me = await bot.api.getMe();
  await ctx.reply(
    "Bring a friend to the table. Share this invite link:",
    { reply_markup: inviteKeyboard(me.username) },
  );
});

bot.callbackQuery("missing_web_app_url", async (ctx) => {
  await ctx.answerCallbackQuery({
    text: "Set WEB_APP_URL on the bot service first.",
    show_alert: true,
  });
});

bot.catch((error) => {
  logger.error({ error: error.error, updateId: error.ctx.update.update_id }, "Bot update failed");
});

const app = express();
app.disable("x-powered-by");
app.get("/healthz", (_request, response) => {
  response.status(200).json({ status: "ok", service: "telegram-bot" });
});

const mode = process.env["BOT_MODE"] ?? "polling";
if (mode === "webhook") {
  app.use(express.json());
  app.post("/telegram/webhook", webhookCallback(bot, "express"));
} else {
  void bot.start({
    onStart: (botInfo) => {
      logger.info({ username: botInfo.username }, "Telegram bot started with long polling");
    },
  });
}

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port, mode, apiBaseUrl }, "Telegram bot health server listening");
});

function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down Telegram bot");
  bot.stop();
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));