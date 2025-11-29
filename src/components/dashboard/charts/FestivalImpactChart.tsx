import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { FestivalImpact } from "@/types/tourism";
import { COMMON_FESTIVALS } from "@/utils/festivalLogic";
import { formatFestivalName } from "@/utils/festivalDetector";

interface FestivalImpactChartProps {
  data?: FestivalImpact[];
  provinceName?: string;
}

export function FestivalImpactChart({
  data,
  provinceName,
}: FestivalImpactChartProps) {
  const festivals = data && data.length > 0 ? data.map((d) => d.festival) : [];
  
  // Separate common and province-specific festivals
  const commonFestivals = festivals.filter((f) =>
    COMMON_FESTIVALS.some((cf) => cf.value === f)
  );
  const provinceSpecificFestivals = festivals.filter(
    (f) => !COMMON_FESTIVALS.some((cf) => cf.value === f)
  );

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          Festivals in this period ({provinceName ?? "selected province"})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {festivals.length > 0 ? (
          <>
            {commonFestivals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Common Festivals:
                </p>
                <div className="flex flex-wrap gap-2">
                  {commonFestivals.map((festival, index) => (
                    <Badge
                      key={index}
                      variant="default"
                      className="text-sm px-3 py-1.5"
                    >
                      {formatFestivalName(festival)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {provinceSpecificFestivals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Province-Specific Festivals:
                </p>
                <div className="flex flex-wrap gap-2">
                  {provinceSpecificFestivals.map((festival, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm px-3 py-1.5"
                    >
                      {formatFestivalName(festival)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No festivals detected for this period.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
