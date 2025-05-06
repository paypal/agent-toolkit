package com.paypal.mcphost;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.tool.ToolCallback;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ChatClientConfigurationTest {

    @Mock
    private ChatModel chatModel;
    @Mock
    SyncMcpToolCallbackProvider toolCallbackProvider;

    @Test
    public void testChatClientCreation() {
        when(toolCallbackProvider.getToolCallbacks()).thenReturn(new ToolCallback[]{});
        ChatClientConfiguration config = new ChatClientConfiguration();
        ChatClient chatClient = config.chatClient(chatModel,toolCallbackProvider);
        assertNotNull(chatClient);
        verify(toolCallbackProvider).getToolCallbacks();
    }
}