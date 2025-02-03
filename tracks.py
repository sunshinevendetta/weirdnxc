#!/usr/bin/env python3
import os
import json
from mutagen import File as MutagenFile

# Set your music folder path (assumed to be in the same folder as this script)
music_dir = os.path.join(os.getcwd(), "music")

# Define the ACT folders we expect (case-sensitive)
acts = ["ACT1", "ACT2", "ACT3", "ACT4", "ACT5", "ACT6", "ACT7"]

# Allowed file extensions
AUDIO_EXTENSIONS = {".mp3", ".wav"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Prepare the dictionary to hold all data
tracks_data = {}

for act in acts:
    act_path = os.path.join(music_dir, act)
    if not os.path.isdir(act_path):
        print(f"Warning: Folder '{act_path}' not found. Skipping.")
        continue

    # Find cover file in the folder (first file with "cover" in its name and with a valid image extension)
    cover_file = ""
    for f in os.listdir(act_path):
        lower_f = f.lower()
        name, ext = os.path.splitext(lower_f)
        if "cover" in lower_f and ext in IMAGE_EXTENSIONS:
            cover_file = f  # use the filename as stored (preserve case)
            break

    # Process audio files in the folder
    track_list = []
    for f in os.listdir(act_path):
        name, ext = os.path.splitext(f.lower())
        if ext in AUDIO_EXTENSIONS:
            full_path = os.path.join(act_path, f)
            metadata = {"filename": f}  # always include the filename
            try:
                audio = MutagenFile(full_path, easy=True)
                if audio:
                    # Use the metadata if present; fallback to filename if not
                    metadata["title"] = audio.get("title", [f])[0]
                    metadata["artist"] = audio.get("artist", ["Unknown Artist"])[0]
                    metadata["album"] = audio.get("album", ["Unknown Album"])[0]
                    metadata["duration"] = int(audio.info.length) if audio.info and hasattr(audio.info, "length") else 0
                else:
                    metadata["title"] = f
                    metadata["artist"] = "Unknown Artist"
                    metadata["album"] = "Unknown Album"
                    metadata["duration"] = 0
            except Exception as e:
                print(f"Error reading metadata for {full_path}: {e}")
                metadata["title"] = f
                metadata["artist"] = "Unknown Artist"
                metadata["album"] = "Unknown Album"
                metadata["duration"] = 0

            track_list.append(metadata)

    # Sort the tracks by filename (or you could sort by title if preferred)
    track_list.sort(key=lambda x: x["filename"])
    tracks_data[act] = {
        "cover": cover_file,  # relative filename for the cover
        "tracks": track_list
    }

# Write the JSON file to music/tracks.json
output_json = os.path.join(music_dir, "tracks.json")
with open(output_json, "w", encoding="utf-8") as outfile:
    json.dump(tracks_data, outfile, indent=4)

print(f"tracks.json generated at: {output_json}")
