package com.paypal.mcphost;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class LLMChatService {
    @Autowired
    ChatClient chatClient;

    public String getResponseFromLLM(String userPrompt) {

        return chatClient
                .prompt()
                .user(userPrompt)
                .call()
                .content();
    }
}
