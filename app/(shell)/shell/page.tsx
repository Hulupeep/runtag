import { Shell } from '@/components/app/Shell'

// One static page serves /app, /app/* and /t/* (rewrites in next.config.mjs). No props: stays prerendered.
export default function ShellPage() {
  return <Shell />
}
