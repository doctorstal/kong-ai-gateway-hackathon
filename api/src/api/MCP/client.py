import asyncio
import os
import sys
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from google import genai
from google import generativeai
from google.generativeai.types import Tool as GeminiTool
from google.generativeai.types import FunctionDeclaration
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env

class MCPClient:
    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.gemini = genai.Client(api_key="")
    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server

        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        is_python = server_script_path.endswith('.py')
        is_js = server_script_path.endswith('.js')
        if not (is_python or is_js):
            raise ValueError("Server script must be a .py or .js file")

        command = "python" if is_python else "node"
        server_params = StdioServerParameters(
            command=command,
            args=[server_script_path],
            env=None
        )

        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

        await self.session.initialize()

        # List available tools
        response = await self.session.list_tools()
        tools = response.tools
        print("\nConnected to server with tools:", [tool.name for tool in tools])

    async def process_query(self, query: str) -> str:
        response = await self.session.list_tools()

        # Convert MCP tools to Gemini tools
        tools = []
        for tool in response.tools:
            print(tool)
            tools.append(
                GeminiTool(
                    function_declarations=[
                        FunctionDeclaration(
                            name=tool.name,
                            description=tool.description,
                            parameters=tool.inputSchema,
                        )
                    ]
                )
            )

        # Update tools in the model
        self.gemini.tools = tools
        chat = self.gemini.start_chat()

        final_text = []

        # Send the initial message
        msg = chat.send_message(query)
        final_text.append(msg.text)

        # If tool call is returned
        if msg.candidates and msg.candidates[0].content.parts:
            for part in msg.candidates[0].content.parts:
                if hasattr(part, 'function_call'):
                    fc = part.function_call
                    tool_result = await self.session.call_tool(fc.name, fc.args)
                    final_text.append(f"[Tool call to {fc.name} with args {fc.args}]")
                    final_text.append(f"Tool result: {tool_result.content}")
                    msg = chat.send_message(tool_result.content)
                    final_text.append(msg.text)

        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        while True:
            try:
                query = input("\nQuery: ").strip()

                if query.lower() == 'quit':
                    break

                response = await self.process_query(query)
                print("\n" + response)

            except Exception as e:
                print(f"\nError: {str(e)}")

    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()

async def main():
    if len(sys.argv) < 2:
        print("Usage: python client.py <path_to_server_script>")
        sys.exit(1)

    client = MCPClient()
    try:
        await client.connect_to_server(sys.argv[1])
        await client.chat_loop()
    finally:
        await client.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
