import yt_dlp
import requests
import json

def get_transcription(video_url, lang='en'):
    ydl_opts = {
        'writesubtitles': True,
        'subtitleslangs': [lang],
        'skip_download': True,
        'quiet': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        subtitles = info.get('subtitles') or {}
        
        if lang in subtitles:
            subtitle_url = subtitles[lang][0]['url']
            response = requests.get(subtitle_url)
            if response.status_code == 200:
                try:
                    subtitle_data = json.loads(response.text)
                    full_text = " ".join(segment["utf8"] for event in subtitle_data["events"] for segment in event.get("segs", []))
                    
                    return {"status": "success", "text": full_text}
                except json.JSONDecodeError:
                    return {"status": "error", "message": "Failed to parse subtitle data."}
            else:
                return {"status": "error", "message": "Failed to download subtitles."}
        else:
            return {"status": "error", "message": "Subtitles not available for the requested language."}
