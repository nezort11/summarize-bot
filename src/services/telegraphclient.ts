import axios from "axios";
import { inspect } from "util";

import { TELEGRAPH_ACCESS_TOKEN } from "../env";

const TELEGRAPH_API_BASE_URL = "https://api.telegra.ph";

const telegraphClient = axios.create({
  baseURL: TELEGRAPH_API_BASE_URL,
});

type NodeElement = {
  tag:
    | "a"
    | "aside"
    | "b"
    | "blockquote"
    | "br"
    | "code"
    | "em"
    | "figcaption"
    | "figure"
    | "h3"
    | "h4"
    | "hr"
    | "i"
    | "iframe"
    | "img"
    | "li"
    | "ol"
    | "p"
    | "pre"
    | "s"
    | "strong"
    | "u"
    | "ul"
    | "video"
    | "div";
  attrs?: object;
  children?: Node[];
};

type Node = string | NodeElement;

export const createYoutubePlayerNodeElement = (
  youtubeSrc: string,
  caption = ""
) => {
  return {
    tag: "figure",
    children: [
      {
        tag: "div",
        attrs: { class: "figure_wrapper" },
        children: [
          {
            tag: "div",
            attrs: { class: "iframe_wrap" },
            children: [
              {
                tag: "div",
                attrs: {
                  class: "iframe_helper",
                  style: "padding-top: 56.2319%;",
                },
                children: [
                  {
                    tag: "iframe",
                    attrs: {
                      src: `https://telegra.ph/embed/youtube?url=${encodeURIComponent(
                        youtubeSrc
                      )}`,
                      width: "640",
                      height: "360",
                      frameborder: "0",
                      allowtransparency: "true",
                      allowfullscreen: "true",
                      scrolling: "no",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      { tag: "figcaption", attrs: { dir: "auto" }, children: [caption] },
    ],
  } as NodeElement;
};

type TelegraphPage = {
  path: string;
  author_name: string;
  author_url?: string;
  url: string;
  title: string;
  content: Node[];
};

type TelegraphResponseData = {
  ok: boolean;
  result: TelegraphPage;
};

class TelegraphError extends Error {}

interface CreatePageOptions {
  title: TelegraphPage["title"];
  authorName: TelegraphPage["author_name"];
  authorUrl: TelegraphPage["author_url"];
  content: TelegraphPage["content"];
}

export const createPage = async ({
  title,
  authorName,
  authorUrl,
  content,
}: CreatePageOptions) => {
  const createPageResponse = await telegraphClient.post<TelegraphResponseData>(
    "createPage",
    {
      access_token: TELEGRAPH_ACCESS_TOKEN,
      title,
      author_name: authorName,
      author_url: authorUrl,
      content: content,
    }
  );
  if (!createPageResponse.data.ok) {
    throw new TelegraphError(inspect(createPageResponse.data.result));
  }
  return createPageResponse.data.result;
};
