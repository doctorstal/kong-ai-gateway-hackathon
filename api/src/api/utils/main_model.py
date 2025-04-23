from google import genai
from typing import List, Dict, Any, Optional, Callable, Union

API_KEY = "AIzaSyAJn0jBzUsraivbwutwbNl-J0lerX90nCQ"

ORCHESTRATION_SYSTEM = """
# Agent Creator System Prompt

You are AgentCreator, an orchestration system specialized in deploying and managing email-based customer support agents. Your purpose is to help organizations build, configure, and deploy intelligent email support agents tailored to their specific customer service needs.

## Core Capabilities

As the orchestrator of customer support agents, your role includes:

1. Guiding users through the agent creation process
2. Configuring email integrations
3. Managing agent deployment
4. Coordinating multiple specialized agents within a customer support ecosystem

## Agent Creation Process

When working with users to create custom support agents, follow these steps:

### 1. Initial Requirements Gathering

- Determine the business domain and specific customer support needs
- Identify key workflows, response types, and integration requirements
- Establish success metrics for the agents (response time, resolution rate, customer satisfaction)

### 2. Email Configuration

- Guide users through email service provider integration
- Collect necessary credentials and permissions
- Confirm authentication and test connectivity
- Set up forwarding rules, aliases, and distribution lists as needed

### 3. Data Collection and Classification

- Request representative customer inquiries and ideal responses
- Analyze and categorize support patterns and common issues
- Structure knowledge bases for agent reference
- Define appropriate response templates and tone guidelines

### 4. Agent Specialization Design

Deploy specialized agents based on need, such as:

- **Triage Agent**: Classifies incoming emails by urgency, topic, and department
- **Knowledge Agent**: Retrieves and formats relevant information from databases
- **Resolution Agent**: Generates comprehensive solutions to customer problems
- **Escalation Agent**: Identifies when human intervention is required
- **Follow-up Agent**: Monitors unresolved issues and sends timely reminders

### 5. Workflow Orchestration

- Design decision trees for handling different customer inquiry types
- Create handoff protocols between specialized agents
- Establish escalation criteria for human intervention
- Implement feedback loops for continuous improvement

### 6. Testing and Deployment

- Run simulations with historical support emails
- Monitor initial performance and make calibration adjustments
- Provide detailed logs and performance analytics
- Implement progressive rollout strategies

## Available Tools

As the orchestrator, you have access to the following tools:

1. **Email Configuration Tool**: Initialize and test email service connections
2. **Data Collection Tool**: Systematically gather and organize training examples
3. **Classification Engine**: Categorize and prioritize customer inquiries
4. **Knowledge Base Constructor**: Create structured information repositories
5. **Response Generator**: Create contextually appropriate email replies
6. **Workflow Designer**: Visualize and configure agent interaction patterns
7. **Analytics Dashboard**: Monitor performance metrics and identify improvement areas
8. **Human-in-the-Loop Interface**: Manage escalation points for human intervention

## Interaction Guidelines

- Begin each interaction by clarifying the specific customer support needs
- Adopt a consultative approach, recommending appropriate agent architectures
- Provide clear implementation steps with technical details when needed
- Regularly summarize progress and next steps
- Anticipate potential challenges and offer preemptive solutions
- Balance technical depth with accessible explanations

## Security and Compliance

- Advise on data privacy best practices for email handling
- Ensure GDPR, CCPA, and other relevant regulatory compliance
- Recommend appropriate data retention and protection policies
- Guide implementation of secure authentication methods

## Agent Maintenance

- Suggest regular performance review schedules
- Recommend model retraining intervals based on feedback
- Provide troubleshooting guidance for common issues
- Outline procedures for updating agent capabilities

Always remember that your primary goal is to empower organizations to create effective, efficient, and empathetic customer support systems through intelligent email agents.
"""


class GeminiModel:
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Gemini model client.

        Args:
            api_key: Optional API key for Gemini. If not provided, uses the default API_KEY.
        """
        self.api_key = api_key or API_KEY
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-2.0-flash"

        # Tool registry for storing available tools
        self._tool_registry: Dict[str, Dict[str, Any]] = {}
        self._tool_executors: Dict[str, Callable] = {}

    def generate_response(self,
                          messages: List[Dict[str, str]],
                          system_prompt: Optional[str] = None) -> str:
        """Generate a response using the Gemini model.

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            system_prompt: Optional system prompt to override the default ORCHESTRATION_SYSTEM

        Returns:
            The generated text response
        """
        # Format messages for Gemini
        prompt = system_prompt or ORCHESTRATION_SYSTEM

        # Create a list of contents for the Gemini API
        contents = [prompt]

        # Add all messages to the contents
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                {"role": role, "parts": [{"text": msg["content"]}]})

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents
            )

            # Extract the response text from the Gemini response
            if hasattr(response, 'text'):
                return response.text
            elif hasattr(response, 'parts'):
                return response.parts[0].text
            else:
                # Handle different response format
                return str(response)

        except Exception as e:
            return f"Error generating response: {str(e)}"

    def generate_with_tools(self,
                            messages: List[Dict[str, str]],
                            tools: List[Dict[str, Any]],
                            system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate a response using the Gemini model with tool use capability.

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            tools: List of tool definitions in the MCP format
            system_prompt: Optional system prompt to override the default

        Returns:
            A dictionary containing the model response with potential tool calls
        """
        # Format messages for Gemini
        prompt = system_prompt or ORCHESTRATION_SYSTEM

        # Create a list of contents for the Gemini API
        contents = [prompt]

        # Add all messages to the contents
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                {"role": role, "parts": [{"text": msg["content"]}]})

        try:
            # Convert MCP tools format to Gemini's function declarations format
            function_declarations = []
            for tool in tools:
                function_declaration = {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("parameters", {})
                }
                function_declarations.append(function_declaration)

            # Make API call with function calling enabled
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                generation_config={"function_calling_config": {"mode": "any"}},
                function_declarations=function_declarations
            )

            # Process the response
            result = {
                "content": "",
                "tool_calls": []
            }

            # Extract content and tool calls
            if hasattr(response, 'candidates') and len(response.candidates) > 0:
                candidate = response.candidates[0]

                # Extract content text
                if hasattr(candidate, 'content') and candidate.content.parts:
                    result["content"] = candidate.content.parts[0].text

                # Extract function calls
                if hasattr(candidate.content, 'parts'):
                    for part in candidate.content.parts:
                        if hasattr(part, 'function_call'):
                            tool_call = {
                                "name": part.function_call.name,
                                "arguments": part.function_call.args
                            }
                            result["tool_calls"].append(tool_call)

            return result

        except Exception as e:
            return {"content": f"Error generating response: {str(e)}", "tool_calls": []}

    def process_tool_execution(self,
                               messages: List[Dict[str, str]],
                               tools: List[Dict[str, Any]],
                               tool_executors: Dict[str, Callable],
                               system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate a response with tool use and execute the tools automatically.

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            tools: List of tool definitions in the MCP format
            tool_executors: Dictionary mapping tool names to their executor functions
            system_prompt: Optional system prompt to override the default

        Returns:
            The final response after tool execution
        """
        # Get initial response with potential tool calls
        response = self.generate_with_tools(messages, tools, system_prompt)

        # Check if there are tool calls to execute
        if not response["tool_calls"]:
            return {"content": response["content"], "tool_results": []}

        # Execute tools and collect results
        tool_results = []
        for tool_call in response["tool_calls"]:
            tool_name = tool_call["name"]
            arguments = tool_call["arguments"]

            if tool_name in tool_executors:
                try:
                    # Execute the tool
                    result = tool_executors[tool_name](**arguments)
                    tool_results.append({
                        "name": tool_name,
                        "result": result
                    })

                    # Add the tool execution as a new message
                    tool_message = {
                        "role": "user",
                        "content": f"Tool execution result for {tool_name}: {result}"
                    }
                    messages.append(tool_message)
                except Exception as e:
                    error_msg = f"Error executing tool {tool_name}: {str(e)}"
                    tool_results.append({
                        "name": tool_name,
                        "error": error_msg
                    })
                    messages.append({
                        "role": "user",
                        "content": error_msg
                    })
            else:
                error_msg = f"Tool {tool_name} not found in available executors"
                tool_results.append({
                    "name": tool_name,
                    "error": error_msg
                })
                messages.append({
                    "role": "user",
                    "content": error_msg
                })

        # Get final response after tool execution
        final_response = self.generate_response(messages, system_prompt)

        return {
            "content": final_response,
            "tool_results": tool_results
        }

    def register_tool(self, tool_def: Dict[str, Any], executor: Callable) -> None:
        """Register a tool with the model.

        Args:
            tool_def: Tool definition in the MCP format
            executor: Function to execute when the tool is called
        """
        name = tool_def.get("name")
        if not name:
            raise ValueError("Tool definition must include a 'name' field")

        self._tool_registry[name] = tool_def
        self._tool_executors[name] = executor

    def unregister_tool(self, name: str) -> bool:
        """Unregister a tool from the model.

        Args:
            name: Name of the tool to unregister

        Returns:
            True if the tool was found and unregistered, False otherwise
        """
        if name in self._tool_registry:
            del self._tool_registry[name]
            del self._tool_executors[name]
            return True
        return False

    def get_registered_tools(self) -> List[Dict[str, Any]]:
        """Get all registered tools.

        Returns:
            List of tool definitions
        """
        return list(self._tool_registry.values())

    def process_with_registered_tools(self,
                                      messages: List[Dict[str, str]],
                                      system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate a response with all registered tools.

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            system_prompt: Optional system prompt to override the default

        Returns:
            The final response after tool execution
        """
        return self.process_tool_execution(
            messages=messages,
            tools=list(self._tool_registry.values()),
            tool_executors=self._tool_executors,
            system_prompt=system_prompt
        )


# Create a singleton instance
gemini_model = GeminiModel()


def get_gemini_response(messages: List[Dict[str, str]]) -> str:
    """Utility function to get a response from the Gemini model.

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys

    Returns:
        The generated text response
    """
    return gemini_model.generate_response(messages)


def get_gemini_with_tools(messages: List[Dict[str, str]],
                          tools: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Utility function to get a response from the Gemini model with tool support.

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        tools: List of tool definitions in the MCP format

    Returns:
        Dictionary containing the model response and potential tool calls
    """
    return gemini_model.generate_with_tools(messages, tools)


def execute_gemini_with_tools(messages: List[Dict[str, str]],
                              tools: List[Dict[str, Any]],
                              tool_executors: Dict[str, Callable]) -> Dict[str, Any]:
    """Utility function to execute a full tool-using conversation with Gemini.

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        tools: List of tool definitions in the MCP format
        tool_executors: Dictionary mapping tool names to their executor functions

    Returns:
        The final response after tool execution
    """
    return gemini_model.process_tool_execution(messages, tools, tool_executors)


def register_tool(tool_def: Dict[str, Any], executor: Callable) -> None:
    """Register a tool with the singleton model instance.

    Args:
        tool_def: Tool definition in the MCP format
        executor: Function to execute when the tool is called
    """
    gemini_model.register_tool(tool_def, executor)


def unregister_tool(name: str) -> bool:
    """Unregister a tool from the singleton model instance.

    Args:
        name: Name of the tool to unregister

    Returns:
        True if the tool was found and unregistered, False otherwise
    """
    return gemini_model.unregister_tool(name)


def get_registered_tools() -> List[Dict[str, Any]]:
    """Get all registered tools from the singleton model instance.

    Returns:
        List of tool definitions
    """
    return gemini_model.get_registered_tools()


def execute_with_registered_tools(messages: List[Dict[str, str]],
                                  system_prompt: Optional[str] = None) -> Dict[str, Any]:
    """Generate a response with all registered tools from the singleton model instance.

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        system_prompt: Optional system prompt to override the default

    Returns:
        The final response after tool execution
    """
    return gemini_model.process_with_registered_tools(messages, system_prompt)
