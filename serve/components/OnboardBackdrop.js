export default function OnboardBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="onboard-orb onboard-orb-a" />
      <div className="onboard-orb onboard-orb-b" />
      <div className="onboard-orb onboard-orb-c" />
      <div className="onboard-grid" />
    </div>
  )
}
