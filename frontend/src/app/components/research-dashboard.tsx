"use client"

import { BookOpen, ExternalLink } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"

export interface SummaryData {
  combined_summary: string
  individual_summaries: IndividualSummary[]
}



interface IndividualSummary {
  title: string
  link: string
  summary: {
    summary: string
    keywords: string
    date: string
  }
}

interface ResponseDashboardProps {
  data: SummaryData
}


export default function ResponseDashboard({data}: ResponseDashboardProps) {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Combined Summary Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2 mt-2 mb-2">
          <BookOpen className="h-6 w-6 text-white" />
          <h1 className="text-3xl font-bold tracking-tight">Unified Research Overview</h1>
          <Badge variant="outline" className="text-xs text-white">
            5 resources
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono bg-slate-100 text-black p-5">{data.combined_summary}</p>
      </div>

      {/* Individual Summaries Section */}
      <div className="space-y-4">
        {data.individual_summaries.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription className="line-clamp-2">{item.summary.summary}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-1 mb-2">
                {item.summary.keywords.split(" ").map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
              <p className="text-xs">
                Date: {new Date(item.summary.date).toLocaleString()}
              </p>
            </CardContent>
            <CardFooter className="pt-1">
              <Button asChild variant="outline" size="sm" className="w-full">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit Resource
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

