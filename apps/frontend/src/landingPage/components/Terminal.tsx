import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const COMMANDS = [
  { type: 'cmd', text: 'npx shipwebsite init' },
  { type: 'out', text: '  Detected: React + Vite' },
  { type: 'out', text: '  Build command: npm run build' },
  { type: 'out', text: '  Output directory: dist/' },
  { type: 'cmd', text: 'npx shipwebsite deploy' },
  { type: 'out', text: '  Building project...' },
  { type: 'out', text: '  Optimizing assets...' },
  { type: 'out', text: '  Uploading to edge...' },
  { type: 'success', text: '  ✓ yourproject.shipwebsite.tech' },
]

export default function TerminalSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const [visibleLines, setVisibleLines] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headRef.current!, {
        scrollTrigger: { trigger: headRef.current, start: 'top 80%' },
        y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
      })

      gsap.from(termRef.current!, {
        scrollTrigger: {
          trigger: termRef.current,
          start: 'top 78%',
          onEnter: () => setStarted(true),
        },
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!started) return

    const timeoutIds: number[] = []
    let i = 0

    const reveal = () => {
      if (i < COMMANDS.length) {
        setVisibleLines(i + 1)
        i++
        const delay = COMMANDS[i - 1]?.type === 'cmd' ? 600 : 200
        timeoutIds.push(window.setTimeout(reveal, delay))
      }
    }

    timeoutIds.push(window.setTimeout(reveal, 400))

    return () => timeoutIds.forEach((id) => window.clearTimeout(id))
  }, [started])

  return (
    <section ref={sectionRef} className="relative py-28 sm:py-32">
      {/* Bottom glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(200,255,60,0.04) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div ref={headRef} className="mx-auto mb-14 max-w-2xl text-center">
          <span className="section-eyebrow">CLI</span>
          <h2 className="section-heading">
            One command.
            <br />
            <em className="text-phosphor" style={{ fontStyle: 'italic' }}>Deploy anything.</em>
          </h2>
          <p className="mx-auto mt-5 section-subheading">
            A single CLI that auto-detects your framework and handles the rest. No YAML files, no config ceremony.
          </p>
        </div>

        <div ref={termRef} className="relative mx-auto max-w-160 overflow-hidden rounded-2xl border border-[rgba(232,230,225,0.08)] bg-void-warm shadow-[0_0_0_1px_rgba(200,255,60,0.04),0_24px_64px_rgba(0,0,0,0.5),0_0_120px_rgba(200,255,60,0.03)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(200,255,60,0.04)_0%,transparent_40%,transparent_60%,rgba(200,255,60,0.02)_100%)] before:content-['']">
          <div className="flex items-center gap-3 border-b border-[rgba(232,230,225,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <span className="ml-auto font-mono text-[0.6875rem] text-ash">terminal</span>
          </div>

          <div className="min-h-[280px] px-7 py-7 font-mono text-[0.8125rem] leading-8 text-ash">
            {COMMANDS.slice(0, visibleLines).map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={`flex items-center gap-2.5 ${
                  line.type === 'cmd' ? 'text-bone' : ''
                } ${line.type === 'success' ? 'font-medium text-phosphor' : ''}`}
              >
                {line.type === 'cmd' && <span className="select-none text-phosphor">$</span>}
                <span className="flex items-center gap-1">
                  {line.text}
                  {lineIndex === visibleLines - 1 && visibleLines < COMMANDS.length && (
                    <span className="inline-block h-3.5 w-1.75 rounded-[1px] bg-phosphor align-middle animate-blink" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Install command */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href="#"
            id="cli-install-link"
            className="group inline-flex items-center gap-3 rounded-xl border border-[rgba(232,230,225,0.08)] bg-slate px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(200,255,60,0.2)] hover:bg-[rgba(200,255,60,0.04)]"
          >
            <span className="font-mono text-sm text-phosphor">npm install -g shipwebsite</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-ash transition-colors duration-200 group-hover:text-phosphor" aria-hidden="true">
              <rect x="1" y="3" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M4 3V1.5A.5.5 0 014.5 1h8a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H11" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </a>
          <p className="text-[0.8125rem] text-ash">Supports macOS, Linux, and Windows</p>
        </div>
      </div>
    </section>
  )
}
