import axios from "axios";
import { setTimeout } from "timers/promises";
import { YANDEX_SESSION_ID } from "../env";

const YANDEX_SUMMARIZE_API_URL = "https://300.ya.ru/api/";

const summarizeClient = axios.create({
  baseURL: YANDEX_SUMMARIZE_API_URL,
});

type SummarizePayloadBase = {
  session_id?: string;
};

type SummarizeVideoPayload = SummarizePayloadBase & {
  video_url: string;
};

type SummarizeArticlePayload = SummarizePayloadBase & {
  article_url: string;
};

type SummarizeTextPayload = SummarizePayloadBase & {
  text: string;
};

type SummarizePayload =
  | SummarizeVideoPayload
  | SummarizeArticlePayload
  | SummarizeTextPayload;

type SummarizeKeypointThese = {
  id: number;
  content: string;
  link?: string;
};

type SummarizeKeypoint = {
  id: number;
  start_time: number;
  content: string;
  theses: SummarizeKeypointThese[];
};

// from 300.ya.ru code chunk
enum SummarizeStatusCode {
  Unknown = 0,
  InProgress = 1,
  Error = 2,
}

export type SummarizeResultBase = {
  status_code: SummarizeStatusCode;
  session_id: string;
  poll_interval_ms: number;
  sharing_url: string;

  message?: string;
};

export type SummarizeVideoResult = SummarizeResultBase & {
  type: "video";
  video_title: string;
  keypoints: SummarizeKeypoint[];
};

export type SummarizeArticleResult = SummarizeResultBase & {
  type: "article";
  title: string;
  total_parts: number;
  normalized_url: string;
  thesis: SummarizeKeypointThese[];
};

export type SummarizeTextResult = SummarizeResultBase & {
  type: "text";
  title: string;
  total_parts: number;
  normalized_url: "";
  thesis: SummarizeKeypointThese[];
};

export type SummarizeResult =
  | SummarizeVideoResult
  | SummarizeArticleResult
  | SummarizeTextResult;

export const requestSummarize = async (payload: SummarizePayload) => {
  // NOTE: Nodejs 18+ is required, or axios will produce errors on followup requests
  const summarizeResponse = await summarizeClient.post<SummarizeResult>(
    "/generation",
    payload,
    {
      headers: {
        cookie: YANDEX_SESSION_ID,
      },
    }
  );

  return summarizeResponse.data;
};

class SummarizeMaxRetryError extends Error {}

const summarizeSettled = async (
  summarizeData: SummarizePayload,
  pollRetryCount = 20
): Promise<SummarizeResult> => {
  const summarizeResult = await requestSummarize(summarizeData);
  console.log(summarizeResult);

  // if in progress
  if (summarizeResult.status_code === 1) {
    if (pollRetryCount <= 1) {
      throw new SummarizeMaxRetryError();
    }

    const summarizePollInterval = summarizeResult.poll_interval_ms;
    await setTimeout(summarizePollInterval);

    const summarizeSessionId = summarizeResult.session_id;
    return await summarizeSettled(
      {
        ...summarizeData,
        ...(summarizeSessionId && { session_id: summarizeSessionId }),
      },
      pollRetryCount - 1
    );
  } else {
    return summarizeResult;
  }
};

const isValidHttpUrl = (str: string) => {
  let url: URL;
  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

// from 300.ya.ru code chunk
const isYoutubeUrl = (link: string) =>
  /^(https?:\/\/)?(www\.|m\.)?youtu(\.be|be\.\w{2,3})+\//i.test(link);

// from 300.ya.ru code chunk
export function getYoutubeId(link: string) {
  if (!isYoutubeUrl(link)) return null;
  const youtubeIdRegex =
    /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/i;
  const youtubeId = link.match(youtubeIdRegex);
  return youtubeId &&
    (youtubeId[1].length == 11 || youtubeId[1].length == 12)
    ? youtubeId[1].trim()
    : null;
}

export const getInputType = (inputText: string) => {
  if (isYoutubeUrl(inputText)) {
    return "video";
  }
  if (isValidHttpUrl(inputText)) {
    return "article";
  }
  return "text";
};

export const summarize = async (inputText: string) => {
  const inputType = getInputType(inputText);
  console.log("inputType", inputType);

  const summarizeDataKey = (
    {
      video: "video_url",
      article: "article_url",
      text: "text",
    } as const
  )[inputType];
  const summarizeData = {
    [summarizeDataKey]: inputText,
  } as SummarizePayload;
  return await summarizeSettled(summarizeData);
};
