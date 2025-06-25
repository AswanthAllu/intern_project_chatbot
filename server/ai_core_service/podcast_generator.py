# server/ai_core_service/podcast_generator.py
import os
import logging
import platform
import subprocess
import pyttsx3
from gtts import gTTS
import json
import re
import random # ✅ Import the random module

logger = logging.getLogger(__name__)

# --- Configuration ---
PODCAST_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'generated_podcasts')
FFMPEG_EXECUTABLE = "C:/ProgramData/chocolatey/bin/ffmpeg.exe"

# --- LLM Prompt for Advanced Scripting (Unchanged) ---
def generate_advanced_podcast_script(text_content: str, api_keys: dict):
    """Generates a two-host dialogue script in JSON format."""
    from . import llm_handler
    logger.info("Generating ADVANCED conversational podcast script...")
    
    model_name = "gemini-1.5-flash-latest" 
    
    prompt = f"""
    You are a master podcast scriptwriter. Your task is to transform the following technical document into an engaging, conversational podcast script for two hosts: Alex (male) and Brenda (female).
    **CRITICAL INSTRUCTIONS:**
    1.  **Create a Real Dialogue:** Do not just split the text. Alex should explain a concept, and Brenda should react, ask clarifying questions, or summarize. This back-and-forth is essential.
    2.  **Use Conversational Language:** Inject natural filler words and phrases (e.g., "So, what you're saying is...", "Right, that makes sense.", "Hmm, interesting.", "Well...", "You know...").
    3.  **Structure:** The script must have a clear intro, a body with conversational turns, and a concluding outro.
    4.  **Output Format:** Your output MUST be a valid JSON array of objects. Each object must have a "speaker" key ("Alex" or "Brenda") and a "line" key. Do not include any text outside of the JSON array.
    Example of good dialogue flow:
    [
      {{"speaker": "Alex", "line": "Welcome to 'Docu-Dive'! Today, we're tackling a paper on Ohm's Law."}},
      {{"speaker": "Brenda", "line": "Great! So, for anyone new to this, what's the core idea of Ohm's Law, Alex?"}},
      {{"speaker": "Alex", "line": "Well, at its heart, it's a simple formula: V equals I times R. It describes how voltage, current, and resistance are related."}},
      {{"speaker": "Brenda", "line": "Right, so V=IR. And what do those letters actually stand for in a practical sense?"}}
    ]
    Here is the document text to transform (use the first 12,000 characters):
    ---
    {text_content[:12000]}
    ---
    """
    try:
        raw_text = llm_handler._call_llm_for_task(
            prompt=prompt,
            llm_provider="gemini",
            llm_model_name=model_name,
            api_keys=api_keys
        )
        json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
        if json_match:
            json_string = json_match.group(0)
            return json.loads(json_string)
        logger.error("Could not find valid JSON array in the LLM script response.")
        return None
    except Exception as e:
        logger.error(f"Error during Gemini advanced script generation: {e}", exc_info=True)
        return None

def _normalize_audio_segment(input_path: str, output_path: str, speed_factor=1.0):
    """Converts any audio input to a standard WAV format, optionally changing the speed."""
    if not os.path.exists(input_path):
        logger.warning(f"Normalization skipped: Input file not found at {input_path}")
        return
    
    # Build the ffmpeg command with an optional atempo filter
    command = [
        FFMPEG_EXECUTABLE,
        '-i', input_path,
        '-y',
    ]
    # ✅ Add the atempo filter only if the speed factor is not 1.0
    if speed_factor != 1.0:
        command.extend(['-filter:a', f"atempo={speed_factor}"])
    
    command.extend([
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '1',
        output_path
    ])
    
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)

def synthesize_and_normalize_audio(script, output_filename_base):
    """
    Creates individual audio clips, normalizes them to a standard WAV format,
    and creates a text file for ffmpeg concatenation.
    """
    logger.info(f"Synthesizing and normalizing audio for {output_filename_base}...")
    normalized_files = []
    concat_file_path = os.path.join(PODCAST_OUTPUT_DIR, f"{output_filename_base}_concat.txt")
    
    try:
        engine = pyttsx3.init('sapi5' if platform.system() == 'Windows' else None)
        male_voice_id = engine.getProperty('voices')[0].id
        engine.stop()

        with open(concat_file_path, 'w') as f:
            for i, part in enumerate(script):
                speaker, line = part.get("speaker"), part.get("line")
                if not all([speaker, line]): continue

                temp_raw_audio_path = os.path.join(PODCAST_OUTPUT_DIR, f"temp_raw_{i}.mp3")
                temp_normalized_wav_path = os.path.join(PODCAST_OUTPUT_DIR, f"temp_norm_{i}.wav")

                if speaker == "Brenda":
                    # Use gTTS for the female voice. It's naturally well-paced.
                    tts = gTTS(text=line, lang='en', tld='co.uk')
                    tts.save(temp_raw_audio_path)
                    # ✅ Speed up the female voice slightly to 1.1x the original speed
                    _normalize_audio_segment(temp_raw_audio_path, temp_normalized_wav_path, speed_factor=1.1)
                
                elif speaker == "Alex":
                    engine = pyttsx3.init('sapi5' if platform.system() == 'Windows' else None)
                    engine.setProperty('voice', male_voice_id)
                    # ✅ Vary the male voice rate slightly for each line to sound more natural
                    engine.setProperty('rate', random.randint(140, 155))
                    
                    temp_raw_audio_path = os.path.join(PODCAST_OUTPUT_DIR, f"temp_raw_{i}.wav")
                    engine.save_to_file(line, temp_raw_audio_path)
                    engine.runAndWait()
                    engine.stop()
                    # Normalize without changing speed, as we already set the rate
                    _normalize_audio_segment(temp_raw_audio_path, temp_normalized_wav_path)

                if os.path.exists(temp_normalized_wav_path):
                    normalized_files.append(temp_normalized_wav_path)
                    f.write(f"file '{os.path.abspath(temp_normalized_wav_path)}'\n")

        return normalized_files, concat_file_path
    except Exception as e:
        logger.error(f"Error during audio synthesis and normalization: {e}", exc_info=True)
        for file_path in normalized_files:
            if os.path.exists(file_path): os.remove(file_path)
        if os.path.exists(concat_file_path): os.remove(concat_file_path)
        raise

def combine_and_convert_with_ffmpeg(concat_file_path: str, output_mp3: str, temp_files: list):
    """Uses ffmpeg's concat demuxer to combine WAVs and convert to a final MP3."""
    logger.info(f"Combining normalized WAVs and converting to {output_mp3}...")
    
    ffmpeg_command = [
        FFMPEG_EXECUTABLE,
        '-f', 'concat',
        '-safe', '0',
        '-i', concat_file_path,
        '-y',
        '-acodec', 'libmp3lame',
        '-b:a', '192k',
        output_mp3
    ]
    
    try:
        subprocess.run(ffmpeg_command, check=True, capture_output=True, text=True)
        logger.info("ffmpeg processing successful.")
    except Exception as e:
        logger.error(f"ffmpeg processing failed: {e}", exc_info=True)
        raise
    finally:
        for file_path in temp_files:
            if os.path.exists(file_path): os.remove(file_path)
        if os.path.exists(concat_file_path): os.remove(concat_file_path)

def create_podcast_from_text(document_text: str, output_filename_base: str, api_keys: dict) -> str:
    """Main orchestrator function."""
    script = generate_advanced_podcast_script(document_text, api_keys)
    if not script:
        raise ValueError("Failed to generate a valid podcast script.")
    
    normalized_wav_files, concat_file = [], ''
    try:
        normalized_wav_files, concat_file = synthesize_and_normalize_audio(script, output_filename_base)
        
        final_mp3_path = os.path.join(PODCAST_OUTPUT_DIR, f"{output_filename_base}.mp3")
        final_mp3_filename = f"{output_filename_base}.mp3"
        
        combine_and_convert_with_ffmpeg(concat_file, final_mp3_path, normalized_wav_files)
        
        return final_mp3_filename
    except Exception as e:
        logger.error(f"Podcast generation pipeline failed for {output_filename_base}: {e}")
        raise