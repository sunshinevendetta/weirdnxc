import os
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1

# Base music directory
base_dir = './music'

# Iterate over each ACT folder
for act_folder in sorted(os.listdir(base_dir)):
    act_path = os.path.join(base_dir, act_folder)
    if os.path.isdir(act_path) and act_folder.startswith('ACT'):
        print(f"Processing {act_folder}...")

        # List all audio files in the current ACT folder
        audio_files = [f for f in os.listdir(act_path) if f.endswith(('.mp3', '.wav'))]
        audio_files.sort()  # Ensure files are in order

        for index, audio_file in enumerate(audio_files, start=1):
            old_path = os.path.join(act_path, audio_file)
            new_filename = f"song{index}.mp3"
            new_path = os.path.join(act_path, new_filename)

            # Read MP3 metadata
            try:
                audio = MP3(old_path, ID3=ID3)
                title = audio.get('TIT2', TIT2(encoding=3, text='Unknown Title')).text[0]
                artist = audio.get('TPE1', TPE1(encoding=3, text='Unknown Artist')).text[0]

                print(f"Renaming '{audio_file}' to '{new_filename}' ({artist} - {title})")
            except Exception as e:
                print(f"Error reading tags from {audio_file}: {e}")
                title = 'Unknown Title'
                artist = 'Unknown Artist'

            # Rename the file
            os.rename(old_path, new_path)

print("Renaming completed.")
