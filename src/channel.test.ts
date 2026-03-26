/**
 * Tests for Phoenix Channel Protocol Implementation
 */

import { PhoenixMessage, PhoenixChannel, PhoenixChannelClient } from "./channel";
import { ConnectionError, WebSocketError } from "./errors";

describe("PhoenixMessage", () => {
  describe("fromTuple", () => {
    it("should create message from valid tuple", () => {
      const tuple = ["1", "phx_join", "agent:123", { status: "ok" }];
      const message = PhoenixMessage.fromTuple(tuple);

      expect(message.ref).toBe("1");
      expect(message.event).toBe("phx_join");
      expect(message.topic).toBe("agent:123");
      expect(message.payload).toEqual({ status: "ok" });
    });

    it("should throw error on invalid tuple length", () => {
      const tuple = ["1", "phx_join"];
      expect(() => PhoenixMessage.fromTuple(tuple)).toThrow("Invalid Phoenix message tuple");
    });

    it("should handle null payload", () => {
      const tuple = ["1", "phx_join", "agent:123", null];
      const message = PhoenixMessage.fromTuple(tuple);

      expect(message.payload).toEqual({});
    });
  });

  describe("toTuple", () => {
    it("should convert message to tuple", () => {
      const message = new PhoenixMessage("1", "phx_join", "agent:123", { status: "ok" });
      const tuple = message.toTuple();

      expect(tuple).toEqual(["1", "phx_join", "agent:123", { status: "ok" }]);
    });
  });

  describe("toJSON", () => {
    it("should serialize message to JSON", () => {
      const message = new PhoenixMessage("1", "phx_join", "agent:123", { status: "ok" });
      const json = message.toJSON();

      expect(json).toBe(JSON.stringify(["1", "phx_join", "agent:123", { status: "ok" }]));
    });
  });

  describe("fromJSON", () => {
    it("should deserialize message from JSON", () => {
      const json = JSON.stringify(["1", "phx_join", "agent:123", { status: "ok" }]);
      const message = PhoenixMessage.fromJSON(json);

      expect(message.ref).toBe("1");
      expect(message.event).toBe("phx_join");
      expect(message.topic).toBe("agent:123");
      expect(message.payload).toEqual({ status: "ok" });
    });

    it("should throw error on invalid format", () => {
      const json = JSON.stringify({ ref: "1" });
      expect(() => PhoenixMessage.fromJSON(json)).toThrow("Phoenix message must be a list");
    });
  });
});

describe("PhoenixChannel", () => {
  let channel: PhoenixChannel;

  beforeEach(() => {
    channel = new PhoenixChannel("agent:123", { token: "test" });
  });

  describe("creation", () => {
    it("should create channel with topic and params", () => {
      expect(channel.topic).toBe("agent:123");
      expect(channel.params).toEqual({ token: "test" });
      expect(channel.isJoined).toBe(false);
    });
  });

  describe("join state", () => {
    it("should mark as joined", () => {
      channel["_markJoined"]();
      expect(channel.isJoined).toBe(true);
    });

    it("should reset join state", () => {
      channel["_markJoined"]();
      channel["_resetJoin"]();
      expect(channel.isJoined).toBe(false);
    });
  });

  describe("event handlers", () => {
    it("should register and call event handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      channel.on("message", handler1);
      channel.on("message", handler2);

      channel.emit("message", { data: "test" });

      expect(handler1).toHaveBeenCalledWith({ data: "test" });
      expect(handler2).toHaveBeenCalledWith({ data: "test" });
    });

    it("should remove event handlers", () => {
      const handler = vi.fn();
      channel.on("message", handler);
      channel.off("message", handler);

      channel.emit("message", { data: "test" });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("waitUntilJoined", () => {
    it("should resolve when channel joins", async () => {
      const promise = channel.waitUntilJoined(1000);
      setTimeout(() => channel["_markJoined"](), 10);

      await expect(promise).resolves.toBeUndefined();
    });

    it("should timeout if channel doesn't join", async () => {
      const promise = channel.waitUntilJoined(100);

      await expect(promise).rejects.toThrow("Timeout waiting to join channel");
    });
  });
});

describe("PhoenixChannelClient", () => {
  let mockClient: any;
  let phoenixClient: PhoenixChannelClient;

  beforeEach(() => {
    mockClient = {
      getWebSocketUrl: () => "ws://localhost:4001",
    };

    phoenixClient = new PhoenixChannelClient(mockClient);
  });

  afterEach(() => {
    if (phoenixClient["ws"]) {
      phoenixClient["ws"].close();
    }
  });

  describe("creation", () => {
    it("should create client", () => {
      expect(phoenixClient.isConnected).toBe(false);
      expect(phoenixClient["refCounter"]).toBe(0);
    });
  });

  describe("channel management", () => {
    it("should create and reuse channels", () => {
      const channel1 = phoenixClient.channel("agent:123");
      const channel2 = phoenixClient.channel("agent:123");
      const channel3 = phoenixClient.channel("agent:456");

      expect(channel1).toBe(channel2);
      expect(channel1).not.toBe(channel3);
      expect(channel1.topic).toBe("agent:123");
    });
  });

  describe("connect", () => {
    it("should connect to Phoenix Channel", async () => {
      global.WebSocket = class MockWebSocket {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;

        readyState = WebSocket.CONNECTING;

        constructor(url: string) {
          queueMicrotask(() => {
            this.readyState = WebSocket.OPEN;
            if (this.onopen) this.onopen(new Event("open"));
          });
        }

        send(data: string): void {}
        close(): void {
          this.readyState = WebSocket.CLOSED;
          if (this.onclose) this.onclose(new CloseEvent("close"));
        }
      } as any;

      await phoenixClient.connect();

      expect(phoenixClient.isConnected).toBe(true);

      await phoenixClient.close();
    });

    it("should handle connection errors", async () => {
      global.WebSocket = class MockWebSocket {
        constructor() {
          queueMicrotask(() => {
            if (this.onerror) this.onerror(new ErrorEvent("error"));
          });
        }

        connect(): void {}
      } as any;

      await expect(phoenixClient.connect()).rejects.toThrow(ConnectionError);
    });
  });

  describe("subscribe/unsubscribe", () => {
    it("should subscribe to agent", () => {
      phoenixClient.subscribe("agent-123");

      expect(phoenixClient["channels"].has("agent:agent-123")).toBe(true);
    });

    it("should unsubscribe from agent", async () => {
      phoenixClient.subscribe("agent-123");

      const leaveSpy = vi.spyOn(phoenixClient, "leaveChannel").mockResolvedValue();

      await phoenixClient.unsubscribe("agent-123");

      expect(leaveSpy).toHaveBeenCalledWith("agent:agent-123");
    });
  });

  describe("send", () => {
    it("should send message through Phoenix Channel", async () => {
      const pushSpy = vi.spyOn(phoenixClient, "push").mockResolvedValue();

      await phoenixClient.send({
        toAgent: "agent-123",
        content: { text: "hello" },
        messageType: "message",
        fromAgent: "agent-456",
        metadata: { key: "value" },
      });

      expect(pushSpy).toHaveBeenCalledWith(
        "agent:agent-123",
        "send",
        expect.objectContaining({
          message: expect.objectContaining({
            content: { text: "hello" },
            message_type: "message",
          }),
        })
      );
    });
  });

  describe("sendRpc", () => {
    it("should send RPC request", async () => {
      const pushSpy = vi.spyOn(phoenixClient, "push").mockResolvedValue();

      await phoenixClient.sendRpc({
        toAgent: "agent-123",
        method: "process",
        params: { input: "test" },
        requestId: "req-123",
        fromAgent: "agent-456",
      });

      expect(pushSpy).toHaveBeenCalledWith(
        "agent:agent-123",
        "rpc_request",
        expect.objectContaining({
          message: expect.objectContaining({
            method: "process",
            params: { input: "test" },
            correlation_id: "req-123",
          }),
        })
      );
    });
  });

  describe("onMessage", () => {
    it("should register global message handler", () => {
      const handler = vi.fn();
      phoenixClient.onMessage(handler);

      expect(phoenixClient["globalHandlers"].size).toBe(1);
    });
  });

  describe("heartbeat", () => {
    it("should send heartbeat periodically", async () => {
      global.WebSocket = class MockWebSocket {
        readyState = WebSocket.OPEN;

        constructor(url: string) {
          setTimeout(() => {
            if (this.onopen) this.onopen(new Event("open"));
          }, 10);
        }

        send(data: string): void {
          // Track heartbeat sends
          if (data.includes("heartbeat")) {
            (this as any).heartbeatSent = true;
          }
        }

        close(): void {
          this.readyState = WebSocket.CLOSED;
          if (this.onclose) this.onclose(new CloseEvent("close"));
        }
      } as any;

      await phoenixClient.connect();

      // Wait for heartbeat interval
      await new Promise(resolve => setTimeout(resolve, 100));

      expect((phoenixClient["ws"] as any).heartbeatSent).toBe(true);

      await phoenixClient.close();
    });
  });

  describe("reconnect", () => {
    it("should attempt reconnection with exponential backoff", async () => {
      let connectAttempts = 0;

      global.WebSocket = class MockWebSocket {
        readyState = WebSocket.OPEN;

        constructor() {
          connectAttempts++;
          if (connectAttempts === 1) {
            setTimeout(() => {
              if (this.onclose) this.onclose(new CloseEvent("close"));
            }, 10);
          } else {
            setTimeout(() => {
              if (this.onopen) this.onopen(new Event("open"));
            }, 10);
          }
        }

        close(): void {
          this.readyState = WebSocket.CLOSED;
        }
      } as any;

      await phoenixClient.connect();

      // Wait for reconnect
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(connectAttempts).toBeGreaterThan(1);

      await phoenixClient.close();
    });
  });

  describe("resubscribe", () => {
    it("should resubscribe to channels after reconnect", async () => {
      phoenixClient.subscribe("agent-123");
      phoenixClient.subscribe("agent-456");

      const joinSpy = vi.spyOn(phoenixClient, "joinChannel").mockResolvedValue(
        phoenixClient.channel("agent:123")
      );

      await phoenixClient["_resubscribeChannels"]();

      expect(joinSpy).toHaveBeenCalledTimes(2);
    });
  });
});