import os
import shutil
import subprocess
import imageio_ffmpeg

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
clips = []

print("Encoding 7 presentation clips...")
for i in range(1, 8):
    slide_png = f"video_build/slides/slide_{i}.png"
    audio_mp3 = f"video_build/audio/seg{i}.mp3"
    clip_mp4 = f"video_build/clips/clip_{i}.mp4"
    clip_abs = os.path.abspath(clip_mp4).replace("\\", "/")
    clips.append(f"file '{clip_abs}'")
    
    cmd = [
        ffmpeg, "-y",
        "-loop", "1",
        "-i", slide_png,
        "-i", audio_mp3,
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        clip_mp4
    ]
    if not os.path.exists(clip_mp4):
        print(f"Encoding clip {i}/7...")
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error encoding clip {i}: {res.stderr}")
            exit(1)
    else:
        print(f"Clip {i}/7 already encoded.")

# Write concat list
concat_file = "video_build/clips_list.txt"
with open(concat_file, "w") as f:
    for c in clips:
        f.write(c + "\n")

print("Concatenating all clips into final 5-minute video...")
output_video = "d:/Athiya/razorpay/pitch_video_5min.mp4"
concat_cmd = [
    ffmpeg, "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concat_file,
    "-c", "copy",
    output_video
]

res = subprocess.run(concat_cmd, capture_output=True, text=True)
if res.returncode != 0:
    print(f"Error concatenating: {res.stderr}")
    exit(1)

# Also copy to artifact directory
artifact_dir = r"C:\Users\Ayesha Thanveer\.gemini\antigravity\brain\254aef66-1973-4a31-9a8e-cffe69180183"
artifact_video = os.path.join(artifact_dir, "pitch_video_5min.mp4")
shutil.copy2(output_video, artifact_video)

file_size_mb = os.path.getsize(output_video) / (1024 * 1024)
print(f"SUCCESS: pitch_video_5min.mp4 created! Size: {file_size_mb:.2f} MB")
print(f"Destination 1: {output_video}")
print(f"Destination 2: {artifact_video}")
