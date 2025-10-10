import os
import subprocess

VIDEO_URL = "https://www.youtube.com/watch?v=EerdGm-ehJQ&t=142s"
OUTPUT_FILE = "JavaScript Tutorial Full Course - Beginner to Pro - YouTube.mp4"

# yt-dlp command with resume, retries, and fragment handling
command = [
    "yt-dlp",
    "--continue",           # resume partial downloads
    "--retries", "infinite",# keep retrying
    "--fragment-retries", "infinite",
    "-o", OUTPUT_FILE,      # output file name
    VIDEO_URL
]

subprocess.run(command)