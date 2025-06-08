"use client"

interface BiasMeterProps {
  score: number
}

/**
 * Displays a circular progress meter visualizing a bias score with color-coded feedback and descriptive labeling.
 *
 * Renders the given score as a circular progress indicator, where the color and label reflect the bias level: green for low, yellow for moderate, and red for high bias.
 *
 * @param score - The bias score to display, expected to be between 0 and 100.
 */
export default function BiasMeter({ score }: BiasMeterProps) {
  const getScoreColor = (score: number) => {
    if (score <= 30) return "text-green-500"
    if (score <= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score <= 30) return "Low Bias"
    if (score <= 60) return "Moderate Bias"
    return "High Bias"
  }

  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Bias Score</h3>
        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>{score}/100</span>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted-foreground/20"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">{getScoreLabel(score)}</p>
    </div>
  )
}
