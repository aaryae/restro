import { useEffect, useRef, type ReactNode } from 'react'
import {
  Bold,
  Code2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (html: string) => void
  className?: string
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </button>
  )
}

export function HtmlBodyEditor({ value, onChange, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lastHtml = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (value === lastHtml.current) return
    el.innerHTML = value || ''
    lastHtml.current = value
  }, [value])

  function run(command: string, arg?: string) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    sync()
  }

  function sync() {
    const html = ref.current?.innerHTML || ''
    lastHtml.current = html
    onChange(html)
  }

  function insertLink() {
    const url = window.prompt('Link URL')
    if (!url) return
    run('createLink', url)
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-white',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
        <ToolbarButton label="Bold" onClick={() => run('bold')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => run('italic')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => run('underline')}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolbarButton label="Bullet list" onClick={() => run('insertUnorderedList')}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => run('insertOrderedList')}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Insert link" onClick={insertLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolbarButton
          label="Clear formatting"
          onClick={() => run('removeFormat')}
        >
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        className="min-h-[320px] max-h-[520px] overflow-y-auto px-4 py-3 text-[15px] leading-7 text-slate-800 outline-none [&_a]:text-sky-700 [&_a]:underline [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5"
        data-placeholder="Type or paste your email content…"
      />
    </div>
  )
}

export function htmlToPlainText(html: string) {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}
