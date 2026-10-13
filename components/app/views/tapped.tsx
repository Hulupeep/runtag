// Placeholder: APP-TAP renders the stored tap result for /app?tapped={runId} (APP-016).
export function TappedView({ runId }: { runId: string }) {
  return (
    <section>
      <h1 className="app-title">Tap recorded</h1>
      <p data-testid="tapped-run" data-run-id={runId}>
        Your tap is saved on this phone.
      </p>
    </section>
  )
}
