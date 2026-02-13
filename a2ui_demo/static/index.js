// https://www.perplexity.ai/search/can-you-attach-a-renderer-in-a-3XYmlpgsT1OcFf4Wmt3QXg#13
// https://claude.ai/share/bf85ade3-808a-43ab-a59a-97b93962fd40
// https://claude.ai/share/cb46da0c-479b-49a7-a3d1-1bfc01f691e0
// https://claude.ai/share/cb46da0c-479b-49a7-a3d1-1bfc01f691e0

import { MessageProcessor } from '@a2ui/web-lib';
import { A2UISurface } from '@a2ui/lit';
// import { v0_8 } from './a2ui/src/index.js';

const processor = new MessageProcessor();
// const { UI } = v0_8;
// const { Surface } = UI;

const userId = 'user-' + Math.random().toString(36).substr(2, 9);
const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const surface = document.getElementById('mainSurface');
    
    if (!surface) {
        console.error('a2ui-surface element not found');
        return;
    }

    surface.processor = processor;
    surface.surfaceId = 'main';

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}/${sessionId}`);

    ws.onopen = () => {
        console.log('Connected to agent');
    };

    ws.onmessage = (event) => {
        const agentEvent = JSON.parse(event.data);
        console.log('Received event:', agentEvent);
        
        // Look for A2UI JSON in the response
        if (agentEvent.content && agentEvent.content.parts) {
            agentEvent.content.parts.forEach(part => {
                if (part.text && part.text.includes('---a2ui_JSON---')) {
                    const parts = part.text.split('---a2ui_JSON---');
                    try {
                        const a2uiMessages = JSON.parse(parts[1].trim());
                        console.log('Parsed A2UI messages:', a2uiMessages);
                        
                        // Process each A2UI message
                        a2uiMessages.forEach(msg => {
                            surface.processMessage(msg);
                        });
                    } catch (e) {
                        console.error('Failed to parse A2UI JSON:', e);
                        console.error('Raw text:', parts[1]);
                    }
                }
            });
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('Disconnected from agent');
    };

    // Handle user input
    const form = document.getElementById('userInput');
    const input = form?.querySelector('input');

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        // const input = e.target.querySelector('input');
        if (input.value.trim() && ws.readyState === WebSocket.OPEN) {
            ws.send(input.value);
            input.value = '';
        }
    });
});