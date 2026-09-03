import {
  Archive,
  ArrowLeft,
  Clock3,
  MoreVertical,
  Star,
  Trash2,
} from 'lucide-react'
import serveLogo from '@/assets/logo.png'

type Props = {
  subject: string
  html: string
  toEmail?: string
}

function formatGmailDate() {
  return new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function GmailPreview({
  subject,
  html,
  toEmail = 'owner@hillsidecafe.com',
}: Props) {
  const dateLabel = formatGmailDate()

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-[#f6f8fc] shadow-[0_1px_2px_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)]">
      {/* Gmail app chrome */}
      <div className="flex items-center gap-3 border-b border-[#e8eaed] bg-white px-4 py-2.5">
        <div className="flex items-center gap-1 text-[#5f6368]">
          <span className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f1f3f4]">
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-[3px]">
              <span className="block h-[2px] w-4 rounded-full bg-[#5f6368]" />
              <span className="block h-[2px] w-4 rounded-full bg-[#5f6368]" />
              <span className="block h-[2px] w-4 rounded-full bg-[#5f6368]" />
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center">
          <span
            className="shrink-0 text-[1.35rem] font-normal tracking-tight text-[#5f6368]"
            style={{ fontFamily: "'Google Sans', system-ui, sans-serif" }}
          >
            <span className="text-[#4285f4]">G</span>
            <span className="text-[#ea4335]">m</span>
            <span className="text-[#fbbc04]">a</span>
            <span className="text-[#4285f4]">i</span>
            <span className="text-[#34a853]">l</span>
          </span>
          <div className="ml-4 hidden min-w-0 flex-1 sm:block">
            <div className="flex h-11 max-w-md items-center rounded-full bg-[#eaf1fb] px-4 text-sm text-[#5f6368]">
              Search mail
            </div>
          </div>
        </div>
      </div>

      {/* Message toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[#e8eaed] bg-white px-2 py-1.5">
        {[ArrowLeft, Archive, Trash2, Clock3, Star].map((Icon, i) => (
          <span
            key={i}
            className="grid h-9 w-9 place-items-center rounded-full text-[#5f6368]"
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
        ))}
        <span className="ml-auto grid h-9 w-9 place-items-center rounded-full text-[#5f6368]">
          <MoreVertical className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
      </div>

      {/* Reading pane */}
      <div className="bg-white px-4 pb-6 pt-5 sm:px-6">
        <h1 className="text-[1.375rem] leading-8 font-normal tracking-tight text-[#202124] sm:text-[1.5rem]">
          {subject || 'No subject'}
        </h1>

        <div className="mt-5 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#18181b] sm:h-11 sm:w-11">
            <img
              src={serveLogo}
              alt="Serve"
              className="h-6 w-6 object-contain brightness-0 invert"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#202124]">
                  Serve Platform
                  <span className="font-normal text-[#5f6368]">
                    {' '}
                    &lt;noreply@servecafe.app&gt;
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[#5f6368]">
                  to{' '}
                  <span className="text-[#202124]">{toEmail}</span>
                </p>
              </div>
              <p className="shrink-0 text-xs text-[#5f6368]">{dateLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#e8eaed] bg-[#fafafa]">
          <iframe
            title="Email body preview"
            srcDoc={html}
            className="block h-[min(480px,55vh)] w-full bg-white"
            sandbox=""
          />
        </div>
      </div>
    </div>
  )
}
