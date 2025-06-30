import { config } from "@dotenvx/dotenvx";
import OpenAI from "openai";
import { PayPalAgentToolkit, ALL_TOOLS_ENABLED } from "@paypal/agent-toolkit/openai";
import type {ChatCompletionMessageParam} from "openai/resources";

const envFilePath = process.env.ENV_FILE_PATH || ".env";
config({path: envFilePath});

const llm = new OpenAI();

const ppConfig = { 
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    configuration: {
        actions: ALL_TOOLS_ENABLED,
    },
}

const paypalToolkit = new PayPalAgentToolkit(ppConfig);

(async (): Promise<void> => {
    let messages: ChatCompletionMessageParam[] = [
        {
            role: "user",
            content: "Create an PayPal order for $50 for Premium News service.",
        },
    ];

    while (true) {
        const completion = await llm.chat.completions.create({
            model: "gpt-4o",
            messages,
            tools: paypalToolkit.getTools(),
        });

        const reply = completion.choices[0].message;
        messages.push(reply);

        if (reply.tool_calls) {
            const toolMessages = await Promise.all(
                reply.tool_calls.map((tc) => paypalToolkit.handleToolCall(tc))
            );
            messages.push(...messages, ...toolMessages);
        }
        else {
            console.log(completion.choices[0].message);
            break;
        }

    }
})();