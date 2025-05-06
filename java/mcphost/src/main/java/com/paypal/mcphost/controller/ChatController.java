package com.paypal.mcphost.controller;

import com.paypal.mcphost.service.LLMChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ChatController {

    @Autowired
    private LLMChatService llmChatService;
    @PostMapping("/chat")
    @ResponseBody
    public String processPrompt(@RequestBody String userPrompt) {
        return llmChatService.getResponseFromLLM(userPrompt);
    }

}
