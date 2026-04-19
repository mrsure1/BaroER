"use client";

import { useState } from "react";
import { ChevronDown, Compass, LifeBuoy, MessageCircleQuestion } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useLocale, type Locale } from "@/stores/localeStore";
import { cn } from "@/lib/cn";

/**
 * 도움말 / FAQ 페이지. 언어 설정에 따라 한국어 / 영어 / 일본어 / 중국어
 * 콘텐츠가 자동 전환된다. 번역은 의미 중심 — 기계적 직역보다 각 언어권
 * 사용자가 응급 상황에서 문장을 빠르게 파악할 수 있도록 간결하게 풀었다.
 */

type FAQ = { q: string; a: string };

const FAQS: Record<Locale, FAQ[]> = {
  ko: [
    {
      q: "병상 정보는 얼마나 정확한가요?",
      a: "공공데이터포털의 응급의료정보 API 를 실시간으로 조회합니다. 대부분의 병원은 5~10분 간격으로 갱신되며, 병원 시스템 장애 시 '정보 없음' 으로 표시돼요.",
    },
    {
      q: "검색 반경은 어떻게 조정하나요?",
      a: "결과 화면 상단의 슬라이더를 좌우로 드래그하면 최대 200km 까지 반경이 늘어납니다. 슬라이더를 놓으면 자동으로 재검색돼요.",
    },
    {
      q: "내 위치가 잘못 잡혀요.",
      a: "Wi‑Fi 로만 접속된 노트북은 수 km 오차가 날 수 있어요. 정확한 위치가 필요하면 스마트폰에서 HTTPS 접속 후 위치 권한을 허용해 주세요.",
    },
    {
      q: "지도가 빈 화면으로 나와요.",
      a: "네이버 클라우드 콘솔에 현재 접속 도메인이 등록돼 있지 않거나, 네트워크가 제한돼 있을 수 있어요. 화면 상단의 오류 문구를 확인하면 원인이 표시됩니다.",
    },
    {
      q: "길안내 버튼을 누르면 어떻게 되나요?",
      a: "네이버 지도 앱이 설치돼 있으면 출발지와 도착지가 모두 채워진 상태로 내비게이션이 시작됩니다. 앱이 없다면 웹 지도로 대체돼요.",
    },
    {
      q: "구급대원 리포트는 외부로 전송되나요?",
      a: "현재는 내 디바이스에만 저장됩니다. 소속 기관 서버로의 업로드는 소속 인증이 완료된 후 별도 동의를 거쳐 활성화됩니다.",
    },
    {
      q: "데이터를 삭제하고 싶어요.",
      a: "설정 → 개인정보 처리방침 하단의 '데이터 삭제 요청' 을 통해 계정·기록 일괄 삭제를 요청할 수 있어요.",
    },
  ],
  en: [
    {
      q: "How accurate is the bed capacity info?",
      a: "We pull live data from Korea’s Public Emergency Medical Info API. Most hospitals refresh every 5–10 minutes. If a hospital’s system is down, you’ll see ‘No data’.",
    },
    {
      q: "How do I adjust the search radius?",
      a: "Drag the slider at the top of the results screen — up to 200 km. Releasing the slider re-runs the search automatically.",
    },
    {
      q: "My location looks wrong.",
      a: "Wi‑Fi‑only laptops can be off by several kilometres. For accurate coordinates, open the app on your phone over HTTPS and allow location permission.",
    },
    {
      q: "The map shows a blank screen.",
      a: "The current origin may not be registered in your Naver Cloud console, or the tile server is blocked by your network. Check the error message shown on the map.",
    },
    {
      q: "What does the ‘Directions’ button do?",
      a: "If Naver Maps is installed, navigation launches with both origin and destination pre-filled. Otherwise it falls back to the Naver web map.",
    },
    {
      q: "Are dispatch reports uploaded anywhere?",
      a: "Not yet. Reports are stored only on this device. Upload to your organization will be enabled after unit verification and explicit consent.",
    },
    {
      q: "How can I delete my data?",
      a: "See ‘Data deletion request’ at the bottom of the Privacy page to wipe your account and history.",
    },
  ],
  ja: [
    {
      q: "病床情報はどの程度正確ですか?",
      a: "韓国公共データポータルの救急医療情報 API をリアルタイム参照しています。多くの病院は 5〜10 分間隔で更新され、病院側の障害時は「情報なし」と表示されます。",
    },
    {
      q: "検索半径はどう変更しますか?",
      a: "結果画面上部のスライダーを左右にドラッグ (最大 200 km)。指を離すと自動で再検索されます。",
    },
    {
      q: "現在地がずれています。",
      a: "Wi‑Fi のみのノート PC は数 km の誤差が出ることがあります。正確な位置が必要な場合はスマートフォンの HTTPS 環境で位置情報を許可してください。",
    },
    {
      q: "地図が真っ白で表示されません。",
      a: "Naver Cloud コンソールに現在のドメインが登録されていないか、ネットワークがブロックされている可能性があります。画面上部のエラーメッセージを確認してください。",
    },
    {
      q: "「道案内」ボタンを押すとどうなりますか?",
      a: "Naver マップがインストールされていれば出発地と目的地が入力された状態でナビが開始されます。未インストールの場合は Web 地図にフォールバックします。",
    },
    {
      q: "救急隊員レポートは外部に送信されますか?",
      a: "現時点では端末にのみ保存されます。所属機関へのアップロードは、所属認証と個別同意を経てから有効化されます。",
    },
    {
      q: "データを削除したいです。",
      a: "個人情報処理方針ページ下部の「データ削除リクエスト」からアカウントと履歴の一括削除を依頼できます。",
    },
  ],
  zh: [
    {
      q: "病床信息的准确度如何?",
      a: "我们通过韩国公共数据门户的急救医疗信息 API 实时查询。大多数医院每 5–10 分钟更新一次;医院系统异常时会显示「无信息」。",
    },
    {
      q: "如何调整搜索半径?",
      a: "在结果页顶部左右拖动滑块,最大 200 公里。松开滑块会自动重新搜索。",
    },
    {
      q: "定位不准。",
      a: "仅通过 Wi‑Fi 联网的笔记本电脑可能有数公里误差。如需精确定位,请在手机上通过 HTTPS 访问并允许位置权限。",
    },
    {
      q: "地图显示为空白。",
      a: "当前域名可能未在 Naver 云控制台注册,或网络封锁了瓦片服务器。请查看地图上的错误提示以定位原因。",
    },
    {
      q: "「路线指引」按钮的行为?",
      a: "已安装 Naver 地图时,会自动填入起点与终点并启动导航;否则回退到网页版 Naver 地图。",
    },
    {
      q: "急救员报告会上传到外部吗?",
      a: "目前仅保存在本设备。上传至所属机构需要通过单位验证并单独征得同意后才会启用。",
    },
    {
      q: "如何删除我的数据?",
      a: "在隐私政策页面底部的「数据删除请求」中,可提交注销账号及历史记录的申请。",
    },
  ],
};

const INTRO: Record<Locale, { title: string; desc: string; quickTitle: string; quickItems: string[] }> = {
  ko: {
    title: "도움이 필요하신가요?",
    desc: "바로응급실은 실시간 병상과 응급실 정보를 가장 빠르게 안내하기 위해 만들어졌어요. 아래는 자주 묻는 질문입니다.",
    quickTitle: "긴급 연락처",
    quickItems: ["생명이 위급하면 119 에 먼저 연락하세요.", "건강상담 1339 (24시간)", "정신건강위기 1577-0199"],
  },
  en: {
    title: "Need a hand?",
    desc: "BaroER surfaces live bed availability so you can reach the right ER first. Here are the most common questions.",
    quickTitle: "Emergency contacts",
    quickItems: [
      "Life-threatening emergency: call 119 first.",
      "24-hour health hotline: 1339",
      "Mental health crisis line: 1577-0199",
    ],
  },
  ja: {
    title: "お困りですか?",
    desc: "BaroER はリアルタイムの病床状況と救急室情報を最短で案内するためのアプリです。よくある質問をまとめました。",
    quickTitle: "緊急連絡先",
    quickItems: [
      "生命に関わる場合はまず 119 に電話してください。",
      "健康相談 1339 (24 時間)",
      "こころの危機相談 1577-0199",
    ],
  },
  zh: {
    title: "需要帮助吗?",
    desc: "BaroER 致力于以最快速度提供实时病床与急诊信息。以下是常见问题。",
    quickTitle: "紧急联系方式",
    quickItems: ["若有生命危险,请先拨打 119。", "健康咨询 1339(24 小时)", "心理危机热线 1577-0199"],
  },
};

export default function HelpPage() {
  const [locale] = useLocale();
  const [open, setOpen] = useState<number | null>(0);
  const faqs = FAQS[locale];
  const intro = INTRO[locale];

  return (
    <>
      <ScreenHeader title={locale === "ko" ? "도움말" : locale === "en" ? "Help" : locale === "ja" ? "ヘルプ" : "帮助"} back />
      <div className="mx-auto w-full max-w-[520px] px-5 pb-10">
        <Card className="flex items-start gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text">{intro.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              {intro.desc}
            </p>
          </div>
        </Card>

        <Card className="mt-4 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Compass className="size-4 text-status-full" />
            <p className="text-[13.5px] font-semibold text-text">
              {intro.quickTitle}
            </p>
          </div>
          <ul className="space-y-1.5 text-[12.5px] text-text-muted">
            {intro.quickItems.map((it) => (
              <li key={it} className="flex gap-2">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-text-subtle" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </Card>

        <section className="mt-6">
          <h3 className="mb-2 flex items-center gap-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-text-subtle">
            <MessageCircleQuestion className="size-3.5" /> FAQ
          </h3>
          <Card className="divide-y divide-border p-0">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[14px] font-medium text-text">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-text-subtle transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <p className="px-4 pb-4 text-[13px] leading-relaxed text-text-muted">
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
        </section>

        <p className="mt-8 text-center text-[11.5px] text-text-subtle">
          {locale === "ko"
            ? "추가 문의: support@baroer.app"
            : locale === "en"
              ? "More questions? support@baroer.app"
              : locale === "ja"
                ? "その他のお問い合わせ: support@baroer.app"
                : "更多咨询: support@baroer.app"}
        </p>
      </div>
    </>
  );
}
