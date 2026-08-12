export default async function handler(req: any, res: any) {
  try {
    const { url, format = "MP4 Video" } = req.body || {};
    if (!url || !url.includes("instagram.com")) {
      return res.status(400).json({ error: "Please enter a valid Instagram post or reel URL" });
    }

    const isImage = format === "High-Res Image";
    setTimeout(() => {
      res.status(200).json({
        success: true,
        format,
        author: "@schrodingerai.official",
        caption: "Automating content creation like a breeze 🚀 #SchrodingerAi #AIStudio #CreatorTools",
        likes: "18.4K",
        views: "142.9K",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        downloadUrl: isImage
          ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80"
          : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        mediaType: isImage ? "image" : "video",
        message: `Instagram ${isImage ? "photo" : "video"} asset ready for high-resolution download (demo)`,
      });
    }, 900);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to extract Instagram media" });
  }
}
