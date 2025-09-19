import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { trackEvent } from '../analytics';

const MathGame = () => {
  // Game settings
  const [settings, setSettings] = useState({
    minNumber: 1,
    maxNumber: 10,
    maxResult: 100,
    allowNegativeResult: false,
    operations: {
      addition: true,
      subtraction: true,
      multiplication: false,
      division: false,
    },
    problemCount: 5,
  });

  // Game state
  const [gameState, setGameState] = useState('setup'); // setup, playing, finished
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState([]);
  const [showCorrectProblems, setShowCorrectProblems] = useState(false);
  
  // Reference for the answer input field
  const answerInputRef = useRef(null);

  // Focus the input field when a new problem is loaded
  useEffect(() => {
    if (gameState === 'playing' && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [currentProblem, gameState]);

  // Generate a random problem based on settings
  const generateProblem = () => {
    const operations = [];
    if (settings.operations.addition) operations.push('+');
    if (settings.operations.subtraction) operations.push('-');
    if (settings.operations.multiplication) operations.push('*');
    if (settings.operations.division) operations.push('/');

    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, result;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      num1 = Math.floor(Math.random() * (settings.maxNumber - settings.minNumber + 1)) + settings.minNumber;
      num2 = Math.floor(Math.random() * (settings.maxNumber - settings.minNumber + 1)) + settings.minNumber;
      
      if (operation === '+') {
        result = num1 + num2;
      } else if (operation === '-') {
        result = num1 - num2;
      } else if (operation === '*') {
        result = num1 * num2;
      } else if (operation === '/') {
        // Ensure division problems result in whole numbers
        num2 = Math.max(1, num2);
        num1 = num2 * (Math.floor(Math.random() * Math.min(settings.maxNumber, Math.floor(settings.maxResult / num2))) + 1);
        result = num1 / num2;
      }
      
      attempts++;
    } while (
      attempts < maxAttempts && 
      (Math.abs(result) > settings.maxResult || 
       (!settings.allowNegativeResult && result < 0))
    );

    // If we couldn't generate a valid problem after many attempts, fall back to a simple one
    if (attempts >= maxAttempts) {
      if (operation === '+') {
        num1 = settings.minNumber;
        num2 = settings.minNumber;
        result = num1 + num2;
      } else if (operation === '-') {
        if (settings.allowNegativeResult) {
          num1 = settings.minNumber;
          num2 = settings.maxNumber;
          result = num1 - num2;
        } else {
          num1 = settings.maxNumber;
          num2 = settings.minNumber;
          result = num1 - num2;
        }
      } else if (operation === '*') {
        num1 = settings.minNumber;
        num2 = settings.minNumber;
        result = num1 * num2;
      } else if (operation === '/') {
        num2 = settings.minNumber;
        num1 = num2;
        result = num1 / num2;
      }
    }

    return {
      num1,
      num2,
      operation,
      answer: result,
    };
  };

  // Start the game
  const startGame = () => {
    console.log('Starting game with settings:', settings);
    const newProblems = Array(settings.problemCount)
      .fill(null)
      .map(() => generateProblem());
    setProblems(newProblems);
    setCurrentProblem(0);
    const now = Date.now();
    setStartTime(now);
    setProblemStartTime(now);
    setAnswers(Array(settings.problemCount).fill(''));
    setResults([]);
    setGameState('playing');
    
    // Track game start
    console.log('About to track game_start event');
    trackEvent('game_start', 'Game', `${settings.problemCount} problems`, settings.problemCount);
    console.log('Game start event tracked');
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (answers[currentProblem] === '') return;

    const currentAnswer = parseFloat(answers[currentProblem]);
    const isCorrect = Math.abs(currentAnswer - problems[currentProblem].answer) < 0.001;
    
    const newResults = [...results, {
      problem: problems[currentProblem],
      userAnswer: currentAnswer,
      isCorrect,
      timeTaken: Date.now() - problemStartTime
    }];
    
    setResults(newResults);

    if (currentProblem < problems.length - 1) {
      setCurrentProblem(curr => curr + 1);
      setProblemStartTime(Date.now());
    } else {
      setGameState('finished');
      
      // Track game completion
      console.log('Game finished, tracking completion events');
      const correctAnswers = newResults.filter(r => r.isCorrect).length;
      const totalTime = newResults.reduce((sum, result) => sum + result.timeTaken, 0);
      const score = Math.round((correctAnswers / newResults.length) * 100);
      
      console.log('Game completion stats:', { correctAnswers, totalTime, score });
      trackEvent('game_completed', 'Game', `Score: ${score}%`, score);
      trackEvent('game_performance', 'Game', `${correctAnswers}/${newResults.length} correct`, correctAnswers);
      trackEvent('game_time', 'Game', `${Math.round(totalTime / 1000)}s total`, Math.round(totalTime / 1000));
      console.log('All completion events tracked');
    }
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOperationToggle = (operation) => {
    setSettings(prev => ({
      ...prev,
      operations: {
        ...prev.operations,
        [operation]: !prev.operations[operation]
      }
    }));
  };

  // Handle keypress events
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameState === 'playing' && answers[currentProblem] !== '') {
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Math Practice Game</CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'setup' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Number</Label>
                <Input
                  type="number"
                  value={settings.minNumber}
                  onChange={(e) => handleSettingsChange('minNumber', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Maximum Number</Label>
                <Input
                  type="number"
                  value={settings.maxNumber}
                  onChange={(e) => handleSettingsChange('maxNumber', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div>
              <Label>Max Result</Label>
              <Input
                type="number"
                value={settings.maxResult}
                onChange={(e) => handleSettingsChange('maxResult', parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.allowNegativeResult}
                onCheckedChange={(checked) => handleSettingsChange('allowNegativeResult', checked)}
              />
              <Label>Allow negative result</Label>
            </div>
            
            <div>
              <Label>Number of Problems</Label>
              <Input
                type="number"
                value={settings.problemCount}
                onChange={(e) => handleSettingsChange('problemCount', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Operations</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(settings.operations).map(([op, checked]) => {
                  const labels = {
                    addition: 'Addition (+)',
                    subtraction: 'Subtraction (-)',
                    multiplication: 'Multiplication (×)',
                    division: 'Division (÷)'
                  };
                  return (
                    <div key={op} className="flex items-center space-x-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => handleOperationToggle(op)}
                      />
                      <Label>{labels[op]}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={startGame}
              disabled={!Object.values(settings.operations).some(Boolean)}
            >
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'playing' && problems[currentProblem] && (
          <div className="space-y-4">
            <div className="text-2xl text-center">
              {problems[currentProblem].num1} {problems[currentProblem].operation} {problems[currentProblem].num2} = ?
            </div>
            
            <Input
              ref={answerInputRef}
              type="number"
              value={answers[currentProblem]}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[currentProblem] = e.target.value;
                setAnswers(newAnswers);
              }}
              onKeyPress={handleKeyPress}
              className="text-xl text-center"
            />
            
            <Button 
              className="w-full"
              onClick={handleSubmit}
              disabled={answers[currentProblem] === ''}
            >
              Submit Answer (or press Enter)
            </Button>
            
            <div className="text-sm text-center">
              Problem {currentProblem + 1} of {problems.length}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Results</h3>
            
            {/* Show "All correct!" message if all problems are correct */}
            {results.every(r => r.isCorrect) && (
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-800 mb-2">🎉 All correct! Well done! 🎉</div>
                <div className="text-green-700">Perfect score!</div>
              </div>
            )}
            
            {/* Toggle for showing correct problems */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={showCorrectProblems}
                onCheckedChange={setShowCorrectProblems}
              />
              <Label>Show correct problems</Label>
            </div>
            
            <div className="space-y-2">
              {results
                .filter(result => !result.isCorrect || showCorrectProblems)
                .map((result, index) => {
                  // Find the original index for the key
                  const originalIndex = results.findIndex(r => r === result);
                  return (
                    <div 
                      key={originalIndex}
                      className={`p-2 rounded ${result.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
                    >
                      {result.problem.num1} {result.problem.operation} {result.problem.num2} = {result.userAnswer}
                      <div className="text-sm">
                        {result.isCorrect ? 'Correct' : `Incorrect (correct answer: ${result.problem.answer})`}
                        <br />
                        Time: {(result.timeTaken / 1000).toFixed(1)}s
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="font-bold mt-4">
              Score: {results.filter(r => r.isCorrect).length} / {results.length}
              <br />
              Total Time: {(results.reduce((sum, result) => sum + result.timeTaken, 0) / 1000).toFixed(1)}s
            </div>
            
            <Button className="w-full" onClick={() => {
              setGameState('setup');
              trackEvent('play_again', 'Game', 'User clicked play again');
            }}>
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MathGame;
