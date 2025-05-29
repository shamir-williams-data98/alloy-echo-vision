
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Camera, CameraOff, Volume2, VolumeX } from 'lucide-react';
import WebcamCapture from '@/components/WebcamCapture';
import VoiceControls from '@/components/VoiceControls';
import ChatDisplay from '@/components/ChatDisplay';
import AIProcessor from '@/components/AIProcessor';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: number;
  hasImage?: boolean;
  hasFiles?: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  type: 'image' | 'pdf' | 'other';
  url?: string;
  content?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m NEXUS AI by Sham, your advanced assistant. I can see through your camera, analyze uploaded files (images & PDFs), and respond with voice. Ask me anything!',
      type: 'assistant',
      timestamp: Date.now()
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const webcamRef = useRef<any>(null);

  useEffect(() => {
    const handleSpeakingStart = () => setIsSpeaking(true);
    const handleSpeakingEnd = () => setIsSpeaking(false);

    window.addEventListener('ai-speaking-start', handleSpeakingStart);
    window.addEventListener('ai-speaking-end', handleSpeakingEnd);

    return () => {
      window.removeEventListener('ai-speaking-start', handleSpeakingStart);
      window.removeEventListener('ai-speaking-end', handleSpeakingEnd);
    };
  }, []);

  const addMessage = useCallback((text: string, type: 'user' | 'assistant', hasImage?: boolean, hasFiles?: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: Date.now(),
      hasImage,
      hasFiles
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleFileUploaded = useCallback((file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleUserMessage = useCallback(async (userText: string) => {
    console.log('User message received:', userText);
    const hasFiles = uploadedFiles.length > 0;
    addMessage(userText, 'user', false, hasFiles);
    
    const aiProcessor = new AIProcessor();
    
    let imageData = null;
    const needsVision = /\b(see|look|what|how|describe|color|wearing|holding|picture|image|show|visible|appearance|behind|front|left|right|above|below|around|gesture|posture|expression|face|hand|object|room|background|doing|reading|watching|identify|recognize|analyze|observe)\b/i.test(userText);
    
    if (cameraEnabled && needsVision && webcamRef.current) {
      console.log('Capturing image for vision request');
      imageData = webcamRef.current.captureImage();
      setCurrentImage(imageData);
    }

    const response = await aiProcessor.processMessage(userText, imageData, uploadedFiles);
    
    addMessage(response, 'assistant', !!imageData, hasFiles);
  }, [addMessage, cameraEnabled, uploadedFiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 md:w-64 md:h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute bottom-0 left-1/3 w-32 h-32 md:w-64 md:h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        {/* Header - Fixed height with proper spacing */}
        <div className="text-center py-3 md:py-4 px-3 md:px-4 flex-shrink-0">
          <div className="max-w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2 leading-tight">
              NEXUS
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-cyan-300 mb-1 leading-tight">
              by <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">SHAM</span>
            </p>
            <p className="text-xs md:text-sm text-gray-300 leading-tight">
              Advanced AI Assistant with Voice, Vision & File Analysis
            </p>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-4 px-3 md:px-4 pb-3 md:pb-4 min-h-0 overflow-hidden">
          {/* Webcam Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1 h-48 sm:h-56 md:h-64 lg:h-auto">
            <Card className="h-full bg-gray-900/50 border-gray-700 backdrop-blur-sm overflow-hidden">
              <div className="p-3 md:p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="text-sm md:text-lg font-semibold text-cyan-400">Vision</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs md:text-sm"
                  >
                    {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex-1 min-h-0">
                  <WebcamCapture 
                    ref={webcamRef}
                    enabled={cameraEnabled}
                    onImageCapture={setCurrentImage}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2 order-1 lg:order-2 flex-1 flex flex-col min-h-0">
            <Card className="h-full bg-gray-900/50 border-gray-700 backdrop-blur-sm flex flex-col min-h-0 overflow-hidden">
              <div className="p-3 md:p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-sm md:text-lg font-semibold text-cyan-400">Conversation</h3>
              </div>
              
              <div className="flex-1 overflow-hidden min-h-0">
                <ChatDisplay messages={messages} />
              </div>

              <div className="p-3 md:p-4 border-t border-gray-700 flex-shrink-0">
                <VoiceControls
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onUserMessage={handleUserMessage}
                  onListeningChange={setIsListening}
                  onSpeakingChange={setIsSpeaking}
                  uploadedFiles={uploadedFiles}
                  onFileUploaded={handleFileUploaded}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-20">
          {isListening && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-xs text-red-300">Listening...</span>
              </div>
            </div>
          )}
          
          {isSpeaking && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-xs text-blue-300">Speaking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
