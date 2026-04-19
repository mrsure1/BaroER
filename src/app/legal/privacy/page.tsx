"use client";

import { Shield } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useLocale, type Locale } from "@/stores/localeStore";

/**
 * 개인정보 처리방침 — 한국 개인정보보호법 / PIPA 및 GDPR 의 최소 요구 항목을
 * 커버한다. 이 앱이 실제로 수집하는 데이터만 명시 — 데이터 최소화 원칙.
 *
 *  ▸ 수집 항목: 이메일·닉네임·프로필 이미지 (인증) + 위치 (검색 그 자리에서만)
 *  ▸ 보관 위치: Supabase (auth.users) + 기기 로컬 (검색 기록, 리포트)
 *  ▸ 제 3자 제공: 네이버 지도 SDK (타일 로드), 공공데이터포털 API (hpid 기반 조회 — PII 미전송)
 *  ▸ 보관 기간: 회원 탈퇴 시 즉시 삭제. 로컬 기록은 사용자가 언제든 지울 수 있음.
 */

const LAST_UPDATED = "2026-04-19";

type Section = { title: string; body: string[] };

type Doc = {
  heading: string;
  subheading: string;
  sections: Section[];
  closing: string;
};

const DOCS: Record<Locale, Doc> = {
  ko: {
    heading: "개인정보 처리방침",
    subheading: `최종 수정일: ${LAST_UPDATED}`,
    sections: [
      {
        title: "1. 수집하는 개인정보",
        body: [
          "바로응급실(이하 '서비스')은 응급실 검색과 병상 정보 제공이라는 본 목적에 반드시 필요한 최소한의 정보만 수집합니다.",
          "• 계정 정보 — 이메일, 닉네임, 프로필 이미지 URL (소셜 로그인 시), 사용자 유형(일반/구급대원), 소속 코드(선택)",
          "• 위치 정보 — 사용자의 현재 좌표(위도/경도). 검색 시점에만 일회성으로 사용되며, 서버에 저장되지 않습니다.",
          "• 이용 기록 — 최근 검색 조건 및 상위 결과 스냅샷. 사용자의 기기 로컬 저장소에만 저장됩니다.",
        ],
      },
      {
        title: "2. 수집 방법과 목적",
        body: [
          "• 회원가입·로그인 시 직접 입력 또는 OAuth 제공자(Google, Kakao) 로부터 전달받습니다.",
          "• 수집된 정보는 (1) 가입자 인증, (2) 거리 기반 응급실 정렬, (3) 구급대원 전용 기능 제공, (4) 고객 문의 응대에 이용됩니다.",
          "• 광고·마케팅 목적의 프로파일링은 수행하지 않습니다.",
        ],
      },
      {
        title: "3. 보관 위치와 기간",
        body: [
          "• 계정 정보는 Supabase(Auth) 에 저장되며, 회원 탈퇴 시 즉시 파기됩니다.",
          "• 검색 기록과 구급 리포트 초안은 사용자의 기기 로컬 저장소에만 있으며, 사용자가 직접 삭제하거나 앱 데이터를 초기화할 때까지 유지됩니다.",
          "• 관련 법령이 정한 최소 보관 기간이 있는 경우 해당 기간 동안 분리 보관 후 파기합니다.",
        ],
      },
      {
        title: "4. 제 3자 제공 및 처리 위탁",
        body: [
          "서비스는 원칙적으로 개인정보를 제 3자에게 제공하지 않습니다. 단 아래 위탁은 서비스 제공에 필수적입니다.",
          "• Supabase — 인증 및 데이터 저장",
          "• 네이버 클라우드 (Maps SDK) — 지도 타일 로드",
          "• 공공데이터포털 — 응급의료정보 조회 (개인 식별 정보 미전송, 병원 식별자만 사용)",
        ],
      },
      {
        title: "5. 이용자의 권리",
        body: [
          "이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 서비스는 요청 접수 후 지체 없이 필요한 조치를 취합니다.",
          "요청 방법: 앱 내 ‘도움말 → 문의하기’ 또는 support@baroer.app 로 이메일.",
        ],
      },
      {
        title: "6. 데이터 보호 조치",
        body: [
          "• 모든 네트워크 통신은 HTTPS 로 암호화됩니다.",
          "• 데이터베이스에는 Row-Level Security(RLS) 가 적용되어, 인증된 사용자만 자신의 데이터에 접근할 수 있습니다.",
          "• 비밀번호는 bcrypt 해시로만 저장되며, 원문은 보관하지 않습니다.",
        ],
      },
      {
        title: "7. 위치 정보 특별 고지",
        body: [
          "본 서비스는 응급실 검색을 위해 사용자의 현재 위치를 일회적으로 사용합니다. 수집된 좌표는 서버 로그에도 남기지 않으며, 검색 직후 메모리에서 폐기됩니다.",
        ],
      },
      {
        title: "8. 만 14 세 미만 아동",
        body: [
          "본 서비스는 만 14 세 미만 아동의 개인정보를 수집하지 않습니다. 본인이 만 14 세 미만인 경우 보호자와 함께 이용해 주세요.",
        ],
      },
      {
        title: "9. 개정 고지",
        body: [
          "본 방침은 법령·서비스 정책 변경에 따라 개정될 수 있습니다. 중대한 변경이 있을 경우 앱 내 공지 또는 이메일로 최소 7 일 전에 알려드립니다.",
        ],
      },
      {
        title: "10. 데이터 삭제 요청",
        body: [
          "계정과 관련된 모든 개인정보의 즉시 삭제를 원하시면 support@baroer.app 으로 가입 이메일과 함께 요청해 주세요. 요청 접수 후 영업일 기준 3 일 이내에 처리합니다.",
        ],
      },
    ],
    closing: "책임자: BaroER 팀 · 문의: support@baroer.app",
  },
  en: {
    heading: "Privacy Policy",
    subheading: `Last updated: ${LAST_UPDATED}`,
    sections: [
      {
        title: "1. Information we collect",
        body: [
          "BaroER (“the Service”) collects only the minimum data necessary to deliver live emergency-room search.",
          "• Account: email, nickname, optional profile photo URL (social login), user type (general/paramedic), unit code (optional).",
          "• Location: your live latitude/longitude used transiently at search time. We never persist it on our servers.",
          "• Usage: recent search parameters and a snapshot of top results — stored only in local device storage.",
        ],
      },
      {
        title: "2. How and why we collect it",
        body: [
          "Account data is provided by you at sign-up or via OAuth (Google, Kakao).",
          "We use it to (1) authenticate you, (2) sort ERs by distance, (3) enable paramedic-only features, (4) respond to inquiries.",
          "We do not build advertising or marketing profiles.",
        ],
      },
      {
        title: "3. Where and how long we keep it",
        body: [
          "Account data lives in Supabase (Auth) and is purged immediately on account deletion.",
          "Search history and dispatch drafts live exclusively in local storage until you delete them or clear app data.",
          "Any data legally required to be retained is kept only for the minimum mandated period and then destroyed.",
        ],
      },
      {
        title: "4. Third parties",
        body: [
          "We do not sell or share personal data. The following processors are essential to operate the Service:",
          "• Supabase — authentication & storage",
          "• Naver Cloud (Maps SDK) — map tiles",
          "• Public Data Portal (Korea) — ER info queries (no PII transmitted; hospital identifiers only)",
        ],
      },
      {
        title: "5. Your rights",
        body: [
          "You can request access, correction, deletion, or processing restriction at any time. Requests are actioned without undue delay.",
          "Contact: in-app Help → Contact, or email support@baroer.app.",
        ],
      },
      {
        title: "6. Security",
        body: [
          "All traffic uses HTTPS. The database enforces Row-Level Security — you can only read/write your own rows. Passwords are stored as bcrypt hashes only.",
        ],
      },
      {
        title: "7. Location data notice",
        body: [
          "We use your device location solely at the moment of search. Coordinates are not logged on our servers and are discarded from memory immediately after the response is returned.",
        ],
      },
      {
        title: "8. Children under 14",
        body: [
          "The Service does not knowingly collect data from children under 14. Minors must use the Service with a guardian.",
        ],
      },
      {
        title: "9. Changes",
        body: [
          "We may revise this policy. Material changes are announced in-app or by email at least 7 days before taking effect.",
        ],
      },
      {
        title: "10. Data deletion requests",
        body: [
          "Email support@baroer.app from your signup address to request full deletion. Requests are processed within 3 business days.",
        ],
      },
    ],
    closing: "Controller: BaroER Team · Contact: support@baroer.app",
  },
  ja: {
    heading: "個人情報処理方針",
    subheading: `最終更新: ${LAST_UPDATED}`,
    sections: [
      {
        title: "1. 収集する個人情報",
        body: [
          "BaroER(以下「本サービス」)は、救急室検索サービスの提供に必要な最小限の情報のみを収集します。",
          "• アカウント情報 — メールアドレス、ニックネーム、プロフィール画像 URL(ソーシャル連携時)、ユーザー種別、所属コード(任意)",
          "• 位置情報 — 現在位置の緯度・経度。検索時のみ一時的に使用し、サーバーには保存しません。",
          "• 利用履歴 — 最近の検索条件と上位結果のスナップショット。端末ローカルにのみ保存されます。",
        ],
      },
      {
        title: "2. 収集方法と目的",
        body: [
          "会員登録・ログイン時にご自身で入力いただくか、OAuth プロバイダ(Google, Kakao)から受領します。",
          "(1) アカウント認証、(2) 距離に基づく救急室並べ替え、(3) 救急隊員専用機能、(4) お問い合わせ対応のために利用します。",
          "広告・マーケティング目的のプロファイリングは行いません。",
        ],
      },
      {
        title: "3. 保管場所と期間",
        body: [
          "アカウント情報は Supabase(Auth)に保存され、退会時に即時削除されます。",
          "検索履歴と救急レポートの下書きは端末ローカルにのみ保管され、ユーザーが削除またはアプリデータを初期化するまで保持されます。",
          "法令で定められた最低保存期間がある情報は、その期間のみ分離保管後に廃棄します。",
        ],
      },
      {
        title: "4. 第三者への提供と委託",
        body: [
          "本サービスは原則として個人情報を第三者に提供しません。ただし以下の委託はサービス提供に不可欠です。",
          "• Supabase — 認証・データ保存",
          "• Naver Cloud(Maps SDK)— 地図タイル",
          "• 公共データポータル(韓国)— 救急医療情報照会(個人識別情報は送信せず、病院識別子のみ使用)",
        ],
      },
      {
        title: "5. 利用者の権利",
        body: [
          "いつでも個人情報の開示・訂正・削除・処理停止を請求できます。受領後、遅滞なく対応します。",
          "請求方法: アプリ内ヘルプ → お問い合わせ、または support@baroer.app まで。",
        ],
      },
      {
        title: "6. 安全管理",
        body: [
          "すべての通信は HTTPS で暗号化されます。データベースには Row-Level Security を適用し、認証済みユーザー本人のデータのみアクセス可能です。パスワードは bcrypt ハッシュのみを保管し、平文は保持しません。",
        ],
      },
      {
        title: "7. 位置情報に関する特別告知",
        body: [
          "救急室検索のために現在位置を一時的に使用します。座標はサーバーログにも残さず、レスポンス返却直後にメモリから破棄されます。",
        ],
      },
      {
        title: "8. 14 歳未満のお子様",
        body: [
          "本サービスは 14 歳未満のお子様の個人情報を収集しません。未成年の方は保護者の方とご一緒にご利用ください。",
        ],
      },
      {
        title: "9. 改定のお知らせ",
        body: [
          "本方針は法令・サービス方針の変更により改定されることがあります。重大な変更は、発効 7 日前までにアプリ内告知またはメールでご案内します。",
        ],
      },
      {
        title: "10. データ削除リクエスト",
        body: [
          "アカウントに関連する個人情報の即時削除を希望する場合、登録メールから support@baroer.app までご請求ください。受付後 3 営業日以内に処理します。",
        ],
      },
    ],
    closing: "管理者: BaroER チーム · お問い合わせ: support@baroer.app",
  },
  zh: {
    heading: "隐私政策",
    subheading: `最后更新日期: ${LAST_UPDATED}`,
    sections: [
      {
        title: "1. 我们收集的信息",
        body: [
          "BaroER(以下简称「本服务」)仅收集为提供急诊室检索服务所必需的最少信息。",
          "• 账户信息 — 邮箱、昵称、头像 URL(社交登录)、用户类型、单位代码(可选)",
          "• 位置信息 — 您的实时经纬度,仅在搜索时临时使用,不会保存至服务器。",
          "• 使用记录 — 近期搜索条件及结果快照,仅保存在设备本地存储中。",
        ],
      },
      {
        title: "2. 收集方式与目的",
        body: [
          "通过您在注册/登录时直接输入,或由 OAuth 提供商(Google、Kakao)传递。",
          "用途:(1)身份认证;(2)按距离排序急诊室;(3)启用急救员专属功能;(4)响应客户咨询。",
          "我们不会进行广告或营销目的的画像分析。",
        ],
      },
      {
        title: "3. 存储位置与期限",
        body: [
          "账户信息保存在 Supabase(Auth),注销账号时立即删除。",
          "搜索历史和救援草稿仅保存在设备本地,直至您主动删除或清除应用数据。",
          "如法律要求最低保存期限,将仅保留该期限,到期后销毁。",
        ],
      },
      {
        title: "4. 第三方共享与受托处理",
        body: [
          "本服务原则上不向第三方提供个人信息。下列受托方为提供服务所必需:",
          "• Supabase — 身份认证与数据存储",
          "• Naver Cloud(Maps SDK)— 地图瓦片",
          "• 韩国公共数据门户 — 急救医疗信息查询(不传输个人可识别信息,仅使用医院识别码)",
        ],
      },
      {
        title: "5. 用户权利",
        body: [
          "您可随时请求查阅、更正、删除或限制处理本人信息。我们将在收到请求后及时处理。",
          "请求方式:应用内「帮助 → 联系我们」,或发送邮件至 support@baroer.app。",
        ],
      },
      {
        title: "6. 安全保障",
        body: [
          "所有通信均通过 HTTPS 加密。数据库启用 Row-Level Security,仅允许已认证用户访问自己的数据。密码仅以 bcrypt 哈希保存,不保存明文。",
        ],
      },
      {
        title: "7. 位置信息特别说明",
        body: [
          "本服务仅在搜索时临时使用您的位置。经纬度不会写入服务器日志,响应返回后立即从内存中丢弃。",
        ],
      },
      {
        title: "8. 14 岁以下儿童",
        body: [
          "本服务不收集 14 岁以下儿童的个人信息。未成年人应在监护人陪同下使用。",
        ],
      },
      {
        title: "9. 政策变更",
        body: [
          "本政策可能因法规或服务变更而修订。重大变更将至少在生效 7 日前通过应用公告或邮件告知。",
        ],
      },
      {
        title: "10. 数据删除请求",
        body: [
          "如需立即删除账户相关的全部个人信息,请从注册邮箱向 support@baroer.app 发送请求。我们将在 3 个工作日内处理。",
        ],
      },
    ],
    closing: "负责人: BaroER 团队 · 联系方式: support@baroer.app",
  },
};

export default function PrivacyPolicyPage() {
  const [locale] = useLocale();
  const doc = DOCS[locale];

  return (
    <>
      <ScreenHeader
        title={
          locale === "ko"
            ? "개인정보 처리방침"
            : locale === "en"
              ? "Privacy Policy"
              : locale === "ja"
                ? "個人情報処理方針"
                : "隐私政策"
        }
        back
      />
      <div className="mx-auto w-full max-w-[640px] px-5 pb-12">
        <Card className="flex items-start gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-text">{doc.heading}</p>
            <p className="text-[12px] text-text-muted">{doc.subheading}</p>
          </div>
        </Card>

        <article className="mt-6 space-y-6">
          {doc.sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-2 text-[14.5px] font-bold text-text">
                {s.title}
              </h3>
              <div className="space-y-2">
                {s.body.map((p, i) => (
                  <p
                    key={i}
                    className="text-[13px] leading-relaxed text-text-muted"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <p className="mt-8 rounded-[var(--radius-md)] bg-surface-2 p-4 text-center text-[12px] text-text-muted">
          {doc.closing}
        </p>
      </div>
    </>
  );
}
