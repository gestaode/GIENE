import { spawn } from "child_process";
import { log } from "../vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make sure output directories exist
const OUTPUT_DIR = path.join(__dirname, "../../uploads/videos");
const TEMP_DIR = path.join(__dirname, "../../uploads/temp");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface VideoOptions {
  outputFileName: string;
  width?: number;
  height?: number;
  frameRate?: number;
  bitrate?: string;
}

interface AddAudioOptions {
  videoPath: string;
  audioPath: string;
  outputFileName: string;
  loop?: boolean;
}

interface ImageToVideoOptions {
  imagePaths: string[];
  outputFileName: string;
  duration?: number;
  transition?: string;
  transitionDuration?: number;
  width?: number;
  height?: number;
}

interface CombineVideosOptions {
  videoPaths: string[];
  outputFileName: string;
  transition?: string;
  transitionDuration?: number;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
}

export class FFmpegService {
  /**
   * Create video from a series of images
   */
  async createVideoFromImages(options: ImageToVideoOptions): Promise<string> {
    const {
      imagePaths,
      outputFileName,
      duration = 3,
      transition = "fade",
      transitionDuration = 0.5,
      width = 1080,
      height = 1920,
    } = options;

    if (imagePaths.length === 0) {
      throw new Error("No image paths provided");
    }

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Create a temporary file for the list of images
      const listFile = path.join(TEMP_DIR, `list_${Date.now()}.txt`);
      
      // Create the content for the list file with durations
      let listContent = "";
      for (const imagePath of imagePaths) {
        listContent += `file '${imagePath}'\nduration ${duration}\n`;
      }
      // Add the last image again (needed for the end)
      listContent += `file '${imagePaths[imagePaths.length - 1]}'`;
      
      // Write the list file
      fs.writeFileSync(listFile, listContent);
      
      // Execute FFmpeg command
      const ffmpegArgs = [
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-movflags", "+faststart",
        "-y", outputPath
      ];
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      // Clean up the list file
      fs.unlinkSync(listFile);
      
      return outputPath;
    } catch (error) {
      log(`Error creating video from images: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Add audio to video
   */
  async addAudioToVideo(options: AddAudioOptions): Promise<string> {
    const {
      videoPath,
      audioPath,
      outputFileName,
      loop = true,
    } = options;

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Get video duration
      const videoMetadata = await this.getVideoMetadata(videoPath);
      
      // Execute FFmpeg command
      const ffmpegArgs = [
        "-i", videoPath,
        "-i", audioPath,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
      ];
      
      // If loop is true, loop the audio to match the video duration
      if (loop) {
        ffmpegArgs.push(
          "-af", `aloop=loop=-1:size=2e+09,atrim=duration=${videoMetadata.duration}`
        );
      }
      
      ffmpegArgs.push(
        "-shortest",
        "-y", outputPath
      );
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      return outputPath;
    } catch (error) {
      log(`Error adding audio to video: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Combine multiple videos into one
   */
  async combineVideos(options: CombineVideosOptions): Promise<string> {
    const {
      videoPaths,
      outputFileName,
      transition = "fade",
      transitionDuration = 0.5,
    } = options;

    if (videoPaths.length === 0) {
      throw new Error("No video paths provided");
    }

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Create a temporary file for the list of videos
      const listFile = path.join(TEMP_DIR, `list_${Date.now()}.txt`);
      
      // Create the content for the list file
      let listContent = "";
      for (const videoPath of videoPaths) {
        listContent += `file '${videoPath}'\n`;
      }
      
      // Write the list file
      fs.writeFileSync(listFile, listContent);
      
      // Execute FFmpeg command
      const ffmpegArgs = [
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "medium",
        "-crf", "23",
        "-movflags", "+faststart",
        "-y", outputPath
      ];
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      // Clean up the list file
      fs.unlinkSync(listFile);
      
      return outputPath;
    } catch (error) {
      log(`Error combining videos: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Create a basic video with text overlay
   */
  async createTextVideo(text: string, options: VideoOptions): Promise<string> {
    const {
      outputFileName,
      width = 1080,
      height = 1920,
      frameRate = 30,
      bitrate = "2M",
    } = options;

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Execute FFmpeg command
      const ffmpegArgs = [
        "-f", "lavfi",
        "-i", "color=c=black:s=1080x1920:d=10",
        "-vf", `drawtext=text='${text.replace(/'/g, "'\\\\''")}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/System/Library/Fonts/Helvetica.ttc`,
        "-c:v", "libx264",
        "-t", "10",
        "-r", frameRate.toString(),
        "-b:v", bitrate,
        "-preset", "medium",
        "-crf", "23",
        "-movflags", "+faststart",
        "-y", outputPath
      ];
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      return outputPath;
    } catch (error) {
      log(`Error creating text video: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Get video metadata (duration, dimensions, etc.)
   */
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v", "error",
        "-show_entries", "format=duration:stream=width,height,codec_name",
        "-of", "json",
        videoPath
      ]);
      
      let stdoutData = "";
      let stderrData = "";
      
      ffprobe.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });
      
      ffprobe.stderr.on("data", (data) => {
        stderrData += data.toString();
      });
      
      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe process exited with code ${code}: ${stderrData}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(stdoutData);
          const streams = parsedData.streams || [];
          const format = parsedData.format || {};
          
          // Find the video stream
          const videoStream = streams.find((stream: any) => stream.codec_name && stream.width && stream.height);
          
          if (!videoStream) {
            reject(new Error("No video stream found"));
            return;
          }
          
          resolve({
            duration: parseFloat(format.duration || "0"),
            width: videoStream.width,
            height: videoStream.height,
            format: format.format_name || "",
          });
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error instanceof Error ? error.message : String(error)}`));
        }
      });
    });
  }

  /**
   * Execute FFmpeg command
   */
  private executeFFmpegCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", args);
      
      let stderrData = "";
      
      ffmpeg.stderr.on("data", (data) => {
        stderrData += data.toString();
        // Log progress for debugging
        log(data.toString().trim(), 'ffmpeg');
      });
      
      ffmpeg.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg process exited with code ${code}: ${stderrData}`));
          return;
        }
        
        resolve();
      });
    });
  }
}
