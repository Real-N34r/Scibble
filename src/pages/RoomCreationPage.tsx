import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { Clipboard, Play, ArrowLeft, Check, Loader2, Copy } from 'lucide-react';

const RoomCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { player, createRoom, gameState } = useGame();
  const { connected } = useSocket();
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState({
    totalPlayers: 6,
    drawTime: 60,
    totalRounds: 3,
    wordCount: 3,
    hintsCount: 2,
    customWordsOnly: false,
    customWords: ''
  });
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if no player set
  useEffect(() => {
    if (!player) {
      navigate('/');
    }
  }, [player, navigate]);

  // Navigate to room when created - FIXED: Direct navigation without additional join
  useEffect(() => {
    if (gameState.roomId && isCreating) {
      console.log('Room created successfully, navigating to room:', gameState.roomId);
      setIsCreating(false);
      // Navigate directly - host is already in the room from creation
      navigate(`/room/${gameState.roomId}`);
    }
  }, [gameState.roomId, navigate, isCreating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};
    
    if (settings.totalPlayers < 2 || settings.totalPlayers > 20) {
      newErrors.totalPlayers = 'Players must be between 2 and 20';
    }
    
    if (settings.drawTime < 15 || settings.drawTime > 240) {
      newErrors.drawTime = 'Draw time must be between 15 and 240 seconds';
    }
    
    if (settings.totalRounds < 2 || settings.totalRounds > 10) {
      newErrors.totalRounds = 'Rounds must be between 2 and 10';
    }
    
    if (settings.wordCount < 1 || settings.wordCount > 5) {
      newErrors.wordCount = 'Word count must be between 1 and 5';
    }
    
    if (settings.hintsCount < 0 || settings.hintsCount > 5) {
      newErrors.hintsCount = 'Hints must be between 0 and 5';
    }
    
    if (settings.customWordsOnly) {
      const words = settings.customWords.split(',').map(word => word.trim()).filter(Boolean);
      if (words.length < 10) {
        newErrors.customWords = 'Please enter at least 10 custom words';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateSettings() || !connected) return;
    
    console.log('Creating room with settings:', settings);
    setIsCreating(true);
    
    const customWordsList = settings.customWords
      .split(',')
      .map(word => word.trim())
      .filter(Boolean);
      
    createRoom({
      ...settings,
      customWords: customWordsList
    });
  };

  const copyRoomLink = () => {
    if (gameState.roomId) {
      const roomLink = `${window.location.origin}/room/${gameState.roomId}`;
      navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyRoomCode = () => {
    if (gameState.roomId) {
      navigator.clipboard.writeText(gameState.roomId);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (!player) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl text-gray-800">
        <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-center">Create Game Room</h1>
          <div className="w-8"></div>
        </div>

        {!connected && (
          <div className="p-6 text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-purple-600 mb-4" />
            <p className="text-gray-600">Connecting to server...</p>
          </div>
        )}

        {connected && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Total Players (2-20)
                </label>
                <input
                  type="number"
                  name="totalPlayers"
                  value={settings.totalPlayers}
                  onChange={handleInputChange}
                  min={2}
                  max={20}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.totalPlayers ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalPlayers && (
                  <p className="text-red-500 text-xs mt-1">{errors.totalPlayers}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Draw Time (15-240 seconds)
                </label>
                <input
                  type="number"
                  name="drawTime"
                  value={settings.drawTime}
                  onChange={handleInputChange}
                  min={15}
                  max={240}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.drawTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.drawTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.drawTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Total Rounds (2-10)
                </label>
                <input
                  type="number"
                  name="totalRounds"
                  value={settings.totalRounds}
                  onChange={handleInputChange}
                  min={2}
                  max={10}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.totalRounds ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalRounds && (
                  <p className="text-red-500 text-xs mt-1">{errors.totalRounds}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Words Per Round (1-5)
                </label>
                <input
                  type="number"
                  name="wordCount"
                  value={settings.wordCount}
                  onChange={handleInputChange}
                  min={1}
                  max={5}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.wordCount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.wordCount && (
                  <p className="text-red-500 text-xs mt-1">{errors.wordCount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Number of Hints (0-5)
                </label>
                <input
                  type="number"
                  name="hintsCount"
                  value={settings.hintsCount}
                  onChange={handleInputChange}
                  min={0}
                  max={5}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.hintsCount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hintsCount && (
                  <p className="text-red-500 text-xs mt-1">{errors.hintsCount}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="customWordsOnly"
                  name="customWordsOnly"
                  checked={settings.customWordsOnly}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="customWordsOnly" className="ml-2 text-sm font-medium">
                  Use Custom Words Only
                </label>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2">
                Custom Words (comma-separated)
              </label>
              <textarea
                name="customWords"
                value={settings.customWords}
                onChange={handleInputChange}
                placeholder="apple, banana, car, dog, elephant, flower, guitar, house, igloo, jacket"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] ${
                  errors.customWords ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customWords && (
                <p className="text-red-500 text-xs mt-1">{errors.customWords}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {settings.customWordsOnly
                  ? 'Enter at least 10 words, separated by commas'
                  : 'Optional: Add your own words to the default word list'}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !connected}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Creating Room...
                  </>
                ) : (
                  'Create Room'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomCreationPage;