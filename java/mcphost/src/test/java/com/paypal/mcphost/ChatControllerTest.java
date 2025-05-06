package com.paypal.mcphost;

import com.paypal.mcphost.controller.ChatController;
import com.paypal.mcphost.service.LLMChatService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
public class ChatControllerTest {

    @Mock
    private LLMChatService llmChatService;

    @InjectMocks
    private ChatController chatController;

    @Test
    public void testProcessPrompt() {
        String userPrompt = "Hello, LLM!";
        String expectedResponse = "Response from LLM";

        when(llmChatService.getResponseFromLLM(userPrompt)).thenReturn(expectedResponse);

        String actualResponse = chatController.processPrompt(userPrompt);

        assertEquals(expectedResponse, actualResponse);
        verify(llmChatService).getResponseFromLLM(userPrompt);
    }
}