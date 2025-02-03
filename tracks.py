#!/usr/bin/env python3
import os
import json

# Define the root music directory (assumed to be in the same folder as this script)
music_dir = os.path.join(os.getcwd(), "music")

# Define allowed file extensions
audio_extensions = {".mp3", ".wav"}
cover_extensions = {".png", ".jpg", ".jpeg"}

# Dictionary to hold our JSON data
tracks_data = {}

# Loop through all directories in the music folder that start with "ACT" (case-insensitive)
for folder in os.listdir(music_dir):
    folder_path = os.path.join(music_dir, folder)
    if os.path.isdir(folder_path) and folder.upper().startswith("ACT"):
        act_key = folder.upper()  # e.g., "ACT1", "ACT2", etc.
        cover_file = None
        track_files = []
        
        # Loop through files in the ACT folder
        for filename in os.listdir(folder_path):
            lower_filename = filename.lower()
            _, ext = os.path.splitext(lower_filename)
            if ext in cover_extensions and "cover" in lower_filename:
                # Use the first cover art file found (you can adjust if multiple covers exist)
                if not cover_file:
                    cover_file = filename
            elif ext in audio_extensions:
                track_files.append(filename)
        
        # Sort the track list for consistency
        track_files.sort()
        
        # Save into our dictionary. If no cover is found, we use an empty string.
        tracks_data[act_key] = {
            "cover": cover_file if cover_file else "",
            "tracks": track_files
        }

# Write the JSON data to music/tracks.json
output_json = os.path.join(music_dir, "tracks.json")
with open(output_json, "w", encoding="utf-8") as outfile:
    json.dump(tracks_data, outfile, indent=4)

print(f"tracks.json generated at: {output_json}")

# Print the JSON data to the console
print(json.dumps(tracks_data, indent=4))