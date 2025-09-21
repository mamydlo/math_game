import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select';
import { trackEvent } from '../analytics';
import { useTranslation } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

const MathGame = () => {
  const { t } = useTranslation();
  // Game settings
  const [settings, setSettings] = useState({
    minNumber: 1,
    maxNumber: 10,
    maxResult: 100,
    allowNegativeResult: false,
    operandCount: 2,
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
  
  // Validation state
  const [maxResultError, setMaxResultError] = useState(false);
  const [minMaxNumberError, setMinMaxNumberError] = useState(false);
  const [problemCountError, setProblemCountError] = useState(false);
  
  // Reference for the answer input field
  const answerInputRef = useRef(null);

  // Helper function to safely convert settings to numbers
  const getNumericSetting = (value, defaultValue = 0) => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Validation function to check all settings
  const validateSettings = (settingsToValidate = settings) => {
    // Max result validation
    const maxResultValue = typeof settingsToValidate.maxResult === 'string' ? parseInt(settingsToValidate.maxResult) : settingsToValidate.maxResult;
    const maxResultInvalid = settingsToValidate.maxResult === '' || settingsToValidate.maxResult === '-' || isNaN(maxResultValue) || maxResultValue < 1;
    
    // Min/Max number validation
    const minNum = getNumericSetting(settingsToValidate.minNumber, 1);
    const maxNum = getNumericSetting(settingsToValidate.maxNumber, 10);
    const minMaxInvalid = (settingsToValidate.minNumber !== '' && settingsToValidate.minNumber !== '-' && 
                          settingsToValidate.maxNumber !== '' && settingsToValidate.maxNumber !== '-' && 
                          !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum);
    
    // Problem count validation
    const problemCountValue = getNumericSetting(settingsToValidate.problemCount, 5);
    const problemCountInvalid = settingsToValidate.problemCount === '' || settingsToValidate.problemCount === '-' || isNaN(problemCountValue) || problemCountValue < 1;
    
    setMaxResultError(maxResultInvalid);
    setMinMaxNumberError(minMaxInvalid);
    setProblemCountError(problemCountInvalid);
    
    return {
      maxResultInvalid,
      minMaxInvalid,
      problemCountInvalid,
      hasAnyError: maxResultInvalid || minMaxInvalid || problemCountInvalid
    };
  };

  // Focus the input field when a new problem is loaded
  useEffect(() => {
    if (gameState === 'playing' && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [currentProblem, gameState]);

  // Initial validation of all settings
  useEffect(() => {
    validateSettings();
  }, [settings]);

  // Evaluate expression following order of operations (PEMDAS/BODMAS)
  const evaluateExpression = (operands, operations) => {
    // Create a copy of operands and operations to avoid modifying the original
    let nums = [...operands];
    let ops = [...operations];
    
    // First pass: Handle multiplication and division (left to right)
    for (let i = 0; i < ops.length; i++) {
      if (ops[i] === '*' || ops[i] === '/') {
        let result;
        if (ops[i] === '*') {
          result = nums[i] * nums[i + 1];
        } else { // division
          result = nums[i] / nums[i + 1];
        }
        
        // Replace the two operands and operator with the result
        nums.splice(i, 2, result);
        ops.splice(i, 1);
        i--; // Adjust index since we removed elements
      }
    }
    
    // Second pass: Handle addition and subtraction (left to right)
    for (let i = 0; i < ops.length; i++) {
      let result;
      if (ops[i] === '+') {
        result = nums[i] + nums[i + 1];
      } else { // subtraction
        result = nums[i] - nums[i + 1];
      }
      
      // Replace the two operands and operator with the result
      nums.splice(i, 2, result);
      ops.splice(i, 1);
      i--; // Adjust index since we removed elements
    }
    
    return nums[0];
  };

  // Generate a random problem based on settings
  const generateProblem = () => {
    const availableOperations = [];
    if (settings.operations.addition) availableOperations.push('+');
    if (settings.operations.subtraction) availableOperations.push('-');
    if (settings.operations.multiplication) availableOperations.push('*');
    if (settings.operations.division) availableOperations.push('/');

    let attempts = 0;
    const maxAttempts = 1000;
    let operands, operations, result;

    do {
      // Generate operations first (one less than operand count)
      operations = [];
      for (let i = 0; i < settings.operandCount - 1; i++) {
        operations.push(availableOperations[Math.floor(Math.random() * availableOperations.length)]);
      }

      // Generate operands within the specified range
      operands = [];
      const minNum = getNumericSetting(settings.minNumber, 1);
      const maxNum = getNumericSetting(settings.maxNumber, 10);
      for (let i = 0; i < settings.operandCount; i++) {
        operands.push(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
      }

      // Special handling for divisions to ensure whole number results
      for (let i = 0; i < operations.length; i++) {
        if (operations[i] === '/') {
          // Avoid division by zero
          if (operands[i + 1] === 0) {
            operands[i + 1] = 1;
          }
          
          // Make sure the dividend is divisible by the divisor
          const remainder = operands[i] % operands[i + 1];
          if (remainder !== 0) {
            // Adjust the dividend to be divisible by the divisor
            operands[i] = operands[i] - remainder;
            // Ensure it's not below minimum
            if (operands[i] < minNum) {
              operands[i] = operands[i + 1] * Math.ceil(minNum / operands[i + 1]);
            }
          }
        }
      }

      // Calculate the result using proper order of operations
      result = evaluateExpression(operands, operations);

      // Validation checks
      const maxRes = getNumericSetting(settings.maxResult, 100);
      const isValid = 
        Number.isInteger(result) &&
        Math.abs(result) <= maxRes &&
        (settings.allowNegativeResult || result >= 0) &&
        operands.every(op => op >= minNum && op <= maxNum);

      if (isValid) {
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    // If we couldn't generate a valid problem after many attempts, fall back to a simple one
    if (attempts >= maxAttempts) {
      const fallbackNum = getNumericSetting(settings.minNumber, 1);
      operands = [fallbackNum, fallbackNum];
      operations = ['+'];
      for (let i = 2; i < settings.operandCount; i++) {
        operands.push(fallbackNum);
        operations.push('+');
      }
      result = fallbackNum * settings.operandCount;
    }

    return {
      operands,
      operations,
      answer: result,
    };
  };

  // Test function to verify mathematical correctness (for debugging)
  const testMathematicalCorrectness = () => {
    console.log('=== Testing Mathematical Correctness ===');
    for (let i = 0; i < 10; i++) {
      const problem = generateProblem();
      const { operands, operations, answer } = problem;
      
      // Create expression string for verification
      let expression = operands[0].toString();
      for (let j = 0; j < operations.length; j++) {
        expression += ` ${operations[j]} ${operands[j + 1]}`;
      }
      
      // Calculate using our function
      const calculatedAnswer = evaluateExpression(operands, operations);
      
      // Verify with JavaScript eval (for comparison only)
      let evalExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
      const evalAnswer = eval(evalExpression);
      
      console.log(`Problem ${i + 1}: ${expression}`);
      console.log(`  Our answer: ${answer}`);
      console.log(`  Calculated: ${calculatedAnswer}`);
      console.log(`  JS eval: ${evalAnswer}`);
      console.log(`  Match: ${answer === calculatedAnswer && calculatedAnswer === evalAnswer ? '✅' : '❌'}`);
      console.log('---');
    }
  };

  // Start the game
  const startGame = () => {
    console.log('Starting game with settings:', settings);
    
    // Test mathematical correctness in development
    if (process.env.NODE_ENV === 'development') {
      testMathematicalCorrectness();
    }
    
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
    const newSettings = {
      ...settings,
      [field]: value
    };
    
    setSettings(newSettings);
    
    // Validate all settings with the new value
    validateSettings(newSettings);
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
        <CardTitle>{t('gameTitle')}</CardTitle>
        {gameState === 'setup' && <LanguageSelector />}
      </CardHeader>
      <CardContent>
        {gameState === 'setup' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('minNumber')}</Label>
                <Input
                  type="number"
                  value={settings.minNumber}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '' || inputValue === '-') {
                      handleSettingsChange('minNumber', inputValue);
                    } else {
                      const numValue = parseInt(inputValue);
                      if (!isNaN(numValue)) {
                        handleSettingsChange('minNumber', numValue);
                      }
                    }
                  }}
                />
              </div>
              <div>
                <Label>{t('maxNumber')}</Label>
                <Input
                  type="number"
                  value={settings.maxNumber}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '' || inputValue === '-') {
                      handleSettingsChange('maxNumber', inputValue);
                    } else {
                      const numValue = parseInt(inputValue);
                      if (!isNaN(numValue)) {
                        handleSettingsChange('maxNumber', numValue);
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div>
              <Label>{t('maxResult')}</Label>
              <Input
                type="number"
                value={settings.maxResult}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || inputValue === '-') {
                    handleSettingsChange('maxResult', inputValue);
                  } else {
                    const numValue = parseInt(inputValue);
                    if (!isNaN(numValue)) {
                      handleSettingsChange('maxResult', numValue);
                    }
                  }
                }}
              />
            </div>
            
            <div>
              <Label>{t('numberOfOperands')}</Label>
              <Select 
                value={settings.operandCount.toString()} 
                onChange={(e) => handleSettingsChange('operandCount', parseInt(e.target.value))}
              >
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.allowNegativeResult}
                onCheckedChange={(checked) => handleSettingsChange('allowNegativeResult', checked)}
              />
              <Label>{t('allowNegativeResult')}</Label>
            </div>
            
            <div>
              <Label>{t('numberOfProblems')}</Label>
              <Input
                type="number"
                value={settings.problemCount}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || inputValue === '-') {
                    handleSettingsChange('problemCount', inputValue);
                  } else {
                    const numValue = parseInt(inputValue);
                    if (!isNaN(numValue)) {
                      handleSettingsChange('problemCount', numValue);
                    }
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('operations')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(settings.operations).map(([op, checked]) => {
                  const labels = {
                    addition: t('addition'),
                    subtraction: t('subtraction'),
                    multiplication: t('multiplication'),
                    division: t('division')
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
            
            {maxResultError && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
                {t('maxResultWarning')}
              </div>
            )}
            
            {minMaxNumberError && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
                {t('minMaxNumberWarning')}
              </div>
            )}
            
            {problemCountError && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
                {t('problemCountWarning')}
              </div>
            )}
            
            <Button 
              className="w-full"
              onClick={startGame}
              disabled={!Object.values(settings.operations).some(Boolean) || maxResultError || minMaxNumberError || problemCountError}
            >
              {t('startGame')}
            </Button>
          </div>
        )}

        {gameState === 'playing' && problems[currentProblem] && (
          <div className="space-y-4">
            <div className="text-2xl text-center">
              {problems[currentProblem].operands?.map((operand, index) => (
                <span key={index}>
                  {operand}
                  {index < problems[currentProblem].operations.length && (
                    <span> {problems[currentProblem].operations[index]} </span>
                  )}
                </span>
              ))} = ?
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
              {t('submitAnswer')}
            </Button>
            
            <div className="text-sm text-center">
              {t('problemCounter', { current: currentProblem + 1, total: problems.length })}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{t('results')}</h3>
            
            {/* Show "All correct!" message if all problems are correct */}
            {results.every(r => r.isCorrect) && (
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-800 mb-2">{t('allCorrectTitle')}</div>
                <div className="text-green-700">{t('allCorrectMessage')}</div>
              </div>
            )}
            
            {/* Toggle for showing correct problems */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={showCorrectProblems}
                onCheckedChange={setShowCorrectProblems}
              />
              <Label>{t('showCorrectProblems')}</Label>
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
                      {result.problem.operands?.map((operand, index) => (
                        <span key={index}>
                          {operand}
                          {index < result.problem.operations.length && (
                            <span> {result.problem.operations[index]} </span>
                          )}
                        </span>
                      ))} = {result.userAnswer}
                      <div className="text-sm">
                        {result.isCorrect ? t('correct') : t('incorrect', { answer: result.problem.answer })}
                        <br />
                        {t('time', { time: (result.timeTaken / 1000).toFixed(1) })}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="font-bold mt-4">
              {t('score', { correct: results.filter(r => r.isCorrect).length, total: results.length })}
              <br />
              {t('totalTime', { time: (results.reduce((sum, result) => sum + result.timeTaken, 0) / 1000).toFixed(1) })}
            </div>
            
            <Button className="w-full" onClick={() => {
              setGameState('setup');
              trackEvent('play_again', 'Game', 'User clicked play again');
            }}>
              {t('playAgain')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MathGame;
