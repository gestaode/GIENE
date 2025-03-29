import { log } from "../vite";

const PEXELS_API_URL = "https://api.pexels.com/v1";
const PEXELS_VIDEOS_API_URL = "https://api.pexels.com/videos";

interface PexelsPhotoResult {
  id: number;
  width: number;
  height: number;
  url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  photographer: string;
  photographer_url: string;
  avg_color: string;
  alt: string;
}

interface PexelsPhotosResponse {
  page: number;
  per_page: number;
  photos: PexelsPhotoResult[];
  total_results: number;
  next_page: string;
}

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

interface PexelsVideoResult {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

interface PexelsVideosResponse {
  page: number;
  per_page: number;
  videos: PexelsVideoResult[];
  total_results: number;
  next_page: string;
}

export class PexelsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for photos based on query
   */
  async searchPhotos(query: string, perPage: number = 10, page: number = 1): Promise<PexelsPhotosResponse> {
    try {
      const params = new URLSearchParams({
        query,
        per_page: perPage.toString(),
        page: page.toString(),
      });

      const response = await fetch(`${PEXELS_API_URL}/search?${params.toString()}`, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      log(`Error searching Pexels photos: ${error instanceof Error ? error.message : String(error)}`, 'pexels');
      throw error;
    }
  }

  /**
   * Search for videos based on query
   */
  async searchVideos(query: string, perPage: number = 10, page: number = 1): Promise<PexelsVideosResponse> {
    try {
      const params = new URLSearchParams({
        query,
        per_page: perPage.toString(),
        page: page.toString(),
      });

      const response = await fetch(`${PEXELS_VIDEOS_API_URL}/search?${params.toString()}`, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      log(`Error searching Pexels videos: ${error instanceof Error ? error.message : String(error)}`, 'pexels');
      throw error;
    }
  }

  /**
   * Get a specific photo by ID
   */
  async getPhoto(photoId: number): Promise<PexelsPhotoResult> {
    try {
      const response = await fetch(`${PEXELS_API_URL}/photos/${photoId}`, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      log(`Error getting Pexels photo: ${error instanceof Error ? error.message : String(error)}`, 'pexels');
      throw error;
    }
  }

  /**
   * Get a specific video by ID
   */
  async getVideo(videoId: number): Promise<PexelsVideoResult> {
    try {
      const response = await fetch(`${PEXELS_VIDEOS_API_URL}/videos/${videoId}`, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      log(`Error getting Pexels video: ${error instanceof Error ? error.message : String(error)}`, 'pexels');
      throw error;
    }
  }
}
