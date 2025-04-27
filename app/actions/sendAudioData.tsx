'use server'

export async function submitAudio(formData: FormData) {
  const stationId = formData.get('stationId') as string;
  
  try {
    const response = await fetch('http://localhost:8000/audio-samples', {
      method: 'POST',
      body: formData, 
     
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error sending audio sample for ${stationId}:`, error);
    return { success: false, error };
  }
}