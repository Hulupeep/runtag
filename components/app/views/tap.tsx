// Placeholder: APP-TAP replaces this with the tap state machine. The tag id lives only in an attribute (P2-14).
export function TapView({ tagId }: { tagId: string }) {
  return (
    <section>
      <h1 className="app-title">RunTag tag</h1>
      <p data-testid="tap-tag-id" data-tag-id={tagId}>
        This tag is recognised.
      </p>
    </section>
  )
}
