const YTDlpWrap = require("yt-dlp-wrap").default;
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ytDlpWrap = new YTDlpWrap();
const videoUrl = "https://www.youtube.com/watch?v=EerdGm-ehJQ&t=142s"; // replace with your URL

// Ask user what quality they want
rl.question("Choose quality (360 or 480): ", (quality) => {
  let format;
  if (quality === "360") {
    format = "bestvideo[height<=360]+bestaudio/best[height<=360]";
  } else if (quality === "480") {
    format = "bestvideo[height<=480]+bestaudio/best[height<=480]";
  } else {
    console.log("Invalid choice. Defaulting to 360p.");
    format = "bestvideo[height<=360]+bestaudio/best[height<=360]";
  }

  ytDlpWrap
    .exec([
      "--continue",
      "--retries", "infinite",
      "--fragment-retries", "infinite",
      "-f", format,
      "-o", "long_video.mp4",
      videoUrl
    ])
    .on("progress", (progress) => {
      console.log(
        `Progress: ${progress.percent}% | Speed: ${progress.currentSpeed} | ETA: ${progress.eta}`
      );
    })
    .on("error", (err) => console.error("❌ Error:", err))
    .on("close", () => console.log("✅ Download finished!"));

  rl.close();
});
