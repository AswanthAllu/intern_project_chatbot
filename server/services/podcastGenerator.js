const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
<<<<<<< HEAD
=======
const fetch = require('node-fetch');
const os = require('os');
require('dotenv').config();
>>>>>>> upstream/main

const execAsync = promisify(exec);

// Audio directory
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'podcasts');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

<<<<<<< HEAD
=======
// ElevenLabs API key (should be stored securely in production)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
    throw new Error('Missing ElevenLabs API key. Set ELEVENLABS_API_KEY in your environment.');
}
// Default English voices (can be customized)
const ELEVENLABS_MALE_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Example: Adam
const ELEVENLABS_FEMALE_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Example: Rachel

>>>>>>> upstream/main
/**
 * Create audio directory if it doesn't exist
 */
const createAudioDir = async () => {
    try {
        await fs.mkdir(AUDIO_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create audio directory:', error);
<<<<<<< HEAD
        throw error; // Re-throw the error to be handled by the caller
    }
};

// Helper to escape text for PowerShell
const escapeForPowerShell = (text) => {
    return text
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // curly/special single quotes to straight
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // curly/special double quotes to straight
        .replace(/[\u2013\u2014\u2015]/g, '-') // dashes to hyphen
        .replace(/'/g, "''") // escape single quotes for PowerShell
        .replace(/[\r\n]+/g, ' ') // newlines to space
        .replace(/[^ -~]/g, ''); // remove non-ASCII
};

/**
 * Generate podcast audio using Windows SAPI with multiple voices
=======
        throw error;
    }
};

/**
 * Generate TTS audio for a segment using ElevenLabs
 * @param {string} text - The text to synthesize
 * @param {string} voiceId - ElevenLabs voice ID
 * @param {string} outputPath - Path to save the audio file
 */
async function generateTTSWithElevenLabs(text, voiceId, outputPath) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const body = {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.7,
            style: 0.5,
            use_speaker_boost: true
        }
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.buffer();
    await fs.writeFile(outputPath, buffer);
}

/**
 * Generate podcast audio using ElevenLabs for TTS and FFmpeg for combining segments
>>>>>>> upstream/main
 * @param {Array} podcastScript - Array of segments with speaker and text properties
 * @param {string} filename - Base filename for output
 * @returns {Promise<string>} Path to generated audio file
 */
const generatePodcastAudio = async (podcastScript, filename) => {
    try {
<<<<<<< HEAD
        // Validate input
        if (!podcastScript || !Array.isArray(podcastScript)) {
            throw new Error('Podcast script array is required');
        }
        
        // Create directory if it doesn't exist
        await createAudioDir();

        // Generate a unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeFilename = filename.replace(/[^a-zA-Z0-9]/g, '_');
        const outputPath = path.join(AUDIO_DIR, `${safeFilename}_podcast_${timestamp}.wav`);

        console.log(`Generating podcast audio with ${podcastScript.length} segments...`);

        // Get available voices and select two different ones
        const voicesCommand = `powershell -Command "Add-Type –AssemblyName System.speech; $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voices = $synthesizer.GetInstalledVoices(); $voiceNames = @(); foreach($voice in $voices) { $voiceNames += $voice.VoiceInfo.Name; } $voiceNames -join ','; $synthesizer.Dispose();"`;
        
        const { stdout: voicesOutput } = await execAsync(voicesCommand);
        const availableVoices = voicesOutput.trim().split(',');
        
        // Simple voice selection - first two available voices
        const voice1 = availableVoices[0] || 'Microsoft David Desktop';
        const voice2 = availableVoices[1] || 'Microsoft Zira Desktop';

        console.log(`Using voices: ${voice1} and ${voice2}`);

        // Create temporary directory for individual segments
        const tempDir = path.join(AUDIO_DIR, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const segmentFiles = [];

        // Generate audio for each segment with appropriate voice
        for (let i = 0; i < podcastScript.length; i++) {
            const segment = podcastScript[i];
            const speaker = segment.speaker;
            const text = segment.text;
            
            // Determine which voice to use based on speaker
            const voiceToUse = (speaker.toLowerCase().includes('b') || speaker.toLowerCase().includes('host b')) 
                ? voice2 
                : voice1;

            const segmentFile = path.join(tempDir, `segment_${i}.wav`);
            const escapedText = escapeForPowerShell(text);
            
            const segmentCommand = `powershell -Command "Add-Type –AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 0; $speak.Volume = 100; $speak.SelectVoice('${voiceToUse}'); $speak.SetOutputToWaveFile('${segmentFile}'); $speak.Speak('${escapedText}'); $speak.Dispose();"`;
            
            await execAsync(segmentCommand);
            segmentFiles.push(segmentFile);
        }

        console.log(`Generated ${segmentFiles.length} segments, combining into final podcast...`);
            
=======
        if (!podcastScript || !Array.isArray(podcastScript)) {
            throw new Error('Podcast script array is required');
        }
        await createAudioDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeFilename = filename.replace(/[^a-zA-Z0-9]/g, '_');
        const outputPath = path.join(AUDIO_DIR, `${safeFilename}_podcast_${timestamp}.mp3`);
        console.log(`Generating podcast audio with ${podcastScript.length} segments using ElevenLabs...`);
        // Create temporary directory for individual segments
        const tempDir = path.join(AUDIO_DIR, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const segmentFiles = [];
        for (let i = 0; i < podcastScript.length; i++) {
            const segment = podcastScript[i];
            const text = segment.text;
            // Choose voice based on speaker
            let speaker = segment.speaker || 'male';
            let voiceId = ELEVENLABS_MALE_VOICE;
            if (speaker.toLowerCase().includes('female') || speaker.toLowerCase().includes('host b')) {
                voiceId = ELEVENLABS_FEMALE_VOICE;
            }
            const segmentFile = path.join(tempDir, `segment_${i}.mp3`);
            await generateTTSWithElevenLabs(text, voiceId, segmentFile);
            segmentFiles.push(segmentFile);
        }
        console.log(`Generated ${segmentFiles.length} segments, combining into final podcast with FFmpeg...`);
>>>>>>> upstream/main
        // Combine all segments into one file using FFmpeg
        const fileList = path.join(tempDir, 'filelist.txt');
        const fileListContent = segmentFiles.map(file => `file '${file}'`).join('\n');
        await fs.writeFile(fileList, fileListContent);
<<<<<<< HEAD

        const combineCommand = `ffmpeg -f concat -safe 0 -i "${fileList}" -c copy "${outputPath}" -y`;
        await execAsync(combineCommand);

=======
        const combineCommand = `ffmpeg -f concat -safe 0 -i "${fileList}" -c copy "${outputPath}" -y`;
        await execAsync(combineCommand);
>>>>>>> upstream/main
        // Clean up temporary files
        await Promise.allSettled([
            ...segmentFiles.map(file => fs.unlink(file)),
            fs.unlink(fileList),
            fs.rmdir(tempDir)
        ]);
<<<<<<< HEAD

        // Verify the file was created and has content
=======
>>>>>>> upstream/main
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Generated audio file is empty (0 bytes)');
        }
<<<<<<< HEAD
        
        console.log(`✅ Podcast generated: ${path.basename(outputPath)} (${stats.size} bytes)`);
        
        // Return the full URL for the frontend
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5005';
        return `${baseUrl}/podcasts/${path.basename(outputPath)}`;

=======
        console.log(`✅ Podcast generated: ${path.basename(outputPath)} (${stats.size} bytes)`);
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5007';
        return `${baseUrl}/podcasts/${path.basename(outputPath)}`;
>>>>>>> upstream/main
    } catch (error) {
        console.error('Error in generatePodcastAudio:', error);
        throw new Error(`Audio generation failed: ${error.message}`);
    }
};

module.exports = {
    generatePodcastAudio
};