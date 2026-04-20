"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookMarked,
  ChevronDown,
  ChevronRight,
  Compass,
  Home,
  LifeBuoy,
  MessageCircleQuestion,
} from "lucide-react";
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
    desc: "바로응급실은 실시간 병상과 응급실 정보를 빠르게 안내합니다. 아래 사용 가이드와 FAQ를 참고해 주세요.",
    quickTitle: "긴급 연락처",
    quickItems: ["생명이 위급하면 119 에 먼저 연락하세요.", "건강상담 1339 (24시간)", "정신건강위기 1577-0199"],
  },
  en: {
    title: "Need a hand?",
    desc: "BaroER surfaces live bed availability so you can reach the right ER first. See the guide below, then the FAQ.",
    quickTitle: "Emergency contacts",
    quickItems: [
      "Life-threatening emergency: call 119 first.",
      "24-hour health hotline: 1339",
      "Mental health crisis line: 1577-0199",
    ],
  },
  ja: {
    title: "お困りですか?",
    desc: "BaroER はリアルタイムの病床と救急情報を素早く案内します。以下の使い方と FAQ をご覧ください。",
    quickTitle: "緊急連絡先",
    quickItems: [
      "生命に関わる場合はまず 119 に電話してください。",
      "健康相談 1339 (24 時間)",
      "こころの危機相談 1577-0199",
    ],
  },
  zh: {
    title: "需要帮助吗?",
    desc: "BaroER 致力于以最快速度提供实时病床与急诊信息。请阅读下方使用说明与常见问题。",
    quickTitle: "紧急联系方式",
    quickItems: ["若有生命危险,请先拨打 119。", "健康咨询 1339(24 小时)", "心理危机热线 1577-0199"],
  },
};

type GuideBlock = { title: string; lines: string[] };

const USER_GUIDE: Record<
  Locale,
  { heading: string; blocks: GuideBlock[]; homeCta: string }
> = {
  ko: {
    heading: "앱 사용 가이드",
    homeCta: "메인 화면으로 이동",
    blocks: [
      {
        title: "이 앱으로 할 수 있는 일",
        lines: [
          "전국 응급의료기관과 수용 가능 병상 정보를 조회하고, 현재 위치를 기준으로 가까운 곳부터 볼 수 있어요.",
          "증상·연령대 등을 입력하면 참고용 KTAS 단계 추정과 응급처치 안내를 보여 줍니다. 의료진의 진단이나 처방을 대신하지 않습니다.",
          "병원에 전화 걸기, 네이버 지도·설정해 둔 내비 앱으로 길안내를 바로 열 수 있어요.",
        ],
      },
      {
        title: "하단 탭(메뉴) 구성",
        lines: [
          "홈: 119 연결, 데이터 안내, 최근 검색 요약, 응급 안전 가이드",
          "검색: 증상·성별·연령·메모(또는 음성) 입력 후 근처 응급실 검색",
          "기록: 로그인한 구급대원은 현장 리포트를 작성·저장할 수 있어요. 일반 사용자에게는 비활성 또는 안내만 보일 수 있어요.",
          "설정: 프로필, 알림, 언어, 기본 내비, 화면 모드(테마), 개인정보 처리방침",
        ],
      },
      {
        title: "검색 → 결과 화면 쓰는 법",
        lines: [
          "검색 화면에서 증상을 하나 이상 선택해야 다음 단계로 진행할 수 있어요. 메모란에 상황을 적거나 음성으로 입력할 수도 있어요.",
          "결과 화면 상단에서 검색 반경(최대 200km)과 정렬(빠른 순·가까운 순·수용 가능)을 바꿀 수 있어요.",
          "리스트와 지도 보기를 전환해 위치와 병상 표시를 함께 확인하세요.",
          "「길안내」는 설정의 기본 내비 또는 처음 선택한 앱으로 열려요. 내비 앱은 설정 → 기본 내비에서 바꿀 수 있어요.",
        ],
      },
      {
        title: "위치·지도가 이상할 때",
        lines: [
          "브라우저·OS에서 위치 권한을 허용하고, 가능하면 스마트폰에서 데이터망으로 접속해 보세요. Wi‑Fi만 쓰는 PC는 오차가 클 수 있어요.",
          "지도가 비어 있으면 네트워크 제한이나 지도 서비스 설정 문제일 수 있어요. 화면에 표시되는 안내 문구와 아래 FAQ를 확인해 주세요.",
        ],
      },
      {
        title: "꼭 기억해 주세요",
        lines: [
          "생명이 위급하면 119와 응급 의료기관 이용이 최우선입니다.",
          "병상 정보는 공공 API 기준이며 갱신 지연·누락이 있을 수 있어요. 방문 전 전화로 한 번 더 확인하는 것이 안전합니다.",
        ],
      },
    ],
  },
  en: {
    heading: "User guide",
    homeCta: "Go to home",
    blocks: [
      {
        title: "What you can do",
        lines: [
          "Browse nationwide ER facilities and live bed availability, sorted from your current location.",
          "After you enter symptoms and age band, we show a reference KTAS-style severity hint and first-aid style guidance. This is not a medical diagnosis.",
          "Call a hospital or open turn-by-turn directions in Naver Maps or your preferred nav app (from Settings).",
        ],
      },
      {
        title: "Bottom tabs",
        lines: [
          "Home: emergency dial shortcut, data trust strip, recent search summary, safety tips",
          "Search: pick symptoms, gender, age band, notes (or voice), then run the nearby-ER search",
          "Records: paramedics who are signed in can draft and save dispatch-style reports. General users may see limited or no content here.",
          "Settings: profile, notifications, language, default navigator, theme, privacy policy",
        ],
      },
      {
        title: "Search → results",
        lines: [
          "Select at least one symptom before continuing. Use the memo field or voice input for extra context.",
          "On the results screen, change the radius (up to 200 km) and sort order (ETA, distance, or capacity).",
          "Switch between list and map to compare locations with bed indicators.",
          "Directions use your saved default nav app, or the picker on first use. Change it under Settings → Default navigator.",
        ],
      },
      {
        title: "Location or map issues",
        lines: [
          "Allow location in the browser/OS and prefer a phone on cellular data when accuracy matters. Wi‑Fi-only laptops can be far off.",
          "If the map is blank, check network restrictions or the on-screen error text, and see the FAQ below.",
        ],
      },
      {
        title: "Important",
        lines: [
          "For life-threatening emergencies, call 119 and seek emergency care first.",
          "Bed data comes from public APIs and may lag or be missing—call ahead when possible.",
        ],
      },
    ],
  },
  ja: {
    heading: "アプリの使い方",
    homeCta: "ホームへ",
    blocks: [
      {
        title: "できること",
        lines: [
          "全国の救急医療機関と病床の空き状況を、現在地から近い順に確認できます。",
          "症状や年齢帯を入力すると、参考用の KTAS 相当の重症度目安と応急手当のヒントを表示します。診断や治療の代わりにはなりません。",
          "病院へ電話、Naver マップや設定したナビアプリでの道案内をすぐ開けます。",
        ],
      },
      {
        title: "下部タブ",
        lines: [
          "ホーム: 119 へのショートカット、データの説明、最近の検索、安全のヒント",
          "検索: 症状・性別・年齢帯・メモ(音声可)を入力して近くの ER を検索",
          "記録: ログインした救急隊員は現場レポートの作成・保存が可能です。一般ユーザーには表示が限られる場合があります。",
          "設定: プロフィール、通知、言語、既定のナビ、テーマ、プライバシーポリシー",
        ],
      },
      {
        title: "検索 → 結果",
        lines: [
          "症状は 1 つ以上選ぶ必要があります。メモ欄や音声入力で状況を補足できます。",
          "結果画面上部で検索半径(最大 200 km)と並び替え(早い順・距離・受入可能)を変更できます。",
          "リストと地図を切り替えて位置と病床表示を確認してください。",
          "「道案内」は設定済みのナビ、または初回選択したアプリで開きます。設定 → 既定のナビ で変更できます。",
        ],
      },
      {
        title: "位置情報・地図のトラブル",
        lines: [
          "ブラウザ/OS で位置情報を許可し、精度が必要ならスマートフォンの回線利用を推奨します。Wi‑Fi のみの PC では大きくずれることがあります。",
          "地図が空白のときはネットワーク制限や画面上のエラー表示を確認し、下の FAQ も参照してください。",
        ],
      },
      {
        title: "注意",
        lines: [
          "命に関わる場合は 119 と救急医療の利用が最優先です。",
          "病床情報は公共 API ベースで遅延や欠損があり得ます。可能なら受診前に電話で確認してください。",
        ],
      },
    ],
  },
  zh: {
    heading: "使用说明",
    homeCta: "返回主页",
    blocks: [
      {
        title: "应用能做什么",
        lines: [
          "查询全国急诊机构与实时可收治床位,并按当前位置由近到远展示。",
          "填写症状、年龄段等信息后,会显示参考性的 KTAS 级别提示与急救指引,不能替代医生诊断。",
          "可一键拨号,或在 Naver 地图及您在设置中选择的导航应用中打开路线。",
        ],
      },
      {
        title: "底部标签页",
        lines: [
          "主页: 紧急拨号入口、数据来源说明、最近搜索摘要、安全提示",
          "搜索: 选择症状、性别、年龄段、备注(支持语音)后搜索附近急诊",
          "记录: 已登录的急救人员可撰写并保存现场报告;普通用户可能看不到或仅有提示。",
          "设置: 个人资料、通知、语言、默认导航、主题、隐私政策",
        ],
      },
      {
        title: "搜索与结果",
        lines: [
          "至少选择一项症状后才能继续。可在备注中用文字或语音补充情况。",
          "在结果页顶部可调整搜索半径(最大 200 公里)与排序(更快、更近、可收治优先)。",
          "在列表与地图视图间切换,同时查看位置与床位信息。",
          "「路线指引」会使用您保存的默认导航应用,或首次使用时弹出的选择器。可在 设置 → 默认导航 中修改。",
        ],
      },
      {
        title: "定位或地图异常",
        lines: [
          "请在浏览器/系统中允许定位;需要高精度时建议使用手机移动网络。仅 Wi‑Fi 的电脑可能偏差很大。",
          "若地图空白,请检查网络限制与页面错误提示,并参阅下方常见问题。",
        ],
      },
      {
        title: "重要提示",
        lines: [
          "危及生命时请优先拨打 119 并前往急诊。",
          "床位数据来自公共接口,可能存在延迟或缺失;条件允许时请电话确认。",
        ],
      },
    ],
  },
};

export default function HelpPage() {
  const [locale] = useLocale();
  const [open, setOpen] = useState<number | null>(0);
  const faqs = FAQS[locale];
  const intro = INTRO[locale];
  const userGuide = USER_GUIDE[locale];

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
            <BookMarked className="size-3.5" />
            {userGuide.heading}
          </h3>
          <Card className="p-4">
            <div className="space-y-4">
              {userGuide.blocks.map((block) => (
                <div key={block.title}>
                  <p className="text-[13.5px] font-semibold text-text">{block.title}</p>
                  <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-text-muted">
                    {block.lines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-text-subtle" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Link
          href="/home"
          className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3.5 text-[14px] font-medium text-text shadow-[var(--shadow-sm)] transition-colors hover:bg-surface-2"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Home className="size-[18px] shrink-0 text-primary" />
            <span className="truncate">{userGuide.homeCta}</span>
          </span>
          <ChevronRight className="size-[18px] shrink-0 text-text-subtle" aria-hidden />
        </Link>

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
