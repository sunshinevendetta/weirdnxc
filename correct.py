#!/usr/bin/env python3
import json
import os

# Path to the JSON file (adjust if needed)
json_path = os.path.join("music", "tracks.json")
output_path = os.path.join("music", "tracks_corrected.json")

# Load the existing JSON data
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Iterate through each ACT and update each track's metadata if needed
for act, act_data in data.items():
    tracks = act_data.get("tracks", [])
    for track in tracks:
        title = track.get("title", "")
        # Check if the title contains " - "
        if " - " in title:
            # Split the title into two parts: left becomes the new artist, right becomes the new title
            parts = title.split(" - ", 1)
            new_artist = parts[0].strip()
            new_title = parts[1].strip()
            # Update the track metadata
            track["artist"] = new_artist
            track["title"] = new_title

# Write the corrected data to a new JSON file
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print(f"Corrected JSON written to: {output_path}")
