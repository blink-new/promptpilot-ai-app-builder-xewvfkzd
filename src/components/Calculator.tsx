import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

export function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '×':
        return firstValue * secondValue
      case '÷':
        return firstValue / secondValue
      case '=':
        return secondValue
      default:
        return secondValue
    }
  }

  const handleEquals = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  const toggleSign = () => {
    if (display !== '0') {
      setDisplay(display.charAt(0) === '-' ? display.substr(1) : '-' + display)
    }
  }

  const percentage = () => {
    const value = parseFloat(display)
    setDisplay(String(value / 100))
  }

  const buttonClass = (type: 'number' | 'operator' | 'special' | 'equals') => {
    const baseClasses = 'h-16 text-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95'
    
    switch (type) {
      case 'number':
        return `${baseClasses} bg-slate-700 hover:bg-slate-600 text-white border-slate-600`
      case 'operator':
        return `${baseClasses} bg-orange-500 hover:bg-orange-400 text-white border-orange-400`
      case 'special':
        return `${baseClasses} bg-slate-500 hover:bg-slate-400 text-white border-slate-400`
      case 'equals':
        return `${baseClasses} bg-orange-500 hover:bg-orange-400 text-white border-orange-400 col-span-2`
      default:
        return baseClasses
    }
  }

  return (
    <Card className="p-6 bg-black/30 backdrop-blur-sm border-slate-700 shadow-2xl">
      {/* Display */}
      <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="text-right text-4xl font-mono text-white min-h-[3rem] flex items-center justify-end overflow-hidden">
          {display}
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Row 1 */}
        <Button
          onClick={clear}
          className={buttonClass('special')}
          variant="outline"
        >
          AC
        </Button>
        <Button
          onClick={toggleSign}
          className={buttonClass('special')}
          variant="outline"
        >
          ±
        </Button>
        <Button
          onClick={percentage}
          className={buttonClass('special')}
          variant="outline"
        >
          %
        </Button>
        <Button
          onClick={() => performOperation('÷')}
          className={buttonClass('operator')}
          variant="outline"
        >
          ÷
        </Button>

        {/* Row 2 */}
        <Button
          onClick={() => inputNumber('7')}
          className={buttonClass('number')}
          variant="outline"
        >
          7
        </Button>
        <Button
          onClick={() => inputNumber('8')}
          className={buttonClass('number')}
          variant="outline"
        >
          8
        </Button>
        <Button
          onClick={() => inputNumber('9')}
          className={buttonClass('number')}
          variant="outline"
        >
          9
        </Button>
        <Button
          onClick={() => performOperation('×')}
          className={buttonClass('operator')}
          variant="outline"
        >
          ×
        </Button>

        {/* Row 3 */}
        <Button
          onClick={() => inputNumber('4')}
          className={buttonClass('number')}
          variant="outline"
        >
          4
        </Button>
        <Button
          onClick={() => inputNumber('5')}
          className={buttonClass('number')}
          variant="outline"
        >
          5
        </Button>
        <Button
          onClick={() => inputNumber('6')}
          className={buttonClass('number')}
          variant="outline"
        >
          6
        </Button>
        <Button
          onClick={() => performOperation('-')}
          className={buttonClass('operator')}
          variant="outline"
        >
          −
        </Button>

        {/* Row 4 */}
        <Button
          onClick={() => inputNumber('1')}
          className={buttonClass('number')}
          variant="outline"
        >
          1
        </Button>
        <Button
          onClick={() => inputNumber('2')}
          className={buttonClass('number')}
          variant="outline"
        >
          2
        </Button>
        <Button
          onClick={() => inputNumber('3')}
          className={buttonClass('number')}
          variant="outline"
        >
          3
        </Button>
        <Button
          onClick={() => performOperation('+')}
          className={buttonClass('operator')}
          variant="outline"
        >
          +
        </Button>

        {/* Row 5 */}
        <Button
          onClick={() => inputNumber('0')}
          className={`${buttonClass('number')} col-span-2`}
          variant="outline"
        >
          0
        </Button>
        <Button
          onClick={inputDecimal}
          className={buttonClass('number')}
          variant="outline"
        >
          .
        </Button>
        <Button
          onClick={handleEquals}
          className={buttonClass('operator')}
          variant="outline"
        >
          =
        </Button>
      </div>
    </Card>
  )
}