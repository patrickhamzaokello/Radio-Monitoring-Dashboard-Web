
export async function submitAudio(stationId: string, audioBlob: Blob){
    try {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm"); // "file" must match FastAPI's param name

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/audio-samples`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'audio/webm',
            'X-Station-ID': stationId,
          },
        });
      } catch (error) {
        console.error(`Error sending audio sample for ${stationId}:`, error);
      }
}