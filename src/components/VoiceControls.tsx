import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Send, Square, Plus, Upload, X, File, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UploadedFile {
  id: string;
  file: File;
  type: 'image' | 'pdf' | 'other';
  url?: string;
  content?: string;
}

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  onUserMessage: (message: string) => void;
  onListeningChange: (listening: boolean) => void;
  onSpeakingChange: (speaking: boolean) => void;
  uploadedFiles?: UploadedFile[];
  onFileUploaded?: (file: UploadedFile) => void;
  onRemoveFile?: (id: string) => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  isSpeaking,
  onUserMessage,
  onListeningChange,
  onSpeakingChange,
  uploadedFiles = [],
  onFileUploaded,
  onRemoveFile
}) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (SpeechRecognition) {
      console.log('Initializing speech recognition');
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setSpeechError('');
        onListeningChange(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        const transcript = event.results[0][0].transcript;
        console.log('Transcript:', transcript);
        onUserMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        onListeningChange(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        onListeningChange(false);
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Check your connection.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech service not allowed.';
            break;
          default:
            errorMessage = `Speech error: ${event.error}`;
        }
        setSpeechError(errorMessage);
      };
    } else {
      console.log('Speech recognition not supported');
      setSpeechError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onListeningChange, onUserMessage]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition not available');
      return;
    }

    try {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        onSpeakingChange(false);
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone permission granted');
        } catch (err) {
          console.error('Microphone permission denied:', err);
          setSpeechError('Microphone access denied. Please allow microphone permissions.');
          return;
        }
      }
      
      if (!isRecording) {
        console.log('Starting speech recognition');
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setSpeechError('Failed to start speech recognition');
    }
  }, [isRecording, onSpeakingChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      onSpeakingChange(false);
    }
  }, [onSpeakingChange]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onFileUploaded) return;

    setIsProcessing(true);
    
    try {
      const fileType = getFileType(file);
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        file,
        type: fileType
      };

      if (fileType === 'image') {
        uploadedFile.url = URL.createObjectURL(file);
      } else if (fileType === 'pdf') {
        uploadedFile.content = `PDF file: ${file.name}`;
      }

      onFileUploaded(uploadedFile);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileType = (file: File): 'image' | 'pdf' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-3 h-3" />;
      case 'pdf':
        return <File className="w-3 h-3" />;
      default:
        return <File className="w-3 h-3" />;
    }
  };

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onUserMessage(textInput.trim());
      setTextInput('');
    }
  }, [textInput, onUserMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  const isMicSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Voice Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {isMicSupported ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={isRecording ? stopListening : startListening}
                className={`relative overflow-hidden transition-all duration-300 text-xs md:text-sm px-2 py-1 md:px-4 md:py-2 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 border-red-500 shadow-lg shadow-red-500/25' 
                    : 'bg-cyan-600 hover:bg-cyan-700 border-cyan-500 shadow-lg shadow-cyan-500/25'
                }`}
                size="sm"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Stop</span>
                    <div className="absolute inset-0 bg-red-400/20 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Speak</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRecording ? 'Stop listening' : 'Start voice input'}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="text-xs text-gray-400">Mic not supported</div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
              disabled={isProcessing}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline ml-1">Files</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload images or PDF files</p>
          </TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isSpeaking && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={stopSpeaking}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1 md:px-3 md:py-2"
              >
                <Square className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop AI speech</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-2 bg-gray-800/50 border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(uploadedFile.type)}
                  <span className="text-xs text-gray-300 truncate">
                    {uploadedFile.file.name}
                  </span>
                  <span className="text-xs text-cyan-400 px-1 bg-cyan-400/20 rounded">
                    {uploadedFile.type.toUpperCase()}
                  </span>
                </div>
                <Button
                  onClick={() => onRemoveFile?.(uploadedFile.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Speech Error Display */}
      {speechError && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded px-2 py-1">
          {speechError}
        </div>
      )}

      {/* Text Input */}
      <div className="flex gap-1 md:gap-2">
        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 text-xs md:text-sm h-8 md:h-10"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 border-cyan-500 px-2 md:px-3 h-8 md:h-10"
              size="sm"
            >
              <Send className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send message</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default VoiceControls;
