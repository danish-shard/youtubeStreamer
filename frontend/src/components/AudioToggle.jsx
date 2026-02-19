export default function AudioToggle({ audioOnly, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        type="checkbox"
        checked={audioOnly}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span>Audio only</span>
    </label>
  );
}
