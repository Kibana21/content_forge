import time
import os
from google import genai
from google.genai import types
from google.oauth2 import service_account

KEY_PATH = "video-key.json"
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']

# Load credentials
creds = service_account.Credentials.from_service_account_file(
    KEY_PATH, 
    scopes=SCOPES
)

# Initialize the client
client = genai.Client(
    vertexai=True, 
    project='gen-lang-client-0913704662',
    location='us-central1',
    credentials=creds
)

# Define your scenes as separate prompts
scenes = [
    # Scene 1: Initial setup
    "two ancient egyptian walls are closing upon 2 people and they say i think i am doomed, we are going to get crushed and we are going to die, the walls are closing in and they are getting closer and closer, the people are screaming and crying, the walls are almost upon them, they are about to be crushed",
    
    # Scene 2: The twist
    "the walls suddenly stop closing in right before crushing them. a hidden mechanism clicks, and a secret stone door slides open in the wall, revealing a dark escape passage",
    
    # Scene 3: The escape
    "the two people scramble through the secret stone door into the escape passage just in time, breathing heavily and looking back at the halted walls"
]

print("Requesting initial video generation for Scene 1...")
operation = client.models.generate_videos(
    model="veo-3.1-generate-001",
    prompt=scenes[0],
)

# Wait for initial generation
while not operation.done:
    print("Waiting for Scene 1 to complete...")
    time.sleep(20)
    operation = client.operations.get(operation)

print("Scene 1 complete.")

# Extend the video for subsequent scenes
for i in range(1, len(scenes)):
    print(f"Extending video for Scene {i+1}...")
    # Get the generated video from the previous step
    prev_video = operation.response.generated_videos[0].video
    
    operation = client.models.generate_videos(
        model="veo-3.1-generate-001",
        prompt=scenes[i], # Give the new prompt for the extension!
        video=prev_video
    )
    
    while not operation.done:
        print(f"Waiting for Scene {i+1} to complete...")
        time.sleep(20)
        operation = client.operations.get(operation)
    
    print(f"Scene {i+1} complete.")

# Ensure we have the response and save it
if operation.response:
    generated_video = operation.response.generated_videos[0]
    os.makedirs("output", exist_ok=True)
    save_path = "output/extended_video_scenes.mp4"
    generated_video.video.save(save_path)
    print(f"Video saved successfully to {save_path}!")
