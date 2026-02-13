# https://www.perplexity.ai/search/can-you-attach-a-renderer-in-a-3XYmlpgsT1OcFf4Wmt3QXg#10
# https://www.perplexity.ai/search/can-you-attach-a-renderer-in-a-3XYmlpgsT1OcFf4Wmt3QXg#10
# https://www.perplexity.ai/search/can-you-attach-a-renderer-in-a-3XYmlpgsT1OcFf4Wmt3QXg#12
# https://claude.ai/share/bf85ade3-808a-43ab-a59a-97b93962fd40

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from my_agent.agent import root_agent

# Initialize FastAPI app
app = FastAPI()

# Serve your static files (index.html, index.js)
app.mount("/static", StaticFiles(directory="./static"), name="static")

@app.get("/")
async def root():
    # Serve the main HTML file at /
    return FileResponse("./index.html")

# Initialize ADK components
session_service = InMemorySessionService()
runner = Runner(
    app_name="restaurant-agent",
    agent=root_agent,
    session_service=session_service
)

@app.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, session_id: str):
    await websocket.accept()
    
    # Get or create session
    session = await session_service.get_session(
        app_name="restaurant-agent",
        user_id=user_id,
        session_id=session_id
    )
    
    if not session:
        await session_service.create_session(
            app_name="restaurant-agent",
            user_id=user_id,
            session_id=session_id
        )
    
    try:
        while True:
            # Receive user message from frontend
            user_input = await websocket.receive_text()
            
            # Run agent and get response
            async for event in runner.run(
                user_id=user_id,
                session_id=session_id,
                new_message=user_input
            ):
                # Send agent events back to frontend
                await websocket.send_json(event.model_dump(exclude_none=True))
                
    except WebSocketDisconnect:
        print(f"Client disconnected: {user_id}/{session_id}")