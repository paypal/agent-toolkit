package com.paypal.mcphost;

import com.paypal.mcphost.service.LLMChatService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class LLMChatServiceTest {

    @Mock
    private ChatClient chatClient;
    @Mock
    ChatClient.ChatClientRequestSpec chatClientRequestSpec;
    @Mock
    ChatClient.CallResponseSpec callResponseSpec;
    @InjectMocks
    private LLMChatService llmChatService;

    @Test
    public void testGetResponseFromLLM() {
        // Arrange
        String userPrompt = "What is the capital of France?";
        String expectedResponse = "Paris";

        // mock the prompt call
        when(chatClient.prompt()).thenReturn(chatClientRequestSpec);
        when(chatClientRequestSpec.user(userPrompt)).thenReturn(chatClientRequestSpec);
        when(chatClientRequestSpec.call()).thenReturn(callResponseSpec);
        when(callResponseSpec.content()).thenReturn(expectedResponse);

        // Act
        String actualResponse = llmChatService.getResponseFromLLM(userPrompt);

        // Assert
        assertEquals(expectedResponse, actualResponse);
    }
}