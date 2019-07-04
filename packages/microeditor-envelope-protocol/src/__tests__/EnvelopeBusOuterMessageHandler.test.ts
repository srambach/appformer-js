import { EnvelopeBusOuterMessageHandler } from "../EnvelopeBusOuterMessageHandler";
import { EnvelopeBusMessage } from "../EnvelopeBusMessage";
import { EnvelopeBusMessageType } from "../EnvelopeBusMessageType";

let sentMessages: Array<EnvelopeBusMessage<any>>;
let receivedMessages: string[];
let handler: EnvelopeBusOuterMessageHandler;
let initPollCount: number;

beforeEach(() => {
  sentMessages = [];
  receivedMessages = [];
  initPollCount = 0;

  handler = new EnvelopeBusOuterMessageHandler(
    {
      postMessage: msg => sentMessages.push(msg)
    },
    self => ({
      pollInit: () => {
        initPollCount++;
      },
      receive_languageRequest: () => {
        receivedMessages.push("languageRequest");
      },
      receive_setContentRequest: () => {
        receivedMessages.push("setContentRequest");
      },
      receive_getContentResponse: (content: string) => {
        receivedMessages.push("getContentResponse_" + content);
      }
    })
  );
});

const delay = (ms: number) => {
  return new Promise(res => setTimeout(res, ms));
};

describe("new instance", () => {
  test("does nothing", () => {
    expect(handler.initPolling).toBeFalsy();
    expect(handler.initPollingTimeout).toBeFalsy();
    expect(sentMessages.length).toEqual(0);
    expect(receivedMessages.length).toEqual(0);
  });
});

describe("startInitPolling", () => {
  test("polls for init response", async () => {
    handler.startInitPolling();
    expect(handler.initPolling).toBeTruthy();
    expect(handler.initPollingTimeout).toBeTruthy();

    //less than the timeout
    await delay(100);

    handler.receive({ type: EnvelopeBusMessageType.RETURN_INIT, data: undefined });

    expect(initPollCount).toBeGreaterThan(0);
    expect(handler.initPolling).toBeFalsy();
    expect(handler.initPollingTimeout).toBeFalsy();
  });

  test("stops polling after timeout", async () => {
    EnvelopeBusOuterMessageHandler.INIT_POLLING_TIMEOUT_IN_MS = 200;

    handler.startInitPolling();
    expect(handler.initPolling).toBeTruthy();
    expect(handler.initPollingTimeout).toBeTruthy();

    //more than the timeout
    await delay(300);

    expect(initPollCount).toBeGreaterThan(0);
    expect(handler.initPolling).toBeFalsy();
    expect(handler.initPollingTimeout).toBeFalsy();
  });
});

describe("receive", () => {
  test("language request", () => {
    handler.receive({ type: EnvelopeBusMessageType.REQUEST_LANGUAGE, data: undefined });
    expect(receivedMessages).toEqual(["languageRequest"]);
  });

  test("set content request", () => {
    handler.receive({ type: EnvelopeBusMessageType.REQUEST_SET_CONTENT, data: undefined });
    expect(receivedMessages).toEqual(["setContentRequest"]);
  });

  test("get content response", () => {
    handler.receive({ type: EnvelopeBusMessageType.RETURN_GET_CONTENT, data: "foo" });
    expect(receivedMessages).toEqual(["getContentResponse_foo"]);
  });
});

describe("send", () => {
  test("request getContentResponse", () => {
    handler.request_getContentResponse();
    expect(sentMessages).toEqual([{ type: EnvelopeBusMessageType.REQUEST_GET_CONTENT, data: undefined }]);
  });

  test("request setContentRequest", () => {
    handler.request_initResponse("test-origin");
    expect(sentMessages).toEqual([{ type: EnvelopeBusMessageType.REQUEST_INIT, data: "test-origin" }]);
  });

  test("respond languageRequest", () => {
    const languageData = { editorId: "id", gwtModuleName: "name", erraiDomain: "domain", resources: [] };
    handler.respond_languageRequest(languageData);
    expect(sentMessages).toEqual([{ type: EnvelopeBusMessageType.RETURN_LANGUAGE, data: languageData }]);
  });

  test("respond setContentRequest", () => {
    handler.respond_setContentRequest("bar");
    expect(sentMessages).toEqual([{ type: EnvelopeBusMessageType.RETURN_SET_CONTENT, data: "bar" }]);
  });
});