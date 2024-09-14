import { Telegraf, Context, Composer } from "telegraf";
import { message } from "telegraf/filters";
import moment from "moment";
import { BOT_TOKEN } from "./env";
import {
  SummarizeResult,
  getYoutubeId,
  summarize,
} from "./services/summarize";
import {
  createPage,
  createYoutubePlayerNodeElement,
} from "./services/telegraphclient";

export const bot = new Telegraf(BOT_TOKEN);

const formatTimecode = (totalSeconds: number) => {
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const hours = Math.floor(totalSeconds / (60 * 60));
  const secondsTimecode = `${seconds}`.padStart(2, "0");
  const minutesTimecode = `${minutes}`.padStart(2, "0");
  const hoursTimecode = `${hours}`.padStart(2, "0");

  return hoursTimecode === "00"
    ? `${minutesTimecode}:${secondsTimecode}`
    : `${hoursTimecode}:${minutesTimecode}:${secondsTimecode}`;
};

const handleError = async (context: Context) => {
  await context.reply("⚠️ Не получилось сделать краткий пересказ(");
};

bot.use(Composer.drop((context) => context.chat?.type !== "private"));

bot.start(async (context) => {
  await context.reply(
    "👋 Привет. Пришли мне 🔗 ссылку на видео (youtube.com), статью, страницу или любой текст от 300 до лимита телеграм - 4096 символов (используй telegra.ph 😉), можешь 📬 пересылать мне длинные сообщения. Поддерживаемые языки: 🇷🇺🇬🇧🇨🇳 и др."
  );
});

bot.use(async (context, next) => {
  let typingInterval: ReturnType<typeof setInterval> | undefined =
    undefined;
  try {
    await context.sendChatAction("typing");
    typingInterval = setInterval(async () => {
      try {
        await context.sendChatAction("typing");
      } catch (error) {
        clearInterval(typingInterval);
      }
    }, moment.duration(5, "seconds").asMilliseconds());

    return await next();
  } finally {
    clearInterval(typingInterval);
    // no way to clear chat action, wait 5s
  }
});

bot.on(message("text"), async (context) => {
  const inputText = context.message.text;

  let summarizeResult: SummarizeResult;
  try {
    summarizeResult = await summarize(inputText);
  } catch (error) {
    await handleError(context);
    return;
  }
  console.log(summarizeResult);

  let summary;
  if (summarizeResult.type === "video") {
    const youtubeId = getYoutubeId(inputText);
    console.log("youtubeId", youtubeId);

    const page = await createPage({
      title: summarizeResult.video_title,
      authorName: "Краткий Пересказ",
      authorUrl: "https://t.me/sum300bot",
      content: [
        createYoutubePlayerNodeElement(inputText),
        ...summarizeResult.keypoints.map((keypoint) => ({
          tag: "div" as const,
          children: [
            {
              tag: "h4" as const,
              children: [
                {
                  tag: "a" as const,
                  attrs: {
                    href: `https://youtu.be/${youtubeId}?t=${keypoint.start_time}`,
                    target: "_blank",
                  },
                  children: [formatTimecode(keypoint.start_time)],
                },
                ` ${keypoint.content}`,
              ],
            },
            {
              tag: "ul" as const,
              children: keypoint.theses.map((these) => ({
                tag: "li" as const,
                children: [these.content],
              })),
            },
          ],
        })),
      ],
    });

    // const summaryKeypoints = summarizeResult.keypoints
    //   .map((keypoint) => {
    //     return `${formatTimecode(keypoint.start_time)} <b>${
    //       keypoint.content
    //     }</b>\n${keypoint.theses
    //       .map((these) => `— ${these.content}`)
    //       .join("\n")}`;
    //   })
    //   .join("\n");

    summary = `<b><a href="${page.url}">${summarizeResult.video_title}</a></b>\n\nhttps://youtu.be/${youtubeId}`;
    // summary = `<b><a href="${inputText}">${summarizeResult.video_title}</a></b>\n\n${summaryKeypoints}\n\n${summarizeResult.sharing_url}`;
  } else {
    const summaryThesis = summarizeResult.thesis
      .map((these) => `— ${these.content}`)
      .join("\n");

    if (summarizeResult.type === "article") {
      summary = `<b>${summarizeResult.title}</b>\n\n${summaryThesis}\n\n${inputText}`;
      // summary = `<b><a href="${inputText}">${summarizeResult.title}</a></b>\n\n${summaryThesis}\n\n${ summarizeResult.sharing_url}`;
    } else {
      summary = summaryThesis;

      const forwardFromChat = context.message.forward_from_chat;
      const forwardFromMessageId = context.message.forward_from_message_id;
      if (
        forwardFromChat &&
        forwardFromChat.type === "channel" &&
        forwardFromChat.username &&
        forwardFromMessageId
      ) {
        summary += `\n\nhttps://t.me/${forwardFromChat.username}/${forwardFromMessageId}`;
      }
    }
  }

  console.log("supply.length", summary.length);
  await context.replyWithHTML(summary, {
    disable_notification: true,
    // @ts-expect-error https://core.telegram.org/bots/api#linkpreviewoptions haven't been added yet
    link_preview_options: {
      show_above_text: true,
    },
  });
});

bot.use(async (context) => {
  await context.reply(
    "⚠️ Пришли мне 🔗 ссылку на видео, статью, страницу",
    {
      disable_notification: true,
    }
  );
});
