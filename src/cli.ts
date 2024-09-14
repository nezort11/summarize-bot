#!/Users/egorzorin/.nvm/versions/node/v18.15.0/bin/node -r ts-node/register
// #!/Users/egorzorin/.nvm/versions/node/v16.15.1/bin/node -r ts-node/register
// import { SummarizeResultBase } from "./summarize";
import { setTimeout } from "timers/promises";

import { requestSummarize, summarize } from "./services/summarize";

const main = async () => {
  // const summarizeQuery = "https://youtu.be/KxHihZx7qEE";
  const inputText = process.argv[2];
  console.log("query", inputText);

  const summarizeResult = await summarize(inputText);
  console.log(summarizeResult);

  // const initSummarizeResult = await requestSummarize({
  //   article_url: inputText,
  // });
  // console.log(initSummarizeResult);
  // await setTimeout(10000);
  // const summarizeResult = await requestSummarize({
  //   article_url: inputText,
  //   session_id: initSummarizeResult.session_id,
  // });
  // console.log(summarizeResult);

  // const summarizeSessionId = initSummarizeResult.session_id;
  // const summarizePollingInterval = initSummarizeResult.poll_interval_ms;

  // const summarizeTimer = setInterval(async () => {
  //   try {
  //   } catch (error) {}
  // }, summarizePollingInterval);

  // console.log("query", query);
  // if (!query) {
  //   console.error("⚠️ Please provide a query (link or text) to summarize");
  //   return;
  // }
};

if (require.main === module) {
  main();
}
