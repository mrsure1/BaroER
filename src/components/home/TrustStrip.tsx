import { Clock, Hospital, Wifi } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * 전국 응급의료기관 신뢰 strip (홈·시안 페이지 공용).
 */
export function TrustStrip() {
  const stats = [
    { Icon: Hospital, big: "411+", label: "전국 응급의료기관" },
    { Icon: Wifi, big: "실시간", label: "E-Gen 데이터 연동" },
    { Icon: Clock, big: "24h", label: "야간·주말 운영 표시" },
  ];
  return (
    <Card className="grid shrink-0 grid-cols-3 divide-x divide-border p-0">
      {stats.map(({ Icon, big, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-2 py-2 text-center"
        >
          <Icon className="size-3.5 text-primary" strokeWidth={2.2} />
          <p className="text-[14px] font-bold leading-none text-text sm:text-[14.5px]">
            {big}
          </p>
          <p className="text-[10.5px] leading-tight text-text-muted sm:text-[11px]">
            {label}
          </p>
        </div>
      ))}
    </Card>
  );
}
