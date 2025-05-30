class AIProcessor {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = 'AIzaSyDRy9DVq-2RO6dcUBnRnc9tu3do6BFURB4';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  private needsVision(text: string): boolean {
    const visionKeywords = [
      'see', 'look', 'what', 'how', 'describe', 'color', 'wearing', 'holding',
      'picture', 'image', 'show', 'visible', 'appearance', 'behind', 'front',
      'left', 'right', 'above', 'below', 'around', 'gesture', 'posture',
      'expression', 'face', 'hand', 'object', 'room', 'background', 'doing',
      'reading', 'watching', 'identify', 'recognize', 'analyze', 'observe'
    ];
    
    const lowerText = text.toLowerCase();
    return visionKeywords.some(keyword => lowerText.includes(keyword));
  }

  async processLiveFrame(imageData: string): Promise<void> {
    try {
      console.log('Processing live frame for gesture analysis');
      
      const url = `${this.baseUrl}/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      
      let base64Data;
      if (imageData.startsWith('blob:')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        base64Data = imageData.split(',')[1];
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this live camera frame and describe any gestures, hand movements, or body language you observe. Be very brief (1-2 sentences max). If no clear gestures are visible, just say 'No clear gestures detected'."
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        console.error('Live frame analysis failed:', response.status);
        return;
      }

      const data = await response.json();
      const gestureDescription = data.candidates?.[0]?.content?.parts?.[0]?.text || "No gesture analysis available";
      
      console.log('Gesture analysis result:', gestureDescription);
      
      // Only speak if there's a meaningful gesture detected
      if (!gestureDescription.toLowerCase().includes('no clear gestures') && 
          !gestureDescription.toLowerCase().includes('no gestures')) {
        this.speakText(gestureDescription);
      }
      
    } catch (error) {
      console.error('Live frame processing error:', error);
    }
  }

  async processMessage(userMessage: string, imageData?: string | null, uploadedFiles?: any[]): Promise<string> {
    try {
      console.log('Processing message:', userMessage);
      console.log('Image data available:', !!imageData);
      console.log('Uploaded files:', uploadedFiles?.length || 0);
      console.log('Needs vision:', this.needsVision(userMessage));
      
      const useVision = this.needsVision(userMessage) && imageData;
      const hasUploadedImages = uploadedFiles?.some(f => f.type === 'image');
      
      if (useVision && imageData) {
        console.log('Using vision API with camera');
        return await this.processWithVision(userMessage, imageData, uploadedFiles);
      } else if (hasUploadedImages && this.needsVision(userMessage)) {
        console.log('Using vision API with uploaded image');
        const imageFile = uploadedFiles?.find(f => f.type === 'image');
        return await this.processWithVision(userMessage, imageFile?.url, uploadedFiles);
      } else if (uploadedFiles && uploadedFiles.length > 0) {
        console.log('Using text-only API with file context');
        return await this.processWithFiles(userMessage, uploadedFiles);
      } else {
        console.log('Using text-only API');
        return await this.processTextOnly(userMessage);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  private async processWithFiles(text: string, files: any[]): Promise<string> {
    const url = `${this.baseUrl}/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    
    let fileContext = "You have access to the following uploaded files. Analyze their content and provide detailed insights:\n\n";
    
    files.forEach((file, index) => {
      fileContext += `File ${index + 1}: ${file.file.name} (${file.type.toUpperCase()})\n`;
      if (file.content) {
        fileContext += `Content: ${file.content}\n`;
      }
      if (file.type === 'image') {
        fileContext += `This is an image file that you can analyze if the user asks about visual content.\n`;
      }
      if (file.type === 'pdf') {
        fileContext += `This is a PDF document. Extract and analyze its text content to answer questions.\n`;
      }
      fileContext += "\n";
    });
    
    const systemPrompt = `You are NEXUS AI by Sham, an advanced AI assistant. You excel at analyzing uploaded files and providing comprehensive insights. When users upload files:

1. For images: Describe what you see, analyze visual elements, identify objects, text, people, etc.
2. For PDFs: Extract key information, summarize content, answer questions about the document
3. Always be specific and detailed in your analysis
4. Reference the file by name when discussing it
5. If asked about specific details, search through the file content thoroughly

${fileContext}

User question: ${text}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't analyze the uploaded files properly.";
    
    this.speakText(aiResponse);
    return aiResponse;
  }

  private async processTextOnly(text: string): Promise<string> {
    const url = `${this.baseUrl}/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    
    console.log('Making text-only API request to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are NEXUS AI by Sham, an advanced AI assistant with a futuristic personality. You are helpful, intelligent, and slightly witty. Keep responses concise but engaging. User message: ${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    console.log('Text-only API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Text-only API response data:', data);
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
    
    this.speakText(aiResponse);
    return aiResponse;
  }

  private async processWithVision(text: string, imageData: string, uploadedFiles?: any[]): Promise<string> {
    const url = `${this.baseUrl}/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    
    console.log('Making vision API request to:', url);
    
    let base64Data;
    if (imageData.startsWith('blob:')) {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const reader = new FileReader();
      base64Data = await new Promise((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      base64Data = imageData.split(',')[1];
    }
    
    let contextText = `You are NEXUS AI by Sham, an advanced AI assistant with vision capabilities. Analyze the image in detail and provide comprehensive insights.`;
    
    if (uploadedFiles && uploadedFiles.length > 0) {
      contextText += " Additional context from uploaded files: ";
      uploadedFiles.forEach(file => {
        contextText += `${file.file.name} (${file.type}), `;
      });
    }
    
    contextText += ` User request: ${text}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: contextText
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    console.log('Vision API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API Error Response:', errorText);
      throw new Error(`Vision API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Vision API response data:', data);
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't analyze the image.";
    
    this.speakText(aiResponse);
    return aiResponse;
  }

  private speakText(text: string): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Samantha')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        console.log('Speech synthesis started');
        window.dispatchEvent(new CustomEvent('ai-speaking-start'));
      };

      utterance.onend = () => {
        console.log('Speech synthesis ended');
        window.dispatchEvent(new CustomEvent('ai-speaking-end'));
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        window.dispatchEvent(new CustomEvent('ai-speaking-end'));
      };

      speechSynthesis.speak(utterance);
    }
  }
}

export default AIProcessor;
