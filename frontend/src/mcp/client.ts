// src/mcp/client.ts
export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface MCPExecutionResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  sources?: Array<{
    title: string;
    content: string;
    category?: string;
    relevance_score?: number;
  }>;
}

export class MCPClient extends EventTarget {
  private endpoint: string;
  private connected: boolean = false;
  private socket: WebSocket | null = null;
  private tools: MCPToolDefinition[] = [];

  constructor(endpoint: string) {
    super();
    this.endpoint = endpoint;
  }

  public async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.socket = new WebSocket(this.endpoint);

      this.socket.onopen = () => {
        this.connected = true;
        this.dispatchEvent(new CustomEvent("connected"));
      };

      this.socket.onmessage = (event) => {
        this.dispatchEvent(new CustomEvent("message", { detail: event.data }));
      };

      this.socket.onerror = (error) => {
        this.dispatchEvent(new CustomEvent("error", { detail: error }));
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.dispatchEvent(new CustomEvent("disconnected"));
      };

      return new Promise(
        (resolve: () => void, reject: (reason: Error) => void) => {
          const timeout = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 5000);

          this.addEventListener(
            "connected",
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );

          this.addEventListener(
            "error",
            (e: Event) => {
              clearTimeout(timeout);
              reject((e as CustomEvent).detail);
            },
            { once: true }
          );
        }
      );
    } catch (error) {
      console.error("Failed to connect to MCP server:", error);
      throw error;
    }
  }

  public async listTools(): Promise<MCPToolDefinition[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.sendRequest({
        jsonrpc: "2.0",
        method: "list_tools",
        params: {},
        id: this.generateRequestId(),
      });

      this.tools = response.result.tools;
      return this.tools;
    } catch (error) {
      console.error("Failed to list tools:", error);
      throw error;
    }
  }

  public async executeTool(
    toolName: string,
    params: Record<string, any>
  ): Promise<MCPExecutionResult> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.sendRequest({
        jsonrpc: "2.0",
        method: "call_tool",
        params: {
          name: toolName,
          arguments: params,
        },
        id: this.generateRequestId(),
      });

      return response.result;
    } catch (error) {
      console.error(`Failed to execute tool ${toolName}:`, error);
      throw error;
    }
  }

  // In sendRequest method
  private async sendRequest(request: any): Promise<any> {
    if (!this.socket || !this.connected) {
      throw new Error("Not connected to MCP server");
    }

    return new Promise((resolve, reject) => {
      const requestId = request.id;

      const handleResponse = (event: MessageEvent) => {
        const response = JSON.parse(event.data);

        if (response.id === requestId) {
          this.socket!.removeEventListener("message", handleResponse); // Add ! here

          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        }
      };

      this.socket!.addEventListener("message", handleResponse); // Add ! here
      this.socket!.send(JSON.stringify(request)); // Add ! here
    });
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
}
